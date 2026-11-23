import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProductionRuntime = () => process.env.NODE_ENV === 'production';

const CSRF_COOKIE_NAME = 'mca_csrf_token';
const CATALOG_SUBJECT_CODES = new Set(['435C1A', '435C1B', '435E1A', '435C1C']);

const isHttpsRequest = (req: express.Request): boolean => {
  if (req.secure) return true;
  const xfProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (xfProto === 'https') return true;
  return String(req.headers['x-forwarded-ssl'] || '').trim().toLowerCase() === 'on';
};

const getAllCookieValues = (cookieHeader: string | undefined, name: string): string[] => {
  if (!cookieHeader) return [];
  const matches: string[] = [];
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    if (k === name) {
      const raw = trimmed.slice(eqIdx + 1).trim();
      if (!raw) continue;
      try {
        matches.push(decodeURIComponent(raw));
      } catch {
        matches.push(raw);
      }
    }
  }
  return matches;
};

const getCookieValue = (cookieHeader: string | undefined, name: string): string | null => {
  const vals = getAllCookieValues(cookieHeader, name);
  return vals.length > 0 ? vals[0] : null;
};

const timingSafeMatch = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const buildSessionCookie = (req: express.Request, token: string, maxAgeSeconds: number | null) => {
  const https = isHttpsRequest(req);
  const sameSite = https ? 'SameSite=None; Secure' : isProductionRuntime() ? 'SameSite=Lax; Secure' : 'SameSite=Lax';
  const maxAgePart = maxAgeSeconds !== null ? `; Max-Age=${maxAgeSeconds}` : '';
  return `mca_session_token=${encodeURIComponent(token)}; HttpOnly; ${sameSite}; Path=/${maxAgePart}`;
};

const clearSessionCookie = (req: express.Request) => {
  const https = isHttpsRequest(req);
  const sameSite = https ? 'SameSite=None; Secure' : isProductionRuntime() ? 'SameSite=Lax; Secure' : 'SameSite=Lax';
  return `mca_session_token=; HttpOnly; ${sameSite}; Path=/; Max-Age=0`;
};

const buildCsrfCookie = (req: express.Request, token: string, maxAgeSeconds = 12 * 3600) => {
  const https = isHttpsRequest(req);
  const sameSite = https ? 'SameSite=None; Secure' : isProductionRuntime() ? 'SameSite=Lax; Secure' : 'SameSite=Lax';
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; ${sameSite}; Path=/; Max-Age=${maxAgeSeconds}`;
};

const ensureCsrfToken = (req: express.Request): string => {
  const existing = getCookieValue(req.headers.cookie, CSRF_COOKIE_NAME);
  if (existing && existing.length >= 16) return existing;
  return crypto.randomBytes(24).toString('hex');
};

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (req.path.startsWith('/api/auth/') || req.path.startsWith('/api/admin/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.use(express.json({ limit: '25mb' }));

// Defense-in-depth CSRF & Origin Verification for mutating /api/* requests
app.use('/api', (req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  const secFetchSite = String(req.headers['sec-fetch-site'] || '').trim().toLowerCase();
  if (secFetchSite === 'cross-site') {
    return res.status(403).json({
      error: 'Cross-site state-changing request blocked by CSRF policy.',
      code: 'CSRF_INVALID',
    });
  }

  const originHeader = req.headers.origin;
  const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (originHeader && hostHeader) {
    try {
      const originHost = new URL(originHeader).host;
      if (originHost.toLowerCase() !== hostHeader.toLowerCase()) {
        return res.status(403).json({
          error: 'Origin mismatch blocked by CSRF protection.',
          code: 'CSRF_INVALID',
        });
      }
    } catch {
      return res.status(403).json({
        error: 'Malformed Origin header blocked by CSRF protection.',
        code: 'CSRF_INVALID',
      });
    }
  }

  const cookieTokens = getAllCookieValues(req.headers.cookie, CSRF_COOKIE_NAME);
  const headerToken = String(req.get('x-csrf-token') || '').trim();
  if (cookieTokens.length > 0 || headerToken.length > 0) {
    if (!headerToken || !cookieTokens.some(tok => timingSafeMatch(tok, headerToken))) {
      return res.status(403).json({
        error: 'Invalid or missing CSRF security token. Please refresh and try again.',
        code: 'CSRF_INVALID',
      });
    }
  }

  next();
});

function sendSafeAiError(res: express.Response, label: string, error: any, fallbackMessage: string) {
  console.error(`Gemini API Error (${label}):`, error?.message || error);
  const status =
    error?.status === 429 || error?.status === 403 || error?.status === 400 || error?.status === 404
      ? error.status
      : 500;
  const clientMsg =
    status === 429
      ? 'AI rate limit reached. Please wait a moment and try again.'
      : status === 403
      ? 'AI provider access is currently unavailable or unauthorized.'
      : status === 400
      ? 'Invalid request payload sent to AI service.'
      : fallbackMessage;
  return res.status(status).json({ error: clientMsg });
}

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. AI Python Code Assistant Debugging Endpoint
app.post('/api/python-assistant/chat', async (req, res) => {
  const auth = requireAuthenticatedAccount(req, res);
  if (!auth) return;
  try {
    const { messages, code, problemTitle, problemDescription, consoleOutput } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'At least one message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please ensure the API key is active in the Secrets panel.',
      });
    }

    const systemInstruction = `You are the MCA Semester 1 AI Academic Code Mentor for the Python Practical Lab.
Your mission is to guide postgraduate Master of Computer Applications (MCA) students in writing, debugging, understanding, and optimizing their Python algorithmic code.

ACADEMIC LAB CONTEXT:
- Active Problem: ${problemTitle || 'General Python Script'}
- Problem Description: ${problemDescription || 'Postgraduate Python laboratory practice.'}

STUDENT'S CURRENT PYTHON CODE:
\`\`\`python
${code || '# No code written yet'}
\`\`\`

RECENT TERMINAL STDOUT / TRACEBACK:
\`\`\`
${consoleOutput || 'Ready.'}
\`\`\`

PEDAGOGICAL GUIDELINES:
1. Provide clear, encouraging, and academically rigorous guidance suitable for MCA Semester 1.
2. Directly identify syntax errors, indentation faults, TypeErrors, boundary/off-by-one errors, infinite recursions, or Big-O computational bottlenecks.
3. When suggesting code fixes, format them in clear markdown \`\`\`python ... \`\`\` code blocks with brief comments explaining what changed and why.
4. If the student asks for explanations, break down the logic step-by-step (e.g. recursion tree, pointer traversal, invariant preservation).
5. Keep explanations actionable, structured with bullet points or brief sections.`;

    const formattedContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'I analyzed your code snippet, but no response was generated. Please try again with your question.';
    return res.json({ reply });
  } catch (error: any) {
    return sendSafeAiError(res, 'python-assistant', error, 'Failed to process AI debugging request.');
  }
});

// 2. AI-Powered PDF Learning "Ask Your Subject" Chatbot Endpoint
app.post('/api/pdf-learning/chat', async (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['student', 'faculty', 'admin'] });
  if (!auth) return;
  try {
    const {
      subjectCode,
      subjectName,
      query,
      pdfContext,
      history,
      uploadedPdfFiles,
      thinkingMode = 'standard',
    } = req.body || {};

    const cleanQuery = typeof query === 'string' ? query.trim() : '';
    if (!cleanQuery) {
      return res.status(400).json({ error: 'Please enter a question about your uploaded PDF materials.' });
    }
    if (cleanQuery.length > 4000) {
      return res.status(400).json({ error: 'Question cannot exceed 4,000 characters.' });
    }

    const safePdfContext = Array.isArray(pdfContext) ? pdfContext.slice(0, 12) : [];
    const safeUploadedFiles: { fileName: string; base64Data: string }[] = [];
    if (Array.isArray(uploadedPdfFiles)) {
      for (const item of uploadedPdfFiles.slice(0, 3)) {
        if (!item || typeof item.base64Data !== 'string') continue;
        const mimeType = String(item.mimeType || 'application/pdf').toLowerCase();
        if (mimeType !== 'application/pdf') {
          return res.status(400).json({ error: 'Only application/pdf attachments are supported.' });
        }
        const rawBase64 = item.base64Data.replace(/^data:application\/pdf;base64,/i, '').trim();
        if (!rawBase64 || rawBase64.length > 14 * 1024 * 1024) {
          return res.status(400).json({
            error: `Uploaded PDF "${String(item.fileName || 'document.pdf').slice(0, 80)}" exceeds the 10 MB upload limit.`,
          });
        }
        safeUploadedFiles.push({
          fileName: String(item.fileName || 'uploaded_material.pdf').slice(0, 140),
          base64Data: rawBase64,
        });
      }
    }

    if (safePdfContext.length === 0 && safeUploadedFiles.length === 0) {
      return res.status(400).json({
        error: 'Select or upload at least one PDF learning material before asking a question.',
      });
    }

    // Role & Material Authorization Check
    const requestedSubject = typeof subjectCode === 'string' ? subjectCode.trim().toUpperCase() : 'ALL';
    const uploadedNameSet = new Set(safeUploadedFiles.map(f => f.fileName));
    if (auth.account.role === 'faculty') {
      const allocatedSubjects = new Set(
        (auth.account.assignedSubjectCodes || []).map(c => String(c).trim().toUpperCase())
      );
      if (requestedSubject && requestedSubject !== 'ALL' && !allocatedSubjects.has(requestedSubject)) {
        return res.status(403).json({
          error: `Access denied: Subject ${requestedSubject} is not allocated to your faculty profile.`,
        });
      }
      for (const ctx of safePdfContext) {
        const ctxCode = ctx?.subjectCode ? String(ctx.subjectCode).trim().toUpperCase() : '';
        const ctxFile = ctx?.fileName ? String(ctx.fileName) : '';
        if (ctxCode && !allocatedSubjects.has(ctxCode) && !uploadedNameSet.has(ctxFile)) {
          return res.status(403).json({
            error: `Access denied: Learning material for ${ctxCode} is outside your allocated faculty subjects.`,
          });
        }
      }
    } else if (auth.account.role === 'student') {
      if (requestedSubject && requestedSubject !== 'ALL' && !CATALOG_SUBJECT_CODES.has(requestedSubject)) {
        return res.status(403).json({
          error: `Access denied: You are not enrolled in or authorized to query subject ${requestedSubject}.`,
        });
      }
      for (const ctx of safePdfContext) {
        const ctxCode = ctx?.subjectCode ? String(ctx.subjectCode).trim().toUpperCase() : '';
        const ctxFile = ctx?.fileName ? String(ctx.fileName) : '';
        if (ctxCode && !CATALOG_SUBJECT_CODES.has(ctxCode) && !uploadedNameSet.has(ctxFile)) {
          return res.status(403).json({
            error: `Access denied: Learning material for ${ctxCode} is outside your authorized curriculum.`,
          });
        }
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets.',
      });
    }

    const candidateLabel = `${auth.account.name} (${auth.account.rollNumber || auth.account.studentId}, Faculty Advisor: ${auth.account.advisorName || 'HCASICAN'})`;
    const activeSubjectLabel =
      subjectCode && subjectCode !== 'ALL'
        ? `"${subjectName || subjectCode}" (${subjectCode})`
        : 'Selected MCA Uploaded Learning Materials';

    const systemInstruction = `You are the MCA SMART CAMPUS AI Academic PDF Assistant for ${activeSubjectLabel}.
Target Scholar: ${candidateLabel}.

STRICT GROUNDING & CITATION RULES:
1. Answer the student's question strictly using the attached PDF documents and the provided PDF Knowledge Base Context below.
2. Cite exact PDF filenames (pdfTitle) and integer page numbers (pageNumber >= 1) in "citations", along with brief direct snippets supporting each claim.
3. Also include inline bracket citations like [Page 12] in your markdown "reply" prose.
4. HONEST GUARDRAIL: If the selected/uploaded PDF materials do not contain sufficient information to answer the question, set "grounded" to false and start "reply" with:
"The uploaded study materials do not contain sufficient information to answer this question." (optionally listing what topics ARE covered in the selected PDFs).
5. Maintain clear postgraduate academic rigor: crisp definitions, formulas, comparison tables, or valid code snippets formatted cleanly in markdown. Do NOT fabricate filenames or page numbers.`;

    const formattedHistory = Array.isArray(history)
      ? history
          .filter(
            (m: any) =>
              m &&
              (m.role === 'user' || m.role === 'model' || m.role === 'assistant') &&
              typeof (m.text ?? m.content) === 'string' &&
              String(m.text ?? m.content).trim().length > 0
          )
          .slice(-16)
          .map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(m.text ?? m.content).trim().slice(0, 6000) }],
          }))
      : [];

    const activeParts: any[] = [];
    for (const file of safeUploadedFiles) {
      activeParts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: file.base64Data,
        },
      });
    }
    activeParts.push({
      text: `STUDENT QUESTION:\n${cleanQuery}\n\nSELECTED PDF KNOWLEDGE BASE METADATA:\n${JSON.stringify(safePdfContext, null, 2)}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [
        ...formattedHistory,
        {
          role: 'user',
          parts: activeParts,
        },
      ],
      config: {
        systemInstruction,
        ...(thinkingMode === 'deep' ? { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } } : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Markdown academic answer strictly grounded in the uploaded PDFs, including [Page X] references.',
            },
            grounded: {
              type: Type.BOOLEAN,
              description: 'True if the uploaded PDF materials contain the answer; false otherwise.',
            },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pdfTitle: { type: Type.STRING },
                  pageNumber: { type: Type.INTEGER },
                  snippet: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const rawText = (response.text || '').trim();
    if (!rawText) {
      return res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
    }

    let parsed: { reply?: string; grounded?: boolean; citations?: any[] } = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { reply: rawText, grounded: true, citations: [] };
    }

    const reply = (parsed.reply || rawText).trim();
    const citations = Array.isArray(parsed.citations)
      ? parsed.citations
          .filter((c: any) => c && typeof c.pdfTitle === 'string')
          .map((c: any) => ({
            pdfTitle: String(c.pdfTitle),
            pageNumber: Number.isFinite(Number(c.pageNumber)) && Number(c.pageNumber) > 0 ? Math.round(Number(c.pageNumber)) : 1,
            snippet: String(c.snippet || '').slice(0, 280),
          }))
      : [];

    return res.json({
      reply,
      grounded: parsed.grounded !== false,
      citations,
      modelUsed: 'gemini-4-hydrogen',
    });
  } catch (error: any) {
    return sendSafeAiError(res, 'pdf-learning', error, 'Failed to query PDF materials with Gemini AI.');
  }
});

// 3. Dynamic Assignment Generation Endpoint
app.post('/api/assignments/generate', async (req, res) => {
  const auth = requireAuthenticatedAccount(req, res);
  if (!auth) return;
  try {
    const { subjectCode, unitNumber, generationMethod, difficulty, questionType, targetCO } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured.' });
    }

    const candidateSummary = req.body?.studentName
      ? `${req.body.studentName} (Roll No: ${req.body.rollNumber || 'MCA Scholar'}, Advisor: HCASICAN)`
      : 'MCA Postgraduate Scholar (Advisor: HCASICAN)';

    const prompt = `Generate a complete, structured postgraduate MCA Academic Assignment in JSON format.
Subject Code: ${subjectCode}
Unit Number: ${unitNumber || 1}
Generation Method: ${generationMethod} (one of: Topic-Based, Difficulty-Based, Question-Type, Randomized, Learning Outcome-Based)
Difficulty: ${difficulty || 'Medium'}
Question Type Focus: ${questionType || 'Mixed'}
Target Learning Outcome: ${targetCO || 'CO1: Core Analysis'}
Candidate: ${candidateSummary}

Return ONLY a valid JSON object matching this schema:
{
  "assignment": {
    "id": "asg-${subjectCode.toLowerCase()}-${Date.now().toString().slice(-4)}",
    "title": "Assignment Title",
    "subjectCode": "${subjectCode}",
    "subjectName": "Subject Name",
    "unit": ${unitNumber || 1},
    "chapter": "Chapter Name",
    "topic": "Topic Name",
    "assignmentType": "Mixed Question Assignment",
    "generationMethod": "${generationMethod}",
    "generatedBy": "Gemini 4 Hydrogen AI Provider",
    "totalMarks": 30,
    "difficulty": "${difficulty || 'Medium'}",
    "instructions": ["Instruction 1", "Instruction 2"],
    "learningObjectives": ["Objective 1", "Objective 2"],
    "dueDate": "2026-11-30",
    "durationMinutes": 60,
    "sourcePdfId": "pdf-${subjectCode.toLowerCase()}-01",
    "sourcePdfTitle": "MCA-${subjectCode}-Core-Notes.pdf",
    "sourcePageReferences": [12, 24, 38],
    "status": "Not Started",
    "submissionRequirements": "Online submission via portal form.",
    "questions": [
      {
        "id": "q-1",
        "questionNumber": 1,
        "text": "Question text...",
        "questionType": "MCQ",
        "marks": 5,
        "difficulty": "Easy",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "sourcePageRef": 12,
        "learningOutcome": "${targetCO || 'CO1'}"
      },
      {
        "id": "q-2",
        "questionNumber": 2,
        "text": "Short answer question text...",
        "questionType": "Short Answer",
        "marks": 10,
        "difficulty": "Medium",
        "expectedKeywords": ["keyword1", "keyword2"],
        "sourcePageRef": 24,
        "learningOutcome": "${targetCO || 'CO1'}"
      },
      {
        "id": "q-3",
        "questionNumber": 3,
        "text": "Long answer or programming question...",
        "questionType": "Long Answer",
        "marks": 15,
        "difficulty": "Hard",
        "sourcePageRef": 38,
        "learningOutcome": "${targetCO || 'CO1'}"
      }
    ]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    return sendSafeAiError(res, 'assignments-generate', error, 'Failed to generate dynamic assignment.');
  }
});

// 4. Server-side Multi-Role Authentication (Admin, Faculty, Student) & RBAC
export const isDemoModeEnabled = () => process.env.DEMO_MODE !== 'false' && !isProductionRuntime();
export const isDemoPortalAccessEnabled = (req?: express.Request): boolean => {
  if (isProductionRuntime()) return false;
  if (!isDemoModeEnabled()) return false;
  if (String(process.env.DEMO_PORTAL_ACCESS ?? 'true').trim().toLowerCase() === 'false') {
    return false;
  }
  if (!req) return true;
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const hostWithoutPort = rawHost.startsWith('[')
    ? rawHost.slice(0, rawHost.indexOf(']') + 1)
    : rawHost.split(':')[0];
  if (!hostWithoutPort) return true;

  const extraHosts = String(process.env.DEMO_PORTAL_ALLOWED_HOSTS || '')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);
  const allowedHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1', 'testserver', ...extraHosts]);
  if (allowedHosts.has(hostWithoutPort)) return true;
  // Allow AI Studio cloud preview hosts ONLY in non-production dev runtime
  if (hostWithoutPort.endsWith('.run.app') && !isProductionRuntime()) return true;
  for (const entry of extraHosts) {
    if (entry.startsWith('.') && hostWithoutPort.endsWith(entry)) return true;
  }
  return false;
};
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const COOKIE_ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.COOKIE_ENCRYPTION_SECRET || process.env.SESSION_SECRET || RESET_TOKEN_SECRET)
  .digest();
const REMEMBERED_USER_COOKIE_NAME = 'mca_remembered_user';
const STANDARD_SESSION_MAX_AGE_SEC = 12 * 3600; // 12 hours
const REMEMBER_ME_DAYS = Math.max(1, Number(process.env.REMEMBER_ME_DAYS) || 30);
const REMEMBER_ME_SESSION_MAX_AGE_SEC = REMEMBER_ME_DAYS * 24 * 3600; // Default 30 days (2,592,000s)
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

interface RememberedUserCookiePayload {
  v: 1;
  byRole: Partial<Record<'student' | 'faculty' | 'admin', string>>;
  expiresAt: number;
}

const encryptRememberedUserPayload = (payload: RememberedUserCookiePayload): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', COOKIE_ENCRYPTION_KEY, iv);
  cipher.setAAD(Buffer.from('mca_remembered_user_v1', 'utf8'));
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
};

const decryptRememberedUserPayload = (rawToken: string): RememberedUserCookiePayload | null => {
  try {
    const parts = rawToken.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') return null;
    const [, ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(tagB64, 'base64url');
    const ciphertext = Buffer.from(dataB64, 'base64url');
    if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) return null;

    const decipher = crypto.createDecipheriv('aes-256-gcm', COOKIE_ENCRYPTION_KEY, iv);
    decipher.setAAD(Buffer.from('mca_remembered_user_v1', 'utf8'));
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString('utf8'));
    if (
      !parsed ||
      parsed.v !== 1 ||
      typeof parsed.expiresAt !== 'number' ||
      Date.now() > parsed.expiresAt ||
      !parsed.byRole ||
      typeof parsed.byRole !== 'object'
    ) {
      return null;
    }
    const cleanByRole: Partial<Record<'student' | 'faculty' | 'admin', string>> = {};
    for (const role of ['student', 'faculty', 'admin'] as const) {
      const val = parsed.byRole[role];
      if (typeof val === 'string' && val.trim().length > 0 && val.trim().length <= 120) {
        cleanByRole[role] = val.trim();
      }
    }
    return {
      v: 1,
      byRole: cleanByRole,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
};

const readRememberedUserCookie = (
  req: express.Request
): { payload: RememberedUserCookiePayload | null; hadCookie: boolean } => {
  const rawValues = getAllCookieValues(req.headers.cookie, REMEMBERED_USER_COOKIE_NAME);
  if (rawValues.length === 0) return { payload: null, hadCookie: false };
  for (const raw of rawValues) {
    const decoded = decryptRememberedUserPayload(raw);
    if (decoded) {
      return { payload: decoded, hadCookie: true };
    }
  }
  return { payload: null, hadCookie: true };
};

const buildRememberedUserCookie = (
  req: express.Request,
  payload: RememberedUserCookiePayload,
  maxAgeSeconds = REMEMBER_ME_SESSION_MAX_AGE_SEC
) => {
  const https = isHttpsRequest(req);
  const sameSite = https ? 'SameSite=None; Secure' : isProductionRuntime() ? 'SameSite=Lax; Secure' : 'SameSite=Lax';
  const encrypted = encryptRememberedUserPayload(payload);
  return `${REMEMBERED_USER_COOKIE_NAME}=${encodeURIComponent(encrypted)}; HttpOnly; ${sameSite}; Path=/; Max-Age=${maxAgeSeconds}`;
};

const clearRememberedUserCookie = (req: express.Request) => {
  const https = isHttpsRequest(req);
  const sameSite = https ? 'SameSite=None; Secure' : isProductionRuntime() ? 'SameSite=Lax; Secure' : 'SameSite=Lax';
  return `${REMEMBERED_USER_COOKIE_NAME}=; HttpOnly; ${sameSite}; Path=/; Max-Age=0`;
};

interface ServerAccountRecord {
  id: string;
  role: 'admin' | 'faculty' | 'student';
  isActive: boolean;
  isDemo?: boolean;
  mustChangePassword: boolean;
  passwordUpdatedAt: string;
  passwordHash: string;
  studentId: string;
  rollNumber: string;
  username: string;
  name: string;
  email: string;
  enrollmentYear: number;
  batch: string;
  semester: number;
  program: string;
  currentSGPA: number;
  targetSGPA: number;
  attendancePercentage: number;
  completedCredits: number;
  totalCredits: number;
  advisorName: string;
  department?: string;
  designation?: string;
  assignedSubjectCodes?: string[];
  facultyPermissions?: string[];
}

interface SessionRecord {
  token: string;
  accountId: string;
  expiresAt: number;
  rememberMe: boolean;
  ipAddress: string;
}

interface LoginAttemptRecord {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

interface ResetTokenRecord {
  accountId: string;
  tokenId: string;
  tokenHash: string;
  codeHash: string;
  expiresAt: number;
  used: boolean;
  failedAttempts: number;
  email: string;
}

interface DevMailMessage {
  messageId: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  resetPath: string;
  resetLink: string;
  verificationCode: string;
  expiresAt: number;
  sentAt: string;
}

interface ServerAuditLogEntry {
  id: string;
  actorName: string;
  actorRole: 'admin' | 'faculty' | 'student';
  action: string;
  target: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Critical';
  ipAddress: string;
  isDemo?: boolean;
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'welcome123',
  'letmein123',
  'mcacampus',
  'changeme',
]);

export function hashPassword(plainText: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainText, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(plainText: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  const actualBuf = crypto.scryptSync(plainText, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function validatePasswordStrength(
  password: string,
  acct?: Pick<ServerAccountRecord, 'username' | 'email' | 'studentId' | 'name'>
): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (/^\d+$/.test(password)) {
    return 'Password cannot be entirely numeric.';
  }
  const lower = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return 'Password is too common. Choose a stronger password.';
  }
  if (!/[A-Za-z]/.test(password) || !/[\d\W_]/.test(password)) {
    return 'Password must combine letters with at least one number or special character.';
  }
  if (acct) {
    const emailLocal = acct.email.split('@')[0]?.toLowerCase() || '';
    const tokens = [
      acct.username.toLowerCase(),
      acct.studentId.toLowerCase(),
      emailLocal,
      ...acct.name.toLowerCase().split(/\s+/).filter(t => t.length >= 3),
    ].filter(Boolean);
    for (const tok of tokens) {
      if (tok.length >= 3 && lower.includes(tok)) {
        return 'Password cannot contain your username, institutional ID, name, or email.';
      }
    }
  }
  return null;
}

const DEFAULT_PASSWORDS: Record<'student' | 'faculty' | 'admin', string> = {
  student: process.env.DEMO_STUDENT_PASSWORD || ['McaDemo', '@2026!'].join(''),
  faculty: process.env.DEMO_FACULTY_PASSWORD || ['Faculty', '@2026!'].join(''),
  admin: process.env.DEMO_ADMIN_PASSWORD || ['Admin', '@2026!'].join(''),
};

const DEV_DEMO_ACCOUNTS_SPEC: ReadonlyArray<{
  id: string;
  role: 'student' | 'faculty' | 'admin';
  userId: string;
  password: string;
  rollNumber: string;
  name: string;
  email: string;
  designation?: string;
}> = [
  {
    id: 'demo-std-01',
    role: 'student',
    userId: 'demo_student',
    password: ['Student', '@123'].join(''),
    rollNumber: 'DEMO-MCA-01',
    name: 'Demo Student',
    email: 'demo_student@demo.mcasmartcampus.local',
  },
  {
    id: 'demo-fac-01',
    role: 'faculty',
    userId: 'demo_faculty',
    password: ['Faculty', '@123'].join(''),
    rollNumber: 'DEMO-FAC-01',
    name: 'Demo Faculty',
    email: 'demo_faculty@demo.mcasmartcampus.local',
    designation: 'Demo Faculty Coordinator',
  },
  {
    id: 'demo-adm-01',
    role: 'admin',
    userId: 'demo_admin',
    password: ['Admin', '@123'].join(''),
    rollNumber: 'DEMO-ADM-01',
    name: 'Demo Administrator',
    email: 'demo_admin@demo.mcasmartcampus.local',
    designation: 'Demo Governance Administrator',
  },
];

export function ensureDemoAccountsInDev(accounts: ServerAccountRecord[] = SERVER_ACCOUNTS): number {
  if (!isDemoModeEnabled()) {
    return 0;
  }
  const nowIso = new Date().toISOString();
  let createdCount = 0;

  for (const spec of DEV_DEMO_ACCOUNTS_SPEC) {
    const existing = accounts.find(
      a =>
        a.id === spec.id ||
        a.username.toLowerCase() === spec.userId.toLowerCase() ||
        a.studentId.toLowerCase() === spec.userId.toLowerCase() ||
        a.email.toLowerCase() === spec.email.toLowerCase()
    );
    if (existing) {
      if (existing.id.startsWith('demo-')) {
        existing.isActive = true;
        existing.isDemo = true;
        existing.role = spec.role;
      }
      continue;
    }

    accounts.push({
      id: spec.id,
      role: spec.role,
      isActive: true,
      isDemo: true,
      mustChangePassword: false,
      passwordUpdatedAt: nowIso,
      passwordHash: hashPassword(spec.password),
      studentId: spec.userId,
      rollNumber: spec.rollNumber,
      username: spec.userId,
      name: spec.name,
      email: spec.email,
      enrollmentYear: 2024,
      batch:
        spec.role === 'student'
          ? 'Demo Sandbox Batch'
          : spec.role === 'faculty'
          ? 'Demo Sandbox Faculty'
          : 'Demo Sandbox Governance',
      semester: 1,
      program: 'Master of Computer Applications',
      currentSGPA: spec.role === 'student' ? 8.6 : 0,
      targetSGPA: spec.role === 'student' ? 9.0 : 0,
      attendancePercentage: spec.role === 'student' ? 94 : 100,
      completedCredits: spec.role === 'student' ? 15 : 0,
      totalCredits: spec.role === 'student' ? 19 : 0,
      advisorName: 'Demo Faculty',
      department: spec.role !== 'student' ? 'Department of Computer Applications' : undefined,
      designation: spec.designation,
      assignedSubjectCodes:
        spec.role !== 'student' ? ['435C1A', '435C1B', '435E1A', '435C1C'] : undefined,
      facultyPermissions:
        spec.role === 'faculty'
          ? [
              'create_assessments',
              'edit_assessments',
              'evaluate_submissions',
              'view_marks',
              'manage_materials',
              'create_challenges',
              'review_projects',
              'verify_skills',
            ]
          : spec.role === 'admin'
          ? [
              'create_assessments',
              'edit_assessments',
              'evaluate_submissions',
              'view_marks',
              'publish_marks',
              'manage_materials',
              'create_challenges',
              'review_projects',
              'verify_skills',
            ]
          : undefined,
    });
    createdCount += 1;
  }

  return createdCount;
}

function createInitialAccounts(): ServerAccountRecord[] {
  const nowIso = new Date().toISOString();

  const initial: ServerAccountRecord[] = [
    {
      id: 'std-2401',
      role: 'student',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: nowIso,
      passwordHash: hashPassword(DEFAULT_PASSWORDS.student),
      studentId: 'MCA2401',
      rollNumber: 'P26CA125',
      username: 'mca_demo_student',
      name: 'Devanath N',
      email: 'devanath016@gmail.com',
      enrollmentYear: 2024,
      batch: 'MCA 2024–2026',
      semester: 1,
      program: 'Master of Computer Applications',
      currentSGPA: 8.85,
      targetSGPA: 9.2,
      attendancePercentage: 92.4,
      completedCredits: 15,
      totalCredits: 19,
      advisorName: 'HCASICAN',
    },
    {
      id: 'std-2402',
      role: 'student',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: nowIso,
      passwordHash: hashPassword(DEFAULT_PASSWORDS.student),
      studentId: 'MCA2402',
      rollNumber: 'P26CA126',
      username: 'priya_patel',
      name: 'Priya Patel',
      email: 'priya.patel@mca.edu.in',
      enrollmentYear: 2024,
      batch: 'MCA 2024–2026',
      semester: 1,
      program: 'Master of Computer Applications',
      currentSGPA: 9.15,
      targetSGPA: 9.5,
      attendancePercentage: 96.0,
      completedCredits: 15,
      totalCredits: 19,
      advisorName: 'HCASICAN',
    },
    {
      id: 'std-2403',
      role: 'student',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: nowIso,
      passwordHash: hashPassword(DEFAULT_PASSWORDS.student),
      studentId: 'MCA2403',
      rollNumber: 'P26CA127',
      username: 'rohan_verma',
      name: 'Rohan Verma',
      email: 'rohan.verma@mca.edu.in',
      enrollmentYear: 2024,
      batch: 'MCA 2024–2026',
      semester: 1,
      program: 'Master of Computer Applications',
      currentSGPA: 8.4,
      targetSGPA: 8.8,
      attendancePercentage: 88.5,
      completedCredits: 15,
      totalCredits: 19,
      advisorName: 'HCASICAN',
    },
    {
      id: 'fac-01',
      role: 'faculty',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: nowIso,
      passwordHash: hashPassword(DEFAULT_PASSWORDS.faculty),
      studentId: 'FAC001',
      rollNumber: 'FAC-HCASICAN',
      username: 'hcasican_faculty',
      name: 'HCASICAN',
      email: 'hcasican@mcasmartcampus.edu',
      enrollmentYear: 2024,
      batch: 'Postgraduate MCA Faculty',
      semester: 1,
      program: 'Master of Computer Applications',
      currentSGPA: 0,
      targetSGPA: 0,
      attendancePercentage: 100,
      completedCredits: 0,
      totalCredits: 0,
      advisorName: 'HCASICAN',
      department: 'Department of Computer Applications',
      designation: 'Faculty Advisor & Subject Coordinator',
      assignedSubjectCodes: ['435C1A', '435C1B', '435E1A', '435C1C'],
      facultyPermissions: [
        'create_assessments',
        'edit_assessments',
        'evaluate_submissions',
        'view_marks',
        'manage_materials',
        'create_challenges',
        'review_projects',
        'verify_skills',
      ],
    },
    {
      id: 'adm-01',
      role: 'admin',
      isActive: true,
      mustChangePassword: false,
      passwordUpdatedAt: nowIso,
      passwordHash: hashPassword(DEFAULT_PASSWORDS.admin),
      studentId: 'ADM001',
      rollNumber: 'ADMIN-MCA',
      username: 'campus_admin',
      name: 'Academic Administrator',
      email: 'admin@mcasmartcampus.edu',
      enrollmentYear: 2024,
      batch: 'Institutional Administration',
      semester: 1,
      program: 'Master of Computer Applications',
      currentSGPA: 0,
      targetSGPA: 0,
      attendancePercentage: 100,
      completedCredits: 0,
      totalCredits: 0,
      advisorName: 'HCASICAN',
      department: 'Department of Computer Applications',
      designation: 'Institutional Academic Administrator',
      assignedSubjectCodes: ['435C1A', '435C1B', '435E1A', '435C1C'],
      facultyPermissions: [
        'create_assessments',
        'edit_assessments',
        'evaluate_submissions',
        'view_marks',
        'publish_marks',
        'manage_materials',
        'create_challenges',
        'review_projects',
        'verify_skills',
      ],
    },
  ];

  ensureDemoAccountsInDev(initial);
  return initial;
}

const SERVER_ACCOUNTS: ServerAccountRecord[] = createInitialAccounts();
const activeSessions = new Map<string, SessionRecord>();
const loginAttemptStore = new Map<string, LoginAttemptRecord>();
const activeResetRequests = new Map<string, ResetTokenRecord>();
const resetEmailRateStore = new Map<string, { count: number; windowStart: number }>();
const devMailOutbox = new Map<string, DevMailMessage>();
const serverAuditLogs: ServerAuditLogEntry[] = [];
const serverQuestionBank: Array<{ id: string; subjectCode: string; prompt: string; answer: string; createdBy: string }> = [];
const serverEvaluations = new Map<string, { id: string; subjectCode: string; marks: number; feedback: string; evaluatedBy: string }>([
  ['asg-435c1b-01', { id: 'asg-435c1b-01', subjectCode: '435C1B', marks: 26, feedback: 'Initial review complete.', evaluatedBy: 'HCASICAN' }],
]);
const contactSubmissions: { id: string; name: string; email: string; subject: string; message: string; submittedAt: string }[] = [];

const sanitizePublicUser = (acct: ServerAccountRecord) => {
  const { passwordHash: _passwordHash, ...safeUser } = acct;
  return safeUser;
};

const getClientIp = (req: express.Request): string => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

const recordServerAuditLog = (
  actorName: string,
  actorRole: 'admin' | 'faculty' | 'student',
  action: string,
  target: string,
  severity: ServerAuditLogEntry['severity'] = 'Info',
  ipAddress = '127.0.0.1',
  isDemo = false
) => {
  serverAuditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorName,
    actorRole,
    action,
    target,
    timestamp: new Date().toISOString(),
    severity,
    ipAddress,
    isDemo,
  });
  if (serverAuditLogs.length > 200) serverAuditLogs.pop();
};

const findAccountByIdentifier = (identifier: string): ServerAccountRecord | undefined => {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return undefined;
  return (
    SERVER_ACCOUNTS.find(a => a.username.toLowerCase() === normalized) ||
    SERVER_ACCOUNTS.find(a => a.studentId.toLowerCase() === normalized) ||
    SERVER_ACCOUNTS.find(a => a.rollNumber.toLowerCase() === normalized) ||
    SERVER_ACCOUNTS.find(a => a.email.toLowerCase() === normalized)
  );
};

const resolveActiveSessionAccount = (req: express.Request): { session: SessionRecord; account: ServerAccountRecord } | null => {
  const tokens = getAllCookieValues(req.headers.cookie, 'mca_session_token');
  if (tokens.length === 0) return null;
  for (const token of tokens) {
    const session = activeSessions.get(token);
    if (!session) continue;
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      continue;
    }
    const account = SERVER_ACCOUNTS.find(a => a.id === session.accountId);
    if (!account || !account.isActive || (account.isDemo && !isDemoModeEnabled())) {
      activeSessions.delete(token);
      continue;
    }
    return { session, account };
  }
  return null;
};

const requireAuthenticatedAccount = (
  req: express.Request,
  res: express.Response,
  options: { allowDuringMustChangePassword?: boolean; allowedRoles?: Array<'admin' | 'faculty' | 'student'> } = {}
): { session: SessionRecord; account: ServerAccountRecord } | null => {
  const resolved = resolveActiveSessionAccount(req);
  if (!resolved) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return null;
  }
  if (!options.allowDuringMustChangePassword && resolved.account.mustChangePassword) {
    res.status(403).json({
      error: 'First-login password setup is required before accessing this workspace.',
      code: 'MUST_CHANGE_PASSWORD',
    });
    return null;
  }
  if (options.allowedRoles && !options.allowedRoles.includes(resolved.account.role)) {
    res.status(403).json({ error: 'Access denied: Insufficient role privileges for this resource.' });
    return null;
  }
  return resolved;
};

const hashVerificationCode = (accountId: string, code: string): string =>
  crypto.createHmac('sha256', RESET_TOKEN_SECRET).update(`${accountId}:${code}`).digest('hex');

const signResetToken = (accountId: string, nonce: string, expiresAt: number): string => {
  const payload = Buffer.from(`${accountId}.${nonce}.${expiresAt}`).toString('base64url');
  const sig = crypto.createHmac('sha256', RESET_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};

const verifySignedResetToken = (rawToken: string): { accountId: string; nonce: string; expiresAt: number } | null => {
  const parts = rawToken.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', RESET_TOKEN_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const [accountId, nonce, expStr] = decoded.split('.');
  const expiresAt = Number(expStr);
  if (!accountId || !nonce || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  return { accountId, nonce, expiresAt };
};

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'registered institutional email';
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
};

export const isSmtpConfigured = (): boolean =>
  Boolean(
    process.env.SMTP_URL ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  );

const resolvePublicOrigin = (req: express.Request): string => {
  const configured = process.env.APP_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, '');
  }
  const xfProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = xfProto || (req.secure ? 'https' : 'http');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || `127.0.0.1:${PORT}`).split(',')[0].trim();
  return `${proto}://${host}`;
};

const escapeHtml = (val: string): string =>
  val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

async function sendPasswordResetVerificationEmail(params: {
  req: express.Request;
  account: ServerAccountRecord;
  resetToken: string;
  code: string;
  expiresAt: number;
}): Promise<{ deliveryMode: 'smtp' | 'dev_inbox'; messageId: string }> {
  const { req, account, resetToken, code, expiresAt } = params;
  const origin = resolvePublicOrigin(req);
  const resetPath = `/accounts/password-reset-confirm/?token=${encodeURIComponent(resetToken)}`;
  const resetLink = `${origin}${resetPath}`;
  const fromAddress = process.env.SMTP_FROM || 'MCA Smart Campus Security <no-reply@mcasmartcampus.edu>';
  const subject = 'MCA Smart Campus — Password Reset Verification';

  const text = [
    `Hello ${account.name} (${account.studentId}),`,
    '',
    'We received a request to reset the password for your MCA Smart Campus account.',
    'Use either the unique verification link or the 6-digit verification code below within 15 minutes:',
    '',
    `Reset Link: ${resetLink}`,
    `6-Digit Verification Code: ${code}`,
    '',
    'This verification token can only be used once and expires automatically in 15 minutes.',
    'If you did not request this password reset, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#F7F5F2;border:1px solid #E5DFD9;border-radius:12px;color:#292929;">
      <div style="border-top:4px solid #B83232;background:#FFFFFF;padding:24px;border-radius:10px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#B83232;">MCA SMART CAMPUS</p>
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#292929;">Password Reset Verification</h1>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#4E4945;">
          Hello <strong>${escapeHtml(account.name)}</strong> (${escapeHtml(account.studentId)}),
        </p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#4E4945;">
          Click the secure verification button below or enter the 6-digit verification code on the password reset page. Both expire automatically in <strong>15 minutes</strong>.
        </p>
        <p style="margin:20px 0;">
          <a href="${escapeHtml(resetLink)}" style="display:inline-block;padding:12px 20px;background:#B83232;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;">
            Verify Email &amp; Reset Password
          </a>
        </p>
        <div style="margin:16px 0;padding:14px;background:#F7F5F2;border:1px solid #E5DFD9;border-radius:8px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#795548;margin-bottom:4px;">6-Digit Verification Code</div>
          <div style="font-family:monospace;font-size:22px;font-weight:800;letter-spacing:0.2em;color:#292929;">${escapeHtml(code)}</div>
        </div>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#795548;">
          If the button does not work, copy this one-time link into your browser:<br/>
          <span style="word-break:break-all;color:#292929;">${escapeHtml(resetLink)}</span>
        </p>
      </div>
    </div>
  `.trim();

  if (isSmtpConfigured()) {
    const transporter = process.env.SMTP_URL
      ? nodemailer.createTransport(process.env.SMTP_URL)
      : nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
    const info = await transporter.sendMail({
      from: fromAddress,
      to: account.email,
      subject,
      text,
      html,
    });
    return { deliveryMode: 'smtp', messageId: info.messageId || `smtp-${crypto.randomUUID()}` };
  }

  if (isProductionRuntime()) {
    throw new Error('SMTP_NOT_CONFIGURED');
  }

  const devTransport = nodemailer.createTransport({ jsonTransport: true });
  const info = await devTransport.sendMail({
    from: fromAddress,
    to: account.email,
    subject,
    text,
    html,
  });
  const messageId = (info.messageId || `dev-${crypto.randomBytes(12).toString('hex')}`).replace(/[<>]/g, '');
  devMailOutbox.set(messageId, {
    messageId,
    to: account.email,
    subject,
    text,
    html,
    resetPath,
    resetLink,
    verificationCode: code,
    expiresAt,
    sentAt: new Date().toISOString(),
  });
  if (devMailOutbox.size > 50) {
    const oldestKey = devMailOutbox.keys().next().value;
    if (oldestKey) devMailOutbox.delete(oldestKey);
  }
  return { deliveryMode: 'dev_inbox', messageId };
}

app.get('/api/auth/csrf', (req, res) => {
  const csrfToken = ensureCsrfToken(req);
  res.setHeader('Set-Cookie', buildCsrfCookie(req, csrfToken));
  return res.json({ csrfToken });
});

app.get('/api/auth/session', (req, res) => {
  const csrfToken = ensureCsrfToken(req);
  res.setHeader('Set-Cookie', buildCsrfCookie(req, csrfToken));
  const resolved = resolveActiveSessionAccount(req);
  if (resolved) {
    return res.json({
      authenticated: true,
      user: sanitizePublicUser(resolved.account),
      rememberMe: resolved.session.rememberMe,
      sessionExpiresAt: resolved.session.expiresAt,
      csrfToken,
    });
  }
  return res.json({ authenticated: false, user: null, rememberMe: false, csrfToken });
});

app.get('/api/auth/remembered-user', (req, res) => {
  const { payload, hadCookie } = readRememberedUserCookie(req);
  if (hadCookie && !payload) {
    // Clear corrupted, tampered, or expired encrypted cookie
    res.setHeader('Set-Cookie', clearRememberedUserCookie(req));
  }
  return res.json({
    rememberedByRole: payload ? payload.byRole : {},
    expiresAt: payload ? payload.expiresAt : null,
  });
});

app.delete('/api/auth/remembered-user', (req, res) => {
  const roleParam = typeof req.query.role === 'string' ? req.query.role.trim().toLowerCase() : '';
  const { payload } = readRememberedUserCookie(req);
  if (roleParam && (roleParam === 'student' || roleParam === 'faculty' || roleParam === 'admin') && payload) {
    const nextByRole = { ...payload.byRole };
    delete nextByRole[roleParam];
    if (Object.keys(nextByRole).length > 0) {
      const nextPayload: RememberedUserCookiePayload = {
        v: 1,
        byRole: nextByRole,
        expiresAt: payload.expiresAt,
      };
      res.setHeader('Set-Cookie', buildRememberedUserCookie(req, nextPayload));
      return res.json({ ok: true, rememberedByRole: nextByRole });
    }
  }
  res.setHeader('Set-Cookie', clearRememberedUserCookie(req));
  return res.json({ ok: true, rememberedByRole: {} });
});

app.post('/api/auth/logout', (req, res) => {
  const tokens = getAllCookieValues(req.headers.cookie, 'mca_session_token');
  const ip = getClientIp(req);
  for (const token of tokens) {
    const existing = activeSessions.get(token);
    if (existing) {
      const acct = SERVER_ACCOUNTS.find(a => a.id === existing.accountId);
      if (acct) {
        recordServerAuditLog(acct.name, acct.role, 'User Logout', acct.username, 'Info', ip);
      }
      activeSessions.delete(token);
    }
  }
  res.setHeader('Set-Cookie', clearSessionCookie(req));
  return res.json({ authenticated: false });
});

app.get('/api/auth/demo-info', (req, res) => {
  const demoMode = isDemoModeEnabled();
  const demoPortalAccess = isDemoPortalAccessEnabled(req);
  if (!demoMode) {
    return res.json({ demoMode: false, demoPortalAccess: false });
  }
  return res.json({
    demoMode: true,
    demoPortalAccess,
  });
});

app.post('/api/auth/demo-enter', (req, res) => {
  if (!isDemoPortalAccessEnabled(req)) {
    return res.status(403).json({
      error: 'Direct demo portal entry is disabled in production mode.',
    });
  }

  const rawRole = String(req.body?.role || '').trim().toLowerCase();
  if (rawRole !== 'student' && rawRole !== 'faculty' && rawRole !== 'admin') {
    return res.status(400).json({ error: 'Valid portal role (student, faculty, or admin) is required.' });
  }

  ensureDemoAccountsInDev();
  const demoAccount = SERVER_ACCOUNTS.find(a => a.isDemo && a.role === rawRole && a.isActive);
  if (!demoAccount) {
    return res.status(404).json({ error: 'Demo portal account is unavailable.' });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const token = crypto.randomBytes(32).toString('hex');
  const maxAgeSeconds = STANDARD_SESSION_MAX_AGE_SEC;
  const sessionExpiresAt = now + maxAgeSeconds * 1000;

  activeSessions.set(token, {
    token,
    accountId: demoAccount.id,
    expiresAt: sessionExpiresAt,
    rememberMe: false,
    ipAddress: ip,
  });

  recordServerAuditLog(
    demoAccount.name,
    demoAccount.role,
    'Demo Portal Direct Entry',
    `${demoAccount.studentId} (${demoAccount.role})`,
    'Info',
    ip,
    true
  );

  const csrfToken = ensureCsrfToken(req);
  res.setHeader('Set-Cookie', [
    buildSessionCookie(req, token, null),
    buildCsrfCookie(req, csrfToken, maxAgeSeconds),
  ]);

  return res.json({
    authenticated: true,
    demoPortalAccess: true,
    mustChangePassword: false,
    rememberMe: false,
    sessionMaxAgeSeconds: maxAgeSeconds,
    sessionExpiresAt,
    user: sanitizePublicUser(demoAccount),
    csrfToken,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, expectedRole, rememberMe } = req.body || {};
  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '');
  const ip = getClientIp(req);

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({ error: 'Institutional ID, email, or username and password are required.' });
  }

  const matched = findAccountByIdentifier(cleanUser);
  const attemptKeys = Array.from(
    new Set([
      `${cleanUser.toLowerCase()}::${ip}`,
      ...(matched ? [`${matched.studentId.toLowerCase()}::${ip}`] : []),
    ])
  );

  // Check active rate-limit lockout before validating credentials
  const now = Date.now();
  for (const key of attemptKeys) {
    const rec = loginAttemptStore.get(key);
    if (rec?.lockedUntil && now < rec.lockedUntil) {
      const remainingMin = Math.max(1, Math.ceil((rec.lockedUntil - now) / 60000));
      return res.status(429).json({
        error: `Too many failed login attempts. Account sign-in is locked for ${remainingMin} minute(s).`,
      });
    }
    if (rec?.lockedUntil && now >= rec.lockedUntil) {
      loginAttemptStore.delete(key);
    }
  }

  const recordFailure = () => {
    let lockedNow = false;
    for (const key of attemptKeys) {
      const prev = loginAttemptStore.get(key) || { failedAttempts: 0, lockedUntil: null, lastAttemptAt: now };
      const nextCount = prev.failedAttempts + 1;
      const lockedUntil = nextCount >= MAX_FAILED_LOGIN_ATTEMPTS ? now + LOGIN_LOCKOUT_MS : null;
      if (lockedUntil) lockedNow = true;
      loginAttemptStore.set(key, {
        failedAttempts: nextCount,
        lockedUntil,
        lastAttemptAt: now,
      });
    }
    return lockedNow;
  };

  if (!matched || (matched.isDemo && !isDemoModeEnabled()) || !verifyPassword(cleanPass, matched.passwordHash)) {
    const locked = recordFailure();
    recordServerAuditLog(
      matched?.name || cleanUser,
      matched?.role || 'student',
      'Failed Login Attempt',
      cleanUser,
      locked ? 'Critical' : 'Warning',
      ip,
      Boolean(matched?.isDemo)
    );
    if (locked) {
      return res.status(429).json({
        error: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
      });
    }
    return res.status(401).json({ error: 'Invalid credentials or password. Please verify and try again.' });
  }

  if (!matched.isActive) {
    recordServerAuditLog(matched.name, matched.role, 'Blocked Inactive Account Login', matched.username, 'Warning', ip, Boolean(matched.isDemo));
    return res.status(403).json({ error: 'Your account is inactive or disabled. Contact the Institutional Administrator.' });
  }

  // Strict server-side role enforcement: prevent logging into wrong portal
  if (expectedRole && ['admin', 'faculty', 'student'].includes(expectedRole) && matched.role !== expectedRole) {
    recordServerAuditLog(
      matched.name,
      matched.role,
      'Cross-Role Portal Login Blocked',
      `${matched.username} -> ${expectedRole}-login`,
      'Warning',
      ip,
      Boolean(matched.isDemo)
    );
    return res.status(403).json({
      error: `Access denied: This login portal is restricted to ${expectedRole} accounts.`,
    });
  }

  // Clear failed attempt records on valid login
  for (const key of attemptKeys) {
    loginAttemptStore.delete(key);
  }

  const isRememberMe = Boolean(rememberMe);
  const token = crypto.randomBytes(32).toString('hex');
  const maxAgeSeconds = isRememberMe ? REMEMBER_ME_SESSION_MAX_AGE_SEC : STANDARD_SESSION_MAX_AGE_SEC;
  const sessionExpiresAt = now + maxAgeSeconds * 1000;
  activeSessions.set(token, {
    token,
    accountId: matched.id,
    expiresAt: sessionExpiresAt,
    rememberMe: isRememberMe,
    ipAddress: ip,
  });

  recordServerAuditLog(
    matched.name,
    matched.role,
    'Portal Login',
    `${matched.studentId} (${matched.role})${isRememberMe ? ' · RememberMe' : ''}`,
    'Info',
    ip,
    Boolean(matched.isDemo)
  );

  const csrfToken = ensureCsrfToken(req);
  const cookiesToSet: string[] = [
    buildSessionCookie(req, token, isRememberMe ? maxAgeSeconds : null),
    buildCsrfCookie(req, csrfToken, maxAgeSeconds),
  ];

  // Manage encrypted HttpOnly remembered-username cookie
  const existingRemembered = readRememberedUserCookie(req);
  const currentByRole = { ...(existingRemembered.payload?.byRole || {}) };
  if (isRememberMe) {
    currentByRole[matched.role] = matched.username;
    cookiesToSet.push(
      buildRememberedUserCookie(
        req,
        {
          v: 1,
          byRole: currentByRole,
          expiresAt: now + REMEMBER_ME_SESSION_MAX_AGE_SEC * 1000,
        },
        REMEMBER_ME_SESSION_MAX_AGE_SEC
      )
    );
  } else if (existingRemembered.hadCookie || currentByRole[matched.role]) {
    delete currentByRole[matched.role];
    if (Object.keys(currentByRole).length > 0) {
      cookiesToSet.push(
        buildRememberedUserCookie(req, {
          v: 1,
          byRole: currentByRole,
          expiresAt: existingRemembered.payload?.expiresAt || now + REMEMBER_ME_SESSION_MAX_AGE_SEC * 1000,
        })
      );
    } else {
      cookiesToSet.push(clearRememberedUserCookie(req));
    }
  }

  res.setHeader('Set-Cookie', cookiesToSet);
  return res.json({
    authenticated: true,
    mustChangePassword: matched.mustChangePassword,
    rememberMe: isRememberMe,
    sessionMaxAgeSeconds: maxAgeSeconds,
    sessionExpiresAt,
    user: sanitizePublicUser(matched),
    csrfToken,
  });
});

app.post('/api/auth/change-password', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowDuringMustChangePassword: true });
  if (!auth) return;

  const { account, session } = auth;
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  const cleanCurrent = String(currentPassword || '');
  const cleanNew = String(newPassword || '');
  const cleanConfirm = String(confirmPassword ?? cleanNew);
  const ip = getClientIp(req);

  if (!cleanCurrent || !cleanNew) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }
  if (!verifyPassword(cleanCurrent, account.passwordHash)) {
    recordServerAuditLog(account.name, account.role, 'Change Password Failed (Wrong Current)', account.username, 'Warning', ip);
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (cleanNew !== cleanConfirm) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }
  if (cleanNew === cleanCurrent) {
    return res.status(400).json({ error: 'New password must differ from your current password.' });
  }

  const strengthError = validatePasswordStrength(cleanNew, account);
  if (strengthError) {
    return res.status(400).json({ error: strengthError });
  }

  account.passwordHash = hashPassword(cleanNew);
  account.mustChangePassword = false;
  account.passwordUpdatedAt = new Date().toISOString();

  // Rotate session token after credential change while preserving Remember Me expiry preference
  activeSessions.delete(session.token);
  const rotatedToken = crypto.randomBytes(32).toString('hex');
  const remainingSec = Math.max(3600, Math.floor((session.expiresAt - Date.now()) / 1000));
  activeSessions.set(rotatedToken, {
    token: rotatedToken,
    accountId: account.id,
    expiresAt: session.expiresAt,
    rememberMe: session.rememberMe,
    ipAddress: ip,
  });

  recordServerAuditLog(account.name, account.role, 'Password Changed', account.username, 'Info', ip);
  const csrfToken = ensureCsrfToken(req);
  res.setHeader('Set-Cookie', [
    buildSessionCookie(req, rotatedToken, session.rememberMe ? remainingSec : null),
    buildCsrfCookie(req, csrfToken, remainingSec),
  ]);

  return res.json({
    ok: true,
    user: sanitizePublicUser(account),
    message: 'Your account password has been updated securely.',
  });
});

// 4B. Admin, Faculty & Student RBAC Protected Endpoints
app.get('/api/admin/users', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['admin'] });
  if (!auth) return;
  const visible = auth.account.isDemo
    ? SERVER_ACCOUNTS.filter(a => Boolean(a.isDemo))
    : SERVER_ACCOUNTS.filter(a => !a.isDemo);
  return res.json({ users: visible.map(sanitizePublicUser) });
});

app.post('/api/admin/users', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['admin'] });
  if (!auth) return;

  const { name, studentId, username, email, role, temporaryPassword } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanId = String(studentId || '').trim().toUpperCase();
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanEmail = String(email || `${cleanUsername}@mcasmartcampus.edu`).trim().toLowerCase();
  const cleanRole: 'admin' | 'faculty' | 'student' =
    role === 'admin' || role === 'faculty' || role === 'student' ? role : 'student';
  const cleanTempPass = String(temporaryPassword || '');
  const ip = getClientIp(req);

  if (!cleanName || !cleanId || !cleanUsername || !cleanTempPass) {
    return res.status(400).json({ error: 'Name, Institutional ID, username, and temporary password are required.' });
  }
  const duplicate = SERVER_ACCOUNTS.find(
    a =>
      a.username.toLowerCase() === cleanUsername ||
      a.studentId.toLowerCase() === cleanId.toLowerCase() ||
      a.email.toLowerCase() === cleanEmail
  );
  if (duplicate) {
    return res.status(409).json({ error: 'An account with that username, ID, or email already exists.' });
  }

  const strengthError = validatePasswordStrength(cleanTempPass, {
    username: cleanUsername,
    email: cleanEmail,
    studentId: cleanId,
    name: cleanName,
  });
  if (strengthError) {
    return res.status(400).json({ error: strengthError });
  }

  const created: ServerAccountRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: cleanRole,
    isActive: true,
    isDemo: Boolean(auth.account.isDemo),
    mustChangePassword: true,
    passwordUpdatedAt: new Date().toISOString(),
    passwordHash: hashPassword(cleanTempPass),
    studentId: cleanId,
    rollNumber: cleanId,
    username: cleanUsername,
    name: cleanName,
    email: cleanEmail,
    enrollmentYear: 2026,
    batch: cleanRole === 'student' ? 'MCA 2024–2026' : cleanRole === 'faculty' ? 'Postgraduate MCA Faculty' : 'Institutional Administration',
    semester: 1,
    program: 'Master of Computer Applications',
    currentSGPA: cleanRole === 'student' ? 8.5 : 0,
    targetSGPA: cleanRole === 'student' ? 9.0 : 0,
    attendancePercentage: 100,
    completedCredits: cleanRole === 'student' ? 15 : 0,
    totalCredits: cleanRole === 'student' ? 19 : 0,
    advisorName: 'HCASICAN',
    assignedSubjectCodes: cleanRole === 'faculty' ? ['435C1A'] : undefined,
    facultyPermissions: cleanRole === 'faculty' ? ['create_assessments', 'evaluate_submissions', 'view_marks'] : undefined,
  };

  SERVER_ACCOUNTS.unshift(created);
  recordServerAuditLog(
    auth.account.name,
    auth.account.role,
    `Created ${cleanRole.toUpperCase()} Account`,
    `${created.name} (${created.studentId})`,
    'Info',
    ip,
    Boolean(auth.account.isDemo)
  );

  return res.status(201).json({ ok: true, user: sanitizePublicUser(created) });
});

app.patch('/api/admin/users/:id/role', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['admin'] });
  if (!auth) return;

  const target = SERVER_ACCOUNTS.find(a => a.id === req.params.id || a.studentId === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Target account not found.' });
  }
  if (auth.account.isDemo && !target.isDemo) {
    return res.status(403).json({ error: 'Forbidden: Demo accounts cannot access or modify real user accounts.' });
  }
  const nextRole = req.body?.role;
  if (nextRole !== 'admin' && nextRole !== 'faculty' && nextRole !== 'student') {
    return res.status(400).json({ error: 'Valid role (admin, faculty, or student) is required.' });
  }
  if (target.id === auth.account.id && nextRole !== 'admin') {
    return res.status(400).json({ error: 'Administrators cannot remove their own admin role.' });
  }
  if (target.id.startsWith('demo-') && nextRole !== target.role) {
    return res.status(400).json({ error: 'Built-in demo portal accounts must retain their assigned role.' });
  }

  const prevRole = target.role;
  target.role = nextRole;
  recordServerAuditLog(
    auth.account.name,
    auth.account.role,
    'Changed User Role',
    `${target.studentId}: ${prevRole} -> ${nextRole}`,
    'Warning',
    getClientIp(req),
    Boolean(auth.account.isDemo)
  );
  return res.json({ ok: true, user: sanitizePublicUser(target) });
});

app.patch('/api/admin/users/:id/toggle-active', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['admin'] });
  if (!auth) return;

  const target = SERVER_ACCOUNTS.find(a => a.id === req.params.id || a.studentId === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Target account not found.' });
  }
  if (auth.account.isDemo && !target.isDemo) {
    return res.status(403).json({ error: 'Forbidden: Demo accounts cannot access or modify real user accounts.' });
  }
  if (target.id === auth.account.id) {
    return res.status(400).json({ error: 'Administrators cannot deactivate their own active session.' });
  }
  if (target.id.startsWith('demo-')) {
    return res.status(400).json({ error: 'Built-in demo portal accounts cannot be deactivated.' });
  }

  target.isActive = !target.isActive;
  if (!target.isActive) {
    for (const [tok, sess] of activeSessions.entries()) {
      if (sess.accountId === target.id) {
        activeSessions.delete(tok);
      }
    }
  }

  recordServerAuditLog(
    auth.account.name,
    auth.account.role,
    target.isActive ? 'Activated User Account' : 'Deactivated User Account',
    `${target.name} (${target.studentId})`,
    'Warning',
    getClientIp(req),
    Boolean(auth.account.isDemo)
  );
  return res.json({ ok: true, user: sanitizePublicUser(target) });
});

app.post('/api/admin/users/:id/reset-password', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['admin'] });
  if (!auth) return;

  const target = SERVER_ACCOUNTS.find(a => a.id === req.params.id || a.studentId === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Target account not found.' });
  }
  if (auth.account.isDemo && !target.isDemo) {
    return res.status(403).json({ error: 'Forbidden: Demo accounts cannot access or modify real user accounts.' });
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
  const resetToken = signResetToken(target.id, nonce, expiresAt);
  const code = String(crypto.randomInt(100000, 1000000));
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  activeResetRequests.set(target.id, {
    accountId: target.id,
    tokenId: nonce,
    tokenHash,
    codeHash: hashVerificationCode(target.id, code),
    expiresAt,
    used: false,
    failedAttempts: 0,
    email: target.email,
  });

  recordServerAuditLog(
    auth.account.name,
    auth.account.role,
    'Initiated Password Reset',
    `${target.name} (${target.studentId})`,
    'Warning',
    getClientIp(req),
    Boolean(auth.account.isDemo)
  );

  // Returns only time-limited one-time reset token, never any password
  return res.json({
    ok: true,
    userId: target.id,
    studentId: target.studentId,
    resetToken,
    resetPath: `/accounts/password-reset-confirm/?token=${encodeURIComponent(resetToken)}`,
    expiresInMinutes: 15,
    message: `Time-limited password reset link generated for ${target.studentId}. Valid for 15 minutes.`,
  });
});

app.put('/api/admin/allocations', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['admin'] });
  if (!auth) return;

  const { facultyId, facultyUsername, subjectCodes, permissions } = req.body || {};
  const target = SERVER_ACCOUNTS.find(
    a => a.role === 'faculty' && (a.id === facultyId || a.studentId === facultyId || a.username === facultyUsername)
  );
  if (!target) {
    return res.status(404).json({ error: 'Faculty account not found.' });
  }
  if (auth.account.isDemo && !target.isDemo) {
    return res.status(403).json({ error: 'Forbidden: Demo accounts cannot access or modify real user accounts.' });
  }
  if (!Array.isArray(subjectCodes) || !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'subjectCodes and permissions arrays are required.' });
  }
  target.assignedSubjectCodes = subjectCodes.map(String);
  target.facultyPermissions = permissions.map(String);

  recordServerAuditLog(
    auth.account.name,
    auth.account.role,
    'Updated Faculty Allocations',
    `${target.studentId}: [${target.assignedSubjectCodes.join(', ')}]`,
    'Warning',
    getClientIp(req),
    Boolean(auth.account.isDemo)
  );
  return res.json({ ok: true, user: sanitizePublicUser(target) });
});

app.get('/api/admin/audit-logs', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['admin'] });
  if (!auth) return;
  const visibleLogs = auth.account.isDemo
    ? serverAuditLogs.filter(entry => Boolean(entry.isDemo))
    : serverAuditLogs.filter(entry => !entry.isDemo);
  return res.json({ auditLogs: visibleLogs });
});

app.post('/api/faculty/question-bank', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['faculty'] });
  if (!auth) return;

  const { subjectCode, prompt, answer } = req.body || {};
  const cleanCode = String(subjectCode || '').trim().toUpperCase();
  if (!auth.account.facultyPermissions?.includes('create_assessments')) {
    return res.status(403).json({ error: 'Forbidden: Missing create_assessments permission.' });
  }
  if (!auth.account.assignedSubjectCodes?.includes(cleanCode)) {
    return res.status(403).json({ error: `Forbidden: Subject ${cleanCode} is not allocated to your faculty profile.` });
  }
  if (!prompt || !answer) {
    return res.status(400).json({ error: 'Subject code, question prompt, and answer are required.' });
  }

  const item = {
    id: `qb-srv-${Date.now()}`,
    subjectCode: cleanCode,
    prompt: String(prompt).trim(),
    answer: String(answer).trim(),
    createdBy: auth.account.username,
  };
  serverQuestionBank.unshift(item);
  recordServerAuditLog(auth.account.name, 'faculty', 'Added Question Bank Item', `${cleanCode}`, 'Info', getClientIp(req));
  return res.status(201).json({ ok: true, item });
});

app.patch('/api/faculty/evaluations/:id', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['faculty'] });
  if (!auth) return;

  const { subjectCode, marks, feedback } = req.body || {};
  const cleanCode = String(subjectCode || '').trim().toUpperCase();
  if (!auth.account.facultyPermissions?.includes('evaluate_submissions')) {
    return res.status(403).json({ error: 'Forbidden: Missing evaluate_submissions permission.' });
  }
  if (!auth.account.assignedSubjectCodes?.includes(cleanCode)) {
    return res.status(403).json({ error: `Forbidden: Subject ${cleanCode} is not allocated to your faculty profile.` });
  }

  const numericMarks = Number(marks);
  if (!Number.isFinite(numericMarks) || numericMarks < 0 || numericMarks > 100) {
    return res.status(400).json({ error: 'Marks must be a finite number between 0 and 100.' });
  }

  const evaluation = {
    id: req.params.id,
    subjectCode: cleanCode,
    marks: Math.round(numericMarks * 10) / 10,
    feedback: String(feedback || '').trim().slice(0, 2000),
    evaluatedBy: auth.account.name,
  };
  serverEvaluations.set(req.params.id, evaluation);
  recordServerAuditLog(auth.account.name, 'faculty', 'Evaluated Submission', `${req.params.id} (${cleanCode})`, 'Info', getClientIp(req));
  return res.json({ ok: true, evaluation });
});

app.get('/api/student/records', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res, { allowedRoles: ['student'] });
  if (!auth) return;

  const requestedStudentId = req.query.studentId ? String(req.query.studentId).trim().toUpperCase() : '';
  if (requestedStudentId && requestedStudentId !== auth.account.studentId.toUpperCase()) {
    return res.status(403).json({ error: 'Forbidden: Students can only access their own academic records.' });
  }

  return res.json({
    student: sanitizePublicUser(auth.account),
    records: [
      {
        studentId: auth.account.studentId,
        rollNumber: auth.account.rollNumber,
        semester: auth.account.semester,
        currentSGPA: auth.account.currentSGPA,
        completedCredits: auth.account.completedCredits,
        totalCredits: auth.account.totalCredits,
      },
    ],
  });
});

// 4B. Isolated Subprocess Python Code Execution Endpoint (Coding Lab & Challenge Arena)
const BLOCKED_PYTHON_MODULES = [
  'os', 'subprocess', 'socket', 'shutil', 'ctypes', 'pty', 'urllib', 'http',
  'sys', 'importlib', 'builtins', 'pathlib', 'io', 'tempfile', 'platform',
  'getpass', 'inspect', 'code', 'codeop', 'multiprocessing', 'threading',
  'concurrent', 'pickle', 'marshal', 'shelve', 'requests', 'httpx', 'aiohttp',
  'webbrowser', 'ftplib', 'smtplib', 'sqlite3', 'signal', 'resource', 'gc',
  'fcntl', 'termios', 'tty', 'mmap', 'asyncio', 'pkgutil', 'runpy', 'venv',
];
const PYTHON_AST_RUNNER = `
import ast, sys
FORBIDDEN_MODS = set(${JSON.stringify(BLOCKED_PYTHON_MODULES)})
FORBIDDEN_CALLS = {'open','eval','exec','compile','__import__','getattr','setattr','delattr','globals','locals','vars','dir','breakpoint','input','memoryview'}
FORBIDDEN_ATTRS = {'__import__','__builtins__','__subclasses__','__globals__','__class__','__bases__','__base__','__mro__','__dict__','__code__','__closure__','__func__','__self__','__loader__','__spec__','__reduce__','__reduce_ex__','__getattribute__','gi_frame','gi_code','cr_frame','ag_frame','f_globals','f_locals','f_builtins','f_back'}
SAFE_DUNDERS = {'__init__','__str__','__repr__','__len__','__iter__','__next__','__eq__','__lt__','__le__','__gt__','__ge__','__hash__','__name__','__main__'}
src = sys.stdin.read()
try:
    tree = ast.parse(src)
except SyntaxError as exc:
    sys.stderr.write(f"SyntaxError on line {exc.lineno}: {exc.msg}\\n")
    sys.exit(2)
for node in ast.walk(tree):
    if isinstance(node, ast.Import):
        for alias in node.names:
            mod = alias.name.split('.')[0].strip()
            if mod in FORBIDDEN_MODS:
                sys.stderr.write(f"__SANDBOX_BLOCK__:Module '{mod}' is restricted in the isolated academic runner.")
                sys.exit(77)
    elif isinstance(node, ast.ImportFrom):
        mod = (node.module or '').split('.')[0].strip()
        if not mod or mod in FORBIDDEN_MODS:
            sys.stderr.write(f"__SANDBOX_BLOCK__:Importing from '{mod or 'relative'}' is restricted in the isolated academic runner.")
            sys.exit(77)
    elif isinstance(node, ast.Call):
        if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
            sys.stderr.write(f"__SANDBOX_BLOCK__:Calling '{node.func.id}()' is disabled in the academic sandbox.")
            sys.exit(77)
        if isinstance(node.func, ast.Attribute) and node.func.attr in FORBIDDEN_CALLS:
            sys.stderr.write(f"__SANDBOX_BLOCK__:Calling '.{node.func.attr}()' is disabled in the academic sandbox.")
            sys.exit(77)
    elif isinstance(node, ast.Attribute):
        if node.attr in FORBIDDEN_ATTRS or (node.attr.startswith('__') and node.attr.endswith('__') and node.attr not in SAFE_DUNDERS):
            sys.stderr.write(f"__SANDBOX_BLOCK__:Accessing attribute '{node.attr}' is prohibited in the academic sandbox.")
            sys.exit(77)
    elif isinstance(node, ast.Name) and node.id in {'__builtins__', '__loader__', '__spec__'}:
        sys.stderr.write(f"__SANDBOX_BLOCK__:Referencing '{node.id}' is prohibited in the academic sandbox.")
        sys.exit(77)
try:
    import resource
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
except Exception:
    pass
ns = {'__name__': '__main__'}
exec(compile(tree, '<coding_lab>', 'exec'), ns, ns)
`;

app.post('/api/coding-lab/execute', (req, res) => {
  const auth = requireAuthenticatedAccount(req, res);
  if (!auth) return;

  const code = String(req.body?.code || '');
  const expectedStdout = typeof req.body?.expectedStdout === 'string' ? req.body.expectedStdout.trim() : '';

  if (!code.trim()) {
    return res.status(400).json({ error: 'Python source code cannot be empty.' });
  }
  if (code.length > 15000) {
    return res.status(400).json({ error: 'Submitted Python code exceeds maximum allowed length (15 KB).' });
  }

  const importPattern = new RegExp(`\\b(import|from)\\s+(${BLOCKED_PYTHON_MODULES.join('|')})\\b`);
  const blockedMatch = code.match(importPattern);
  if (blockedMatch) {
    return res.status(403).json({
      error: `Sandbox Policy Violation: Module "${blockedMatch[2]}" is restricted in the isolated academic runner.`,
      passed: false,
    });
  }
  if (/\b(__import__|eval|exec|open|compile|getattr|setattr|delattr|globals|locals|vars|breakpoint|input)\s*\(/.test(code)) {
    return res.status(403).json({
      error: 'Sandbox Policy Violation: Dynamic system calls are disabled in the academic sandbox.',
      passed: false,
    });
  }
  if (/\b(__builtins__|__subclasses__|__globals__|__bases__|__mro__|__closure__)\b/.test(code)) {
    return res.status(403).json({
      error: 'Sandbox Policy Violation: Restricted internal Python attributes are disabled in the academic sandbox.',
      passed: false,
    });
  }

  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mca_sandbox_'));
  const startedAt = Date.now();
  try {
    const proc = spawnSync('python3', ['-I', '-c', PYTHON_AST_RUNNER], {
      input: code,
      cwd: sandboxDir,
      env: {
        PYTHONNOUSERSITE: '1',
        PYTHONDONTWRITEBYTECODE: '1',
        LC_ALL: 'C.UTF-8',
        LANG: 'C.UTF-8',
      },
      encoding: 'utf-8',
      timeout: 3000,
      maxBuffer: 128 * 1024,
    });
    const elapsedMs = Date.now() - startedAt;

    if (proc.status === 77 && (proc.stderr || '').includes('__SANDBOX_BLOCK__:')) {
      const reason = proc.stderr.split('__SANDBOX_BLOCK__:')[1]?.trim() || 'Restricted operation blocked.';
      return res.status(403).json({
        error: `Sandbox Policy Violation: ${reason}`,
        passed: false,
      });
    }

    if (proc.error) {
      const timedOut = (proc.error as any).code === 'ETIMEDOUT';
      return res.status(200).json({
        stdout: (proc.stdout || '').slice(0, 32768),
        stderr: timedOut ? 'Execution timed out after 3000ms limit.' : 'Sandbox execution failed.',
        returncode: -1,
        elapsedMs,
        passed: false,
      });
    }

    const cleanOut = (proc.stdout || '').trim().replace(/\r\n/g, '\n');
    const expectedClean = expectedStdout.replace(/\r\n/g, '\n');
    const passed = proc.status === 0 && (expectedClean ? cleanOut === expectedClean : true);

    return res.json({
      stdout: (proc.stdout || '').slice(0, 32768),
      stderr: (proc.stderr || '').slice(0, 32768),
      returncode: proc.status ?? 0,
      elapsedMs,
      passed,
    });
  } finally {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  }
});

app.post('/api/auth/request-password-reset', async (req, res) => {
  const identifier = String(req.body?.identifier || '').trim();
  if (!identifier) {
    return res.status(400).json({ error: 'Please enter your registered email address, Institutional ID, or username.' });
  }
  const ip = getClientIp(req);
  const rateKey = `${identifier.toLowerCase()}::${ip}`;
  const now = Date.now();
  const rateRec = resetEmailRateStore.get(rateKey);
  if (rateRec && now - rateRec.windowStart < RESET_TOKEN_TTL_MS && rateRec.count >= 5) {
    return res.status(429).json({
      error: 'Too many password reset email requests. Please wait 15 minutes before requesting another token.',
    });
  }

  const matched = findAccountByIdentifier(identifier);

  if (!matched || !matched.isActive || (matched.isDemo && !isDemoModeEnabled())) {
    return res.status(404).json({
      error: 'No active MCA Smart Campus account matched that email or identifier.',
    });
  }
  if (!matched.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(matched.email)) {
    return res.status(400).json({
      error: 'This account does not have a valid registered email address for verification.',
    });
  }

  const nextCount = rateRec && now - rateRec.windowStart < RESET_TOKEN_TTL_MS ? rateRec.count + 1 : 1;
  resetEmailRateStore.set(rateKey, {
    count: nextCount,
    windowStart: rateRec && now - rateRec.windowStart < RESET_TOKEN_TTL_MS ? rateRec.windowStart : now,
  });

  const nonce = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + RESET_TOKEN_TTL_MS;
  const resetToken = signResetToken(matched.id, nonce, expiresAt);
  const code = String(crypto.randomInt(100000, 1000000));
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  activeResetRequests.set(matched.id, {
    accountId: matched.id,
    tokenId: nonce,
    tokenHash,
    codeHash: hashVerificationCode(matched.id, code),
    expiresAt,
    used: false,
    failedAttempts: 0,
    email: matched.email,
  });

  try {
    const dispatch = await sendPasswordResetVerificationEmail({
      req,
      account: matched,
      resetToken,
      code,
      expiresAt,
    });

    recordServerAuditLog(
      matched.name,
      matched.role,
      'Dispatched Password Reset Verification Email',
      `${matched.studentId} (${dispatch.deliveryMode})`,
      'Info',
      ip,
      Boolean(matched.isDemo)
    );

    // Never expose passwords, verification codes, or secret reset tokens in unauthenticated responses
    return res.json({
      ok: true,
      maskedEmail: maskEmail(matched.email),
      expiresInMinutes: 15,
      expiresAt,
      deliveryMode: dispatch.deliveryMode,
      ...(dispatch.deliveryMode === 'dev_inbox' ? { devMessageId: dispatch.messageId } : {}),
      message: `A unique, time-limited verification link and 6-digit code have been sent to ${maskEmail(matched.email)}. Valid for 15 minutes.`,
    });
  } catch (err: any) {
    activeResetRequests.delete(matched.id);
    if (err?.message === 'SMTP_NOT_CONFIGURED') {
      return res.status(503).json({
        error: 'Password reset email service is not configured on the server. Contact your administrator.',
      });
    }
    console.error('Password reset email dispatch error:', err?.message || err);
    return res.status(502).json({
      error: 'Unable to deliver verification email at this moment. Please try again shortly.',
    });
  }
});

app.get('/api/auth/verify-reset-token', (req, res) => {
  const cleanToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!cleanToken) {
    return res.status(400).json({ valid: false, error: 'Missing password reset verification token.' });
  }
  const verified = verifySignedResetToken(cleanToken);
  if (!verified) {
    return res.status(400).json({ valid: false, error: 'This password reset link is invalid or has expired.' });
  }
  const record = activeResetRequests.get(verified.accountId);
  const incomingHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
  if (
    !record ||
    record.used ||
    Date.now() > record.expiresAt ||
    !timingSafeMatch(record.tokenHash, incomingHash)
  ) {
    return res.status(400).json({
      valid: false,
      error: 'This password reset link has expired, been superseded, or has already been used.',
    });
  }
  const targetAccount = SERVER_ACCOUNTS.find(a => a.id === verified.accountId);
  if (!targetAccount || !targetAccount.isActive || (targetAccount.isDemo && !isDemoModeEnabled())) {
    return res.status(403).json({ valid: false, error: 'Account is inactive or unavailable for password reset.' });
  }
  return res.json({
    valid: true,
    maskedEmail: maskEmail(targetAccount.email),
    studentId: targetAccount.studentId,
    expiresAt: record.expiresAt,
  });
});

app.get('/api/auth/dev-mail-preview', (req, res) => {
  if (isProductionRuntime() || isSmtpConfigured()) {
    return res.status(404).json({ error: 'Not found.' });
  }
  const messageId = typeof req.query.messageId === 'string' ? req.query.messageId.trim() : '';
  if (!messageId) {
    return res.status(400).json({ error: 'messageId query parameter is required.' });
  }
  const mail = devMailOutbox.get(messageId);
  if (!mail) {
    return res.status(404).json({ error: 'Preview message not found or expired.' });
  }
  return res.json({ mail });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { identifier, verificationCode, resetToken, newPassword, confirmPassword } = req.body || {};
  const cleanCode = String(verificationCode || '').trim();
  const cleanToken = String(resetToken || '').trim();
  const cleanPass = String(newPassword || '');
  const cleanConfirm = String(confirmPassword ?? cleanPass);
  const ip = getClientIp(req);

  if ((!cleanCode && !cleanToken) || !cleanPass) {
    return res.status(400).json({ error: 'A valid reset token or verification code and new password are required.' });
  }
  if (cleanPass !== cleanConfirm) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }

  let targetAccount: ServerAccountRecord | undefined;
  let record: ResetTokenRecord | undefined;

  if (cleanToken) {
    const verified = verifySignedResetToken(cleanToken);
    if (!verified) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }
    record = activeResetRequests.get(verified.accountId);
    const incomingHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
    if (
      !record ||
      record.used ||
      Date.now() > record.expiresAt ||
      !timingSafeMatch(record.tokenHash, incomingHash)
    ) {
      return res.status(400).json({ error: 'Reset token has expired or has already been used.' });
    }
    targetAccount = SERVER_ACCOUNTS.find(a => a.id === verified.accountId);
  } else {
    targetAccount = findAccountByIdentifier(String(identifier || ''));
    if (!targetAccount) {
      return res.status(400).json({ error: 'Account identifier or verification code is invalid.' });
    }
    record = activeResetRequests.get(targetAccount.id);
    if (!record || record.used || Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Request a fresh reset email.' });
    }
    const candidateHash = hashVerificationCode(targetAccount.id, cleanCode);
    if (!timingSafeMatch(record.codeHash, candidateHash)) {
      record.failedAttempts += 1;
      if (record.failedAttempts >= 5) {
        activeResetRequests.delete(targetAccount.id);
        recordServerAuditLog(
          targetAccount.name,
          targetAccount.role,
          'Password Reset Token Invalidated (Too Many Invalid Attempts)',
          targetAccount.studentId,
          'Warning',
          ip,
          Boolean(targetAccount.isDemo)
        );
        return res.status(429).json({
          error: 'Too many invalid verification attempts. Please request a new password reset email.',
        });
      }
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }
  }

  if (!targetAccount || !targetAccount.isActive || (targetAccount.isDemo && !isDemoModeEnabled())) {
    return res.status(403).json({ error: 'Account is inactive or unavailable for password reset.' });
  }

  const strengthError = validatePasswordStrength(cleanPass, targetAccount);
  if (strengthError) {
    return res.status(400).json({ error: strengthError });
  }

  targetAccount.passwordHash = hashPassword(cleanPass);
  targetAccount.mustChangePassword = false;
  targetAccount.passwordUpdatedAt = new Date().toISOString();
  record.used = true;
  activeResetRequests.delete(targetAccount.id);

  // Invalidate any prior active sessions on password reset
  for (const [tok, sess] of activeSessions.entries()) {
    if (sess.accountId === targetAccount.id) {
      activeSessions.delete(tok);
    }
  }

  recordServerAuditLog(
    targetAccount.name,
    targetAccount.role,
    'Completed Password Reset',
    targetAccount.studentId,
    'Info',
    ip,
    Boolean(targetAccount.isDemo)
  );

  return res.json({
    ok: true,
    role: targetAccount.role,
    message: 'Your MCA Smart Campus password has been updated securely. You can now sign in with your new password.',
  });
});

app.post('/api/contact', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();

  if (name.length < 2 || name.length > 120 || !email || message.length < 10 || message.length > 4000) {
    return res.status(400).json({
      error: 'Please enter a valid name (2–120 chars), email address, and message (10–4000 chars).',
    });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (subject.length > 200) {
    return res.status(400).json({ error: 'Subject cannot exceed 200 characters.' });
  }

  const ticket = {
    id: `TKT-${Date.now().toString().slice(-6)}`,
    name,
    email,
    subject: subject || 'General Academic Inquiry',
    message,
    submittedAt: new Date().toISOString(),
  };
  contactSubmissions.unshift(ticket);
  if (contactSubmissions.length > 50) contactSubmissions.pop();

  return res.status(201).json({
    ok: true,
    ticketId: ticket.id,
    submittedAt: ticket.submittedAt,
    message: 'Your inquiry has been logged with the MCA Academic Desk.',
  });
});

// 5. Practice Arena AI Question Generator (Grounded Strictly in Subject PDFs)
app.post('/api/practice/generate', async (req, res) => {
  const auth = requireAuthenticatedAccount(req, res);
  if (!auth) return;
  try {
    const { subjectCode, subjectName, topic, difficulty, questionType, count, pdfContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    if (!pdfContext || !Array.isArray(pdfContext) || pdfContext.length === 0) {
      return res.status(400).json({ error: 'No uploaded PDF context found for this subject.' });
    }

    const prompt = `Generate ${count || 4} postgraduate MCA Semester 1 practice questions strictly from the uploaded PDF context below.
Subject: ${subjectName} (${subjectCode})
Topic Focus: ${topic || 'Core Syllabus'}
Difficulty: ${difficulty || 'Mixed'}
Question Type Focus: ${questionType || 'Mixed'} (allowed types: "MCQ", "True/False", "Fill in the Blank", "Short Answer")

UPLOADED PDF CONTEXT:
${JSON.stringify(pdfContext, null, 2)}

RULES:
1. Do NOT mix content from other subjects. Ground every question in the PDF context above.
2. Cite the exact sourcePdfTitle and sourcePageRef from the provided pageReferences.
3. For "MCQ", include 4 options. For "True/False", include options ["True", "False"]. For "Fill in the Blank" and "Short Answer", omit options or leave empty array.
4. Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "pq-1",
      "subjectCode": "${subjectCode}",
      "topic": "${topic || 'Core'}",
      "questionType": "MCQ",
      "difficulty": "Medium",
      "prompt": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Concise explanation citing the PDF principle.",
      "sourcePdfTitle": "Exact fileName from context",
      "sourcePageRef": 12
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{"questions":[]}');
    return res.json(parsed);
  } catch (error: any) {
    return sendSafeAiError(res, 'practice-generate', error, 'Failed to generate practice questions.');
  }
});

// 6. AI Flashcards Generator (Grounded Strictly in Subject PDFs)
app.post('/api/flashcards/generate', async (req, res) => {
  const auth = requireAuthenticatedAccount(req, res);
  if (!auth) return;
  try {
    const { subjectCode, subjectName, unit, topic, count, pdfContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    if (!pdfContext || !Array.isArray(pdfContext) || pdfContext.length === 0) {
      return res.status(400).json({ error: 'No uploaded PDF context found for this subject.' });
    }

    const prompt = `Create ${count || 6} concise, high-retention study flashcards for MCA Semester 1 strictly grounded in the uploaded PDF knowledge base below.
Subject: ${subjectName} (${subjectCode})
Unit: ${unit || 1}
Topic: ${topic || 'Core Concepts'}

UPLOADED PDF CONTEXT:
${JSON.stringify(pdfContext, null, 2)}

RULES:
1. Every flashcard question and answer must derive directly from the PDF context above.
2. Include exact sourcePdfTitle and sourcePageRef from the provided PDFs.
3. Return ONLY valid JSON:
{
  "cards": [
    {
      "id": "fc-1",
      "question": "Clear conceptual prompt or theorem name",
      "answer": "Precise, memorable explanation with formula or key rule",
      "topic": "${topic || 'Core Concepts'}",
      "unit": ${unit || 1},
      "sourcePdfTitle": "Exact fileName from context",
      "sourcePageRef": 12
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{"cards":[]}');
    return res.json(parsed);
  } catch (error: any) {
    return sendSafeAiError(res, 'flashcards-generate', error, 'Failed to generate AI flashcards.');
  }
});

// 7. University-Level MCA Study Notes & Exam Q&A Generator (Grounded in Subject PDFs)
const SUBJECT_PEDAGOGY: Record<string, string> = {
  '435C1A': `DISCRETE MATHEMATICS (435C1A) EXPECTATIONS:
- Include formal mathematical definitions, logical/set notation (∀, ∃, ∧, ∨, ¬, ⇒, ⇔, ∑, ∈, ⊆, ⌈ ⌉, ⌊ ⌋), theorems, algebraic properties, and truth/algebraic derivations.
- Whenever proofs, recurrences, normal forms, posets, or graph problems appear, provide step-by-step derivations and worked mathematical solutions in formulaBox and contentMarkdown.`,
  '435C1B': `DATA STRUCTURES AND ALGORITHMS (435C1B) EXPECTATIONS:
- Include formal ADT definitions, clean indented pseudocode, step-by-step dry runs / trace tables on concrete inputs, ASCII tree/heap/graph diagrams in diagramText, exact Best/Average/Worst Time & Space Complexity analysis, comparisons, and system applications.`,
  '435E1A': `DATA ENGINEERING AND MANAGEMENT (435E1A) EXPECTATIONS:
- Include conceptual database engineering explanations, relational schemas / functional dependencies, valid SQL or MongoDB queries in codeSnippet, ASCII B+ tree / transaction / warehouse architecture diagrams in diagramText, concurrency/OLAP comparisons, and industry use cases.`,
  '435C1C': `PYTHON PROGRAMMING (435C1C) EXPECTATIONS:
- Include Python 3 syntax rules, syntactically valid executable Python 3 code examples in codeSnippet with expected console output, step-by-step execution traces, CPython/memory/concurrency insights, and practical software engineering applications.`,
};

const MODE_INSTRUCTIONS: Record<string, string> = {
  'Detailed Notes': `Generate comprehensive, university-level MCA Semester 1 lecture & study notes using all relevant sections from this academic blueprint:
1. Learning Objectives
2. Introduction & Background
3. Definition & Fundamental Concepts
4. Detailed Explanation
5. Classification & Types (where applicable)
6. Characteristics & Properties (where applicable)
7. Working Principles & Step-by-Step Process
8. Architecture / Components / Mathematical Structure
9. Diagrams, Flowcharts & Comparison Tables (use markdown tables & ASCII diagrams in diagramText)
10. Syntax / Pseudocode / Programming or Derivation Examples
11. Real-World Applications
12. Advantages & Limitations
13. Comparison with Related Concepts
14. Important Points to Remember & Exam Tips
15. Sample Exam-Oriented Q&A (at least one 2-mark, one 5-mark, and one 10-mark structured model answer)
Omit any section that does not naturally apply to the topic rather than writing filler.`,
  '2-Mark Questions': `Generate 6 high-yield 2-mark university examination questions & answers strictly for this topic.
Each question section MUST include:
- Precise formal definition
- 2–3 crisp bullet key points
- Short concrete formula, code line, or micro-example.`,
  '5-Mark Questions': `Generate 4 comprehensive 5-mark university examination questions & answers strictly for this topic.
Each question section MUST include:
- Structured introduction
- Detailed explanation with clear subheadings
- Worked example, diagram/table (diagramText), or code snippet (codeSnippet)
- Key exam takeaways.`,
  '10-Mark Questions': `Generate 2 full-length 10-mark postgraduate university essay/problem answers strictly for this topic. Do NOT write short paragraphs!
Each 10-mark section MUST include:
- Comprehensive introduction
- Deep conceptual explanation & formal classification
- Step-by-step working principles / derivation / algorithm
- Suitable ASCII diagram/table (diagramText), syntax/code (codeSnippet), and real-world applications
- Advantages, limitations, and well-structured conclusion.`,
  'Solved Examples': `Generate 4–5 fully worked step-by-step solved problems / derivations / dry-runs / executable programs matching this exact topic, moving from fundamental to university exam difficulty.`,
  'Revision Notes': `Generate a high-density pre-exam revision sheet: concise formula/syntax reference box, key comparison markdown table, common exam traps to avoid, and rapid-recall bullet points.`,
};

app.post('/api/study-notes/generate', async (req, res) => {
  const auth = requireAuthenticatedAccount(req, res);
  if (!auth) return;
  try {
    const { subjectCode, subjectName, unit, topic, subtopic, mode, pdfContext } = req.body || {};

    if (!subjectCode || !topic || !mode) {
      return res.status(400).json({ error: 'Subject code, topic, and generation mode are required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI Provider is not configured (GEMINI_API_KEY missing in server environment). Please set GEMINI_API_KEY in Secrets to enable live Gemini generation.',
      });
    }

    const pedagogy = SUBJECT_PEDAGOGY[subjectCode] || '';
    const modePrompt = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS['Detailed Notes'];
    const safePdfContext = Array.isArray(pdfContext) ? pdfContext : [];

    const systemInstruction = `You are a Senior Postgraduate Computer Science Professor designing official MCA Semester 1 university study notes for "${subjectName}" (${subjectCode}).

STRICT SOURCE GROUNDING & INTEGRITY RULES:
1. Never mix content from other subjects. Stay 100% focused on ${subjectName} (${subjectCode}), Unit ${unit || 1}, Topic: "${topic}"${subtopic ? `, Subtopic: "${subtopic}"` : ''}.
2. Use the uploaded PDF context below as the primary knowledge source. Preserve exact terminology and cite ONLY exact pdfTitle and pageNumber values present in the PDF context.
3. NEVER fabricate PDF filenames or page numbers.
4. For each section, honestly label sourceType:
   - "PDF-Grounded" if directly derived from the provided PDF excerpts/pageReferences (and include exact citations).
   - "AI-Supplementary" if expanding with university-level depth, additional worked examples, code, or derivations beyond the provided PDF snippet.
5. Set isPdfSufficient to true if the PDF context directly covers this topic well, or false if the PDF context had minimal/no coverage and AI supplementary academic explanation was added (and explain clearly in supplementaryNotice).
6. Zero filler, zero repetitive generic intros, syntactically valid code, and accurate step-by-step math.

${pedagogy}`;

    const userPrompt = `${modePrompt}

SUBJECT: ${subjectName} (${subjectCode})
UNIT: Unit ${unit || 1}
TOPIC: ${topic}
${subtopic ? `SUBTOPIC FOCUS: ${subtopic}` : ''}

UPLOADED SUBJECT PDF KNOWLEDGE BASE:
${safePdfContext.length > 0 ? JSON.stringify(safePdfContext, null, 2) : 'NO UPLOADED PDF EXCERPTS MATCHED THIS TOPIC DIRECTLY. Label sections honestly as "AI-Supplementary" and set isPdfSufficient=false.'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Academic title for the generated notes or Q&A set.' },
            isPdfSufficient: { type: Type.BOOLEAN, description: 'True if uploaded PDFs directly cover the topic; false if supplementary AI explanation was needed.' },
            supplementaryNotice: { type: Type.STRING, description: 'Clear disclosure noting which content is PDF-grounded vs AI supplementary.' },
            summary: { type: Type.STRING, description: 'Concise 2-4 sentence academic summary of the topic.' },
            importantPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '5 to 8 high-yield exam takeaways.',
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  sourceType: { type: Type.STRING, description: 'Either PDF-Grounded or AI-Supplementary' },
                  contentMarkdown: { type: Type.STRING, description: 'Rich markdown prose with subheadings, bold terms, numbered steps, or markdown tables.' },
                  formulaBox: { type: Type.STRING, description: 'Optional highlighted definition, theorem, recurrence, or key formula.' },
                  diagramText: { type: Type.STRING, description: 'Optional clean ASCII diagram, flowchart, truth table, or architecture block.' },
                  codeSnippet: {
                    type: Type.OBJECT,
                    properties: {
                      language: { type: Type.STRING },
                      code: { type: Type.STRING },
                      output: { type: Type.STRING },
                    },
                  },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  citations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        pdfTitle: { type: Type.STRING },
                        pageNumber: { type: Type.INTEGER },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    if (!parsed || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return res.status(502).json({ error: 'AI Provider returned an empty or malformed study notes payload. Please retry.' });
    }

    return res.json({
      note: parsed,
      providerUsed: 'Gemini AI',
    });
  } catch (error: any) {
    return sendSafeAiError(res, 'study-notes-generate', error, 'Failed to generate detailed study notes from AI provider.');
  }
});

// 8. Multi-Turn Academic Gemini Chatbot Endpoint (ai.chats.create + systemInstruction)
const CHAT_ROLE_INSTRUCTIONS: Record<string, string> = {
  academic_tutor: `You are the MCA Semester 1 Academic Tutor for a postgraduate Master of Computer Applications student.
You specialize in the four core Semester 1 subjects:
1. Discrete Mathematics (435C1A)
2. Data Structures and Algorithms (435C1B)
3. Data Engineering and Management (435E1A)
4. Python Programming (435C1C)
Give rigorous, accurate, step-by-step academic explanations with formal definitions, clear examples, complexity notes, or SQL/Python snippets where relevant. Maintain continuity across follow-up questions.`,
  coding_mentor: `You are an Algorithm & Python Programming Mentor for MCA Semester 1 students.
Focus on clean pseudocode, syntactically valid Python 3 code blocks, step-by-step dry runs, edge cases, and Big-O time/space complexity analysis. Build incrementally on earlier turns in the conversation.`,
  exam_strategist: `You are an MCA University Examination Strategist.
Structure your answers for Indian postgraduate university exams (2-mark crisp definitions, 5-mark structured explanations with diagrams/examples, or 10-mark comprehensive essays with classification, working principles, advantages, limitations, and conclusions) depending on the student's question.`,
  concept_guide: `You are a Concise Study Concept Guide for busy MCA students revising before quizzes or labs.
Deliver clear intuition first, followed by a concise formal definition, bullet-point key properties, and a quick concrete micro-example or mnemonic.`,
};

app.post('/api/gemini/chat', async (req, res) => {
  const auth = requireAuthenticatedAccount(req, res);
  if (!auth) return;
  try {
    const { message, history, role = 'academic_tutor', taskMode = 'general', studentContext } = req.body || {};

    const trimmedMessage = typeof message === 'string' ? message.trim() : '';
    if (!trimmedMessage) {
      return res.status(400).json({ error: 'Please enter a message before sending.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it in the Secrets panel.',
      });
    }

    const baseRoleInstruction = CHAT_ROLE_INSTRUCTIONS[role] || CHAT_ROLE_INSTRUCTIONS.academic_tutor;
    const contextLines: string[] = [];
    if (studentContext?.name) contextLines.push(`Student: ${studentContext.name} (${studentContext.studentId || 'MCA Semester 1'})`);
    if (studentContext?.currentPage) contextLines.push(`Active Portal Section: ${studentContext.currentPage}`);
    if (Array.isArray(studentContext?.subjects) && studentContext.subjects.length > 0) {
      contextLines.push(`Enrolled Subjects: ${studentContext.subjects.join(', ')}`);
    }

    const systemInstruction = contextLines.length > 0
      ? `${baseRoleInstruction}\n\nPORTAL CONTEXT:\n${contextLines.join('\n')}`
      : baseRoleInstruction;

    const selectedModel =
      taskMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

    const thinkingConfig =
      taskMode === 'deep'
        ? { thinkingLevel: ThinkingLevel.HIGH }
        : taskMode === 'fast'
        ? { thinkingLevel: ThinkingLevel.MINIMAL }
        : undefined;

    const formattedHistory = Array.isArray(history)
      ? history
          .filter(
            (item: any) =>
              item &&
              (item.role === 'user' || item.role === 'model') &&
              typeof item.text === 'string' &&
              item.text.trim().length > 0
          )
          .slice(-24)
          .map((item: any) => ({
            role: item.role as 'user' | 'model',
            parts: [{ text: item.text }],
          }))
      : [];

    const chat = ai.chats.create({
      model: selectedModel,
      config: {
        systemInstruction,
        ...(thinkingConfig ? { thinkingConfig } : {}),
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message: trimmedMessage });
    const reply = response.text?.trim();

    if (!reply) {
      return res.status(502).json({
        error: 'Gemini returned an empty response. Please rephrase or try again.',
      });
    }

    return res.json({
      reply,
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    return sendSafeAiError(res, '/api/gemini/chat', error, 'Failed to get a response from the Gemini academic tutor.');
  }
});

async function startServer() {
  if (!isProductionRuntime()) {
    // HMR is disabled in this environment; serve a WebSocket-free /@vite/client shim
    // so Vite CSS/module runtime imports work without opening failing WebSocket connections.
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

export function resetAuthStateForTests() {
  activeSessions.clear();
  loginAttemptStore.clear();
  activeResetRequests.clear();
  resetEmailRateStore.clear();
  devMailOutbox.clear();
  serverAuditLogs.length = 0;
  serverQuestionBank.length = 0;
  SERVER_ACCOUNTS.length = 0;
  SERVER_ACCOUNTS.push(...createInitialAccounts());
}

export { app };

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  startServer();
}
