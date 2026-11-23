import {
  Subject,
  StudentUser,
  Examination,
  CodingProblem,
  LearningMaterial,
  FAQItem,
  SubjectPDF,
  Assignment,
  NotificationItem,
  AIGeneratedStudyPack
} from '../types';

export const SEMESTER_SUBJECTS: Subject[] = [
  {
    id: 'dm-435c1a',
    code: '435C1A',
    name: 'Discrete Mathematics',
    semester: 1,
    status: 'Upcoming',
    isAvailable: true,
    credits: 4,
    type: 'Core',
    instructor: 'Dr. V. Ramanathan, Ph.D.',
    description: 'Foundations of mathematical reasoning, propositional and predicate logic, combinatorial theory, graph models, and algebraic structures for computing.',
    iconName: 'Calculator',
    totalModules: 5,
    completedModules: 0,
    progressPercentage: 0,
    units: [
      {
        unitNumber: 1,
        title: 'Mathematical Logic & Proof Techniques',
        topics: ['Propositional Logic', 'Truth Tables & Normal Forms (CNF, DNF)', 'Predicate Calculus & Quantifiers', 'Methods of Proof & Mathematical Induction']
      },
      {
        unitNumber: 2,
        title: 'Set Theory, Relations & Functions',
        topics: ['Set Operations & Power Sets', 'Equivalence Relations & Partitions', 'Partial Ordering Relations & Hasse Diagrams', 'Lattices & Injective/Surjective Functions']
      },
      {
        unitNumber: 3,
        title: 'Combinatorics & Recurrence Relations',
        topics: ['Pigeonhole Principle', 'Permutations and Combinations', 'Generating Functions', 'Solving Linear First and Second Order Recurrence Relations']
      },
      {
        unitNumber: 4,
        title: 'Graph Theory & Network Models',
        topics: ['Basic Terminology & Representation (Adjacency Matrix)', 'Eulerian & Hamiltonian Paths', 'Planar Graphs & Kuratowski’s Theorem', 'Trees, Spanning Trees & Prim/Kruskal Algorithms']
      },
      {
        unitNumber: 5,
        title: 'Algebraic Structures & Group Theory',
        topics: ['Semigroups & Monoids', 'Groups, Subgroups & Cosets', 'Lagrange’s Theorem', 'Homomorphisms & Isomorphisms']
      }
    ],
    referenceBooks: [
      'Kenneth H. Rosen, Discrete Mathematics and Its Applications, 8th Edition',
      'Tremblay, J.P. and Manohar, R., Discrete Mathematical Structures with Applications to Computer Science',
      'C.L. Liu, Elements of Discrete Mathematics, McGraw Hill'
    ]
  },
  {
    id: 'dsa-435c1b',
    code: '435C1B',
    name: 'Data Structures and Algorithms',
    semester: 1,
    status: 'Upcoming',
    isAvailable: true,
    credits: 4,
    type: 'Core',
    instructor: 'Prof. Ananya Sengupta, M.Tech',
    description: 'Design, analysis, and asymptotic efficiency of linear and non-linear data structures, balanced search trees, graph algorithms, and algorithmic paradigms.',
    iconName: 'Network',
    totalModules: 5,
    completedModules: 0,
    progressPercentage: 0,
    units: [
      {
        unitNumber: 1,
        title: 'Analysis of Algorithms & Linear Structures',
        topics: ['Asymptotic Notations (Big-O, Omega, Theta)', 'Singly, Doubly and Circular Linked Lists', 'Stacks, Queues, and Circular Queue Implementations', 'Stack Applications: Infix to Postfix Conversion']
      },
      {
        unitNumber: 2,
        title: 'Tree Data Structures & Balancing',
        topics: ['Binary Trees, Traversals (Pre, In, Post, Level-order)', 'Binary Search Trees (BST) - Search, Insert, Delete', 'AVL Trees - Rotations and Balancing', 'B-Trees & B+ Trees for External Indexing']
      },
      {
        unitNumber: 3,
        title: 'Priority Queues & Disjoint Sets',
        topics: ['Binary Min/Max Heaps', 'Heap Sort & Priority Queue Operations', 'Disjoint Set Data Structure (Union-Find)', 'Path Compression & Union by Rank']
      },
      {
        unitNumber: 4,
        title: 'Graph Algorithms & Shortest Paths',
        topics: ['Graph Representations & BFS/DFS Traversals', 'Topological Sorting & DAGs', 'Dijkstra’s Algorithm & Bellman-Ford Algorithm', 'Minimum Spanning Trees: Kruskal and Prim']
      },
      {
        unitNumber: 5,
        title: 'Algorithm Design Paradigms & Complexity',
        topics: ['Divide and Conquer (Merge Sort, Quick Sort)', 'Greedy Methods (Huffman Coding, Fractional Knapsack)', 'Dynamic Programming (0/1 Knapsack, LCS)', 'Intro to P, NP, and NP-Complete Classes']
      }
    ],
    referenceBooks: [
      'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein, Introduction to Algorithms (CLRS)',
      'Mark Allen Weiss, Data Structures and Algorithm Analysis in C/Python, Pearson',
      'Robert Sedgewick and Kevin Wayne, Algorithms, 4th Edition'
    ]
  },
  {
    id: 'dem-435e1a',
    code: '435E1A',
    name: 'Data Engineering and Management',
    semester: 1,
    status: 'Upcoming',
    isAvailable: true,
    credits: 3,
    type: 'Elective',
    instructor: 'Dr. Suresh K. Nair, Ph.D.',
    description: 'Enterprise relational database systems, formal relational algebra, normalization theory, indexing strategies, transaction ACID properties, and modern ETL pipelines.',
    iconName: 'Database',
    totalModules: 5,
    completedModules: 0,
    progressPercentage: 0,
    units: [
      {
        unitNumber: 1,
        title: 'Relational Model & Relational Algebra',
        topics: ['Entity-Relationship (ER) & Enhanced ER Modeling', 'Relational Algebra Operators: Select, Project, Join, Division', 'SQL DDL, DML, and Advanced Nested Queries', 'Integrity Constraints & Triggers']
      },
      {
        unitNumber: 2,
        title: 'Relational Database Design & Normalization',
        topics: ['Functional Dependencies & Inference Rules (Armstrong’s Axioms)', 'Lossless-Join Decomposition & Dependency Preservation', 'First, Second, and Third Normal Forms (1NF, 2NF, 3NF)', 'Boyce-Codd Normal Form (BCNF) & Multivalued Dependencies (4NF)']
      },
      {
        unitNumber: 3,
        title: 'Transaction Management & Concurrency Control',
        topics: ['ACID Properties and States of a Transaction', 'Schedules, Serializability (Conflict & View)', 'Two-Phase Locking Protocol (2PL)', 'Deadlock Handling & Write-Ahead Logging (WAL)']
      },
      {
        unitNumber: 4,
        title: 'Storage, Indexing & Query Processing',
        topics: ['File Organizations (Heap, Hash, Sequential)', 'B+ Tree Index Files & Hash Indexing', 'Query Processing Steps & Cost Estimation', 'Query Optimization Strategies']
      },
      {
        unitNumber: 5,
        title: 'Modern Data Engineering & NoSQL Architectures',
        topics: ['Data Warehousing & Star/Snowflake Schemas', 'ETL vs. ELT Pipeline Architectures', 'NoSQL Classifications (Key-Value, Document, Column, Graph)', 'CAP Theorem & Base Consistency Models']
      }
    ],
    referenceBooks: [
      'Abraham Silberschatz, Henry F. Korth, S. Sudarshan, Database System Concepts, 7th Edition',
      'Ramez Elmasri, Shamkant B. Navathe, Fundamentals of Database Systems, 7th Edition',
      'Martin Kleppmann, Designing Data-Intensive Applications, O’Reilly'
    ]
  },
  {
    id: 'py-435c1c',
    code: '435C1C',
    name: 'Python Programming',
    semester: 1,
    status: 'Upcoming',
    isAvailable: true,
    credits: 4,
    type: 'Core',
    instructor: 'Prof. Meenakshi Sundaram, M.S.',
    description: 'Advanced Python idioms, object-oriented architecture, functional programming paradigms, modular package design, exception handling, and scientific computing stacks.',
    iconName: 'Code',
    totalModules: 5,
    completedModules: 0,
    progressPercentage: 0,
    units: [
      {
        unitNumber: 1,
        title: 'Python Core Architecture & Data Models',
        topics: ['Python Execution Model & Bytecode Interpretation', 'Dynamic Typing, Mutability, and Memory References', 'Advanced Data Structures: Sets, Dicts, Defaultdicts, Counters', 'Comprehensions (List, Set, Dict, Generator Expressions)']
      },
      {
        unitNumber: 2,
        title: 'Functions, Scopes & Functional Programming',
        topics: ['Positional-only, Keyword-only arguments & *args, **kwargs', 'LEGB Scope Resolution & Closures', 'First-Class Functions, Decorators, and Memoization', 'Built-in Functional Tools: map(), filter(), reduce(), itertools']
      },
      {
        unitNumber: 3,
        title: 'Object-Oriented Programming & Metaprogramming',
        topics: ['Classes, Dunder/Magic Methods (__init__, __str__, __repr__)', 'Inheritance, Multiple Inheritance, and MRO (C3 Linearization)', 'Encapsulation, Properties (@property), and Descriptors', 'Abstract Base Classes (abc module) & Dataclasses']
      },
      {
        unitNumber: 4,
        title: 'Robust I/O, Exceptions & Testing',
        topics: ['Context Managers and the with Statement (__enter__, __exit__)', 'Custom Exception Hierarchies & Tracebacks', 'File Serialization: JSON, CSV, and Pickle Safety', 'Unit Testing with unittest and pytest Assertions']
      },
      {
        unitNumber: 5,
        title: 'Scientific Computing & Applied Libraries',
        topics: ['NumPy Arrays, Vectorization, and Broadcasting Rules', 'Pandas DataFrames, Series, and Data Cleansing', 'Matplotlib & Seaborn Data Visualization Fundamentals', 'Integration with SQLite3 & Relational ORMs']
      }
    ],
    referenceBooks: [
      'Luciano Ramalho, Fluent Python: Clear, Concise, and Effective Programming, 2nd Edition',
      'David Beazley, Brian K. Jones, Python Cookbook, 3rd Edition',
      'Mark Lutz, Learning Python, 5th Edition, O’Reilly'
    ]
  }
];

export const DEMO_STUDENTS: StudentUser[] = [
  {
    id: 'std-2401',
    role: 'student',
    isActive: true,
    studentId: 'MCA2401',
    rollNumber: 'P26CA125',
    username: 'devanath_n',
    name: 'Devanath N',
    email: 'devanath016@gmail.com',
    enrollmentYear: 2024,
    batch: 'MCA 2024–2026',
    semester: 1,
    program: 'Master of Computer Applications',
    currentSGPA: 8.85,
    targetSGPA: 9.20,
    attendancePercentage: 92.4,
    completedCredits: 15,
    totalCredits: 19,
    advisorName: 'HCASICAN'
  },
  {
    id: 'std-2402',
    role: 'student',
    isActive: true,
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
    targetSGPA: 9.50,
    attendancePercentage: 96.0,
    completedCredits: 15,
    totalCredits: 19,
    advisorName: 'Prof. Ananya Sengupta'
  },
  {
    id: 'std-2403',
    role: 'student',
    isActive: true,
    studentId: 'MCA2403',
    rollNumber: 'P26CA127',
    username: 'rohan_verma',
    name: 'Rohan Verma',
    email: 'rohan.verma@mca.edu.in',
    enrollmentYear: 2024,
    batch: 'MCA 2024–2026',
    semester: 1,
    program: 'Master of Computer Applications',
    currentSGPA: 8.40,
    targetSGPA: 8.80,
    attendancePercentage: 88.5,
    completedCredits: 15,
    totalCredits: 19,
    advisorName: 'Dr. Suresh K. Nair'
  }
];

export const EXAMINATIONS: Examination[] = [
  {
    id: 'exam-dsa-01',
    title: 'Mid-Semester Assessment: Data Structures & Algorithms',
    subjectCode: '435C1B',
    subjectName: 'Data Structures and Algorithms',
    durationMinutes: 30,
    totalMarks: 30,
    passingMarks: 15,
    status: 'Available',
    dueDate: '2026-11-20',
    questions: [
      {
        id: 'q-dsa-1',
        subjectCode: '435C1B',
        subjectName: 'Data Structures and Algorithms',
        unit: 1,
        difficulty: 'Medium',
        text: 'What is the tightest worst-case time complexity of finding the k-th smallest element in an unsorted array of n elements using the QuickSelect algorithm?',
        options: [
          'O(n)',
          'O(n log n)',
          'O(n²)',
          'O(k log n)'
        ],
        correctAnswerIndex: 2,
        explanation: 'While QuickSelect has an expected average-case running time of O(n), its worst-case occurs when unbalanced partitions are continually chosen (e.g. sorted input with last element as pivot), yielding O(n²).'
      },
      {
        id: 'q-dsa-2',
        subjectCode: '435C1B',
        subjectName: 'Data Structures and Algorithms',
        unit: 2,
        difficulty: 'Hard',
        text: 'In an AVL Tree, if an insertion into the right subtree of the left child causes an imbalance at node Z, which rotation sequence must be performed to restore the AVL invariant?',
        options: [
          'Single Left Rotation',
          'Single Right Rotation',
          'Left-Right (LR) Double Rotation',
          'Right-Left (RL) Double Rotation'
        ],
        correctAnswerIndex: 2,
        explanation: 'When an insertion occurs in the inside child (right child of left subtree), a Left-Right (LR) double rotation is required: first a left rotation on the child, followed by a right rotation on the parent.'
      },
      {
        id: 'q-dsa-3',
        subjectCode: '435C1B',
        subjectName: 'Data Structures and Algorithms',
        unit: 4,
        difficulty: 'Medium',
        text: 'Which algorithm is best suited for computing single-source shortest paths on a directed graph with non-negative edge weights implemented with a Fibonacci heap?',
        options: [
          'Bellman-Ford Algorithm with O(V·E) complexity',
          'Floyd-Warshall Algorithm with O(V³) complexity',
          'Dijkstra’s Algorithm with O(E + V log V) complexity',
          'Breadth-First Search with O(V + E) complexity'
        ],
        correctAnswerIndex: 2,
        explanation: 'Dijkstra’s algorithm using a Fibonacci heap achieves an optimal asymptotic complexity of O(E + V log V) when edge weights are strictly non-negative.'
      },
      {
        id: 'q-dsa-4',
        subjectCode: '435C1B',
        subjectName: 'Data Structures and Algorithms',
        unit: 2,
        difficulty: 'Easy',
        text: 'Which tree traversal on a Binary Search Tree (BST) produces nodes in strictly ascending numerical order?',
        options: [
          'Pre-order Traversal',
          'In-order Traversal',
          'Post-order Traversal',
          'Level-order Traversal'
        ],
        correctAnswerIndex: 1,
        explanation: 'In-order traversal visits Left Subtree -> Root -> Right Subtree, which yields the sorted non-decreasing sequence of elements in any valid Binary Search Tree.'
      },
      {
        id: 'q-dsa-5',
        subjectCode: '435C1B',
        subjectName: 'Data Structures and Algorithms',
        unit: 5,
        difficulty: 'Hard',
        text: 'What is the recurrence relation for the Merge Sort algorithm on an array of size n, assuming division into two equal halves?',
        options: [
          'T(n) = 2T(n/2) + O(n)',
          'T(n) = T(n-1) + O(n)',
          'T(n) = 2T(n/2) + O(1)',
          'T(n) = 4T(n/2) + O(n²)'
        ],
        correctAnswerIndex: 0,
        explanation: 'Merge sort splits the input into two subproblems of size n/2, solves them recursively (2T(n/2)), and merges the two sorted subarrays in linear time (O(n)), yielding T(n) = 2T(n/2) + O(n).'
      }
    ]
  },
  {
    id: 'exam-py-01',
    title: 'Unit Evaluation: Advanced Python Architecture & OOP',
    subjectCode: '435C1C',
    subjectName: 'Python Programming',
    durationMinutes: 25,
    totalMarks: 25,
    passingMarks: 12,
    status: 'Available',
    dueDate: '2026-11-22',
    questions: [
      {
        id: 'q-py-1',
        subjectCode: '435C1C',
        subjectName: 'Python Programming',
        unit: 2,
        difficulty: 'Medium',
        text: 'What will be the output of evaluating default parameter expressions in Python functions, such as `def append_to(item, target=[]):`?',
        options: [
          'A new empty list is created on every function call',
          'The default list is instantiated once at module load time and shared across subsequent calls',
          'A TypeError is raised because default arguments cannot be mutable objects',
          'Python creates a shallow copy of the list on each invocation'
        ],
        correctAnswerIndex: 1,
        explanation: 'Python def statements evaluate default argument expressions once when the function definition is executed, binding the same mutable object to the function object across all future calls.'
      },
      {
        id: 'q-py-2',
        subjectCode: '435C1C',
        subjectName: 'Python Programming',
        unit: 3,
        difficulty: 'Hard',
        text: 'Which algorithm does Python 3 utilize to determine Method Resolution Order (MRO) in diamond inheritance hierarchies?',
        options: [
          'Depth-First Search (DFS) left-to-right',
          'Breadth-First Search (BFS)',
          'C3 Superclasses Linearization Algorithm',
          'Dijkstra’s Topological Sort'
        ],
        correctAnswerIndex: 2,
        explanation: 'Python 2.3+ and Python 3 implement the C3 Linearization algorithm to enforce local precedence order and monotonicity in multiple inheritance graphs.'
      },
      {
        id: 'q-py-3',
        subjectCode: '435C1C',
        subjectName: 'Python Programming',
        unit: 4,
        difficulty: 'Easy',
        text: 'Which special dunder method is invoked when entering a context managed block via the `with` statement?',
        options: [
          '__open__()',
          '__init__()',
          '__enter__()',
          '__start__()'
        ],
        correctAnswerIndex: 2,
        explanation: 'The context management protocol requires implementing `__enter__()` for acquiring resources when entering the `with` block and `__exit__()` for deterministic teardown.'
      },
      {
        id: 'q-py-4',
        subjectCode: '435C1C',
        subjectName: 'Python Programming',
        unit: 1,
        difficulty: 'Medium',
        text: 'What is the primary operational difference between a list comprehension and a generator expression in Python?',
        options: [
          'List comprehensions use round brackets; generator expressions use square brackets',
          'List comprehensions eagerly construct the entire list in memory; generator expressions yield elements lazily on demand',
          'Generator expressions cannot be iterated over using a for-loop',
          'List comprehensions execute in C while generator expressions execute in Python bytecode'
        ],
        correctAnswerIndex: 1,
        explanation: 'List comprehensions eagerly allocate and populate the entire sequence in memory immediately, whereas generator expressions produce generator iterators that compute items lazily one at a time.'
      }
    ]
  },
  {
    id: 'exam-dm-01',
    title: 'Quiz 1: Logic, Predicates & Graph Theory',
    subjectCode: '435C1A',
    subjectName: 'Discrete Mathematics',
    durationMinutes: 20,
    totalMarks: 20,
    passingMarks: 10,
    status: 'Completed',
    dueDate: '2026-11-05',
    userScore: 18,
    completedAt: '2026-11-04 14:30',
    questions: [
      {
        id: 'q-dm-1',
        subjectCode: '435C1A',
        subjectName: 'Discrete Mathematics',
        unit: 1,
        difficulty: 'Easy',
        text: 'What is the contrapositive of the implication "If it rains, then the ground is wet"?',
        options: [
          'If the ground is wet, then it rains',
          'If it does not rain, then the ground is not wet',
          'If the ground is not wet, then it does not rain',
          'It rains if and only if the ground is wet'
        ],
        correctAnswerIndex: 2,
        explanation: 'The contrapositive of p -> q is ¬q -> ¬p. Both statements are logically equivalent.'
      },
      {
        id: 'q-dm-2',
        subjectCode: '435C1A',
        subjectName: 'Discrete Mathematics',
        unit: 4,
        difficulty: 'Medium',
        text: 'According to Euler’s formula for connected planar graphs, if V is the number of vertices, E is the number of edges, and F is the number of faces, which equality holds?',
        options: [
          'V - E + F = 2',
          'V + E - F = 2',
          'V + E + F = 1',
          'V - E - F = 0'
        ],
        correctAnswerIndex: 0,
        explanation: 'Euler’s formula states that for any connected planar graph drawn without intersecting edges, V - E + F = 2.'
      }
    ]
  }
];

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'prob-01',
    title: 'Binary Search Tree Validator & Inorder Checker',
    difficulty: 'Medium',
    category: 'Data Structures',
    description: `Given a representation of a binary tree, write a Python function \`is_valid_bst(root)\` that determines if the tree satisfies the Binary Search Tree (BST) property.
    
A valid BST is defined as follows:
- The left subtree of a node contains only nodes with keys strictly less than the node's key.
- The right subtree of a node contains only nodes with keys strictly greater than the node's key.
- Both the left and right subtrees must also be binary search trees.`,
    inputFormat: 'A binary tree root node representation as a nested dict: `{"val": 5, "left": {"val": 3}, "right": {"val": 8}}`',
    outputFormat: 'Return True if valid BST, otherwise False',
    sampleInput: 'root = {"val": 5, "left": {"val": 3, "left": None, "right": None}, "right": {"val": 8, "left": None, "right": None}}',
    sampleOutput: 'True',
    starterCode: `def is_valid_bst(root):
    """
    Validate whether the given binary tree is a valid BST.
    root is a dict: {'val': int, 'left': dict or None, 'right': dict or None} or None
    """
    def validate(node, low=float('-inf'), high=float('inf')):
        if not node:
            return True
        if not (low < node['val'] < high):
            return False
        return (validate(node.get('left'), low, node['val']) and 
                validate(node.get('right'), node['val'], high))
                
    return validate(root)

# Test execution:
test_tree = {
    'val': 10,
    'left': {'val': 5, 'left': {'val': 2}, 'right': {'val': 7}},
    'right': {'val': 15, 'left': {'val': 12}, 'right': {'val': 20}}
}
print(f"Is valid BST: {is_valid_bst(test_tree)}")
`,
    testCases: [
      {
        input: '{"val": 10, "left": {"val": 5}, "right": {"val": 15}}',
        expectedOutput: 'True'
      },
      {
        input: '{"val": 10, "left": {"val": 12}, "right": {"val": 15}}',
        expectedOutput: 'False'
      }
    ],
    solutionExplanation: 'Use depth-first search with upper and lower bounding constraints carried through recursive invocations in O(n) time and O(h) recursion stack space.'
  },
  {
    id: 'prob-02',
    title: 'Dijkstra Shortest Path Matrix Implementation',
    difficulty: 'Hard',
    category: 'Algorithms',
    description: `Implement Dijkstra's Single Source Shortest Path algorithm on a directed weighted graph represented as an adjacency matrix.
    
Compute the shortest path distance from a specified source vertex (0) to all other vertices in the graph. If a vertex is unreachable, return infinity (\`float('inf')\`).`,
    inputFormat: 'Adjacency matrix graph (2D list) and source vertex integer',
    outputFormat: 'List of shortest distances from source to every vertex [dist_0, dist_1, ...]',
    sampleInput: 'graph = [[0, 4, 2], [4, 0, 1], [2, 1, 0]], src = 0',
    sampleOutput: '[0, 3, 2]',
    starterCode: `import heapq

def dijkstra_shortest_path(graph, src):
    """
    Computes shortest distances from src to all vertices.
    graph: 2D list where graph[u][v] is edge weight (0 if no edge)
    """
    V = len(graph)
    distances = [float('inf')] * V
    distances[src] = 0
    pq = [(0, src)] # (distance, vertex)
    
    while pq:
        curr_dist, u = heapq.heappop(pq)
        
        if curr_dist > distances[u]:
            continue
            
        for v in range(V):
            weight = graph[u][v]
            if weight > 0:
                new_dist = curr_dist + weight
                if new_dist < distances[v]:
                    distances[v] = new_dist
                    heapq.heappush(pq, (new_dist, v))
                    
    return distances

# Run example:
matrix = [
    [0, 10, 3, 0],
    [0, 0, 1, 2],
    [0, 4, 0, 8],
    [0, 0, 0, 0]
]
print("Shortest distances from source 0:", dijkstra_shortest_path(matrix, 0))
`,
    testCases: [
      {
        input: 'graph = [[0, 2, 4], [0, 0, 1], [0, 0, 0]], src = 0',
        expectedOutput: '[0, 2, 3]'
      }
    ],
    solutionExplanation: 'Utilize a priority queue (min-heap) to greedily expand the minimum distance unsettled vertex, maintaining edge relaxation logic.'
  },
  {
    id: 'prob-03',
    title: 'Relational Schema Functional Dependency Closure',
    difficulty: 'Medium',
    category: 'Data Engineering',
    description: `Write a Python utility \`compute_attribute_closure(attributes, functional_dependencies, target_attrs)\` to compute the attribute closure (X+) under a given set of Functional Dependencies (FDs).
    
Attributes and FDs are crucial for 3NF and BCNF normalization proofs.`,
    inputFormat: 'attributes: set of strings, FDs: list of tuples (determinant_set, dependent_set), target: set',
    outputFormat: 'Alphabetically sorted list of all attributes in target+',
    sampleInput: 'attrs = {"A", "B", "C", "D"}, FDs = [({"A"}, {"B"}), ({"B"}, {"C"})], target = {"A"}',
    sampleOutput: '["A", "B", "C"]',
    starterCode: `def compute_attribute_closure(all_attrs, fds, target_attrs):
    """
    all_attrs: set of attribute names
    fds: list of (set(determinants), set(dependents))
    target_attrs: set of attributes to find closure for
    """
    closure = set(target_attrs)
    changed = True
    
    while changed:
        changed = False
        for lhs, rhs in fds:
            if lhs.issubset(closure) and not rhs.issubset(closure):
                closure.update(rhs)
                changed = True
                
    return sorted(list(closure))

# Example: Schema R(A, B, C, D, E) with F = {A -> B, B -> C, CD -> E}
fds = [
    ({'A'}, {'B'}),
    ({'B'}, {'C'}),
    ({'C', 'D'}, {'E'})
]
print("Closure of {A, D}:", compute_attribute_closure({'A','B','C','D','E'}, fds, {'A', 'D'}))
`,
    testCases: [
      {
        input: 'target = {"A"} with A->B and B->C',
        expectedOutput: "['A', 'B', 'C']"
      }
    ],
    solutionExplanation: 'Iteratively augment the closure set using Armstrong’s transitivity and augmentation rules until a fixed point is reached.'
  },
  {
    id: 'prob-04',
    title: 'Python Decorator for Execution Timing & Memoization',
    difficulty: 'Medium',
    category: 'Core Python',
    description: `Implement a parameterized Python decorator \`@cache_and_log\` that memoizes function output based on input arguments and records execution metrics.`,
    inputFormat: 'Function definition decorated with @cache_and_log',
    outputFormat: 'Cached return values on repeated executions',
    sampleInput: 'fib(10)',
    sampleOutput: '55',
    starterCode: `import time
from functools import wraps

def cache_and_log(func):
    """
    Decorator that caches results in memory and prints execution latency.
    """
    memo = {}
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        key = (args, frozenset(kwargs.items()))
        if key in memo:
            print(f"[CACHE HIT] Returning stored result for {func.__name__}{args}")
            return memo[key]
            
        t0 = time.perf_counter()
        result = func(*args, **kwargs)
        t1 = time.perf_counter()
        
        memo[key] = result
        print(f"[COMPUTED] {func.__name__}{args} in {(t1 - t0)*1000:.4f} ms")
        return result
        
    wrapper.cache_size = lambda: len(memo)
    return wrapper

@cache_and_log
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("fib(8) =", fibonacci(8))
print("fib(8) second call =", fibonacci(8))
`,
    testCases: [
      {
        input: 'fibonacci(8)',
        expectedOutput: '21'
      }
    ],
    solutionExplanation: 'Closures capture a dictionary cache `memo` in the outer enclosing scope while preserving function metadata via `functools.wraps`.'
  }
];

export const LEARNING_MATERIALS: LearningMaterial[] = [
  {
    id: 'mat-01',
    title: 'Discrete Mathematics: Complete Graph Theory & Trees Lecture Notes',
    subjectCode: '435C1A',
    subjectName: 'Discrete Mathematics',
    unit: 4,
    category: 'Lecture Notes',
    fileFormat: 'PDF',
    fileSize: '4.2 MB',
    uploadDate: '2026-10-18',
    downloadCount: 142,
    summary: 'Exhaustive notes covering Eulerian & Hamiltonian paths, Planar graph proofs, Kuratowski theorem, and tree spanning algorithms.',
    content: `# Discrete Mathematics: Unit IV - Graph Theory & Trees

## 1. Graph Fundamentals
A graph G = (V, E) consists of a non-empty set of vertices V and a set of edges E.

### Handshaking Theorem
Sum of degrees of all vertices equals twice the number of edges:
∑ deg(v) = 2|E|

### Consequence
In any graph, the number of vertices with odd degree is always even.

## 2. Eulerian vs Hamiltonian Paths
- **Eulerian Path**: A trail that visits every *edge* exactly once. Exists iff graph has 0 or 2 vertices of odd degree.
- **Eulerian Circuit**: Closed trail visiting every edge once. Exists iff all vertices have even degree.
- **Hamiltonian Path**: Visits every *vertex* exactly once. NP-complete decision problem.

## 3. Planar Graphs & Euler's Formula
For any connected planar graph drawn in the plane:
V - E + F = 2
Where F is the number of faces (regions including external unbounded region).`
  },
  {
    id: 'mat-02',
    title: 'DSA Comprehensive Lab Manual: Trees, Heaps and Graphs in C & Python',
    subjectCode: '435C1B',
    subjectName: 'Data Structures and Algorithms',
    unit: 2,
    category: 'Lab Manual',
    fileFormat: 'PDF',
    fileSize: '6.8 MB',
    uploadDate: '2026-10-24',
    downloadCount: 189,
    summary: 'Step-by-step laboratory exercises with C and Python implementations of AVL rotations, Min/Max Binary Heaps, and Dijkstra graphs.',
    content: `# Data Structures and Algorithms Laboratory Manual
## MCA Semester 1 - Practical Course

### Experiment 4: Self-Balancing AVL Trees
An AVL tree maintains height balance such that for any node:
Balance Factor = Height(LeftSubtree) - Height(RightSubtree) ∈ {-1, 0, 1}

#### Rotation Classifications:
1. **LL Rotation**: Single right rotation around node Z
2. **RR Rotation**: Single left rotation around node Z
3. **LR Rotation**: Double rotation (Left on child, Right on parent)
4. **RL Rotation**: Double rotation (Right on child, Left on parent)

### Experiment 5: Graph Traversals (BFS & DFS)
- **BFS (Breadth-First Search)**: Uses FIFO Queue; computes unweighted shortest path. Time complexity: O(V + E).
- **DFS (Depth-First Search)**: Uses LIFO Stack / Recursion; topological sort for DAGs.`
  },
  {
    id: 'mat-03',
    title: 'Data Engineering: Relational Normalization (1NF to BCNF) Master Sheet',
    subjectCode: '435E1A',
    subjectName: 'Data Engineering and Management',
    unit: 2,
    category: 'Reference Sheet',
    fileFormat: 'PDF',
    fileSize: '3.1 MB',
    uploadDate: '2026-10-12',
    downloadCount: 215,
    summary: 'Clear formulas, decomposition algorithms, Armstrong axioms, and normal form validation criteria.',
    content: `# Database Normalization Guide: 1NF to BCNF

## 1. Normal Forms Hierarchy
1NF ⊂ 2NF ⊂ 3NF ⊂ BCNF ⊂ 4NF

### 1NF (First Normal Form)
- All attributes must have atomic values (no multivalued or composite attributes).

### 2NF (Second Normal Form)
- In 1NF + No partial dependency.
- Every non-prime attribute must be fully functionally dependent on every candidate key.

### 3NF (Third Normal Form)
- In 2NF + No transitive dependency.
- For every non-trivial FD X -> A:
  Either X is a superkey OR A is a prime attribute.

### BCNF (Boyce-Codd Normal Form)
- Stricter version of 3NF.
- For every non-trivial FD X -> A:
  X MUST be a superkey. Eliminates anomalies where a prime attribute is dependent on a non-superkey.`
  },
  {
    id: 'mat-04',
    title: 'Python Metaprogramming, Closures & Dunder Methods Guide',
    subjectCode: '435C1C',
    subjectName: 'Python Programming',
    unit: 3,
    category: 'Lecture Notes',
    fileFormat: 'PDF',
    fileSize: '5.5 MB',
    uploadDate: '2026-11-01',
    downloadCount: 230,
    summary: 'In-depth guide to Python object model, descriptor protocol, abstract base classes, and C3 method resolution order.',
    content: `# Advanced Python Architecture & OOP

## 1. Python Data Model
Python's core is powered by special "dunder" (double underscore) methods.
- Collection emulation: \`__len__\`, \`__getitem__\`, \`__setitem__\`, \`__contains__\`
- Arithmetic operators: \`__add__\`, \`__sub__\`, \`__mul__\`, \`__matmul__\`
- Context managers: \`__enter__\`, \`__exit__\`

## 2. Descriptor Protocol
A descriptor is an object attribute with binding behavior controlled by:
- \`__get__(self, instance, owner)\`
- \`__set__(self, instance, value)\`
- \`__delete__(self, instance)\`
This is how \`@property\`, class methods, and ORM columns function under the hood.`
  },
  {
    id: 'mat-05',
    title: 'Question Bank: Previous 5 Years MCA Semester 1 Examinations',
    subjectCode: '435C1B',
    subjectName: 'Data Structures and Algorithms',
    unit: 5,
    category: 'Question Bank',
    fileFormat: 'PDF',
    fileSize: '8.4 MB',
    uploadDate: '2026-09-30',
    downloadCount: 310,
    summary: 'Consolidated end-semester examination papers with step-by-step model solutions and marking schemes.',
    content: `# Question Bank: MCA Semester 1 Model Papers

## Section A (Short Answer - 2 Marks Each)
1. Differentiate between Big-O and Big-Theta asymptotic notations.
2. What are the advantages of B+ Trees over B Trees in database indexing?
3. State Lagrange's theorem in group theory.
4. Explain the significance of the GIL (Global Interpreter Lock) in CPython.

## Section B (Long Answer - 10 Marks Each)
1. Construct an AVL tree by inserting the following sequence: 40, 20, 10, 25, 30, 22, 50. Illustrate each rotation.
2. Given relational schema R(A, B, C, D, E) with F = {A->BC, CD->E, B->D, E->A}:
   (a) Find all candidate keys of R.
   (b) Determine the highest normal form of R.`
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Accounts',
    question: 'How do I log in to the MCA Academic Portal?',
    answer: 'Enter your registered Student ID (e.g., MCA2401) or university username along with your institutional password. For development testing, demo credentials for Devanath N (MCA2401) and cohort peers can be selected from the demo switcher.'
  },
  {
    id: 'faq-2',
    category: 'Curriculum',
    question: 'What are the four core subjects included in MCA Semester 1?',
    answer: 'Semester 1 comprises four structured courses: Discrete Mathematics (435C1A - 4 Credits), Data Structures and Algorithms (435C1B - 4 Credits), Data Engineering and Management (435E1A - 3 Credits), and Python Programming (435C1C - 4 Credits).'
  },
  {
    id: 'faq-3',
    category: 'Examinations',
    question: 'How does the online examination and instant grading system operate?',
    answer: 'Assessments feature timed sessions with a visual question navigator palette. Upon completing and submitting the assessment, your responses are evaluated against the verified answer key, calculating your score and providing detailed rationales for every question.'
  },
  {
    id: 'faq-4',
    category: 'Coding Lab',
    question: 'Can I execute and test Python code directly in the browser?',
    answer: 'Yes! The integrated Python Coding Lab features an interactive code editor with syntax highlighting, starter algorithms, sample inputs, and test cases covering BST validation, Dijkstra graphs, functional dependencies, and closures.'
  },
  {
    id: 'faq-5',
    category: 'Materials',
    question: 'How do bookmarks work across learning resources and question banks?',
    answer: 'You can click the bookmark icon on any lecture note, lab manual, or coding problem. Bookmarked items are stored in your student session and easily accessible via the Bookmarks tab.'
  },
  {
    id: 'faq-6',
    category: 'Reports',
    question: 'Can I generate and download official Semester 1 academic progress reports?',
    answer: 'Yes, the Academic Reports module calculates your current SGPA, projected credits, course grades, and provides instant options to print, generate a formal PDF grade sheet, or export data in CSV format.'
  }
];

export * from './pdfLearningData';
export * from './assignmentData';
export * from './notificationData';
export * from './smartCampusData';
