import json
import os
import urllib.error
import urllib.request


class StudyNoteGenerationError(Exception):
    """Raised when server-side Gemini study note generation fails or is unconfigured."""


SUBJECT_PEDAGOGY = {
    '435C1A': (
        'Discrete Mathematics (435C1A): Emphasize rigorous mathematical definitions, formal symbolic '
        'notation, algebraic laws, theorem proofs, equivalence derivations, recurrence steps, and solved numerical exercises.'
    ),
    '435C1B': (
        'Data Structures and Algorithms (435C1B): Emphasize Abstract Data Type specifications, structured '
        'pseudocode, ASCII node/tree/graph diagrams, invariants, asymptotic time/space complexity (Big-O, Omega, Theta), and step-by-step traces.'
    ),
    '435E1A': (
        'Data Engineering and Management (435E1A): Emphasize relational algebra, BCNF/4NF normalization proofs, '
        'SQL DDL/DML queries with sample output, concurrency schedules, B+ tree / ETL / warehouse ASCII diagrams, and OLTP vs OLAP tables.'
    ),
    '435C1C': (
        'Python Programming (435C1C): Emphasize Python 3 syntax rules, runnable code examples with expected console '
        'output, memory/execution traces, CPython/GIL internals, OOP/async/NumPy/Pandas/Django patterns, and edge cases.'
    ),
}

MODE_INSTRUCTIONS = {
    'Detailed Notes': (
        'Generate comprehensive postgraduate university lecture notes using applicable sections from the 17-point academic framework: '
        'Topic Title, Learning Objectives, Introduction & Background, Definition & Fundamental Concepts, Detailed Explanation, '
        'Classification & Types, Characteristics & Properties, Working Principles & Step-by-Step Processes, Architecture/Structure, '
        'Diagrams/Tables, Syntax & Programming Examples (for technical topics), Real-World Applications, Advantages & Disadvantages, '
        'Comparison with Related Concepts, Important Points to Remember, Topic Summary, and Exam-Oriented 2/5/10-Mark Q&A. Omit irrelevant sections.'
    ),
    '2-Mark Questions': (
        'Generate 6 to 8 university 2-mark questions and crisp model answers. Each answer MUST include a precise definition, '
        '2-3 bullet key points, and a micro-example or formula.'
    ),
    '5-Mark Questions': (
        'Generate 4 university 5-mark questions and structured model answers. Each answer MUST include an Introduction, '
        'Detailed Explanation with subheadings, Important Points, and a worked Example or ASCII Diagram.'
    ),
    '10-Mark Questions': (
        'Generate 2 to 3 university 10-mark essay questions and exhaustive model answers. Each MUST contain: Comprehensive Introduction, '
        'Detailed Conceptual Explanation, Classification & Working Principles, Diagram/Table/Code Example, Advantages & Limitations, and Conclusion.'
    ),
    'Solved Examples': (
        'Generate 4 to 5 postgraduate solved problems progressing from foundational to university examination difficulty, showing '
        'Given/Goal, Formula/Algorithm, Step-by-step Derivation or Trace, and Final Verified Result.'
    ),
    'Revision Notes': (
        'Generate high-yield last-minute university revision sheets containing crisp concept bullets, formula/theorem cheat sheet, '
        'key comparison table, common exam traps, and 1-line memory hooks.'
    ),
}


def generate_university_study_note(subject, pdfs, unit, topic, subtopic='', mode='Detailed Notes'):
    """
    Generate structured university-level MCA study notes strictly grounded in uploaded subject PDFs.
    Requires GEMINI_API_KEY in server environment variables; never fabricates PDF page numbers.
    """
    api_key = os.environ.get('GEMINI_API_KEY', '').strip()
    if not api_key:
        raise StudyNoteGenerationError(
            'AI Study Notes generation requires GEMINI_API_KEY to be configured on the server.'
        )

    pedagogy = SUBJECT_PEDAGOGY.get(
        subject.code,
        'Postgraduate MCA university curriculum depth with definitions, examples, and exam Q&A.'
    )
    mode_guide = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS['Detailed Notes'])

    pdf_context_blocks = []
    for pdf in pdfs:
        pdf_context_blocks.append(
            f"- Title: {pdf.title} | Filename: {pdf.file_name} | Unit {pdf.unit} | Chapter: {pdf.chapter}"
        )
    pdf_context_text = '\n'.join(pdf_context_blocks) if pdf_context_blocks else 'No PDFs uploaded for this subject yet.'

    prompt = f"""
You are a senior MCA Postgraduate Professor preparing authoritative study notes for:
Subject: {subject.code} - {subject.name}
Unit: {unit}
Topic: {topic}
Subtopic: {subtopic or 'Comprehensive unit/topic coverage'}
Generation Mode: {mode}

PEDAGOGY:
{pedagogy}

MODE REQUIREMENTS:
{mode_guide}

UPLOADED SUBJECT PDFs (STRICT KNOWLEDGE BOUNDARY - DO NOT MIX OTHER SUBJECTS):
{pdf_context_text}

GROUNDING RULES:
1. Base explanations primarily on the uploaded PDF metadata/context above.
2. Mark every section sourceTag as 'PDF-Grounded' when directly supported by the uploaded PDFs, or 'AI-Supplementary' when supplementing gaps beyond the metadata.
3. Never invent fake PDF filenames or fabricated page numbers. Set isPdfSufficient=false and explain honestly in supplementaryNotice if uploaded PDF detail is partial.
4. Return strictly valid JSON matching this object structure:
{{
  "title": "string",
  "summary": "string",
  "isPdfSufficient": true,
  "supplementaryNotice": "string",
  "importantPoints": ["string"],
  "sourcePdfs": ["string"],
  "pageCitations": [1],
  "sections": [
    {{
      "id": "string",
      "heading": "string",
      "sourceTag": "PDF-Grounded" | "AI-Supplementary",
      "markdown": "string",
      "formula": "optional string",
      "diagram": "optional ASCII diagram string",
      "codeSnippet": "optional string",
      "codeLanguage": "optional string",
      "expectedOutput": "optional string"
    }}
  ]
}}
"""

    model_name = os.environ.get('GEMINI_NOTES_MODEL', 'gemini-2.5-flash')
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent'
    payload = json.dumps({
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'responseMimeType': 'application/json',
        },
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'x-goog-api-key': api_key,
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        raise StudyNoteGenerationError(f'Gemini API HTTP {exc.code}: unable to generate notes.') from exc
    except Exception as exc:
        raise StudyNoteGenerationError('Failed to reach Gemini AI service. Please verify server connectivity and try again.') from exc

    try:
        text_output = raw['candidates'][0]['content']['parts'][0]['text']
        parsed = json.loads(text_output)
    except Exception as exc:
        raise StudyNoteGenerationError('AI service returned an unreadable response structure.') from exc

    if not parsed.get('sections'):
        raise StudyNoteGenerationError('AI service returned empty study sections.')

    return parsed
