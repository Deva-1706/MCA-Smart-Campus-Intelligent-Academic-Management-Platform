import { GeneratedStudyNote } from '../types';

export const INITIAL_GENERATED_STUDY_NOTES: GeneratedStudyNote[] = [
  {
    id: 'note-seed-435C1A-u1',
    studentId: 'MCA2401',
    subjectCode: '435C1A',
    subjectName: 'Discrete Mathematics',
    unit: 1,
    topic: 'Propositional Logic & Normal Forms',
    subtopic: 'CNF, DNF & Logical Equivalence Derivations',
    mode: 'Detailed Notes',
    title: 'Propositional Logic, Normal Forms (CNF/DNF) & Truth-Preserving Derivations',
    createdAt: '2026-11-05',
    updatedAt: '2026-11-05',
    sourcePdfIds: ['pdf-dm-01'],
    sourcePdfTitles: ['MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf'],
    sourcePageCitations: [12, 21],
    isPdfSufficient: true,
    supplementaryNotice: 'Primary definitions and normal form clauses are cited directly from MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf [Pages 12, 21]; full algebraic conversion derivations and 10-mark exam solutions are provided as AI Supplementary Academic Content.',
    summary: 'Propositional logic formalizes declarative statements using atomic variables and Boolean connectives (¬, ∧, ∨, ⇒, ⇔). Conjunctive Normal Form (CNF) and Disjunctive Normal Form (DNF) provide canonical representations required for SAT solvers, automated theorem proving, and resolution refutation.',
    importantPoints: [
      'A compound proposition is in CNF iff it is a conjunction of disjunctions of literals.',
      'A compound proposition is in DNF iff it is a disjunction of conjunctions of literals.',
      'Principal CNF (PCNF) consists strictly of maxterms; Principal DNF (PDNF) consists strictly of minterms.',
      'Eliminate conditionals via (p ⇒ q) ≡ (¬p ∨ q) and biconditionals via (p ⇔ q) ≡ (p ⇒ q) ∧ (q ⇒ p) before applying De Morgan laws.',
      'By the Handshaking / Truth-Table duality, a formula is a tautology iff every clause in its CNF contains a complementary literal pair (p ∨ ¬p).'
    ],
    completed: false,
    bookmarked: false,
    markedForRevision: false,
    savedToAccount: true,
    providerUsed: 'PDF Knowledge Baseline',
    sections: [
      {
        id: 'sec-dm-1',
        heading: '1. Learning Objectives & Formal Definitions',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `By completing this topic, a postgraduate scholar will be able to:
- Translate natural-language specifications into well-formed propositional formulas (WFFs).
- Apply equivalence laws to reduce arbitrary formulas into **Conjunctive Normal Form (CNF)** and **Disjunctive Normal Form (DNF)**.
- Verify tautologies, contradictions, and logical consequences algebraically without full $2^n$ truth-table enumeration.

**Fundamental Definition (CNF & DNF):**
A **literal** is either an atomic proposition $p$ or its negation $\\neg p$.
- A **Conjunctive Normal Form (CNF)** expression is a conjunction of one or more **clauses**, where each clause is a disjunction of literals: $C_1 \\land C_2 \\land \\dots \\land C_k$.
- A **Disjunctive Normal Form (DNF)** expression is a disjunction of **fundamental conjunctions** (minterms/terms): $T_1 \\lor T_2 \\lor \\dots \\lor T_m$.`,
        formulaBox: 'CNF: ⋀_i (⋁_j L_{i,j})    |    DNF: ⋁_i (⋀_j L_{i,j})    |    (p ⇒ q) ≡ (¬p ∨ q)',
        citations: [{ pdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf', pageNumber: 12 }],
      },
      {
        id: 'sec-dm-2',
        heading: '2. Step-by-Step Conversion Algorithm & Algebraic Laws',
        sourceType: 'AI-Supplementary',
        contentMarkdown: `To convert any arbitrary propositional formula into CNF cleanly during university examinations:

1. **Eliminate ⇒ and ⇔:** Replace $(A \\Leftrightarrow B)$ with $(A \\Rightarrow B) \\land (B \\Rightarrow A)$, then replace $(A \\Rightarrow B)$ with $(\\neg A \\lor B)$.
2. **Push Negations Inward (NNF):** Apply Double Negation $(\\neg\\neg A \\equiv A)$ and De Morgan's Laws:
   - $\\neg(A \\land B) \\equiv (\\neg A \\lor \\neg B)$
   - $\\neg(A \\lor B) \\equiv (\\neg A \\land \\neg B)$
3. **Distribute Disjunction over Conjunction:** Apply $A \\lor (B \\land C) \\equiv (A \\lor B) \\land (A \\lor C)$ until no disjunction encloses a conjunction.`,
        diagramText: `Input Formula P
      │
      ▼  [Step 1] Eliminate ⇔ and ⇒ using (¬A ∨ B)
      │
      ▼  [Step 2] Apply De Morgan's Laws until ¬ applies ONLY to atoms
      │           (Negation Normal Form)
      ▼  [Step 3] Distribute ∨ over ∧  ──►  Conjunctive Normal Form (CNF)`,
      },
      {
        id: 'sec-dm-3',
        heading: '3. Solved Derivation Example (University Examination Standard)',
        sourceType: 'AI-Supplementary',
        contentMarkdown: `**Problem:** Obtain the Conjunctive Normal Form (CNF) and Principal CNF (PCNF) of:
$$P \\equiv (p \\Rightarrow q) \\land (\\neg p \\lor r)$$

**Step-by-Step Derivation:**
1. Eliminate the conditional connective $(p \\Rightarrow q)$:
   $$(p \\Rightarrow q) \\land (\\neg p \\lor r) \\equiv (\\neg p \\lor q) \\land (\\neg p \\lor r)$$
   Notice this expression is already a conjunction of two clauses, so **CNF** $= (\\neg p \\lor q) \\land (\\neg p \\lor r)$.
2. Expand each clause to include all variables $\\{p, q, r\\}$ using $A \\equiv A \\lor (x \\land \\neg x)$:
   - Clause 1: $(\\neg p \\lor q) \\equiv (\\neg p \\lor q) \\lor (r \\land \\neg r) \\equiv (\\neg p \\lor q \\lor r) \\land (\\neg p \\lor q \\lor \\neg r)$
   - Clause 2: $(\\neg p \\lor r) \\equiv (\\neg p \\lor r) \\lor (q \\land \\neg q) \\equiv (\\neg p \\lor q \\lor r) \\land (\\neg p \\lor \\neg q \\lor r)$
3. Remove duplicate maxterms via Idempotence ($A \\land A \\equiv A$):
   $$\\text{PCNF} \\equiv (\\neg p \\lor q \\lor r) \\land (\\neg p \\lor q \\lor \\neg r) \\land (\\neg p \\lor \\neg q \\lor r)$$`,
        formulaBox: 'Maxterms M₂ = (¬p ∨ q ∨ r), M₃ = (¬p ∨ q ∨ ¬r), M₆ = (¬p ∨ ¬q ∨ r) ⇒ Π(4, 5, 6)',
      },
      {
        id: 'sec-dm-4',
        heading: '4. Exam-Oriented Questions & Model Answers (2-Mark, 5-Mark & 10-Mark)',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `### 2-Mark Question: Define Conjunctive Normal Form (CNF) with an example. [Page 12]
- **Definition:** A compound proposition is in CNF when expressed as a conjunction of clauses, each clause being a disjunction of literals.
- **Key Points:** Canonical for resolution proofs; uses $\\land$ as outer connective and $\\lor$ as inner connective.
- **Example:** $(p \\lor \\neg q) \\land (\\neg p \\lor r)$.

### 5-Mark Question: Show that $((p \\lor q) \\land \\neg(\\neg p \\land (\\neg q \\lor \\neg r))) \\lor (\\neg p \\land \\neg q) \\lor (\\neg p \\land \\neg r)$ is a Tautology.
1. Simplify $\\neg(\\neg p \\land (\\neg q \\lor \\neg r)) \\equiv p \\lor (q \\land r)$ via De Morgan's Law.
2. Observe $(p \\lor q) \\land (p \\lor (q \\land r)) \\equiv p \\lor (q \\land (q \\land r)) \\equiv p \\lor (q \\land r)$ by Distribution & Absorption.
3. Combine with remaining disjuncts: $(p \\lor (q \\land r)) \\lor \\neg(p \\lor q) \\lor \\neg(p \\lor r) \\equiv T$ because $\\neg(p \\lor q) \\lor \\neg(p \\lor r) \\equiv \\neg((p \\lor q) \\land (p \\lor r)) \\equiv \\neg(p \\lor (q \\land r))$, yielding $X \\lor \\neg X \\equiv \\mathbf{T}$.

### 10-Mark Question: Explain Principal Normal Forms (PDNF & PCNF), Conversion Procedures & Applications in Automated Reasoning.
- **Introduction:** While CNF/DNF forms are not unique for a truth function, **Principal DNF (sum of minterms)** and **Principal CNF (product of maxterms)** are algebraically unique canonical forms for every non-trivial Boolean function over $n$ variables.
- **Structure & Truth-Table Construction:** Each row evaluating to **T** generates a minterm $m_i$ (variable appears unnegated if 1, negated if 0). Each row evaluating to **F** generates a maxterm $M_i$ (inverted polarity).
- **Real-World Applications:** SAT solvers (DPLL & CDCL algorithms require CNF), digital VLSI logic minimization (Karnaugh maps & Quine-McCluskey minimize DNF), and Prolog backward chaining (Horn clauses are a restricted CNF with at most one positive literal).
- **Conclusion:** Canonical normal forms bridge theoretical mathematical logic with automated verification and hardware synthesis.`,
        citations: [{ pdfTitle: 'MCA-435C1A-Unit1-5-Comprehensive-Notes.pdf', pageNumber: 12 }],
      }
    ]
  },
  {
    id: 'note-seed-435C1B-u2',
    studentId: 'MCA2401',
    subjectCode: '435C1B',
    subjectName: 'Data Structures and Algorithms',
    unit: 2,
    topic: 'Binary Search Trees & AVL Height Balancing',
    subtopic: 'Balance Factor & 4-Rotation Rebalancing (LL, RR, LR, RL)',
    mode: 'Detailed Notes',
    title: 'AVL Self-Balancing Binary Search Trees: Invariants, Rotations & Complexity',
    createdAt: '2026-11-05',
    updatedAt: '2026-11-05',
    sourcePdfIds: ['pdf-dsa-02'],
    sourcePdfTitles: ['MCA-435C1B-DSA-Core-Textbook-Reference.pdf'],
    sourcePageCitations: [58, 62],
    isPdfSufficient: true,
    supplementaryNotice: 'Balance factor invariant and rotation taxonomy match MCA-435C1B-DSA-Core-Textbook-Reference.pdf [Pages 58, 62]; full rotation pseudocode, worked insertion trace, and comparison table are added as AI Supplementary Academic Content.',
    summary: 'AVL trees (Adelson-Velsky and Landis) guarantee O(log n) worst-case search, insertion, and deletion by enforcing a strict per-node height balance factor BF ∈ {-1, 0, +1} via single (LL, RR) and double (LR, RL) rotations.',
    importantPoints: [
      'Balance Factor BF(node) = height(left) − height(right) must stay in {-1, 0, +1}.',
      'LL and RR imbalances are fixed with a single rotation (O(1) pointer updates).',
      'LR and RL imbalances require two rotations (child first, then ancestor).',
      'Minimum nodes in an AVL tree of height h satisfies N(h) = N(h−1) + N(h−2) + 1 (Fibonacci bound ⇒ h < 1.44 log₂(n+2)).',
      'Compared to Red-Black trees, AVL trees are more strictly balanced (faster lookups, slightly more rotations on deletion).'
    ],
    completed: false,
    bookmarked: false,
    markedForRevision: false,
    savedToAccount: true,
    providerUsed: 'PDF Knowledge Baseline',
    sections: [
      {
        id: 'sec-dsa-1',
        heading: '1. Definition, Balance Factor & Height Bound',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `An **AVL Tree** is a height-balanced Binary Search Tree (BST) in which the heights of the left and right subtrees of every node differ by at most 1. This invariant prevents the $O(n)$ skewed-chain degeneration observed in ordinary BSTs under sorted insertions.`,
        formulaBox: 'BF(x) = h(x.left) − h(x.right) ∈ {-1, 0, +1}    |    Max Height h ≤ 1.44 · log₂(n + 2)',
        citations: [{ pdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf', pageNumber: 58 }],
      },
      {
        id: 'sec-dsa-2',
        heading: '2. Classification of Imbalances & 4 Rotation Mechanics',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `When inserting or deleting a key causes $|\\text{BF}(z)| = 2$ at the lowest unbalanced ancestor $z$:

| Imbalance Case | Insertion Path from z | Fix Required | Time Complexity |
| :--- | :--- | :--- | :--- |
| **LL (Left-Left)** | Left child → Left subtree | Single Right Rotation on $z$ | $O(1)$ |
| **RR (Right-Right)** | Right child → Right subtree | Single Left Rotation on $z$ | $O(1)$ |
| **LR (Left-Right)** | Left child → Right subtree | Left Rotate($z.\\text{left}$), then Right Rotate($z$) | $O(1)$ |
| **RL (Right-Left)** | Right child → Left subtree | Right Rotate($z.\\text{right}$), then Left Rotate($z$) | $O(1)$ |`,
        diagramText: `LL Single Right Rotation:          LR Double Rotation:
      z (+2)                           z (+2)
     /                                /
    y (+1)      ══►     y (0)        y (-1)     ══► Left(y) ══► Right(z) ══►    x (0)
   /                   /     \\        \\                                         /     \\
  x (0)               x       z        x (0)                                   y       z`,
        citations: [{ pdfTitle: 'MCA-435C1B-DSA-Core-Textbook-Reference.pdf', pageNumber: 62 }],
      },
      {
        id: 'sec-dsa-3',
        heading: '3. Pseudocode & Python Implementation',
        sourceType: 'AI-Supplementary',
        contentMarkdown: `Each rotation updates exactly 2 child pointers and recalculates heights bottom-up in $O(1)$ time:`,
        codeSnippet: {
          language: 'python',
          code: `class Node:
    def __init__(self, key):
        self.key = key
        self.left = self.right = None
        self.height = 1

def height(n):
    return n.height if n else 0

def right_rotate(z):
    y = z.left
    T3 = y.right
    y.right = z
    z.left = T3
    z.height = 1 + max(height(z.left), height(z.right))
    y.height = 1 + max(height(y.left), height(y.right))
    return y`,
          output: `Insert [30, 20, 10] -> LL imbalance at 30 -> Right Rotate(30) -> Root=20, Left=10, Right=30 (BF=0)`,
        },
      },
      {
        id: 'sec-dsa-4',
        heading: '4. Complexity Comparison & Real-World Applications',
        sourceType: 'AI-Supplementary',
        contentMarkdown: `- **Search / Insert / Delete:** Guaranteed $\\Theta(\\log n)$ worst-case time; $O(n)$ space.
- **Applications:** In-memory database indexes, compiler symbol tables, and network routing lookup tables where read latency must be tightly bounded.
- **Comparison:** Prefer **AVL Trees** for read-heavy workloads; prefer **Red-Black Trees** (e.g., Java \`TreeMap\`, Linux CFS scheduler) when insertions and deletions outnumber searches.`,
      }
    ]
  },
  {
    id: 'note-seed-435E1A-u1',
    studentId: 'MCA2401',
    subjectCode: '435E1A',
    subjectName: 'Data Engineering and Management',
    unit: 1,
    topic: 'Boyce-Codd Normal Form (BCNF) & Strict 2PL Concurrency',
    subtopic: 'Lossless-Join Decomposition & Precedence Graphs',
    mode: 'Detailed Notes',
    title: 'Database Normalization (BCNF) & Transaction Concurrency (Strict 2PL)',
    createdAt: '2026-11-05',
    updatedAt: '2026-11-05',
    sourcePdfIds: ['pdf-dem-03'],
    sourcePdfTitles: ['MCA-435E1A-Relational-NoSQL-Warehousing.pdf'],
    sourcePageCitations: [24, 44, 48],
    isPdfSufficient: true,
    supplementaryNotice: 'BCNF rule, conflict serializability theorem, and Strict 2PL guarantees derive from MCA-435E1A-Relational-NoSQL-Warehousing.pdf [Pages 24, 44, 48]; SQL decomposition and schedule trace examples are provided as AI Supplementary Academic Content.',
    summary: 'BCNF eliminates redundancy caused by non-trivial functional dependencies whose determinants are not superkeys, while Strict Two-Phase Locking (Strict 2PL) enforces conflict serializability and prevents cascading aborts in concurrent OLTP databases.',
    importantPoints: [
      'BCNF Condition: For every non-trivial FD X → Y in R, X must be a superkey of R.',
      'BCNF decomposition always preserves lossless-join, though dependency preservation is not always guaranteed (unlike 3NF).',
      'A schedule is conflict serializable iff its Precedence Graph contains zero directed cycles.',
      'Strict 2PL holds all Exclusive (X) locks until transaction COMMIT or ABORT.',
      'Basic 2PL guarantees serializability but can still suffer cascading aborts without Strict 2PL.'
    ],
    completed: false,
    bookmarked: false,
    markedForRevision: false,
    savedToAccount: true,
    providerUsed: 'PDF Knowledge Baseline',
    sections: [
      {
        id: 'sec-dem-1',
        heading: '1. Boyce-Codd Normal Form (BCNF) — Formal Rule & Comparison',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `A relation schema $R$ is in **Boyce-Codd Normal Form (BCNF)** if for every functional dependency $X \\rightarrow Y$ that holds on $R$, at least one of the following holds:
1. $Y \\subseteq X$ (trivial functional dependency), OR
2. $X$ is a **superkey** of $R$.

Every BCNF relation is strictly in 3NF, eliminating update, insertion, and deletion anomalies arising from prime-attribute dependencies.`,
        formulaBox: '∀(X → Y) ∈ F⁺:  (Y ⊆ X)  ∨  (X is Superkey of R)   |   BCNF ⊂ 3NF ⊂ 2NF ⊂ 1NF',
        citations: [{ pdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf', pageNumber: 24 }],
      },
      {
        id: 'sec-dem-2',
        heading: '2. Conflict Serializability & Strict Two-Phase Locking (2PL)',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `Two operations in a schedule **conflict** if they belong to different transactions, access the same data item $Q$, and at least one is a **WRITE** ($R(Q)/W(Q)$, $W(Q)/R(Q)$, or $W(Q)/W(Q)$).

- **Precedence Graph Test:** Construct a directed graph with vertices = transactions $\\{T_1, \\dots, T_n\\}$. Add edge $T_i \\rightarrow T_j$ whenever a conflicting operation in $T_i$ precedes one in $T_j$. **Schedule is conflict serializable iff the graph is acyclic (DAG).**
- **Strict 2PL Rule:** Follows Growing Phase (acquire S/X locks, no releases) and Shrinking Phase, **plus holds all Exclusive (X) locks until COMMIT/ABORT**, preventing dirty reads and cascading rollbacks.`,
        diagramText: `Strict 2PL Lock Timeline for Transaction T_i:
Locks Held ▲
           │         ┌── Growing Phase (Acquire S / X Locks)
           │       ┌─┘
           │     ┌─┘          [All X-Locks Retained Until EOT]
           │   ┌─┘                                             │
           └───┴───────────────────────────────────────────────┴──► Time
           Begin                                            COMMIT / ABORT`,
        citations: [
          { pdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf', pageNumber: 44 },
          { pdfTitle: 'MCA-435E1A-Relational-NoSQL-Warehousing.pdf', pageNumber: 48 }
        ],
      },
      {
        id: 'sec-dem-3',
        heading: '3. Practical SQL Schema Normalization Example',
        sourceType: 'AI-Supplementary',
        contentMarkdown: `Consider \`Enrollment(StudentID, CourseCode, FacultyName)\` where \`FacultyName → CourseCode\` (violating BCNF because \`FacultyName\` is not a superkey). Decompose losslessly into:`,
        codeSnippet: {
          language: 'sql',
          code: `CREATE TABLE FacultyCourse (
  FacultyName VARCHAR(100) PRIMARY KEY,
  CourseCode  VARCHAR(12)  NOT NULL
);

CREATE TABLE StudentFaculty (
  StudentID   VARCHAR(16),
  FacultyName VARCHAR(100) REFERENCES FacultyCourse(FacultyName),
  PRIMARY KEY (StudentID, FacultyName)
);`,
          output: 'Lossless Join verified: FacultyCourse ∩ StudentFaculty = {FacultyName}, which is a superkey of FacultyCourse.',
        },
      }
    ]
  },
  {
    id: 'note-seed-435C1C-u1',
    studentId: 'MCA2401',
    subjectCode: '435C1C',
    subjectName: 'Python Programming',
    unit: 1,
    topic: 'Generators, Decorators & CPython Global Interpreter Lock',
    subtopic: 'Lazy Iteration (yield), @functools.wraps & Concurrency',
    mode: 'Detailed Notes',
    title: 'Python Generators, Decorators & CPython GIL Architecture',
    createdAt: '2026-11-05',
    updatedAt: '2026-11-05',
    sourcePdfIds: ['pdf-py-04'],
    sourcePdfTitles: ['MCA-435C1C-Python-Advanced-Computing-Lab.pdf'],
    sourcePageCitations: [18, 24, 74],
    isPdfSufficient: true,
    supplementaryNotice: 'Generator O(1) memory semantics, @functools.wraps metadata preservation, and CPython GIL definition are cited from MCA-435C1C-Python-Advanced-Computing-Lab.pdf [Pages 18, 24, 74]; runnable benchmark scripts and step-by-step execution traces are provided as AI Supplementary Academic Content.',
    summary: 'Generators implement lazy state-machine iteration via yield with O(1) memory, decorators compose cross-cutting behavior while preserving metadata via @functools.wraps, and CPython uses the Global Interpreter Lock (GIL) to serialize bytecode execution across threads.',
    importantPoints: [
      'yield suspends the function stack frame and resumes from the exact bytecode offset on next().',
      'Generators operate in O(1) space compared to O(n) materialized lists.',
      'Always decorate wrappers with @functools.wraps(func) so __name__ and __doc__ remain intact.',
      'The CPython GIL prevents parallel CPU-bound execution in threading; use multiprocessing for CPU-bound tasks.',
      'I/O-bound workloads benefit from threading and AsyncIO because threads release the GIL during blocking I/O.'
    ],
    completed: false,
    bookmarked: false,
    markedForRevision: false,
    savedToAccount: true,
    providerUsed: 'PDF Knowledge Baseline',
    sections: [
      {
        id: 'sec-py-1',
        heading: '1. Generators & Lazy State Suspension (yield)',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `A Python function containing \`yield\` compiles into a **generator factory**. Calling it returns a generator iterator without executing the body until \`next()\` is invoked. Execution pauses at each \`yield\`, preserving local variables and instruction pointer in the heap frame with **$O(1)$ memory footprint**.`,
        formulaBox: 'List Comprehension [x*x for x in range(N)] ⇒ O(N) RAM  |  Generator (x*x for x in range(N)) ⇒ O(1) RAM',
        citations: [{ pdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf', pageNumber: 18 }],
      },
      {
        id: 'sec-py-2',
        heading: '2. Decorators with @functools.wraps & Working Code Example',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `Decorators are higher-order callables that wrap target functions to add logging, authentication, caching, or timing. Using \`@functools.wraps(func)\` copies \`__name__\`, \`__doc__\`, and \`__wrapped__\`.`,
        codeSnippet: {
          language: 'python',
          code: `import functools, time

def trace_calls(unit_tag):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            t0 = time.perf_counter()
            res = fn(*args, **kwargs)
            ms = (time.perf_counter() - t0) * 1000
            print(f"[{unit_tag}] {fn.__name__} -> {res} ({ms:.2f} ms)")
            return res
        return wrapper
    return decorator

@trace_calls("435C1C")
def fibonacci_stream(limit):
    a, b = 0, 1
    for _ in range(limit):
        yield a
        a, b = b, a + b

print(list(fibonacci_stream(6)))`,
          output: `[435C1C] fibonacci_stream -> <generator object> (0.01 ms)\n[0, 1, 1, 2, 3, 5]`,
        },
        citations: [{ pdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf', pageNumber: 24 }],
      },
      {
        id: 'sec-py-3',
        heading: '3. CPython Global Interpreter Lock (GIL) & Concurrency Selection',
        sourceType: 'PDF-Grounded',
        contentMarkdown: `In CPython, memory management uses reference counting on \`PyObject\`. To protect reference counts from race conditions without fine-grained lock overhead, the **GIL** ensures only one OS thread executes Python bytecode at a time.

| Workload Type | Recommended Mechanism | Why? |
| :--- | :--- | :--- |
| **High-Concurrency Network / File I/O** | \`asyncio\` or \`threading\` | GIL is released during OS socket/disk waits. |
| **CPU-Bound Numerical / Matrix Computation** | \`multiprocessing\` / NumPy C-ext | Separate processes bypass GIL across CPU cores. |`,
        citations: [{ pdfTitle: 'MCA-435C1C-Python-Advanced-Computing-Lab.pdf', pageNumber: 74 }],
      }
    ]
  }
];
