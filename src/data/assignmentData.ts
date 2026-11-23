import { Assignment } from '../types';

export const ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-dm-01',
    title: 'Propositional Logic, Truth Tables & Normal Forms (CNF/DNF)',
    subjectCode: '435C1A',
    subjectName: 'Discrete Mathematics',
    unit: 1,
    chapter: 'Mathematical Logic & Proof Techniques',
    topic: 'CNF/DNF Equivalence & Mathematical Induction',
    assignmentType: 'Mixed Question Assignment',
    generationMethod: 'Topic-Based',
    generatedBy: 'Gemini 3.8 Flash AI Provider',
    totalMarks: 30,
    difficulty: 'Medium',
    instructions: [
      'Derive all algebraic simplifications step-by-step.',
      'Cite propositional logic equivalence laws applied.',
      'Submit written proofs or type formulas clearly in the answer boxes.'
    ],
    learningObjectives: [
      'CO1: Formulate compound propositions and construct Conjunctive & Disjunctive Normal Forms.',
      'CO2: Apply mathematical induction to prove mathematical identities.'
    ],
    dueDate: '2026-11-20',
    durationMinutes: 60,
    sourcePdfId: 'pdf-dm-01',
    sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
    sourcePageReferences: [12, 14, 16, 21],
    status: 'Evaluated',
    submissionRequirements: 'Online submission through form or PDF upload.',
    questions: [
      {
        id: 'q-dm-1',
        questionNumber: 1,
        text: 'Which of the following propositions is logically equivalent to (p → q) ∧ (p → r)?',
        questionType: 'MCQ',
        marks: 5,
        difficulty: 'Easy',
        options: ['p → (q ∧ r)', 'p → (q ∨ r)', '(p ∨ q) → r', '¬p → (q ∧ r)'],
        correctAnswer: 'p → (q ∧ r)',
        sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
        sourcePageRef: 14,
        learningOutcome: 'CO1: Propositional Logic'
      },
      {
        id: 'q-dm-2',
        questionNumber: 2,
        text: 'State the difference between Conjunctive Normal Form (CNF) and Disjunctive Normal Form (DNF). Provide one example of each.',
        questionType: 'Short Answer',
        marks: 10,
        difficulty: 'Medium',
        expectedKeywords: ['conjunction of clauses', 'disjunction of literals', 'product of sums', 'sum of products'],
        sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
        sourcePageRef: 12,
        learningOutcome: 'CO1: Normal Forms'
      },
      {
        id: 'q-dm-3',
        questionNumber: 3,
        text: 'Using Mathematical Induction, prove that for all n ≥ 1: 1^2 + 2^2 + 3^2 + ... + n^2 = n(n + 1)(2n + 1) / 6.',
        questionType: 'Long Answer',
        marks: 15,
        difficulty: 'Medium',
        expectedKeywords: ['base step', 'inductive hypothesis', 'inductive step', 'P(k+1)'],
        sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
        sourcePageRef: 21,
        learningOutcome: 'CO2: Proof Methods'
      }
    ],
    studentSubmission: {
      id: 'sub-dm-01',
      assignmentId: 'asg-dm-01',
      studentId: 'MCA2401',
      studentName: 'Devanath N',
      rollNumber: 'P26CA125',
      submittedAt: '2026-11-10 16:45',
      answers: {
        'q-dm-1': 'p → (q ∧ r)',
        'q-dm-2': 'CNF is a conjunction of disjunctions (AND of OR clauses), such as (p ∨ q) ∧ (¬p ∨ r). DNF is a disjunction of conjunctions (OR of AND clauses), such as (p ∧ q) ∨ (¬p ∧ ¬r).',
        'q-dm-3': 'Base Step (n=1): LHS = 1^2 = 1. RHS = 1(2)(3)/6 = 1. Holds for n=1.\nInductive Hypothesis: Assume true for n=k: 1^2 + ... + k^2 = k(k+1)(2k+1)/6.\nInductive Step: For n=k+1: LHS + (k+1)^2 = [k(k+1)(2k+1)/6] + (k+1)^2 = (k+1)[(2k^2+k+6k+6)/6] = (k+1)(k+2)(2k+3)/6 = RHS(k+1). Verified.'
      },
      marksObtained: 28,
      feedback: 'Excellent rigor and neat notation. Minor formatting in Q2 example. Approved by Faculty Advisor HCASICAN.',
      status: 'Evaluated'
    }
  },
  {
    id: 'asg-dsa-02',
    title: 'AVL Tree Height Balancing & Single Source Shortest Path Algorithms',
    subjectCode: '435C1B',
    subjectName: 'Data Structures and Algorithms',
    unit: 2,
    chapter: 'Non-Linear Structures: Trees & Graphs',
    topic: 'AVL Rotations & Dijkstra Priority Queue Analysis',
    assignmentType: 'Mixed Question Assignment',
    generationMethod: 'Difficulty-Based',
    generatedBy: 'Gemini 3.8 Flash AI Provider',
    totalMarks: 40,
    difficulty: 'Hard',
    instructions: [
      'Analyze worst-case rotation conditions for AVL trees.',
      'Write clean algorithmic pseudocode or Python implementation.',
      'Show trace table for vertex relaxation.'
    ],
    learningObjectives: [
      'CO3: Implement and balance self-adjusting search trees.',
      'CO4: Analyze single-source shortest path algorithms on weighted graphs.'
    ],
    dueDate: '2026-11-25',
    durationMinutes: 90,
    sourcePdfId: 'pdf-dsa-02',
    sourcePdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf',
    sourcePageReferences: [58, 62, 72, 135],
    status: 'In Progress',
    submissionRequirements: 'Code and written analysis submission.',
    questions: [
      {
        id: 'q-dsa-1',
        questionNumber: 1,
        text: 'When a new node is inserted into the left subtree of the right child of an AVL tree node, which rotation restores balance?',
        questionType: 'MCQ',
        marks: 5,
        difficulty: 'Medium',
        options: [
          'LL Rotation (Single Right)',
          'RR Rotation (Single Left)',
          'RL Rotation (Right-Left Double Rotation)',
          'LR Rotation (Left-Right Double Rotation)'
        ],
        correctAnswer: 'RL Rotation (Right-Left Double Rotation)',
        sourcePdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf',
        sourcePageRef: 62,
        learningOutcome: 'CO3: Balanced Trees'
      },
      {
        id: 'q-dsa-2',
        questionNumber: 2,
        text: 'Why does Dijkstra’s algorithm fail to produce correct shortest paths in graphs containing negative edge weights?',
        questionType: 'Short Answer',
        marks: 10,
        difficulty: 'Hard',
        expectedKeywords: ['greedy assumption', 'visited node finalized', 'negative cycle', 'relaxation'],
        sourcePdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf',
        sourcePageRef: 138,
        learningOutcome: 'CO4: Graph Algorithms'
      },
      {
        id: 'q-dsa-3',
        questionNumber: 3,
        text: 'Write a Python function `is_valid_bst(root)` that verifies if a binary tree satisfies the BST property in O(N) time and O(H) auxiliary space.',
        questionType: 'Programming',
        marks: 15,
        difficulty: 'Hard',
        expectedKeywords: ['def is_valid_bst', 'float("-inf")', 'float("inf")', 'recursion', 'inorder'],
        sourcePdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf',
        sourcePageRef: 72,
        learningOutcome: 'CO3: Tree Traversals'
      },
      {
        id: 'q-dsa-4',
        questionNumber: 4,
        text: 'Compare BFS and DFS with respect to memory consumption on deep vs wide search graphs.',
        questionType: 'Long Answer',
        marks: 10,
        difficulty: 'Medium',
        sourcePdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf',
        sourcePageRef: 118,
        learningOutcome: 'CO4: Graph Traversals'
      }
    ]
  },
  {
    id: 'asg-dem-03',
    title: 'Relational Decomposition (3NF/BCNF) & Transaction Isolation Schedules',
    subjectCode: '435E1A',
    subjectName: 'Data Engineering and Management',
    unit: 2,
    chapter: 'Transaction Management & ACID Concurrency Control',
    topic: 'Serializability, Precedence Graphs & Strict 2PL Protocol',
    assignmentType: 'Short Answer Assignment',
    generationMethod: 'Learning Outcome-Based',
    generatedBy: 'Rule-Based Baseline',
    totalMarks: 35,
    difficulty: 'Hard',
    instructions: [
      'Draw or describe precedence graph directed edges.',
      'Check if dependency preservation is maintained under BCNF decomposition.'
    ],
    learningObjectives: [
      'CO2: Evaluate conflict serializability and construct locking protocols for transactional consistency.',
      'CO3: Apply normalization algorithms to eliminate update and deletion anomalies.'
    ],
    dueDate: '2026-11-28',
    durationMinutes: 75,
    sourcePdfId: 'pdf-dem-03',
    sourcePdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf',
    sourcePageReferences: [24, 44, 48, 108],
    status: 'Not Started',
    submissionRequirements: 'Step-by-step mathematical reasoning.',
    questions: [
      {
        id: 'q-dem-1',
        questionNumber: 1,
        text: 'In relation R(A, B, C, D) with FDs {A → B, B → C, C → D}, determine the highest normal form satisfied and justify.',
        questionType: 'Short Answer',
        marks: 10,
        difficulty: 'Medium',
        expectedKeywords: ['candidate key A', '2NF satisfied', 'transitive dependency', '3NF violated'],
        sourcePdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf',
        sourcePageRef: 24,
        learningOutcome: 'CO3: Normalization'
      },
      {
        id: 'q-dem-2',
        questionNumber: 2,
        text: 'Explain why Strict Two-Phase Locking (Strict 2PL) guarantees conflict serializability while completely preventing cascading aborts.',
        questionType: 'Short Answer',
        marks: 10,
        difficulty: 'Hard',
        expectedKeywords: ['growing phase', 'shrinking phase', 'exclusive locks held till commit', 'no dirty reads'],
        sourcePdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf',
        sourcePageRef: 48,
        learningOutcome: 'CO2: Transaction Processing'
      },
      {
        id: 'q-dem-3',
        questionNumber: 3,
        text: 'State the CAP Theorem. Explain how MongoDB handles network partitions when configured as a CP system.',
        questionType: 'Long Answer',
        marks: 15,
        difficulty: 'Hard',
        expectedKeywords: ['Consistency', 'Availability', 'Partition Tolerance', 'Primary-Secondary replication', 'majority write quorum'],
        sourcePdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf',
        sourcePageRef: 108,
        learningOutcome: 'CO5: Distributed Systems'
      }
    ]
  },
  {
    id: 'asg-py-04',
    title: 'Advanced Python Decorators, AsyncIO Event Loop & Memory Optimization',
    subjectCode: '435C1C',
    subjectName: 'Python Programming',
    unit: 3,
    chapter: 'Concurrency, Functional Features & Object Optimization',
    topic: 'Decorators, yield Generators, AsyncIO Coroutines & GIL',
    assignmentType: 'Programming Assignment',
    generationMethod: 'Question-Type',
    generatedBy: 'Gemini 3.8 Flash AI Provider',
    totalMarks: 40,
    difficulty: 'Medium',
    instructions: [
      'All code must adhere to PEP 8 standards.',
      'Use functools.wraps on all decorator implementations.',
      'Test your code in the Python Coding Lab before submitting.'
    ],
    learningObjectives: [
      'CO3: Implement advanced meta-programming, closures, and decorators.',
      'CO4: Build asynchronous pipelines with AsyncIO and avoid GIL bottlenecks.'
    ],
    dueDate: '2026-12-02',
    durationMinutes: 90,
    sourcePdfId: 'pdf-py-04',
    sourcePdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf',
    sourcePageReferences: [18, 24, 74, 82],
    status: 'Not Started',
    submissionRequirements: 'Executable Python functions and unit test scripts.',
    questions: [
      {
        id: 'q-py-1',
        questionNumber: 1,
        text: 'Which standard module provides the `@wraps` decorator to preserve introspection metadata across wrapped functions?',
        questionType: 'MCQ',
        marks: 5,
        difficulty: 'Easy',
        options: ['sys', 'functools', 'inspect', 'itertools'],
        correctAnswer: 'functools',
        sourcePdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf',
        sourcePageRef: 24,
        learningOutcome: 'CO3: Meta-programming'
      },
      {
        id: 'q-py-2',
        questionNumber: 2,
        text: 'Write a Python decorator `@execution_timer(threshold_ms=50)` that prints a warning whenever the decorated function takes longer than `threshold_ms` to execute.',
        questionType: 'Programming',
        marks: 15,
        difficulty: 'Medium',
        expectedKeywords: ['functools.wraps', 'time.perf_counter()', 'def decorator', 'def wrapper'],
        sourcePdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf',
        sourcePageRef: 24,
        learningOutcome: 'CO3: Decorators'
      },
      {
        id: 'q-py-3',
        questionNumber: 3,
        text: 'Explain the CPython Global Interpreter Lock (GIL). When is `multiprocessing` preferred over `threading` in Python?',
        questionType: 'Long Answer',
        marks: 20,
        difficulty: 'Medium',
        expectedKeywords: ['CPython mutex', 'bytecode execution', 'CPU-bound vs IO-bound', 'ProcessPoolExecutor'],
        sourcePdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf',
        sourcePageRef: 74,
        learningOutcome: 'CO4: Concurrency'
      }
    ]
  },
  {
    id: 'asg-rand-05',
    title: 'Randomized Diagnostic Benchmark: Discrete Structures & Combinatorics',
    subjectCode: '435C1A',
    subjectName: 'Discrete Mathematics',
    unit: 3,
    chapter: 'Combinatorics & Recurrence Relations',
    topic: 'Pigeonhole Principle, Inclusions-Exclusions & Planar Graphs',
    assignmentType: 'MCQ Assignment',
    generationMethod: 'Randomized',
    generatedBy: 'Rule-Based Baseline',
    totalMarks: 20,
    difficulty: 'Easy',
    instructions: [
      'Diagnostic check to evaluate foundational readiness.',
      'Answer all questions within the allocated 30 minutes.'
    ],
    learningObjectives: [
      'CO1: Apply counting arguments and Pigeonhole Principle.',
      'CO4: Verify planarity and calculate chromatic numbers.'
    ],
    dueDate: '2026-12-05',
    durationMinutes: 30,
    sourcePdfId: 'pdf-dm-01',
    sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
    sourcePageReferences: [55, 79, 88],
    status: 'Evaluated',
    submissionRequirements: 'Auto-evaluated diagnostic quiz.',
    questions: [
      {
        id: 'q-rand-1',
        questionNumber: 1,
        text: 'In any connected planar graph with 8 vertices and 12 edges, how many faces (regions) are formed?',
        questionType: 'MCQ',
        marks: 5,
        difficulty: 'Easy',
        options: ['4', '6', '8', '10'],
        correctAnswer: '6',
        sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
        sourcePageRef: 88,
        learningOutcome: 'CO4: Planar Graphs'
      },
      {
        id: 'q-rand-2',
        questionNumber: 2,
        text: 'What is the minimum number of students required in an MCA class to guarantee that at least 5 students share the same birth month?',
        questionType: 'MCQ',
        marks: 5,
        difficulty: 'Medium',
        options: ['48', '49', '50', '60'],
        correctAnswer: '49',
        sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
        sourcePageRef: 55,
        learningOutcome: 'CO1: Counting'
      },
      {
        id: 'q-rand-3',
        questionNumber: 3,
        text: 'What is the sum of degrees of all vertices in a tree with 15 vertices?',
        questionType: 'MCQ',
        marks: 10,
        difficulty: 'Easy',
        options: ['14', '28', '30', '15'],
        correctAnswer: '28',
        sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
        sourcePageRef: 79,
        learningOutcome: 'CO4: Trees'
      }
    ],
    studentSubmission: {
      id: 'sub-rand-05',
      assignmentId: 'asg-rand-05',
      studentId: 'MCA2401',
      studentName: 'Devanath N',
      rollNumber: 'P26CA125',
      submittedAt: '2026-11-08 11:20',
      answers: {
        'q-rand-1': '6',
        'q-rand-2': '49',
        'q-rand-3': '28'
      },
      marksObtained: 20,
      feedback: 'Perfect diagnostic score! Strong foundation in planar formula and pigeonhole applications. Verified by Advisor HCASICAN.',
      status: 'Evaluated'
    }
  }
];
