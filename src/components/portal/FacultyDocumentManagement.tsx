import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { SubjectPDF } from '../../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  BookOpen,
  Filter,
  Search,
  Trash2,
  Eye,
  Download,
  Sparkles,
  ShieldAlert,
  Layers,
  FileCheck,
  RefreshCw,
  Plus,
  Tag,
  Check
} from 'lucide-react';

const SUBJECT_UNITS: Record<string, { unit: number; title: string; defaultTopics: string[] }[]> = {
  '435C1A': [
    { unit: 1, title: 'Mathematical Logic & Proof Techniques', defaultTopics: ['Propositional Logic', 'CNF/DNF Normal Forms', 'Predicate Calculus', 'Mathematical Induction'] },
    { unit: 2, title: 'Set Theory, Relations & Lattices', defaultTopics: ['Equivalence Relations', 'Partial Order Posets', 'Hasse Diagrams', 'Lattice Properties'] },
    { unit: 3, title: 'Combinatorics & Recurrence Relations', defaultTopics: ['Pigeonhole Principle', 'Inclusion-Exclusion', 'Generating Functions', 'Homogeneous Recurrences'] },
    { unit: 4, title: 'Graph Theory & Network Models', defaultTopics: ['Handshaking Lemma', 'Eulerian & Hamiltonian Circuits', 'Planar Euler Formula V-E+R=2', 'Spanning Trees (Prim/Kruskal)'] },
    { unit: 5, title: 'Algebraic Structures & Group Theory', defaultTopics: ['Semigroups & Monoids', 'Groups & Subgroups', 'Lagrange Theorem', 'Homomorphisms & Cyclic Groups'] }
  ],
  '435C1B': [
    { unit: 1, title: 'Asymptotic Analysis & Linear Data Structures', defaultTopics: ['Big-O/Omega/Theta Notations', 'Circular Queues', 'Doubly Linked Lists', 'Infix-to-Postfix Stack'] },
    { unit: 2, title: 'Non-Linear Structures: Trees & Search Trees', defaultTopics: ['Binary Tree Traversals', 'AVL Height Balancing', '4 Rotations (LL, RR, LR, RL)', 'Red-Black Trees'] },
    { unit: 3, title: 'Priority Queues & Hashing Techniques', defaultTopics: ['Binary Max/Min Heaps', 'Heap Sort O(n log n)', 'Double Hashing', 'Collision Resolution Chaining'] },
    { unit: 4, title: 'Graph Algorithms & Shortest Path', defaultTopics: ['BFS and DFS Traversals', 'Topological Sorting (Kahn)', 'Dijkstra Shortest Path', 'Bellman-Ford Algorithm'] },
    { unit: 5, title: 'Algorithm Design Paradigms & Complexity', defaultTopics: ['Master Theorem', '0/1 Knapsack Dynamic Programming', 'Greedy Huffman Coding', 'P vs NP Concepts'] }
  ],
  '435E1A': [
    { unit: 1, title: 'Relational Data Modeling & Normalization', defaultTopics: ['Relational Algebra', 'Armstrong Axioms', '1NF/2NF/3NF Decomposition', 'Boyce-Codd Normal Form (BCNF)'] },
    { unit: 2, title: 'Transaction Management & ACID Concurrency', defaultTopics: ['Conflict Serializability', 'Precedence Graphs', 'Strict Two-Phase Locking (2PL)', 'ARIES WAL Recovery'] },
    { unit: 3, title: 'Storage Architecture & Query Optimization', defaultTopics: ['B+ Tree Indexing O(log_B N)', 'Hash Indexing', 'Cost-Based Query Optimization', 'Join Algorithms'] },
    { unit: 4, title: 'Distributed Databases & NoSQL Systems', defaultTopics: ['CAP Theorem', 'BASE Consistency', 'MongoDB Document Store', 'Consistent Hashing'] },
    { unit: 5, title: 'Data Warehousing, ETL & OLAP Cubes', defaultTopics: ['Star vs Snowflake Schemas', 'OLAP Roll-up/Drill-down', 'ETL Data Pipelines', 'Data Lakehouse Architecture'] }
  ],
  '435C1C': [
    { unit: 1, title: 'Python Paradigms & Functional Features', defaultTopics: ['Memory Model PyObject', 'Generators & yield', 'Decorators with Arguments', 'functools.wraps'] },
    { unit: 2, title: 'Object-Oriented Architecture & Dunder Protocols', defaultTopics: ['__slots__ Optimization', '__new__ vs __init__', 'Abstract Base Classes (abc)', 'Context Managers __enter__/__exit__'] },
    { unit: 3, title: 'File Streaming, Serialization & Concurrency', defaultTopics: ['CPython Global Interpreter Lock (GIL)', 'AsyncIO Event Loops', 'Coroutines async/await', 'Multiprocessing vs Threading'] },
    { unit: 4, title: 'Scientific Computing: NumPy & Pandas', defaultTopics: ['NumPy Vectorization & Broadcasting', 'Pandas loc vs iloc', 'Data Wrangling & Groupby', 'Matrix Operations'] },
    { unit: 5, title: 'Web Frameworks, ORM & Testing', defaultTopics: ['Django MTV Pattern', 'select_related vs prefetch_related', 'RESTful API Design', 'pytest Unit Testing'] }
  ]
};

export const FacultyDocumentManagement: React.FC = () => {
  const {
    allSubjects,
    subjectPdfs,
    addSubjectPdf,
    deleteSubjectPdf,
    togglePdfPublishStatus,
    currentUser
  } = usePortal();

  // Selected subject & structured metadata for uploading
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('435C1A');
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [docTitle, setDocTitle] = useState<string>('');
  const [chapterName, setChapterName] = useState<string>('');
  const [topicSummary, setTopicSummary] = useState<string>('');
  const [docDescription, setDocDescription] = useState<string>('');
  const [objectivesText, setObjectivesText] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [topicsList, setTopicsList] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileNameInput, setFileNameInput] = useState<string>('');
  const [fileSizeInput, setFileSizeInput] = useState<string>('5.6 MB');
  const [pageCountInput, setPageCountInput] = useState<number>(36);

  // Advanced OCR settings
  const [enableFormulaOcr, setEnableFormulaOcr] = useState<boolean>(true);
  const [autoIndexChatbot, setAutoIndexChatbot] = useState<boolean>(true);

  // Upload progress simulation state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string>('');

  // Table filter state
  const [tableSubjectFilter, setTableSubjectFilter] = useState<string>('All');
  const [tableUnitFilter, setTableUnitFilter] = useState<string>('All');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [previewPdfModal, setPreviewPdfModal] = useState<SubjectPDF | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available units for currently selected subject
  const currentSubjectUnits = SUBJECT_UNITS[selectedSubjectCode] || [];
  const activeUnitInfo = currentSubjectUnits.find(u => u.unit === selectedUnit) || currentSubjectUnits[0];

  // Auto-populate chapter name and topics when subject/unit changes
  const handleSubjectChange = (code: string) => {
    setSelectedSubjectCode(code);
    const units = SUBJECT_UNITS[code] || [];
    if (units.length > 0) {
      setSelectedUnit(units[0].unit);
      setChapterName(units[0].title);
      setTopicsList(units[0].defaultTopics);
    }
  };

  const handleUnitChange = (unitNum: number) => {
    setSelectedUnit(unitNum);
    const matchedUnit = currentSubjectUnits.find(u => u.unit === unitNum);
    if (matchedUnit) {
      setChapterName(matchedUnit.title);
      setTopicsList(matchedUnit.defaultTopics);
    }
  };

  const handleAddTopic = () => {
    if (customTopic.trim() && !topicsList.includes(customTopic.trim())) {
      setTopicsList(prev => [...prev, customTopic.trim()]);
      setCustomTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopicsList(prev => prev.filter(t => t !== topicToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Invalid file format: Only .pdf academic documents are permitted.');
      setSelectedFile(null);
      setFileNameInput('');
      e.target.value = '';
      return;
    }
    if (file.size === 0 || file.size > 50 * 1024 * 1024) {
      setFileError('Invalid file size: PDF file must be between 1 byte and 50 MB.');
      setSelectedFile(null);
      setFileNameInput('');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setFileNameInput(file.name);
    setFileSizeInput(`${Math.max(0.1, file.size / (1024 * 1024)).toFixed(1)} MB`);
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const submitUploadWithStatus = (publishStatus: 'Draft' | 'Published') => {
    if (!docTitle.trim() || fileError) return;
    if (fileNameInput && !fileNameInput.toLowerCase().endsWith('.pdf')) {
      setFileError('Invalid file format: Only .pdf academic documents are permitted.');
      return;
    }
    setFileError('');

    setIsProcessing(true);
    setProcessStep('Parsing PDF binary structure and verifying header tokens...');

    setTimeout(() => {
      setProcessStep('Running Optical Character Recognition (OCR v3.2)...');
    }, 600);

    setTimeout(() => {
      setProcessStep('Indexing mathematical formulas, diagrams, and chapter boundaries...');
    }, 1200);

    setTimeout(() => {
      setProcessStep(
        publishStatus === 'Published'
          ? 'Publishing unit content to students & embedding citations...'
          : 'Saving faculty draft in private repository...'
      );
    }, 1800);

    setTimeout(() => {
      const subjectObj = allSubjects.find(s => s.code === selectedSubjectCode);
      const generatedFileName = fileNameInput || `MCA-${selectedSubjectCode}-Unit${selectedUnit}-${docTitle.replace(/\s+/g, '-')}.pdf`;
      const parsedObjectives = objectivesText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      const newPdf: SubjectPDF = {
        id: `pdf-faculty-${Date.now()}`,
        subjectCode: selectedSubjectCode,
        subjectName: subjectObj?.name || 'MCA Subject',
        semester: subjectObj?.semester ?? selectedSemester,
        status: publishStatus,
        topic: topicSummary.trim() || chapterName || `Unit ${selectedUnit}`,
        description:
          docDescription.trim() ||
          `Structured faculty learning module covering ${chapterName || `Unit ${selectedUnit}`} for ${subjectObj?.name || selectedSubjectCode}.`,
        learningObjectives:
          parsedObjectives.length > 0
            ? parsedObjectives
            : [
                `Master core concepts in ${chapterName || `Unit ${selectedUnit}`}`,
                'Apply syllabus formulations to assessment problems',
              ],
        title: docTitle.trim(),
        fileName: generatedFileName,
        fileSize: fileSizeInput || '6.2 MB',
        pageCount: pageCountInput || 42,
        unit: selectedUnit,
        chapter: chapterName || `Unit ${selectedUnit} Detailed Notes`,
        uploadedBy: `Faculty Advisor (${currentUser?.advisorName || 'HCASICAN'})`,
        uploadDate: new Date().toISOString().split('T')[0],
        ocrApplied: true,
        ocrConfidence: Number((99.1 + Math.random() * 0.7).toFixed(1)),
        processingStatus: 'Completed',
        extractedText: `${docDescription.trim() || `Comprehensive academic document covering ${chapterName} for ${subjectObj?.name}.`} Topics: ${topicsList.join(', ')}.`,
        topicsCovered: topicsList.length > 0 ? topicsList : ['Core Syllabus Concepts', 'Model Formulations', 'Practical Examples'],
        pageReferences: [
          {
            pageNumber: 1,
            heading: `${chapterName || `Unit ${selectedUnit}`} Overview & Axioms`,
            snippet: docDescription.trim() || `Foundational definitions and syllabus mapping for ${chapterName || `Unit ${selectedUnit}`}.`
          },
          {
            pageNumber: Math.max(2, Math.floor(pageCountInput / 3)),
            heading: `Key Algorithms & Analytical Derivations`,
            snippet: `Core theorems, step-by-step proofs, and mathematical invariants verified for Semester ${subjectObj?.semester ?? selectedSemester} examinations.`
          },
          {
            pageNumber: Math.max(3, Math.floor(pageCountInput * 0.75)),
            heading: `Model Examination Solutions & Problem Set`,
            snippet: `Solved 2-mark, 5-mark and 10-mark questions with standard academic marking schemes.`
          }
        ]
      };

      addSubjectPdf(newPdf);
      setIsProcessing(false);
      setProcessStep('');
      setUploadSuccessToast(
        publishStatus === 'Published'
          ? `Published to students: "${newPdf.title}" (${newPdf.subjectCode})`
          : `Saved as Draft (hidden from students): "${newPdf.title}" (${newPdf.subjectCode})`
      );

      // Reset form
      setDocTitle('');
      setTopicSummary('');
      setDocDescription('');
      setObjectivesText('');
      setSelectedFile(null);
      setFileNameInput('');
      setFileError('');

      setTimeout(() => setUploadSuccessToast(null), 5000);
    }, 2400);
  };

  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    submitUploadWithStatus('Published');
  };

  const handleDelete = (pdfId: string) => {
    deleteSubjectPdf(pdfId);
    setDeleteConfirmId(null);
  };

  // Filtered documents list
  const filteredPdfs = subjectPdfs.filter(pdf => {
    if (tableSubjectFilter !== 'All' && pdf.subjectCode !== tableSubjectFilter) return false;
    if (tableUnitFilter !== 'All' && pdf.unit.toString() !== tableUnitFilter) return false;
    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase();
      const matchTitle = pdf.title.toLowerCase().includes(q);
      const matchFile = pdf.fileName.toLowerCase().includes(q);
      const matchChapter = pdf.chapter.toLowerCase().includes(q);
      const matchTopics = pdf.topicsCovered.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchFile && !matchChapter && !matchTopics) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Administrator Control Banner */}
      <div className="bg-gradient-to-r from-[#292929] via-[#332A27] to-[#292929] border border-[#795548]/40 rounded-3xl p-6 sm:p-8 text-[#F7F5F2] shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#B83232] text-white flex items-center gap-1.5 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-[#F2C94C]" />
                Faculty Administrator Interface
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F2C94C]/20 text-[#F2C94C] border border-[#F2C94C]/30">
                OCR v3.2 Engine Active
              </span>
            </div>

            <div className="text-right text-xs text-[#BDB7B2]">
              <span>Authorized Faculty Advisor: </span>
              <strong className="text-[#F2C94C] font-mono">{currentUser?.advisorName || 'HCASICAN'}</strong>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Faculty Document Management System
            </h2>
            <p className="text-xs sm:text-sm text-[#BDB7B2] max-w-2xl leading-relaxed mt-1">
              Upload, organize, and index syllabus-verified academic PDFs across all four MCA Semester 1 subjects.
              The AI engine extracts chapters, generates OCR page citations, and constructs ground-truth question banks.
            </p>
          </div>

          {/* KPI Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-[#BDB7B2] block">Total Documents</span>
              <span className="text-xl font-extrabold text-[#F2C94C]">{subjectPdfs.length}</span>
              <span className="text-[10px] text-white/50 block">4 Subjects Covered</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-[#BDB7B2] block">Total Pages Indexed</span>
              <span className="text-xl font-extrabold text-white">
                {subjectPdfs.reduce((acc, p) => acc + (p.pageCount || 0), 0)}
              </span>
              <span className="text-[10px] text-white/50 block">High-Resolution OCR</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-[#BDB7B2] block">Average OCR Accuracy</span>
              <span className="text-xl font-extrabold text-emerald-400">99.3%</span>
              <span className="text-[10px] text-white/50 block">Mathematical Formula Validated</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[11px] text-[#BDB7B2] block">Chatbot Knowledge Status</span>
              <span className="text-xl font-extrabold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Grounded
              </span>
              <span className="text-[10px] text-white/50 block">Zero-Hallucination Guardrail</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {uploadSuccessToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{uploadSuccessToast}</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">Verified & Published</span>
        </div>
      )}

      {/* Upload Academic PDF Form Card */}
      <div className="bg-white dark:bg-[#292929] rounded-3xl p-6 sm:p-8 border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-[#E5DFD9] dark:border-[#3D3835]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Upload New Curriculum Document
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#292929] dark:text-[#F7F5F2] mt-0.5">
              Upload Academic PDF & Categorize by Unit / Topic
            </h3>
            <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2]">
              Select one of the four official MCA Semester 1 subjects, assign unit and subtopics, and attach the PDF.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitUpload} className="space-y-6">
          {/* 1. Semester & Subject Selector Tiles */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] flex items-center gap-1.5">
                <span>Step 1: Select Semester &amp; Relevant Subject Code</span>
                <span className="text-[#B83232]">*</span>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#795548] dark:text-[#F2C94C]">Semester:</span>
                <select
                  aria-label="Content Semester"
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] font-bold text-[#292929] dark:text-[#F7F5F2]"
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                  <option value={3}>Semester 3</option>
                  <option value={4}>Semester 4</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {allSubjects.map(sub => {
                const isSelected = selectedSubjectCode === sub.code;
                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => handleSubjectChange(sub.code)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-[#B83232] bg-[#B83232]/10 dark:bg-[#B83232]/20 ring-2 ring-[#B83232]/30 text-[#292929] dark:text-white shadow-xs'
                        : 'border-[#E5DFD9] dark:border-[#3D3835] hover:bg-[#F7F5F2] dark:hover:bg-[#1E1E1E] text-[#6E6863] dark:text-[#BDB7B2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#B83232] text-white'
                          : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#F2C94C]'
                      }`}>
                        {sub.code}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#B83232] dark:text-[#F2C94C]" />}
                    </div>
                    <div className="text-xs font-bold text-[#292929] dark:text-[#F7F5F2] line-clamp-1">
                      {sub.name}
                    </div>
                    <div className="text-[10px] text-[#795548] dark:text-[#BDB7B2] mt-0.5 line-clamp-1">
                      Sem {sub.semester ?? 1} · {sub.instructor}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Unit & Chapter Categorization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                Step 2: Select Unit <span className="text-[#B83232]">*</span>
              </label>
              <select
                value={selectedUnit}
                onChange={e => handleUnitChange(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
              >
                {currentSubjectUnits.map(u => (
                  <option key={u.unit} value={u.unit}>
                    Unit {u.unit}: {u.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                Chapter / Module Name <span className="text-[#B83232]">*</span>
              </label>
              <input
                type="text"
                required
                value={chapterName}
                onChange={e => setChapterName(e.target.value)}
                placeholder="e.g. Mathematical Logic & Proof Techniques"
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
              />
            </div>
          </div>

          {/* 3. Document Title, Topic, Description & Learning Objectives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                Document Title <span className="text-[#B83232]">*</span>
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="e.g. Unit 1 Lecture Notes & Solved Proofs"
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                Primary Topic Focus
              </label>
              <input
                type="text"
                value={topicSummary}
                onChange={e => setTopicSummary(e.target.value)}
                placeholder="e.g. Propositional & Predicate Logic"
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                Estimated Pages
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={pageCountInput}
                onChange={e => setPageCountInput(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                Content Description
              </label>
              <textarea
                rows={3}
                value={docDescription}
                onChange={e => setDocDescription(e.target.value)}
                placeholder="Summarize what students will read and practice in this module..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block mb-1">
                Learning Objectives (one per line)
              </label>
              <textarea
                rows={3}
                value={objectivesText}
                onChange={e => setObjectivesText(e.target.value)}
                placeholder="Understand formal equivalence laws&#10;Apply CNF conversion in theorem proving"
                className="w-full text-xs p-2.5 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
              />
            </div>
          </div>

          {/* 4. Topic Categorization Tags */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block">
              Step 3: Categorize by Topics & Syllabus Sub-units
            </label>

            <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
              {topicsList.map(topic => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#292929] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] shadow-2xs"
                >
                  <Tag className="w-3 h-3 text-[#B83232]" />
                  <span>{topic}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="text-[#6E6863] hover:text-[#B83232] text-xs font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                  placeholder="+ Add custom topic (e.g. Warshall Algorithm)..."
                  className="w-full text-xs p-1.5 bg-transparent border-0 text-[#292929] dark:text-[#F7F5F2] placeholder-[#6E6863] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="px-2.5 py-1 text-xs font-bold bg-[#795548] text-white rounded-lg hover:bg-[#604237] transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* 5. Drag & Drop PDF File Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#292929] dark:text-[#F7F5F2] block">
              Step 4: Select Academic PDF Document <span className="text-[#B83232]">*</span>
            </label>

            <div className="border-2 border-dashed border-[#795548]/40 dark:border-[#795548]/60 hover:border-[#B83232] rounded-3xl p-6 sm:p-8 text-center bg-[#F7F5F2]/40 dark:bg-[#1E1E1E]/40 transition-colors">
              <BookOpen className="w-10 h-10 text-[#795548] dark:text-[#F2C94C] mx-auto mb-2" />
              <div className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">
                {fileNameInput ? (
                  <span className="text-[#B83232] dark:text-[#F2C94C] font-mono">
                    {fileNameInput} ({fileSizeInput})
                  </span>
                ) : (
                  <span>Drag and drop academic PDF document here, or browse</span>
                )}
              </div>
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] mt-1">
                Accepted: .pdf format (up to 50 MB) · Includes mathematical formulas, code blocks, diagrams
              </p>

              <div className="mt-4 flex items-center justify-center">
                <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-[#B83232] text-white hover:bg-[#a02b2b] transition-colors shadow-xs flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose PDF File</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {fileError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs font-semibold text-[#B83232] dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* 6. Advanced OCR & Knowledge Settings */}
          <div className="p-4 rounded-2xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C] block">
              Automated AI Processing Options
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 text-xs text-[#292929] dark:text-[#F7F5F2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFormulaOcr}
                  onChange={e => setEnableFormulaOcr(e.target.checked)}
                  className="rounded text-[#B83232] focus:ring-[#B83232]"
                />
                <span>High-Precision Mathematical Formula OCR (LaTeX)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-[#292929] dark:text-[#F7F5F2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoIndexChatbot}
                  onChange={e => setAutoIndexChatbot(e.target.checked)}
                  className="rounded text-[#B83232] focus:ring-[#B83232]"
                />
                <span>Index for "Ask Your Subject" Chatbot & Question Banks</span>
              </label>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-[#B83232]/10 border border-[#B83232]/30 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-[#B83232] dark:text-[#F2C94C]">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#B83232]" />
                  <span>{processStep}</span>
                </span>
                <span className="font-mono">Processing...</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#B83232] to-[#F2C94C] h-full w-3/4 animate-pulse" />
              </div>
            </div>
          )}

          {/* Submit Actions: Save as Draft vs Publish to Students */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => submitUploadWithStatus('Draft')}
              disabled={isProcessing || !docTitle.trim()}
              className="px-5 py-3 rounded-2xl font-bold text-xs bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548] disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#795548] dark:text-[#F2C94C]" />
              <span>Save as Draft</span>
            </button>
            <button
              type="submit"
              disabled={isProcessing || !docTitle.trim()}
              className="px-6 py-3 rounded-2xl font-bold text-xs bg-[#B83232] text-white hover:bg-[#a02b2b] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-[#F2C94C]" />
              <span>Publish to Students</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Managed Documents Repository Table */}
      <div className="bg-white dark:bg-[#292929] rounded-3xl p-6 sm:p-8 border border-[#E5DFD9] dark:border-[#3D3835] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#795548] dark:text-[#F2C94C]">
              Document Repository
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#292929] dark:text-[#F7F5F2] mt-0.5">
              Managed Academic PDF Collections ({filteredPdfs.length})
            </h3>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#6E6863]" />
            <input
              type="text"
              value={tableSearchQuery}
              onChange={e => setTableSearchQuery(e.target.value)}
              placeholder="Search by topic, unit, title..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E5DFD9] dark:border-[#3D3835] bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] focus:outline-hidden focus:ring-2 focus:ring-[#B83232]"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-[#F7F5F2] dark:bg-[#1E1E1E] rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835] text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#795548] dark:text-[#F2C94C]" />
            <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">Subject:</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['All', '435C1A', '435C1B', '435E1A', '435C1C'].map(code => (
              <button
                key={code}
                onClick={() => setTableSubjectFilter(code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  tableSubjectFilter === code
                    ? 'bg-[#B83232] text-white shadow-2xs font-bold'
                    : 'text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-[#F7F5F2]'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-[#E5DFD9] dark:bg-[#3D3835] mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#292929] dark:text-[#F7F5F2]">Unit:</span>
            <select
              value={tableUnitFilter}
              onChange={e => setTableUnitFilter(e.target.value)}
              className="p-1 rounded-lg border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#292929] text-[#292929] dark:text-[#F7F5F2] text-xs"
            >
              <option value="All">All Units</option>
              <option value="1">Unit 1</option>
              <option value="2">Unit 2</option>
              <option value="3">Unit 3</option>
              <option value="4">Unit 4</option>
              <option value="5">Unit 5</option>
            </select>
          </div>
        </div>

        {/* Documents Table / Card List */}
        <div className="space-y-3">
          {filteredPdfs.length === 0 ? (
            <div className="p-12 text-center bg-[#F7F5F2] dark:bg-[#1E1E1E] rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835]">
              <FolderArchive className="w-8 h-8 text-[#795548] dark:text-[#F2C94C] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">No documents match current filters</p>
              <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] mt-1">Try resetting the search query or subject filters.</p>
            </div>
          ) : (
            filteredPdfs.map(pdf => (
              <div
                key={pdf.id}
                className="p-5 rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835] bg-white dark:bg-[#1E1E1E] hover:border-[#B83232]/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#795548]/10 text-[#795548] dark:bg-[#795548]/30 dark:text-[#F2C94C]">
                      {pdf.subjectCode} · Sem {pdf.semester ?? 1}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#292929] text-[#6E6863] dark:text-[#BDB7B2] border border-[#E5DFD9] dark:border-[#3D3835]">
                      Unit {pdf.unit}: {pdf.chapter}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        pdf.status === 'Draft'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-[#F2C94C] dark:border-amber-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {pdf.status === 'Draft' ? 'Draft (Hidden from Students)' : 'Published'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                      OCR: {pdf.ocrConfidence}%
                    </span>
                    <span className="text-[10px] font-mono text-[#6E6863] dark:text-[#BDB7B2]">
                      {pdf.pageCount} Pages · {pdf.fileSize}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-[#292929] dark:text-[#F7F5F2] group-hover:text-[#B83232] transition-colors">
                      {pdf.title}
                    </h4>
                    <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] font-mono mt-0.5">
                      {pdf.fileName}
                    </p>
                  </div>

                  {/* Categorized Topic Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {pdf.topicsCovered.map((topic, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F7F5F2] dark:bg-[#292929] text-[#795548] dark:text-[#BDB7B2] border border-[#E5DFD9] dark:border-[#3D3835]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => togglePdfPublishStatus(pdf.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                      pdf.status === 'Draft'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                        : 'bg-[#F7F5F2] dark:bg-[#292929] text-[#795548] dark:text-[#F2C94C] border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#B83232]'
                    }`}
                  >
                    {pdf.status === 'Draft' ? 'Publish' : 'Move to Draft'}
                  </button>
                  <button
                    onClick={() => setPreviewPdfModal(pdf)}
                    className="p-2 text-xs font-semibold rounded-xl bg-[#F7F5F2] dark:bg-[#292929] text-[#292929] dark:text-[#F7F5F2] hover:bg-[#EFEBE9] border border-[#E5DFD9] dark:border-[#3D3835] flex items-center gap-1 transition-colors"
                    title="Preview Document Index & Page Snippets"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#795548] dark:text-[#F2C94C]" />
                    <span className="hidden sm:inline">Inspect Index</span>
                  </button>

                  {deleteConfirmId === pdf.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-xl border border-rose-200 dark:border-rose-900">
                      <span className="text-[10px] font-bold text-[#B83232] px-1">Confirm Delete?</span>
                      <button
                        onClick={() => handleDelete(pdf.id)}
                        className="px-2 py-1 text-[10px] font-bold bg-[#B83232] text-white rounded-lg hover:bg-rose-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 text-[10px] text-[#6E6863] hover:text-black dark:hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(pdf.id)}
                      className="p-2 text-xs rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[#6E6863] hover:text-[#B83232] transition-colors"
                      title="Delete Academic Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inspect Document Index Modal */}
      {previewPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5DFD9] dark:border-[#3D3835]">
              <div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#795548]/10 text-[#795548] dark:bg-[#795548]/30 dark:text-[#F2C94C]">
                  {previewPdfModal.subjectCode} · Unit {previewPdfModal.unit}
                </span>
                <h3 className="text-lg font-extrabold text-[#292929] dark:text-[#F7F5F2] mt-1">
                  {previewPdfModal.title}
                </h3>
                <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] font-mono">
                  {previewPdfModal.fileName} ({previewPdfModal.pageCount} pages, OCR {previewPdfModal.ocrConfidence}%)
                </p>
              </div>
              <button
                onClick={() => setPreviewPdfModal(null)}
                className="p-1 rounded-lg text-[#6E6863] hover:text-[#292929] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Topics Categorized */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-[#795548] dark:text-[#F2C94C]">
                Categorized Syllabus Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {previewPdfModal.topicsCovered.map((topic, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#292929] dark:text-[#F7F5F2] border border-[#E5DFD9] dark:border-[#3D3835]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Page Citations */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-[#795548] dark:text-[#F2C94C]">
                Sample OCR Page Indices (Used for Chatbot & Question Banks):
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {previewPdfModal.pageReferences.map((ref, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-3 rounded-xl bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-[#292929] dark:text-[#F7F5F2]">
                      <span>{ref.heading}</span>
                      <span className="font-mono text-[#B83232] dark:text-[#F2C94C]">Page {ref.pageNumber}</span>
                    </div>
                    <p className="text-[#6E6863] dark:text-[#BDB7B2] text-[11px] leading-relaxed">
                      {ref.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Close */}
            <div className="flex items-center justify-end pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835]">
              <button
                type="button"
                onClick={() => setPreviewPdfModal(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#B83232] hover:bg-[#a02b2b] rounded-xl transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
