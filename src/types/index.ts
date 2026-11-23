export type UserRole = 'admin' | 'faculty' | 'student';

export type FacultyPermissionKey =
  | 'create_assessments'
  | 'edit_assessments'
  | 'evaluate_submissions'
  | 'view_marks'
  | 'publish_marks'
  | 'manage_materials'
  | 'create_challenges'
  | 'review_projects'
  | 'verify_skills';

export type PageId =
  | 'home'
  | 'about'
  | 'subjects'
  | 'features'
  | 'how-it-works'
  | 'contact'
  | 'faq'
  | 'login'
  | 'admin-login'
  | 'faculty-login'
  | 'student-login'
  | 'forgot-password'
  | 'reset-password'
  | 'change-password'
  // Student Workspace Routes
  | 'dashboard'
  | 'my-courses'
  | 'my-semesters'
  | 'my-subjects'
  | 'assignments'
  | 'examinations'
  | 'coding-lab'
  | 'materials'
  | 'ai-notes'
  | 'ai-assistant'
  | 'question-bank'
  | 'bookmarks'
  | 'analytics'
  | 'reports'
  | 'notifications'
  | 'profile'
  | 'achievements'
  | 'practice-arena'
  | 'flashcards'
  | 'calendar'
  | 'intelligence'
  | 'skill-dna'
  | 'project-studio'
  | 'career-lab'
  | 'study-planner'
  | 'knowledge-graph'
  | 'challenge-arena'
  | 'academic-passport'
  // Faculty Workspace Routes
  | 'faculty-overview'
  | 'faculty-profile'
  | 'faculty-subjects'
  | 'faculty-units'
  | 'faculty-students'
  | 'faculty-materials'
  | 'faculty-ai-notes'
  | 'faculty-question-bank'
  | 'faculty-assignments'
  | 'faculty-exams'
  | 'faculty-evaluation'
  | 'faculty-gradebook'
  | 'faculty-practice'
  | 'faculty-projects'
  | 'faculty-challenges'
  | 'faculty-skills'
  | 'faculty-knowledge-graph'
  | 'faculty-analytics'
  | 'faculty-calendar'
  | 'faculty-notices'
  // Admin Workspace Routes
  | 'admin-overview'
  | 'admin-users'
  | 'admin-academics'
  | 'admin-allocations'
  | 'admin-assessments'
  | 'admin-results'
  | 'admin-materials'
  | 'admin-notices'
  | 'admin-certificates'
  | 'admin-analytics'
  | 'admin-features'
  | 'admin-settings'
  | 'admin-audit-logs';

export type SubjectStatus = 'Upcoming' | 'Active' | 'Completed';

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester?: number;
  status: SubjectStatus;
  isAvailable?: boolean;
  credits: number;
  type: 'Core' | 'Elective' | 'Practical';
  instructor: string;
  description: string;
  iconName: string;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  learningObjectives?: string[];
  units: {
    unitNumber: number;
    title: string;
    topics: string[];
  }[];
  referenceBooks: string[];
}

export interface StudentUser {
  id: string;
  role?: UserRole;
  isActive?: boolean;
  isDemo?: boolean;
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
  facultyPermissions?: FacultyPermissionKey[];
  mustChangePassword?: boolean;
  passwordUpdatedAt?: string;
  avatarUrl?: string;
}

export interface Question {
  id: string;
  subjectCode: string;
  subjectName: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  unit: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Examination {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  status: 'Available' | 'Completed' | 'Upcoming';
  dueDate: string;
  questions: Question[];
  userScore?: number;
  completedAt?: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Algorithms' | 'Data Structures' | 'Data Engineering' | 'Core Python';
  description: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  starterCode: string;
  testCases: {
    input: string;
    expectedOutput: string;
  }[];
  solutionExplanation: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  unit: number;
  category: 'Lecture Notes' | 'Question Bank' | 'Lab Manual' | 'Reference Sheet';
  fileFormat: 'PDF' | 'DOCX' | 'ZIP' | 'CODE';
  fileSize: string;
  uploadDate: string;
  downloadCount: number;
  summary: string;
  content: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  type: 'Material' | 'Question' | 'Problem' | 'Subject' | 'Assignment';
  refId: string;
  subtitle: string;
  addedAt: string;
  tags: string[];
}

export interface FAQItem {
  id: string;
  category: 'Accounts' | 'Curriculum' | 'Examinations' | 'Coding Lab' | 'Materials' | 'Reports';
  question: string;
  answer: string;
}

// -------------------------------------------------------------
// NEW: AI-POWERED PDF LEARNING SYSTEM TYPES
// -------------------------------------------------------------

export interface SubjectPDF {
  id: string;
  subjectCode: string; // '435C1A' | '435C1B' | '435E1A' | '435C1C'
  subjectName: string;
  semester?: number;
  status?: 'Draft' | 'Published';
  topic?: string;
  description?: string;
  learningObjectives?: string[];
  title: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  unit: number;
  chapter: string;
  uploadedBy: string;
  uploadDate: string;
  ocrApplied: boolean;
  ocrConfidence: number; // e.g. 98.4%
  processingStatus: 'Completed' | 'Processing' | 'Failed';
  extractedText: string;
  topicsCovered: string[];
  pageReferences: {
    pageNumber: number;
    heading: string;
    snippet: string;
  }[];
}

export interface AIGeneratedStudyPack {
  id: string;
  subjectCode: string;
  sourcePdfId: string;
  sourcePdfTitle: string;
  unit: number;
  title: string;
  createdAt: string;
  type: 'StudyNotes' | 'ImportantQuestions' | 'QuestionBank' | 'ExamPrep';
  contentMarkdown: string;
  pageCitations: number[];
}

export interface AIChatbotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sourceCitations?: {
    pdfTitle: string;
    pageNumber: number;
    snippet: string;
  }[];
  isGeneralKnowledgeFallback?: boolean;
}

// -------------------------------------------------------------
// NEW: DYNAMIC ASSIGNMENT SYSTEM TYPES
// -------------------------------------------------------------

export type AssignmentStatus =
  | 'Draft'
  | 'Published'
  | 'Not Started'
  | 'In Progress'
  | 'Submitted'
  | 'Under Review'
  | 'Evaluated'
  | 'Overdue';

export type AssignmentType =
  | 'MCQ Assignment'
  | 'Short Answer Assignment'
  | 'Long Answer Assignment'
  | 'Programming Assignment'
  | 'Practical Assignment'
  | 'Mixed Question Assignment';

export type GenerationMethod =
  | 'Topic-Based'
  | 'Difficulty-Based'
  | 'Question-Type'
  | 'Randomized'
  | 'Learning Outcome-Based';

export interface AssignmentQuestion {
  id: string;
  questionNumber: number;
  text: string;
  questionType: 'MCQ' | 'Short Answer' | 'Long Answer' | 'Programming' | 'Problem Solving';
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options?: string[];
  correctAnswer?: string | number;
  expectedKeywords?: string[];
  sourcePdfTitle?: string;
  sourcePageRef?: number;
  learningOutcome?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectCode: string; // 435C1A, 435C1B, 435E1A, 435C1C
  subjectName: string;
  unit: number;
  chapter: string;
  topic: string;
  assignmentType: AssignmentType;
  generationMethod: GenerationMethod;
  generatedBy: 'Rule-Based Baseline' | 'Gemini 3.8 Flash AI Provider';
  totalMarks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  instructions: string[];
  learningObjectives: string[];
  dueDate: string;
  durationMinutes: number;
  sourcePdfId: string;
  sourcePdfTitle: string;
  sourcePageReferences: number[];
  questions: AssignmentQuestion[];
  status: AssignmentStatus;
  submissionRequirements: string;
  studentSubmission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: string;
  answers: Record<string, string | number>;
  attachedFileName?: string;
  marksObtained?: number;
  feedback?: string;
  status: 'Submitted' | 'Under Review' | 'Evaluated';
}

// -------------------------------------------------------------
// NEW: NOTIFICATION TYPES
// -------------------------------------------------------------

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'Assignment' | 'Examination' | 'Material' | 'Academic' | 'System';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionPage?: PageId;
  priority: 'High' | 'Normal' | 'Low';
}

// -------------------------------------------------------------
// NEW: SIX STUDENT DASHBOARD FEATURES & IMPORTANT NOTICES
// -------------------------------------------------------------

export interface AchievementItem {
  id: string;
  title: string;
  category: 'Coding Lab' | 'Quiz & Exam' | 'Assignment' | 'Curriculum';
  description: string;
  earned: boolean;
  earnedAt?: string;
  metricLabel: string;
  certificateEligible: boolean;
  certificateCode?: string;
}

export type PracticeQuestionType = 'MCQ' | 'True/False' | 'Fill in the Blank' | 'Short Answer';

export interface PracticeQuestion {
  id: string;
  subjectCode: string;
  topic: string;
  questionType: PracticeQuestionType;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourcePdfTitle?: string;
  sourcePageRef?: number;
}

export interface PracticeAttempt {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  topic: string;
  mode: 'Standard' | 'Timed Quiz';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  durationSeconds: number;
  attemptedAt: string;
}

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  topic: string;
  unit: number;
  sourcePdfTitle: string;
  sourcePageRef?: number;
  status: 'Unseen' | 'Known' | 'Need Revision';
}

export interface FlashcardDeck {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  unit: number;
  topic: string;
  title: string;
  sourcePdfId: string;
  sourcePdfTitle: string;
  createdAt: string;
  cards: FlashcardItem[];
}

export type CalendarEventCategory =
  | 'Assignment'
  | 'Examination'
  | 'Academic Event'
  | 'General Notice'
  | 'Study Reminder';

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  timeLabel?: string;
  category: CalendarEventCategory;
  subjectCode?: string;
  isPublished: boolean;
  createdBy: string;
  sourceType: 'Assignment' | 'Examination' | 'Faculty' | 'Student';
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  roomOrLab: string;
  instructor: string;
}

export type NoticeCategory =
  | 'Academic Notice'
  | 'Examination Notice'
  | 'Assignment Notice'
  | 'General Announcement'
  | 'Important Deadline';

export type NoticePriority = 'Normal' | 'Important' | 'Urgent';

export interface ImportantNotice {
  id: string;
  title: string;
  description: string;
  publicationDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  priority: NoticePriority;
  category: NoticeCategory;
  isPublished: boolean;
  attachmentName?: string;
  attachmentUrl?: string;
  createdBy: string;
  readByStudentIds: string[];
}

// -------------------------------------------------------------
// AI-GENERATED UNIVERSITY-LEVEL STUDY NOTES SYSTEM
// -------------------------------------------------------------

export type StudyNoteMode =
  | 'Detailed Notes'
  | '2-Mark Questions'
  | '5-Mark Questions'
  | '10-Mark Questions'
  | 'Solved Examples'
  | 'Revision Notes';

export interface StudyNoteSection {
  id: string;
  heading: string;
  sourceType: 'PDF-Grounded' | 'AI-Supplementary';
  contentMarkdown: string;
  formulaBox?: string;
  diagramText?: string;
  codeSnippet?: {
    language: string;
    code: string;
    output?: string;
  };
  keyPoints?: string[];
  citations?: {
    pdfTitle: string;
    pageNumber: number;
  }[];
}

export interface GeneratedStudyNote {
  id: string;
  studentId: string;
  subjectCode: string; // '435C1A' | '435C1B' | '435E1A' | '435C1C'
  subjectName: string;
  unit: number;
  topic: string;
  subtopic?: string;
  mode: StudyNoteMode;
  title: string;
  createdAt: string;
  updatedAt: string;
  sourcePdfIds: string[];
  sourcePdfTitles: string[];
  sourcePageCitations: number[];
  isPdfSufficient: boolean;
  supplementaryNotice?: string;
  sections: StudyNoteSection[];
  summary: string;
  importantPoints: string[];
  completed: boolean;
  bookmarked: boolean;
  markedForRevision: boolean;
  savedToAccount: boolean;
  providerUsed: 'Gemini AI' | 'PDF Knowledge Baseline';
}

export type StudyResourceKey =
  | 'study-notes'
  | 'coding-lab'
  | 'practice-arena'
  | 'flashcards'
  | 'assignments'
  | 'subjects';

export interface StudySessionLog {
  id: string;
  studentId: string;
  resource: StudyResourceKey;
  subjectCode: string;
  label: string;
  durationSeconds: number;
  completedAt: string;
}

export interface CompletedStudySessionSummary {
  id: string;
  studentId: string;
  totalSeconds: number;
  subjectsCovered: string[];
  resourcesCovered: StudyResourceKey[];
  completedAt: string;
  completedDate: string;
  notes?: string;
  loggedToReports?: boolean;
}

// -------------------------------------------------------------
// MCA SMART CAMPUS — MULTI-SEMESTER, ADMIN, FACULTY & 8 FEATURES
// -------------------------------------------------------------

export interface AcademicProgrammeConfig {
  id: string;
  code: string;
  name: string;
  durationSemesters: number;
  totalCredits: number;
  status: 'Active' | 'Archived';
}

export interface AcademicYearRecord {
  id: string;
  label: string;
  programmeCode: string;
  isCurrent: boolean;
  status: 'Active' | 'Upcoming' | 'Completed';
}

export interface SemesterRecord {
  id: string;
  number: number;
  title: string;
  academicYear: string;
  status: 'Active' | 'Draft' | 'Completed';
  subjectCodes: string[];
  description: string;
}

export interface FacultySubjectAllocation {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyUsername: string;
  subjectCodes: string[];
  permissions: FacultyPermissionKey[];
  studentGroupLabel: string;
  updatedAt: string;
}

export interface QuestionBankItem {
  id: string;
  subjectCode: string;
  unit: number;
  topic: string;
  questionType: 'MCQ' | 'Short Answer' | 'Descriptive' | 'Coding';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceRef?: string;
  createdBy: string;
  approved: boolean;
}

export type SkillDNASkillKey =
  | 'Python'
  | 'Data Structures'
  | 'Database Management'
  | 'Web Development'
  | 'Mathematics'
  | 'Problem-solving'
  | 'Software Engineering'
  | 'Communication'
  | 'Teamwork';

export interface SkillDNACriterion {
  skill: SkillDNASkillKey;
  category: 'Technical' | 'Analytical' | 'Engineering' | 'Professional';
  weight: number;
  description: string;
}

export interface SkillEvidenceRecord {
  id: string;
  studentId: string;
  skill: SkillDNASkillKey;
  evidenceTitle: string;
  evidenceType: 'Coding Lab' | 'Assignment' | 'Examination' | 'Project' | 'Challenge';
  sourceRefId: string;
  levelScore: number; // 0-100
  status: 'Pending Review' | 'Verified' | 'Needs Improvement';
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export interface StudentProject {
  id: string;
  studentId: string;
  studentName: string;
  subjectCode: string;
  title: string;
  description: string;
  objectives: string[];
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  screenshotSummary?: string;
  milestones: ProjectMilestone[];
  contributions: string;
  status: 'Draft' | 'Under Review' | 'Verified' | 'Needs Revision';
  facultyFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedForShowcase: boolean;
  skillsEvaluated: SkillDNASkillKey[];
}

export interface CareerPracticeQuestion {
  id: string;
  track: 'Python Interview' | 'DSA Interview' | 'Aptitude & Reasoning' | 'Verbal & Communication';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  keyAnswerPoints: string[];
  relatedSkill: SkillDNASkillKey;
}

export interface JobRoleBenchmark {
  id: string;
  roleTitle: string;
  description: string;
  requiredSkills: {
    skill: SkillDNASkillKey;
    targetScore: number;
  }[];
}

export interface KnowledgeNode {
  id: string;
  label: string;
  nodeType: 'Semester' | 'Subject' | 'Unit' | 'Topic' | 'Project';
  subjectCode?: string;
  semester?: number;
  unit?: number;
  refId?: string;
  summary: string;
}

export interface KnowledgeEdge {
  id: string;
  fromId: string;
  toId: string;
  relation: 'contains' | 'covers' | 'prerequisite_for' | 'applied_in';
  verified: boolean;
  createdBy: string;
}

export interface ChallengeItem {
  id: string;
  title: string;
  category:
    | 'Python'
    | 'Data Structures & Algorithms'
    | 'SQL'
    | 'Database Management'
    | 'Discrete Mathematics'
    | 'Data Engineering'
    | 'Aptitude';
  subjectCode: string;
  mode: 'Timed Coding' | 'Subject Quiz';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  durationMinutes: number;
  points: number;
  prompt: string;
  starterCode?: string;
  expectedStdout?: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation: string;
  createdBy: string;
  isPublished: boolean;
}

export interface ChallengeAttempt {
  id: string;
  challengeId: string;
  challengeTitle: string;
  studentId: string;
  category: string;
  passed: boolean;
  score: number;
  maxScore: number;
  durationSeconds: number;
  attemptedAt: string;
  stdout?: string;
}

export interface IssuedCertificate {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  category: string;
  certificateCode: string;
  issuedBy: string;
  issuedAt: string;
  status: 'Issued' | 'Revoked';
}

export interface DigitalPassportSettings {
  isPublicShareEnabled: boolean;
  showVerifiedSkills: boolean;
  showApprovedProjects: boolean;
  showCertificates: boolean;
  showChallengeBadges: boolean;
  showAcademicMarks: boolean;
  headline: string;
  portfolioSlug: string;
}

export interface SmartStudyTask {
  id: string;
  studentId: string;
  subjectCode: string;
  unit: number;
  title: string;
  scheduledDate: string;
  slotLabel: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  source: 'Student' | 'Faculty Recommended';
}

export interface FacultyRevisionRecommendation {
  id: string;
  subjectCode: string;
  unit: number;
  title: string;
  guidance: string;
  recommendedBy: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface PlatformFeatureConfig {
  aiTutorEnabled: boolean;
  isolatedPythonRunnerEnabled: boolean;
  challengeArenaEnabled: boolean;
  passportPublicSharingEnabled: boolean;
  projectShowcaseEnabled: boolean;
  activeAcademicYear: string;
  activeSemesterNumber: number;
}



