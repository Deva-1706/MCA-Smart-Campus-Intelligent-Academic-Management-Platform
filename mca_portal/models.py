from django.db import models
from django.contrib.auth.models import User

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='studentprofile')
    student_id = models.CharField(max_length=20, unique=True)
    roll_number = models.CharField(max_length=30, default='P26CA125')
    enrollment_year = models.PositiveIntegerField(default=2024)
    batch = models.CharField(max_length=50, default='MCA 2024–2026')
    semester = models.PositiveIntegerField(default=1)
    current_sgpa = models.DecimalField(max_digits=4, decimal_places=2, default=8.85)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=92.40)
    advisor_name = models.CharField(max_length=120, default='HCASICAN')

    def __str__(self):
        return f"{self.roll_number} ({self.student_id}) - {self.user.get_full_name() or self.user.username}"

class Subject(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    credits = models.PositiveIntegerField(default=4)
    course_type = models.CharField(max_length=50, default='Core')
    instructor = models.CharField(max_length=120)
    description = models.TextField()

    def __str__(self):
        return f"{self.code} - {self.name}"

class SubjectPDF(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='pdfs')
    title = models.CharField(max_length=200)
    file_name = models.CharField(max_length=200)
    unit = models.PositiveIntegerField(default=1)
    chapter = models.CharField(max_length=200)
    uploaded_by = models.CharField(max_length=120, default='Faculty Administrator')
    upload_date = models.DateField(auto_now_add=True)
    ocr_applied = models.BooleanField(default=True)
    ocr_confidence = models.DecimalField(max_digits=5, decimal_places=2, default=99.20)
    processing_status = models.CharField(max_length=30, default='Completed')
    page_count = models.PositiveIntegerField(default=50)

    def __str__(self):
        return f"{self.subject.code} - {self.title}"

class Assignment(models.Model):
    GENERATION_CHOICES = [
        ('Topic-Based', 'Topic-Based'),
        ('Difficulty-Based', 'Difficulty-Based'),
        ('Question-Type', 'Question-Type'),
        ('Randomized', 'Randomized'),
        ('Learning Outcome-Based', 'Learning Outcome-Based'),
    ]
    title = models.CharField(max_length=200)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    unit = models.PositiveIntegerField(default=1)
    chapter = models.CharField(max_length=200)
    topic = models.CharField(max_length=200)
    generation_method = models.CharField(max_length=50, choices=GENERATION_CHOICES, default='Topic-Based')
    generated_by = models.CharField(max_length=50, default='Gemini 3.8 Flash AI Provider')
    total_marks = models.PositiveIntegerField(default=30)
    difficulty = models.CharField(max_length=20, default='Medium')
    due_date = models.DateField()
    duration_minutes = models.PositiveIntegerField(default=60)
    status = models.CharField(max_length=30, default='Not Started')

    def __str__(self):
        return f"{self.subject.code} - {self.title}"

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='assignment_submissions')
    submitted_at = models.DateTimeField(auto_now_add=True)
    answers_json = models.JSONField(default=dict)
    marks_obtained = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, default='')
    status = models.CharField(max_length=30, default='Submitted')

    class Meta:
        indexes = [
            models.Index(fields=['student', '-submitted_at'], name='idx_subm_student_date'),
            models.Index(fields=['assignment', 'status'], name='idx_subm_assign_status'),
        ]

    def __str__(self):
        return f"{self.student.roll_number} - {self.assignment.title}"

class Examination(models.Model):
    title = models.CharField(max_length=200)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='examinations')
    duration_minutes = models.PositiveIntegerField(default=30)
    total_marks = models.PositiveIntegerField(default=30)
    passing_marks = models.PositiveIntegerField(default=15)
    due_date = models.DateField()

    def __str__(self):
        return self.title

class ExaminationResult(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='results')
    examination = models.ForeignKey(Examination, on_delete=models.CASCADE)
    score = models.PositiveIntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', '-submitted_at'], name='idx_examres_student_date'),
        ]

class CodingProblem(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20, default='Medium')
    description = models.TextField()
    starter_code = models.TextField()

class LearningMaterial(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200)
    unit = models.PositiveIntegerField(default=1)
    category = models.CharField(max_length=50, default='Lecture Notes')
    summary = models.TextField()
    file_path = models.FileField(upload_to='materials/', null=True, blank=True)
    upload_date = models.DateField(auto_now_add=True)

class StudentNotification(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=50, default='Assignment')
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    action_page = models.CharField(max_length=50, default='assignments')

    class Meta:
        indexes = [
            models.Index(fields=['student', 'read', '-created_at'], name='idx_notif_student_read'),
        ]

    def __str__(self):
        return f"{self.student.roll_number}: {self.title}"

class ContactTicket(models.Model):
    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# -------------------------------------------------------------
# NEW MODULES: ACHIEVEMENTS,
# PRACTICE ARENA, FLASHCARDS, CALENDAR & IMPORTANT NOTICES
# -------------------------------------------------------------

class AchievementRecord(models.Model):
    CATEGORY_CHOICES = [
        ('Coding Lab', 'Coding Lab'),
        ('Quiz & Exam', 'Quiz & Exam'),
        ('Assignment', 'Assignment'),
        ('Curriculum', 'Curriculum'),
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='Curriculum')
    description = models.TextField()
    metric_label = models.CharField(max_length=120)
    certificate_eligible = models.BooleanField(default=False)
    certificate_code = models.CharField(max_length=64, blank=True, default='')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'title')

    def __str__(self):
        return f"{self.student.roll_number} - {self.title}"


class PracticeAttempt(models.Model):
    MODE_CHOICES = [
        ('Standard', 'Standard'),
        ('Timed Quiz', 'Timed Quiz'),
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='practice_attempts')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='practice_attempts')
    topic = models.CharField(max_length=200)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='Standard')
    difficulty = models.CharField(max_length=20, default='Mixed')
    total_questions = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    score_percent = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    duration_seconds = models.PositiveIntegerField(default=0)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']


class FlashcardDeck(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='flashcard_decks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='flashcard_decks')
    source_pdf = models.ForeignKey(SubjectPDF, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.PositiveIntegerField(default=1)
    topic = models.CharField(max_length=200)
    title = models.CharField(max_length=220)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class Flashcard(models.Model):
    STATUS_CHOICES = [
        ('Unseen', 'Unseen'),
        ('Known', 'Known'),
        ('Need Revision', 'Need Revision'),
    ]
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE, related_name='cards')
    question = models.TextField()
    answer = models.TextField()
    topic = models.CharField(max_length=200)
    unit = models.PositiveIntegerField(default=1)
    source_page_ref = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Unseen')


class AcademicCalendarEvent(models.Model):
    CATEGORY_CHOICES = [
        ('Assignment', 'Assignment'),
        ('Examination', 'Examination'),
        ('Academic Event', 'Academic Event'),
        ('General Notice', 'General Notice'),
        ('Study Reminder', 'Study Reminder'),
    ]
    title = models.CharField(max_length=200)
    event_date = models.DateField()
    start_time = models.CharField(max_length=20, blank=True, default='')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='Study Reminder')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_personal_reminder = models.BooleanField(default=True)

    class Meta:
        ordering = ['event_date', 'start_time']


class TimetableSlot(models.Model):
    day_of_week = models.CharField(max_length=15)
    start_time = models.CharField(max_length=20)
    end_time = models.CharField(max_length=20)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    room_or_lab = models.CharField(max_length=100, blank=True, default='')
    faculty = models.CharField(max_length=120, blank=True, default='')


class ImportantNotice(models.Model):
    PRIORITY_CHOICES = [
        ('Normal', 'Normal'),
        ('Important', 'Important'),
        ('Urgent', 'Urgent'),
    ]
    CATEGORY_CHOICES = [
        ('Academic Notice', 'Academic Notice'),
        ('Examination Notice', 'Examination Notice'),
        ('Assignment Notice', 'Assignment Notice'),
        ('General Announcement', 'General Announcement'),
        ('Important Deadline', 'Important Deadline'),
    ]
    title = models.CharField(max_length=220)
    description = models.TextField()
    publication_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Normal')
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default='Academic Notice')
    attachment = models.FileField(upload_to='notices/', null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    read_by = models.ManyToManyField(User, related_name='read_notices', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-publication_date', '-created_at']
        indexes = [
            models.Index(fields=['is_published', 'expiry_date'], name='idx_notice_pub_exp'),
            models.Index(fields=['priority', '-publication_date'], name='idx_notice_prio_pub'),
        ]

    @classmethod
    def active_published(cls):
        from django.utils import timezone
        from django.db.models import Q
        today = timezone.localdate()
        return cls.objects.filter(is_published=True).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
        )

    def __str__(self):
        return f"[{self.priority}] {self.title}"


class GeneratedStudyNote(models.Model):
    MODE_CHOICES = [
        ('Detailed Notes', 'Detailed Notes'),
        ('2-Mark Questions', '2-Mark Questions'),
        ('5-Mark Questions', '5-Mark Questions'),
        ('10-Mark Questions', '10-Mark Questions'),
        ('Solved Examples', 'Solved Examples'),
        ('Revision Notes', 'Revision Notes'),
    ]

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='study_notes')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='study_notes')
    source_pdf = models.ForeignKey(SubjectPDF, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.PositiveIntegerField(default=1)
    topic = models.CharField(max_length=220)
    subtopic = models.CharField(max_length=220, blank=True, default='')
    mode = models.CharField(max_length=30, choices=MODE_CHOICES, default='Detailed Notes')
    title = models.CharField(max_length=280)
    sections_json = models.JSONField(default=list)
    summary = models.TextField(blank=True, default='')
    important_points_json = models.JSONField(default=list)
    source_pdfs = models.JSONField(default=list)
    page_citations = models.JSONField(default=list)
    is_pdf_sufficient = models.BooleanField(default=True)
    supplementary_notice = models.TextField(blank=True, default='')
    is_completed = models.BooleanField(default=False)
    is_bookmarked = models.BooleanField(default=False)
    needs_revision = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.roll_number} | {self.subject.code} | {self.mode}: {self.title}"


# -------------------------------------------------------------
# MCA SMART CAMPUS: ROLE PROFILES, GOVERNANCE & 8 GROWTH MODULES
# -------------------------------------------------------------

class RoleProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('faculty', 'Faculty'),
        ('student', 'Student'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='roleprofile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    institutional_id = models.CharField(max_length=32, unique=True)
    is_active = models.BooleanField(default=True)
    must_change_password = models.BooleanField(default=False)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    department = models.CharField(max_length=150, default='Department of Computer Applications')
    designation = models.CharField(max_length=150, blank=True, default='')
    faculty_permissions_json = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.institutional_id} ({self.role}) - {self.user.username}"


class LoginAttempt(models.Model):
    identifier = models.CharField(max_length=150, db_index=True)
    ip_address = models.CharField(max_length=64, default='127.0.0.1')
    failed_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('identifier', 'ip_address')

    def __str__(self):
        return f"{self.identifier}@{self.ip_address} ({self.failed_attempts} failures)"


class Programme(models.Model):
    code = models.CharField(max_length=20, unique=True, default='MCA')
    name = models.CharField(max_length=180, default='Master of Computer Applications')
    total_semesters = models.PositiveIntegerField(default=4)

    def __str__(self):
        return f"{self.code} - {self.name}"


class AcademicYear(models.Model):
    label = models.CharField(max_length=32, unique=True)
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return self.label


class Semester(models.Model):
    number = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    is_configured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Semester {self.number}: {self.title}"


class FacultyAllocation(models.Model):
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subject_allocations')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='faculty_allocations')
    permissions_json = models.JSONField(default=list)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('faculty', 'subject')

    def __str__(self):
        return f"{self.faculty.username} -> {self.subject.code}"


class QuestionBankItem(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='question_bank')
    unit = models.PositiveIntegerField(default=1)
    topic = models.CharField(max_length=200)
    question_type = models.CharField(max_length=40, default='MCQ')
    prompt = models.TextField()
    options_json = models.JSONField(default=list)
    answer = models.TextField()
    difficulty = models.CharField(max_length=20, default='Medium')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class SkillEvidence(models.Model):
    STATUS_CHOICES = [
        ('Pending Review', 'Pending Review'),
        ('Verified', 'Verified'),
        ('Needs Improvement', 'Needs Improvement'),
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='skill_evidences')
    domain = models.CharField(max_length=100)
    title = models.CharField(max_length=220)
    evidence_url = models.CharField(max_length=400, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Pending Review')
    awarded_points = models.PositiveIntegerField(default=0)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'status'], name='idx_skill_student_status'),
        ]


class StudentProject(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Under Review', 'Under Review'),
        ('Verified', 'Verified'),
        ('Needs Revision', 'Needs Revision'),
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='projects')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=220)
    summary = models.TextField()
    github_url = models.CharField(max_length=400, blank=True, default='')
    demo_url = models.CharField(max_length=400, blank=True, default='')
    milestones_json = models.JSONField(default=list)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Draft')
    showcase_approved = models.BooleanField(default=False)
    evaluation_score = models.PositiveIntegerField(null=True, blank=True)
    faculty_feedback = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'status'], name='idx_proj_student_status'),
            models.Index(fields=['showcase_approved'], name='idx_proj_showcase'),
        ]


class KnowledgeEdge(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='knowledge_edges')
    source_node = models.CharField(max_length=150)
    target_node = models.CharField(max_length=150)
    relationship = models.CharField(max_length=80, default='prerequisite_of')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)


class Challenge(models.Model):
    title = models.CharField(max_length=220)
    category = models.CharField(max_length=60, default='Timed Coding')
    difficulty = models.CharField(max_length=20, default='Medium')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='challenges')
    duration_minutes = models.PositiveIntegerField(default=20)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)


class ChallengeAttempt(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='challenge_attempts')
    score = models.PositiveIntegerField(default=0)
    passed = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'challenge'], name='idx_chal_student_chal'),
        ]


class IssuedCertificate(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='issued_certificates')
    title = models.CharField(max_length=220)
    certificate_code = models.CharField(max_length=64, unique=True)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, default='system')
    action = models.CharField(max_length=160)
    target = models.CharField(max_length=220, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['role', '-timestamp'], name='idx_audit_role_ts'),
            models.Index(fields=['actor', '-timestamp'], name='idx_audit_actor_ts'),
        ]
