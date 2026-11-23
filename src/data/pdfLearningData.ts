import { SubjectPDF, AIGeneratedStudyPack } from '../types';

export const SUBJECT_PDFS: SubjectPDF[] = [
  {
    id: 'pdf-dm-01',
    subjectCode: '435C1A',
    subjectName: 'Discrete Mathematics',
    semester: 1,
    status: 'Published',
    topic: 'Logic, Predicates, Relations, Graphs & Groups',
    description: 'Faculty-verified reference notes covering propositional logic, predicate calculus, posets, combinatorics, planar graph theory, and algebraic groups.',
    learningObjectives: [
      'Construct formal proofs using CNF/DNF conversions and mathematical induction.',
      'Model relations with Hasse diagrams and analyze planar/Eulerian graphs.',
      'Apply Lagrange theorem to finite algebraic subgroups.'
    ],
    title: 'Unit 1-5 Core Curriculum & Mathematical Foundations',
    fileName: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
    fileSize: '8.4 MB',
    pageCount: 124,
    unit: 1,
    chapter: 'Logic, Predicates, Relations, Graphs & Groups',
    uploadedBy: 'Dr. V. Ramanathan, Ph.D. (HOD)',
    uploadDate: '2026-09-04',
    ocrApplied: true,
    ocrConfidence: 99.4,
    processingStatus: 'Completed',
    extractedText: 'Mathematical Logic, Propositional Calculus, Normal Forms CNF/DNF, Predicates and Quantifiers, Equivalence Relations, Partial Order Posets, Hasse Diagrams, Lattices, Generating Functions, Eulerian & Hamiltonian Graphs, Planar Graph Euler Formula V-E+R=2, Semigroups and Groups, Lagrange Theorem.',
    topicsCovered: [
      'Propositional Logic & Normal Forms',
      'Predicate Calculus & Mathematical Induction',
      'Equivalence Relations & Hasse Diagrams',
      'Combinatorics & Recurrence Relations',
      'Eulerian & Planar Graphs (Euler Formula)',
      'Algebraic Structures & Lagrange Theorem'
    ],
    pageReferences: [
      {
        pageNumber: 12,
        heading: 'Normal Forms (CNF and DNF)',
        snippet: 'A compound proposition is in Conjunctive Normal Form (CNF) if it is a conjunction of one or more clauses, where each clause is a disjunction of literals. Example: (p ∨ ¬q) ∧ (¬p ∨ r).'
      },
      {
        pageNumber: 21,
        heading: 'Principle of Mathematical Induction',
        snippet: 'Base step verifies P(1). Inductive step assumes P(k) and proves P(k+1) follows rigorously.'
      },
      {
        pageNumber: 38,
        heading: 'Partial Orderings & Hasse Diagrams',
        snippet: 'A Hasse diagram graphically represents a finite poset (S, ≤), suppressing reflexive loops and transitive edges, displaying strictly covering pairs with directed upward orientation.'
      },
      {
        pageNumber: 55,
        heading: 'Pigeonhole Principle Applications',
        snippet: 'If k+1 objects are placed into k boxes, at least one box contains two or more objects. Generalized: at least ⌈N/k⌉ objects.'
      },
      {
        pageNumber: 79,
        heading: 'Handshaking Lemma & Graph Degree',
        snippet: 'In every undirected graph G=(V, E), the sum of degrees of all vertices equals twice the number of edges: ∑ deg(v) = 2|E|.'
      },
      {
        pageNumber: 88,
        heading: 'Euler Planar Graph Formula',
        snippet: 'For any connected planar graph with V vertices, E edges, and R enclosed regions (faces), V - E + R = 2.'
      },
      {
        pageNumber: 111,
        heading: 'Lagrange Theorem in Group Theory',
        snippet: 'The order of any subgroup H of a finite group G divides the order of G: |G| = [G : H] · |H|.'
      }
    ]
  },
  {
    id: 'pdf-dsa-02',
    subjectCode: '435C1B',
    subjectName: 'Data Structures and Algorithms',
    semester: 1,
    status: 'Published',
    topic: 'Linear Structures, Trees, Heaps, Graphs & Dynamic Programming',
    description: 'Official MCA DSA textbook guide covering asymptotic complexity, balanced AVL trees, priority heaps, shortest paths, and dynamic programming.',
    learningObjectives: [
      'Evaluate algorithm complexity using Big-O, Theta, and Omega notations.',
      'Implement AVL rebalancing rotations and binary min/max heap invariants.',
      'Solve graph shortest-path and 0/1 knapsack optimization problems.'
    ],
    title: 'Core Textbook & Algorithmic Problem Solving Manual',
    fileName: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf',
    fileSize: '11.2 MB',
    pageCount: 168,
    unit: 2,
    chapter: 'Linear Structures, Trees, Heaps, Graphs & Dynamic Programming',
    uploadedBy: 'Prof. Ananya Sengupta, M.Tech.',
    uploadDate: '2026-09-06',
    ocrApplied: true,
    ocrConfidence: 99.2,
    processingStatus: 'Completed',
    extractedText: 'Asymptotic notation Big-O/Theta/Omega, Linked Lists, Circular Queues, Binary Trees, AVL Balance Factor BF ∈ {-1, 0, 1}, LL/RR/LR/RL rotations, Binary Heaps, Hash Tables & Double Hashing, Dijkstra Shortest Path, Bellman Ford, Kruskal MST, Dynamic Programming 0/1 Knapsack, LCS.',
    topicsCovered: [
      'Asymptotic Notations & Linear Data Structures',
      'Binary Search Trees & AVL Height Balancing',
      'Priority Queues, Binary Heaps & Hashing',
      'Graph Traversals (BFS/DFS) & Shortest Path (Dijkstra)',
      'Greedy Algorithms & Dynamic Programming'
    ],
    pageReferences: [
      {
        pageNumber: 28,
        heading: 'Circular Queue Operations',
        snippet: 'A circular queue connects the last position to the first position using modulo arithmetic ((rear + 1) % MAX_SIZE), preventing false overflow.'
      },
      {
        pageNumber: 58,
        heading: 'AVL Tree Balance Factor',
        snippet: 'BF(node) = height(left) - height(right). In a valid AVL tree, BF is constrained to {-1, 0, 1}. Violations trigger single or double rotations.'
      },
      {
        pageNumber: 62,
        heading: 'AVL 4-Rotation Rebalancing',
        snippet: 'LL (single right), RR (single left), LR (left child left-rotation then parent right-rotation), and RL (right child right-rotation then parent left-rotation).'
      },
      {
        pageNumber: 86,
        heading: 'Binary Max-Heap Invariants',
        snippet: 'For every node i other than root, value(parent(i)) ≥ value(i). Parent index is ⌊(i-1)/2⌋, left child 2i+1, right child 2i+2.'
      },
      {
        pageNumber: 122,
        heading: 'Topological Sorting & DAGs',
        snippet: 'Topological sorting linearly orders vertices of a Directed Acyclic Graph (DAG) such that for all directed edges u → v, u precedes v.'
      },
      {
        pageNumber: 135,
        heading: 'Dijkstra Single Source Shortest Path',
        snippet: 'Maintains min-priority queue of tentative distances. Runs in O((V + E) log V). Assumes non-negative edge weights.'
      },
      {
        pageNumber: 156,
        heading: '0/1 Knapsack Dynamic Programming',
        snippet: 'State recurrence: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i]). Space optimized to 1D rolling array O(W).'
      }
    ]
  },
  {
    id: 'pdf-dem-03',
    subjectCode: '435E1A',
    subjectName: 'Data Engineering and Management',
    semester: 1,
    status: 'Published',
    topic: 'Normalization, ACID Transactions, B+ Trees, CAP Theorem & OLAP',
    description: 'Faculty study notes on relational decomposition up to BCNF, ACID concurrency control, B+ tree indexing, distributed CAP guarantees, and OLAP cubes.',
    learningObjectives: [
      'Decompose relational schemas cleanly into 3NF and BCNF.',
      'Verify conflict serializability and strict two-phase locking schedules.',
      'Contrast Star vs Snowflake schemas and CAP trade-offs in NoSQL stores.'
    ],
    title: 'Relational Database Architecture, NoSQL & Data Warehousing',
    fileName: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf',
    fileSize: '9.8 MB',
    pageCount: 142,
    unit: 3,
    chapter: 'Normalization, ACID Transactions, B+ Trees, CAP Theorem & OLAP',
    uploadedBy: 'Dr. K. Rajesh Kumar, Ph.D.',
    uploadDate: '2026-09-08',
    ocrApplied: true,
    ocrConfidence: 98.9,
    processingStatus: 'Completed',
    extractedText: 'Relational Model, Armstrong Axioms, 1NF/2NF/3NF/BCNF, Multi-valued dependencies 4NF, ACID properties, Conflict Serializability & Precedence Graphs, Strict Two-Phase Locking (2PL), B+ Tree search cost O(log_B N), CAP Theorem, MongoDB Document Store, Star & Snowflake Schemas, OLAP Cubes Roll-up Drill-down.',
    topicsCovered: [
      'Relational Algebra & 3NF/BCNF Decomposition',
      'ACID Concurrency Control & Strict 2PL Protocol',
      'B+ Tree Indices & Query Cost Estimation',
      'Distributed Systems & CAP Theorem Guarantees',
      'Dimensional Modeling (Star/Snowflake) & OLAP Operations'
    ],
    pageReferences: [
      {
        pageNumber: 24,
        heading: 'Boyce-Codd Normal Form (BCNF)',
        snippet: 'A relation R is in BCNF if for every functional dependency X → Y holding over R, either Y ⊆ X or X is a superkey of R.'
      },
      {
        pageNumber: 44,
        heading: 'Conflict Serializability & Precedence Graph',
        snippet: 'A schedule is conflict serializable if and only if its precedence graph contains no directed cycles.'
      },
      {
        pageNumber: 48,
        heading: 'Two-Phase Locking (2PL) Guarantees',
        snippet: 'Strict 2PL retains all exclusive locks until transaction commit or abort, guaranteeing conflict serializability and eliminating cascading aborts.'
      },
      {
        pageNumber: 78,
        heading: 'B+ Tree Index Architecture',
        snippet: 'Internal nodes store routing search keys; leaf nodes store sorted pointers linked sequentially, optimizing range queries to O(log_B N + scans).'
      },
      {
        pageNumber: 108,
        heading: 'Brewer CAP Theorem',
        snippet: 'A distributed store can satisfy at most two out of: Consistency (all nodes see same data), Availability (reads/writes succeed), Partition Tolerance (network splits tolerated).'
      },
      {
        pageNumber: 130,
        heading: 'Star Schema vs Snowflake Schema',
        snippet: 'Star schemas maintain denormalized dimension tables surrounding a central fact table for fast analytical joins; Snowflake normalizes dimensions into hierarchies.'
      },
      {
        pageNumber: 134,
        heading: 'OLAP Multidimensional Operations',
        snippet: 'Roll-up aggregates up hierarchies; Drill-down navigates to granular detail; Slice extracts a 2D sub-cube; Dice isolates multi-dimensional ranges; Pivot rotates view axes.'
      }
    ]
  },
  {
    id: 'pdf-py-04',
    subjectCode: '435C1C',
    subjectName: 'Python Programming',
    semester: 1,
    status: 'Published',
    topic: 'Functional Paradigms, OOP Protocols, AsyncIO, NumPy & Django MTV',
    description: 'Postgraduate Python manual detailing lazy generators, decorators, dunder protocols, CPython GIL, AsyncIO, NumPy/Pandas, and Django ORM tuning.',
    learningObjectives: [
      'Write memory-efficient generators, context managers, and parameterized decorators.',
      'Understand CPython GIL constraints and cooperative AsyncIO concurrency.',
      'Optimize Django ORM queries and vectorized Pandas/NumPy data pipelines.'
    ],
    title: 'Advanced Python Computing, AsyncIO & Scientific Engineering',
    fileName: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf',
    fileSize: '10.5 MB',
    pageCount: 136,
    unit: 4,
    chapter: 'Functional Paradigms, OOP Protocols, AsyncIO, NumPy & Django MTV',
    uploadedBy: 'Dr. Meera Nambiar, Ph.D.',
    uploadDate: '2026-09-09',
    ocrApplied: true,
    ocrConfidence: 99.6,
    processingStatus: 'Completed',
    extractedText: 'Python object model, __slots__, generators & yield, decorators with arguments, functools.wraps, Context Managers __enter__/__exit__, CPython Global Interpreter Lock (GIL), AsyncIO event loops and coroutines, NumPy ndarray broadcasting, Pandas loc/iloc slicing, Django ORM select_related vs prefetch_related, pytest fixtures.',
    topicsCovered: [
      'Functional Paradigms, Comprehensions & Generators',
      'OOP Architecture, Metaclasses & Dunder Protocols',
      'AsyncIO Event Loops & CPython GIL Multi-Processing',
      'Scientific Computing: NumPy Vectorization & Pandas Wrangling',
      'Django MTV Architecture & ORM Optimization'
    ],
    pageReferences: [
      {
        pageNumber: 18,
        heading: 'Generators and the yield Keyword',
        snippet: 'Yield pauses execution state and yields value with O(1) memory overhead, enabling lazy evaluation over infinite or large disk streams.'
      },
      {
        pageNumber: 24,
        heading: 'Decorators and functools.wraps',
        snippet: 'Decorators wrap callables; @wraps preserves docstrings, __name__, and inspectable signatures across decorator layers.'
      },
      {
        pageNumber: 42,
        heading: 'Constructor Protocols: __new__ vs __init__',
        snippet: '__new__ is the static allocator that creates the instance; __init__ initializes instance state.'
      },
      {
        pageNumber: 74,
        heading: 'CPython Global Interpreter Lock (GIL)',
        snippet: 'A mutex protecting PyObject memory; limits native bytecode execution to a single thread, requiring multiprocessing for CPU-bound task parallelism.'
      },
      {
        pageNumber: 82,
        heading: 'AsyncIO Cooperative Multitasking',
        snippet: 'Single-threaded event loop yielding control voluntarily at await points during non-blocking socket and file operations.'
      },
      {
        pageNumber: 104,
        heading: 'Pandas Indexing: loc vs iloc',
        snippet: 'loc performs label-based indexing; iloc performs 0-indexed integer position-based indexing.'
      },
      {
        pageNumber: 124,
        heading: 'Django ORM Query Optimization',
        snippet: 'select_related executes SQL INNER/LEFT JOIN for single-valued relationships; prefetch_related executes separate queries with IN clauses for multi-valued relations.'
      }
    ]
  }
];

export const AI_STUDY_PACKS: Record<string, AIGeneratedStudyPack> = {
  '435C1A': {
    id: 'pack-dm-01',
    subjectCode: '435C1A',
    sourcePdfId: 'pdf-dm-01',
    sourcePdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf',
    unit: 1,
    title: 'Discrete Mathematics: Comprehensive Revision Notes & Questions',
    createdAt: '2026-10-15',
    type: 'ExamPrep',
    contentMarkdown: `### Discrete Mathematics (435C1A) - Semester 1 AI Study Pack

#### Key 2-Mark Questions & Model Answers
1. **Define Conjunctive Normal Form (CNF) with an example.** [Page 12]
   - *Answer*: A compound proposition is in CNF if it is a conjunction of one or more clauses, where each clause is a disjunction of literals. Example: (p ∨ ¬q) ∧ (¬p ∨ r).
2. **State the Handshaking Lemma in graph theory.** [Page 79]
   - *Answer*: In any undirected graph G=(V, E), the sum of degrees of all vertices equals twice the number of edges: ∑ deg(v) = 2|E|. Hence every graph has an even number of odd-degree vertices.
3. **State the Pigeonhole Principle.** [Page 55]
   - *Answer*: If k+1 or more objects are placed into k boxes, at least one box contains two or more objects. Generalized: ⌈N/k⌉ objects.
4. **State Lagrange's Theorem in group theory.** [Page 111]
   - *Answer*: If H is a subgroup of a finite group G, then |G| = [G : H] · |H|. The order of H divides the order of G.

#### Key 5-Mark Questions
1. **Explain Proof by Mathematical Induction and verify: 1 + 2 + ... + n = n(n+1)/2.** [Page 21]
2. **Formulate Warshall's Algorithm for finding the transitive closure of a relation.** [Page 34]
3. **State and prove Euler's Planar Graph Formula V - E + R = 2.** [Page 88]

#### Key 10-Mark Questions
1. **Discuss Lattices as Posets and prove uniqueness of complements in distributive lattices.** [Page 45]
2. **Compare Kruskal's and Prim's Minimal Spanning Tree Algorithms.** [Page 96]`,
    pageCitations: [12, 21, 34, 45, 55, 79, 88, 96, 111]
  },
  '435C1B': {
    id: 'pack-dsa-02',
    subjectCode: '435C1B',
    sourcePdfId: 'pdf-dsa-02',
    sourcePdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf',
    unit: 2,
    title: 'Data Structures & Algorithms: Balanced Trees & Graph Analysis',
    createdAt: '2026-10-15',
    type: 'ExamPrep',
    contentMarkdown: `### Data Structures and Algorithms (435C1B) - Semester 1 AI Study Pack

#### Key 2-Mark Questions & Model Answers
1. **Define Balance Factor in an AVL Tree.** [Page 58]
   - *Answer*: BF(node) = height(left) - height(right). In a valid AVL tree, BF ∈ {-1, 0, 1}.
2. **What is a Circular Queue and why is it preferred over a linear queue?** [Page 28]
   - *Answer*: Avoids false overflow by wrapping rear to front using (rear + 1) % MAX_SIZE without shifting elements.
3. **State the time complexity of QuickSort.** [Page 148]
   - *Answer*: Best & Average: O(n log n). Worst: O(n^2) when pivot creates maximum partition imbalance.

#### Key 5-Mark Questions
1. **Describe the 4 rotation techniques to rebalance an AVL Tree (LL, RR, LR, RL).** [Page 62]
2. **Trace Dijkstra's Single Source Shortest Path Algorithm.** [Page 135]

#### Key 10-Mark Questions
1. **Formulate the 0/1 Knapsack Problem using Dynamic Programming.** [Page 156]`,
    pageCitations: [28, 58, 62, 86, 122, 135, 148, 156]
  },
  '435E1A': {
    id: 'pack-dem-03',
    subjectCode: '435E1A',
    sourcePdfId: 'pdf-dem-03',
    sourcePdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf',
    unit: 3,
    title: 'Data Engineering & Management: ACID, Concurrency & OLAP',
    createdAt: '2026-10-15',
    type: 'ExamPrep',
    contentMarkdown: `### Data Engineering and Management (435E1A) - Semester 1 AI Study Pack

#### Key 2-Mark Questions & Model Answers
1. **Define Boyce-Codd Normal Form (BCNF).** [Page 24]
   - *Answer*: For every non-trivial functional dependency X → Y in R, X must be a superkey.
2. **What is the ACID guarantee in transaction processing?** [Page 40]
   - *Answer*: Atomicity, Consistency, Isolation, Durability.
3. **State the CAP Theorem for distributed data stores.** [Page 108]
   - *Answer*: Simultaneously guarantees at most two of Consistency, Availability, and Partition Tolerance.

#### Key 5-Mark Questions
1. **Contrast Basic 2PL with Strict 2PL regarding cascading aborts.** [Page 48]
2. **Explain Conflict Serializability using Precedence Graphs.** [Page 44]

#### Key 10-Mark Questions
1. **Examine Data Warehouse Architecture and OLAP Operations (Roll-up, Drill-down, Slice, Dice, Pivot).** [Page 134]`,
    pageCitations: [24, 40, 44, 48, 78, 108, 130, 134]
  },
  '435C1C': {
    id: 'pack-py-04',
    subjectCode: '435C1C',
    sourcePdfId: 'pdf-py-04',
    sourcePdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf',
    unit: 4,
    title: 'Python Programming: Paradigms, AsyncIO & Django Optimization',
    createdAt: '2026-10-15',
    type: 'ExamPrep',
    contentMarkdown: `### Python Programming (435C1C) - Semester 1 AI Study Pack

#### Key 2-Mark Questions & Model Answers
1. **What is the Global Interpreter Lock (GIL) in CPython?** [Page 74]
   - *Answer*: A mutex that limits bytecode execution to one native thread at a time, protecting memory but restricting multi-threaded CPU parallelism.
2. **Explain the difference between __init__ and __new__ in Python OOP.** [Page 42]
   - *Answer*: __new__ is the allocator that creates instance; __init__ initializes attributes.
3. **What does the yield keyword do in a generator?** [Page 18]
   - *Answer*: Pauses generator function and yields value to caller with O(1) memory overhead.

#### Key 5-Mark Questions
1. **Demonstrate Python decorators with arguments using execution timing.** [Page 26]
2. **Explain Metaclasses and enforcing attribute conventions.** [Page 54]

#### Key 10-Mark Questions
1. **Analyze Python AsyncIO vs Multiprocessing for concurrent computing.** [Page 82]`,
    pageCitations: [18, 26, 42, 54, 74, 82, 104, 124]
  }
};
