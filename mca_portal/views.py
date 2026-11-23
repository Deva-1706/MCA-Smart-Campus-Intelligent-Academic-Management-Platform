import logging
import os
import secrets
from datetime import timedelta
from functools import wraps
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.core.validators import validate_email
from django.contrib import messages
from django.contrib.auth.models import User
from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse
from django.http import FileResponse, Http404, HttpResponseForbidden, HttpResponseNotAllowed, JsonResponse
from django.db.models import Q

from .security import (
    decrypt_cookie_value,
    encrypt_cookie_value,
    execute_python_isolated,
    is_safe_url_for_host,
    safe_date,
    safe_int,
    validate_safe_python_code,
    validate_uploaded_file,
)

logger = logging.getLogger('mca_portal')

from .models import (
    Subject,
    SubjectPDF,
    Assignment,
    AssignmentSubmission,
    Examination,
    ExaminationResult,
    CodingProblem,
    LearningMaterial,
    StudentProfile,
    StudentNotification,
    ContactTicket,
    AchievementRecord,
    PracticeAttempt,
    FlashcardDeck,
    Flashcard,
    AcademicCalendarEvent,
    TimetableSlot,
    ImportantNotice,
    GeneratedStudyNote,
    RoleProfile,
    LoginAttempt,
    Programme,
    AcademicYear,
    Semester,
    FacultyAllocation,
    QuestionBankItem,
    SkillEvidence,
    StudentProject,
    KnowledgeEdge,
    Challenge,
    ChallengeAttempt,
    IssuedCertificate,
    AuditLog,
)
from .services.notes_generator import generate_university_study_note, StudyNoteGenerationError

# Python Coding Lab AST sandbox policy is enforced by mca_portal.security.validate_safe_python_code

ALL_FACULTY_PERMISSIONS = [
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


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()[:64]
    return (request.META.get('REMOTE_ADDR') or '127.0.0.1')[:64]


def _record_audit(request, action, target='', role_override=None, actor_override=None):
    actor = actor_override if actor_override is not None else (
        request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
    )
    resolved_role = role_override or (_get_user_role(actor) if actor else 'anonymous') or 'system'
    AuditLog.objects.create(
        actor=actor,
        role=resolved_role,
        action=action[:160],
        target=str(target or '')[:220],
        ip_address=_get_client_ip(request),
    )


def _get_user_role(user):
    """
    Resolve MCA Smart Campus application role from server-side RoleProfile first,
    then explicit institutional Django Groups ('Admin'/'Administrator', 'Faculty', 'Student'),
    and finally StudentProfile. Technical Django superusers (is_superuser=True without an
    ordinary RoleProfile or explicit portal Group) remain separated from ordinary MCA Smart
    Campus application roles unless explicitly provisioned.
    """
    if not user or not user.is_authenticated:
        return None
    try:
        rp = user.roleprofile
    except RoleProfile.DoesNotExist:
        rp = None
    if rp is not None:
        normalized_role = (rp.role or '').strip().lower()
        if normalized_role in ('student', 'faculty', 'admin'):
            return normalized_role

    group_names = {
        str(name).strip().lower()
        for name in user.groups.values_list('name', flat=True)
        if name
    }
    if group_names & {'admin', 'administrator', 'campus admin', 'portal admin'}:
        return 'admin'
    if group_names & {'faculty', 'teacher', 'instructor'}:
        return 'faculty'
    if group_names & {'student', 'scholar'}:
        return 'student'

    if hasattr(user, 'studentprofile'):
        return 'student'
    return None


def _role_dashboard_url(role):
    if role == 'admin':
        return 'portal:admin_overview'
    if role == 'faculty':
        return 'portal:faculty_overview'
    if role == 'student':
        return 'portal:dashboard'
    return 'portal:home'


def _faculty_subject_codes(user):
    allocs = FacultyAllocation.objects.filter(faculty=user).select_related('subject')
    return {a.subject.code for a in allocs}


def _faculty_has_permission(user, perm_key: str, subject_code: str = None) -> bool:
    if _get_user_role(user) != 'faculty':
        return False
    rp = getattr(user, 'roleprofile', None)
    if rp is None or not rp.is_active or not user.is_active:
        return False
    allocs = FacultyAllocation.objects.filter(faculty=user).select_related('subject')
    if subject_code:
        alloc = allocs.filter(subject__code=subject_code).first()
        if alloc is None:
            return False
        return perm_key in (alloc.permissions_json or [])
    if allocs.exists():
        return any(perm_key in (a.permissions_json or []) for a in allocs)
    return perm_key in (rp.faculty_permissions_json or [])


def _is_demo_portal_access_enabled(request=None) -> bool:
    """
    One-click role-based dashboard entry is permitted ONLY when:
    - Django DEBUG is enabled
    - DJANGO_ENV is not 'production'
    - settings.DEMO_MODE is explicitly True
    - settings.DEMO_PORTAL_ACCESS is explicitly True
    - Request host (when provided) is in settings.DEMO_PORTAL_ALLOWED_HOSTS (approved local dev host)
    """
    if not getattr(settings, 'DEBUG', False):
        return False
    if str(getattr(settings, 'DJANGO_ENV', 'development')).strip().lower() == 'production':
        return False
    if not getattr(settings, 'DEMO_MODE', False):
        return False
    if not getattr(settings, 'DEMO_PORTAL_ACCESS', False):
        return False
    if request is not None:
        raw_host = (request.get_host() or '').split(':')[0].strip().lower()
        allowed_hosts = [
            str(h).strip().lower()
            for h in getattr(settings, 'DEMO_PORTAL_ALLOWED_HOSTS', ['localhost', '127.0.0.1', 'testserver'])
            if str(h).strip() and str(h).strip() != '*'
        ]
        host_ok = any(
            raw_host == entry or (entry.startswith('.') and raw_host.endswith(entry))
            for entry in allowed_hosts
        )
        if not host_ok:
            return False
    return True


def _get_or_create_sandbox_demo_user(role: str):
    """
    Fetch or provision an isolated sandbox demo account for local development.
    Never modifies real user accounts, never exposes real passwords, and never grants superuser privileges.
    """
    specs = {
        'student': {
            'username': 'demo_student',
            'email': 'demo_student@demo.mcasmartcampus.local',
            'first_name': 'Demo',
            'last_name': 'Student',
            'institutional_id': 'DEMO_STD',
            'department': 'Department of Computer Applications',
            'is_staff': False,
        },
        'faculty': {
            'username': 'demo_faculty',
            'email': 'demo_faculty@demo.mcasmartcampus.local',
            'first_name': 'Demo',
            'last_name': 'Faculty',
            'institutional_id': 'DEMO_FAC',
            'department': 'Department of Computer Applications',
            'is_staff': True,
        },
        'admin': {
            'username': 'demo_admin',
            'email': 'demo_admin@demo.mcasmartcampus.local',
            'first_name': 'Demo',
            'last_name': 'Administrator',
            'institutional_id': 'DEMO_ADM',
            'department': 'Institutional Administration',
            'is_staff': True,
        },
    }
    spec = specs[role]
    user, created = User.objects.get_or_create(
        username=spec['username'],
        defaults={
            'email': spec['email'],
            'first_name': spec['first_name'],
            'last_name': spec['last_name'],
            'is_active': True,
            'is_staff': spec['is_staff'],
            'is_superuser': False,
        },
    )
    if created:
        user.set_unusable_password()
        user.save()
    else:
        changed = []
        if not user.is_active:
            user.is_active = True
            changed.append('is_active')
        if user.is_staff != spec['is_staff']:
            user.is_staff = spec['is_staff']
            changed.append('is_staff')
        if user.is_superuser:
            user.is_superuser = False
            changed.append('is_superuser')
        if changed:
            user.save(update_fields=changed)

    RoleProfile.objects.update_or_create(
        user=user,
        defaults={
            'role': role,
            'institutional_id': spec['institutional_id'],
            'department': spec['department'],
            'is_active': True,
            'must_change_password': False,
            'faculty_permissions_json': list(ALL_FACULTY_PERMISSIONS) if role in ('faculty', 'admin') else [],
        },
    )

    if role == 'student':
        StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                'student_id': 'DEMO_STD',
                'roll_number': 'DEMO-MCA-01',
                'advisor_name': 'Demo Faculty',
            },
        )
    elif role == 'faculty':
        for subj in Subject.objects.all()[:4]:
            FacultyAllocation.objects.get_or_create(
                faculty=user,
                subject=subj,
                defaults={'permissions_json': list(ALL_FACULTY_PERMISSIONS)},
            )

    return user


def role_required(expected_role):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            if request.session.get('is_demo_portal_session') and not _is_demo_portal_access_enabled(request):
                _record_audit(request, 'blocked_demo_session_in_production', target=request.path)
                logout(request)
                return redirect('portal:login')

            if not request.user.is_authenticated:
                login_name = {
                    'admin': 'portal:admin_login',
                    'faculty': 'portal:faculty_login',
                    'student': 'portal:login',
                }.get(expected_role, 'portal:login')
                return redirect(login_name)

            rp = getattr(request.user, 'roleprofile', None)
            if not request.user.is_active or (rp is not None and not rp.is_active):
                _record_audit(request, 'blocked_inactive_access', target=request.path)
                logout(request)
                return HttpResponseForbidden('Institutional account is currently inactive.')

            actual_role = _get_user_role(request.user)
            if actual_role != expected_role:
                _record_audit(
                    request,
                    'blocked_cross_role_access',
                    target=f'{request.path} (expected={expected_role}, actual={actual_role})',
                )
                return HttpResponseForbidden(
                    f'Access denied: {expected_role.title()} role required.'
                )

            if rp is not None and rp.must_change_password:
                return redirect('portal:change_password')

            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator


def faculty_permission_required(perm_key: str):
    def decorator(view_func):
        @wraps(view_func)
        @faculty_required
        def _wrapped(request, *args, **kwargs):
            if not _faculty_has_permission(request.user, perm_key):
                _record_audit(request, 'blocked_missing_faculty_permission', target=perm_key)
                return HttpResponseForbidden(f'Access denied: Missing faculty permission "{perm_key}".')
            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator


student_required = role_required('student')
faculty_required = role_required('faculty')
admin_required = role_required('admin')


def _execute_python_isolated(code: str, expected_stdout: str = ''):
    clean_code = str(code or '')
    if not clean_code.strip():
        return {'error': 'Python source code cannot be empty.', 'passed': False, 'status': 400}
    if len(clean_code) > 15000:
        return {'error': 'Submitted code exceeds 15 KB limit.', 'passed': False, 'status': 400}
    safety_err = validate_safe_python_code(clean_code, max_chars=15000)
    if safety_err:
        return {'error': safety_err, 'passed': False, 'status': 403}
    res = execute_python_isolated(clean_code, expected_stdout=expected_stdout)
    if res.get('status') == 'blocked':
        return {'error': res.get('stderr', 'Sandbox policy violation.'), 'passed': False, 'status': 403}
    return {
        'stdout': res.get('stdout', ''),
        'stderr': res.get('stderr', ''),
        'returncode': res.get('returncode', 0),
        'elapsed_ms': res.get('elapsed_ms', 0),
        'passed': bool(res.get('passed', False)),
        'status': 200,
    }


def _get_or_create_student_profile(user):
    profile = getattr(user, 'studentprofile', None)
    if profile is None:
        profile, _ = StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                'student_id': f"MCA{user.id:04d}",
                'roll_number': 'P26CA125',
                'advisor_name': 'HCASICAN',
            },
        )
    return profile


def _resolve_user_by_identifier(identifier: str):
    clean = (identifier or '').strip()
    if not clean:
        return None
    user = User.objects.filter(username__iexact=clean).first()
    if user:
        return user
    rp = RoleProfile.objects.filter(institutional_id__iexact=clean).select_related('user').first()
    if rp:
        return rp.user
    sp = StudentProfile.objects.filter(student_id__iexact=clean).select_related('user').first()
    if sp:
        return sp.user
    user = User.objects.filter(email__iexact=clean).first()
    if user:
        return user
    return None


def health_check_view(request):
    """Lightweight deployment health check verifying database connectivity without exposing secrets."""
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
        db_engine = str(settings.DATABASES.get('default', {}).get('ENGINE', '')).split('.')[-1]
        return JsonResponse(
            {
                'status': 'ok',
                'database': 'connected',
                'engine': db_engine,
                'environment': getattr(settings, 'DJANGO_ENV', 'development'),
            },
            status=200,
        )
    except Exception:
        logger.error('Health check failed: database connection unavailable.')
        return JsonResponse(
            {
                'status': 'error',
                'database': 'unavailable',
                'environment': getattr(settings, 'DJANGO_ENV', 'development'),
            },
            status=503,
        )


def home_view(request):
    subjects = Subject.objects.all()[:4]
    active_notices = ImportantNotice.active_published()
    return render(
        request,
        'public/home.html',
        {
            'subjects': subjects,
            'active_notices': active_notices,
        },
    )


def about_view(request):
    return render(request, 'public/about.html')


def subjects_view(request):
    subjects = Subject.objects.all()
    return render(request, 'public/subjects.html', {'subjects': subjects})


def subject_detail_view(request, code):
    subject = get_object_or_404(Subject, code=code)
    return render(request, 'public/subject_detail.html', {'subject': subject})


def features_view(request):
    return render(request, 'public/features.html')


def how_it_works_view(request):
    return render(request, 'public/how_it_works.html')


def contact_view(request):
    if request.method == 'POST':
        full_name = request.POST.get('full_name', '').strip()
        email = request.POST.get('email', '').strip()
        subject = request.POST.get('subject', '').strip()
        message_text = request.POST.get('message', '').strip()
        errors = []
        if len(full_name) < 2 or len(full_name) > 120:
            errors.append('Please provide your full name (2–120 characters).')
        try:
            validate_email(email)
        except ValidationError:
            errors.append('Please enter a valid email address.')
        if len(subject) < 2 or len(subject) > 200:
            errors.append('Please provide a clear inquiry subject.')
        if len(message_text) < 10 or len(message_text) > 4000:
            errors.append('Please enter a detailed message (at least 10 characters).')
        if errors:
            for err in errors:
                messages.error(request, err)
            return render(
                request,
                'public/contact.html',
                {
                    'form_data': {
                        'full_name': full_name,
                        'email': email,
                        'subject': subject,
                        'message': message_text,
                    }
                },
                status=400,
            )
        ContactTicket.objects.create(
            full_name=full_name,
            email=email,
            subject=subject,
            message=message_text,
        )
        messages.success(request, 'Your message has been delivered to the academic administration.')
        return redirect('portal:contact')
    return render(request, 'public/contact.html')


def faq_view(request):
    return render(request, 'public/faq.html')


def _is_demo_credentials_enabled(request=None) -> bool:
    """
    Demo credentials visibility is strictly enabled ONLY when:
    - Django DEBUG is enabled (DEBUG=True)
    - DJANGO_ENV is not 'production'
    - Demo access feature is explicitly enabled:
      (settings.DEMO_MODE=True, settings.DEMO_CREDENTIALS_ENABLED=True,
       settings.SHOW_DEMO_CREDENTIALS=True, or settings.DEMO_PORTAL_ACCESS=True)
    Never exposes real production administrator credentials.
    """
    if not getattr(settings, 'DEBUG', False):
        return False
    if str(getattr(settings, 'DJANGO_ENV', 'development')).strip().lower() == 'production':
        return False
    return bool(
        getattr(settings, 'DEMO_CREDENTIALS_ENABLED', False)
        or getattr(settings, 'DEMO_MODE', False)
        or getattr(settings, 'SHOW_DEMO_CREDENTIALS', False)
        or getattr(settings, 'ENABLE_DEMO_CREDENTIALS', False)
        or getattr(settings, 'DEMO_PORTAL_ACCESS', False)
    )


def _get_role_demo_credentials() -> dict:
    """
    Read demo credentials directly from existing Django settings / environment configuration.
    Never exposes real production credentials.
    """
    return {
        'student': {
            'role': 'student',
            'role_label': 'Student',
            'username': str(getattr(settings, 'DEMO_STUDENT_USERNAME', 'mca_demo_student')),
            'password': str(getattr(settings, 'DEMO_STUDENT_PASSWORD', 'McaDemo@2026!')),
            'badge': 'STD',
            'accent_color': '#B83232',
            'icon_class': 'auth-role-icon--student',
            'portal_name': 'Student Portal',
            'subtitle': 'MCA SMART CAMPUS · STUDENT PORTAL',
            'heading': 'Student Portal Login',
            'hint': 'Sign in with your Student ID, university email, or username',
            'action_url': reverse('portal:login'),
            'submit_label': 'Login to Student Portal',
            'description': 'Student Portal Demo Account',
        },
        'faculty': {
            'role': 'faculty',
            'role_label': 'Faculty',
            'username': str(getattr(settings, 'DEMO_FACULTY_USERNAME', 'hcasican_faculty')),
            'password': str(getattr(settings, 'DEMO_FACULTY_PASSWORD', 'Faculty@2026!')),
            'badge': 'FAC',
            'accent_color': '#795548',
            'icon_class': 'auth-role-icon--faculty',
            'portal_name': 'Faculty Portal',
            'subtitle': 'MCA SMART CAMPUS · FACULTY PORTAL',
            'heading': 'Faculty Portal Login',
            'hint': 'Restricted to authorized faculty coordinators (Advisor: HCASICAN)',
            'action_url': reverse('portal:faculty_login'),
            'submit_label': 'Sign In to Faculty Portal',
            'description': 'Faculty Coordinator Demo Account',
        },
        'admin': {
            'role': 'admin',
            'role_label': 'Admin',
            'username': str(getattr(settings, 'DEMO_ADMIN_USERNAME', 'campus_admin')),
            'password': str(getattr(settings, 'DEMO_ADMIN_PASSWORD', 'Admin@2026!')),
            'badge': 'ADM',
            'accent_color': '#292929',
            'icon_class': 'auth-role-icon--admin',
            'portal_name': 'Admin Portal',
            'subtitle': 'MCA SMART CAMPUS · ADMIN PORTAL',
            'heading': 'Admin Governance Login',
            'hint': 'Institutional governance & identity management access only',
            'action_url': reverse('portal:admin_login'),
            'submit_label': 'Sign In to Admin Portal',
            'description': 'Institutional Administration Demo Account',
        },
    }


def _handle_role_login(request, expected_role: str, template_name: str):
    if request.user.is_authenticated:
        rp = getattr(request.user, 'roleprofile', None)
        if rp and rp.must_change_password:
            return redirect('portal:change_password')
        role = _get_user_role(request.user)
        if role:
            return redirect(_role_dashboard_url(role))
        logout(request)

    demo_mode = bool(getattr(settings, 'DEMO_MODE', False) and (settings.DEBUG or getattr(settings, 'IS_TEST_RUNNER', False)))
    show_demo_creds = _is_demo_credentials_enabled(request)
    all_demo_creds = _get_role_demo_credentials() if show_demo_creds else {}
    current_demo = all_demo_creds.get(expected_role, all_demo_creds.get('student')) if show_demo_creds else None

    remember_cookie_name = getattr(settings, 'REMEMBER_ME_COOKIE_NAME', 'mca_remembered_user')
    cookie_secret = getattr(settings, 'COOKIE_ENCRYPTION_SECRET', '')
    remembered_username = ''
    raw_remember_cookie = request.COOKIES.get(remember_cookie_name)
    if raw_remember_cookie and cookie_secret:
        remembered_username = decrypt_cookie_value(raw_remember_cookie, cookie_secret) or ''

    demo_context = {
        'expected_role': expected_role,
        'demo_mode': demo_mode,
        'show_demo_credentials': show_demo_creds,
        'demo_credentials': all_demo_creds,
        'current_demo': current_demo,
        'remembered_username': remembered_username,
        'remember_me_days': int(getattr(settings, 'REMEMBER_ME_DAYS', 30)),
    }

    if request.method == 'POST':
        identifier = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        remember_me = request.POST.get('remember_me')

        if not identifier or not password:
            messages.error(request, 'Please enter both your ID / email / username and password.')
            return render(request, template_name, demo_context)

        client_ip = _get_client_ip(request)
        norm_id = identifier.lower()[:150]
        attempt, _ = LoginAttempt.objects.get_or_create(
            identifier=norm_id,
            ip_address=client_ip,
        )
        now = timezone.now()
        if attempt.locked_until and attempt.locked_until > now:
            wait_mins = max(1, int((attempt.locked_until - now).total_seconds() // 60) + 1)
            _record_audit(request, 'login_rate_limited', target=identifier, role_override=expected_role)
            messages.error(
                request,
                f'Too many failed login attempts. Account sign-in temporarily locked for ~{wait_mins} minute(s).',
            )
            return render(request, template_name, demo_context, status=429)

        matched_user = _resolve_user_by_identifier(identifier)
        if matched_user is not None and not demo_mode and matched_user.username in ('demo_student', 'demo_faculty', 'demo_admin'):
            matched_user = None
        canonical_attempt = None
        if matched_user is not None and matched_user.username.lower()[:150] != norm_id:
            canonical_attempt, _ = LoginAttempt.objects.get_or_create(
                identifier=matched_user.username.lower()[:150],
                ip_address=client_ip,
            )
            if canonical_attempt.locked_until and canonical_attempt.locked_until > now:
                wait_mins = max(1, int((canonical_attempt.locked_until - now).total_seconds() // 60) + 1)
                _record_audit(request, 'login_rate_limited', target=matched_user.username, role_override=expected_role)
                messages.error(
                    request,
                    f'Too many failed login attempts. Account sign-in temporarily locked for ~{wait_mins} minute(s).',
                )
                return render(request, template_name, demo_context, status=429)

        # Explicitly check password safely first so inactive accounts report inactive status accurately
        if matched_user is None or not matched_user.check_password(password):
            attempt.failed_attempts += 1
            max_attempts = int(getattr(settings, 'AUTH_MAX_FAILED_ATTEMPTS', 5))
            lockout_seconds = int(getattr(settings, 'AUTH_LOCKOUT_SECONDS', 900))
            if attempt.failed_attempts >= max_attempts:
                attempt.locked_until = now + timedelta(seconds=lockout_seconds)
            attempt.save(update_fields=['failed_attempts', 'locked_until', 'last_attempt_at'])
            if canonical_attempt is not None:
                canonical_attempt.failed_attempts += 1
                if canonical_attempt.failed_attempts >= max_attempts:
                    canonical_attempt.locked_until = now + timedelta(seconds=lockout_seconds)
                canonical_attempt.save(update_fields=['failed_attempts', 'locked_until', 'last_attempt_at'])
            _record_audit(
                request,
                'login_failed',
                target=identifier,
                role_override=expected_role,
                actor_override=matched_user,
            )
            role_label = 'Student' if expected_role == 'student' else 'Faculty' if expected_role == 'faculty' else 'Admin'
            messages.error(request, f'Invalid {role_label} ID or Password. Please verify and try again.')
            status_code = 429 if (attempt.locked_until and attempt.locked_until > now) else 200
            return render(request, template_name, demo_context, status=status_code)

        rp = getattr(matched_user, 'roleprofile', None)
        if not matched_user.is_active or (rp is not None and not rp.is_active):
            _record_audit(
                request,
                'login_blocked_inactive',
                target=identifier,
                role_override=expected_role,
                actor_override=matched_user,
            )
            messages.error(request, 'This institutional account is currently inactive or disabled. Contact the Administrator.')
            return render(request, template_name, demo_context, status=403)

        actual_role = _get_user_role(matched_user)
        if actual_role != expected_role:
            _record_audit(
                request,
                'login_blocked_wrong_role',
                target=f'{identifier} tried {expected_role} portal (actual={actual_role})',
                role_override=actual_role or 'system',
                actor_override=matched_user,
            )
            messages.error(
                request,
                f'Access denied: This login portal is restricted to {expected_role} accounts.',
            )
            return render(request, template_name, demo_context, status=403)

        auth_user = authenticate(request, username=matched_user.username, password=password)
        if auth_user is None:
            messages.error(request, 'Authentication failed. Please retry.')
            return render(request, template_name, demo_context, status=401)

        # Clear failed login counter on success
        attempt.failed_attempts = 0
        attempt.locked_until = None
        attempt.save(update_fields=['failed_attempts', 'locked_until', 'last_attempt_at'])
        if canonical_attempt is not None:
            canonical_attempt.failed_attempts = 0
            canonical_attempt.locked_until = None
            canonical_attempt.save(update_fields=['failed_attempts', 'locked_until', 'last_attempt_at'])

        login(request, auth_user)
        if rp is not None:
            rp.last_login_ip = client_ip
            rp.save(update_fields=['last_login_ip'])

        _record_audit(request, f'{actual_role}_login', target=identifier, role_override=actual_role, actor_override=auth_user)

        if rp is not None and rp.must_change_password:
            messages.warning(request, 'First-login security setup required: please set a new personal password.')
            response = redirect('portal:change_password')
        else:
            response = redirect(_role_dashboard_url(actual_role))

        remember_max_age = int(getattr(settings, 'REMEMBER_ME_MAX_AGE', 30 * 86400))
        secure_cookie_flag = bool(getattr(settings, 'SESSION_COOKIE_SECURE', not settings.DEBUG) or request.is_secure())
        samesite_flag = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')

        if remember_me:
            request.session.set_expiry(remember_max_age)
            encrypted_username = encrypt_cookie_value(
                auth_user.username,
                getattr(settings, 'COOKIE_ENCRYPTION_SECRET', ''),
                max_age_seconds=remember_max_age,
            )
            response.set_cookie(
                remember_cookie_name,
                encrypted_username,
                max_age=remember_max_age,
                httponly=True,
                secure=secure_cookie_flag,
                samesite=samesite_flag,
            )
            response.delete_cookie('remember_student_id')
        else:
            request.session.set_expiry(0)
            response.delete_cookie(remember_cookie_name)
            response.delete_cookie('remember_student_id')

        return response

    return render(request, template_name, demo_context)


def _render_demo_portal_selector(request):
    return render(
        request,
        'accounts/portal_select.html',
        {
            'demo_portal_access': True,
        },
    )


def demo_portal_enter_view(request, role):
    """
    Development-only one-click dashboard entry for Student, Faculty, or Admin.
    Requires POST (CSRF-protected) and is strictly disabled whenever DEBUG=False,
    DJANGO_ENV='production', DEMO_MODE=False, or DEMO_PORTAL_ACCESS=False.
    """
    if not _is_demo_portal_access_enabled(request):
        _record_audit(request, 'blocked_demo_portal_enter_in_production', target=f'role={role}')
        return HttpResponseForbidden('Direct demo portal access is disabled in production mode.')

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    clean_role = str(role or '').strip().lower()
    if clean_role not in ('student', 'faculty', 'admin'):
        raise Http404('Invalid portal role requested.')

    demo_user = _get_or_create_sandbox_demo_user(clean_role)
    login(request, demo_user, backend='django.contrib.auth.backends.ModelBackend')
    request.session['is_demo_portal_session'] = True
    _record_audit(
        request,
        'demo_portal_enter',
        target=f'{clean_role} -> {_role_dashboard_url(clean_role)}',
        role_override=clean_role,
        actor_override=demo_user,
    )
    return redirect(_role_dashboard_url(clean_role))


def login_view(request):
    """Central portal selection in development/demo mode, or Student credential login in production."""
    if request.method == 'GET' and _is_demo_portal_access_enabled(request):
        return _render_demo_portal_selector(request)
    return _handle_role_login(request, 'student', 'accounts/login.html')


def student_login_view(request):
    if request.method == 'GET' and _is_demo_portal_access_enabled(request):
        return _render_demo_portal_selector(request)
    return _handle_role_login(request, 'student', 'accounts/student_login.html')


def faculty_login_view(request):
    if request.method == 'GET' and _is_demo_portal_access_enabled(request):
        return _render_demo_portal_selector(request)
    return _handle_role_login(request, 'faculty', 'accounts/faculty_login.html')


def admin_login_view(request):
    if request.method == 'GET' and _is_demo_portal_access_enabled(request):
        return _render_demo_portal_selector(request)
    return _handle_role_login(request, 'admin', 'accounts/admin_login.html')


def logout_view(request):
    if request.user.is_authenticated:
        _record_audit(request, 'logout', target=request.user.username)
    logout(request)
    response = redirect('portal:home')
    response.delete_cookie(getattr(settings, 'REMEMBER_ME_COOKIE_NAME', 'mca_remembered_user'))
    response.delete_cookie('remember_student_id')
    return response


@login_required
def change_password_view(request):
    rp = getattr(request.user, 'roleprofile', None)
    first_login_required = bool(rp and rp.must_change_password)

    if request.method == 'POST':
        current_pw = request.POST.get('current_password', '')
        new_pw = request.POST.get('new_password', '')
        confirm_pw = request.POST.get('confirm_password', '')

        if not first_login_required and not request.user.check_password(current_pw):
            messages.error(request, 'Current password is incorrect.')
            return render(
                request,
                'accounts/change_password.html',
                {'first_login_required': first_login_required},
                status=400,
            )

        if first_login_required and current_pw and not request.user.check_password(current_pw):
            messages.error(request, 'Temporary password is incorrect.')
            return render(
                request,
                'accounts/change_password.html',
                {'first_login_required': first_login_required},
                status=400,
            )

        if new_pw != confirm_pw:
            messages.error(request, 'New password and confirmation do not match.')
            return render(
                request,
                'accounts/change_password.html',
                {'first_login_required': first_login_required},
                status=400,
            )

        try:
            validate_password(new_pw, user=request.user)
        except ValidationError as exc:
            for err in exc.messages:
                messages.error(request, err)
            return render(
                request,
                'accounts/change_password.html',
                {'first_login_required': first_login_required},
                status=400,
            )

        with transaction.atomic():
            request.user.set_password(new_pw)
            request.user.save()
            update_session_auth_hash(request, request.user)
            request.session.cycle_key()
            if rp is not None:
                rp.must_change_password = False
                rp.password_changed_at = timezone.now()
                rp.save(update_fields=['must_change_password', 'password_changed_at'])

        _record_audit(request, 'password_changed', target=request.user.username)
        messages.success(request, 'Your password has been updated securely.')
        role = _get_user_role(request.user)
        return redirect(_role_dashboard_url(role))

    return render(
        request,
        'accounts/change_password.html',
        {'first_login_required': first_login_required},
    )


def password_reset_view(request):
    """
    Public password reset workflow using Django's time-limited cryptographic tokens
    plus verification code validation (never exposes passwords in logs or tables).
    """
    if request.user.is_authenticated:
        return redirect(_role_dashboard_url(_get_user_role(request.user)))

    step = 'request'
    target_username = ''
    reset_code_hint = None
    reset_confirm_url = None

    if request.method == 'POST':
        action = request.POST.get('action', 'request_code')
        if action == 'request_code':
            identifier = request.POST.get('identifier', '').strip()
            matched_user = _resolve_user_by_identifier(identifier)

            if matched_user is None or not matched_user.is_active:
                messages.error(request, 'No active account matched that Institutional ID, username, or email.')
            else:
                uidb64 = urlsafe_base64_encode(force_bytes(matched_user.pk))
                token = default_token_generator.make_token(matched_user)
                reset_confirm_url = reverse('portal:password_reset_confirm', kwargs={'uidb64': uidb64, 'token': token})
                code = f'{secrets.randbelow(900000) + 100000}'
                request.session['pwd_reset_uid'] = matched_user.id
                request.session['pwd_reset_code'] = code
                request.session['pwd_reset_attempts'] = 0
                request.session['pwd_reset_expires_at'] = (timezone.now() + timedelta(minutes=15)).timestamp()
                step = 'confirm'
                target_username = matched_user.username
                _record_audit(request, 'password_reset_requested', target=matched_user.username, actor_override=matched_user)
                if matched_user.email:
                    absolute_reset_url = request.build_absolute_uri(reset_confirm_url)
                    email_body = (
                        f'Hello {matched_user.get_full_name() or matched_user.username},\n\n'
                        f'A password reset was requested for your MCA Smart Campus account.\n'
                        f'Verification code (valid for 15 minutes): {code}\n'
                        f'Secure reset link: {absolute_reset_url}\n\n'
                        'If you did not request this password reset, you can safely ignore this email.'
                    )
                    try:
                        send_mail(
                            subject='MCA Smart Campus — Password Reset Verification',
                            message=email_body,
                            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@mcasmartcampus.edu'),
                            recipient_list=[matched_user.email],
                            fail_silently=False,
                        )
                    except Exception:
                        logger.warning('Password reset email dispatch failed for user_id=%s (check SMTP configuration).', matched_user.pk)
                        if not settings.DEBUG:
                            messages.warning(
                                request,
                                'Unable to dispatch email via SMTP right now. Please contact your campus administrator.',
                            )
                if getattr(settings, 'DEMO_MODE', False) and settings.DEBUG:
                    reset_code_hint = code
        elif action == 'confirm_reset':
            uid = request.session.get('pwd_reset_uid')
            expected_code = request.session.get('pwd_reset_code')
            expires_at = request.session.get('pwd_reset_expires_at', 0)
            attempts = int(request.session.get('pwd_reset_attempts', 0) or 0)
            submitted_code = request.POST.get('verification_code', '').strip()
            new_pw = request.POST.get('new_password', '')
            confirm_pw = request.POST.get('confirm_password', '')

            step = 'confirm'
            if not uid or not expected_code or timezone.now().timestamp() > float(expires_at or 0):
                messages.error(request, 'Your reset session expired. Please request a new reset token.')
                step = 'request'
            elif not secrets.compare_digest(str(submitted_code), str(expected_code)):
                attempts += 1
                request.session['pwd_reset_attempts'] = attempts
                if attempts >= 5:
                    for k in ('pwd_reset_uid', 'pwd_reset_code', 'pwd_reset_expires_at', 'pwd_reset_attempts'):
                        request.session.pop(k, None)
                    messages.error(request, 'Too many invalid verification attempts. Please request a new reset token.')
                    step = 'request'
                else:
                    messages.error(request, 'Invalid verification code.')
            elif new_pw != confirm_pw:
                messages.error(request, 'Password confirmation does not match.')
            else:
                user_obj = get_object_or_404(User, id=uid)
                try:
                    validate_password(new_pw, user=user_obj)
                except ValidationError as exc:
                    for err in exc.messages:
                        messages.error(request, err)
                    return render(
                        request,
                        'accounts/password_reset.html',
                        {'step': step, 'target_username': user_obj.username},
                    )
                with transaction.atomic():
                    user_obj.set_password(new_pw)
                    user_obj.save()
                    rp = getattr(user_obj, 'roleprofile', None)
                    if rp is not None:
                        rp.must_change_password = False
                        rp.password_changed_at = timezone.now()
                        rp.save(update_fields=['must_change_password', 'password_changed_at'])
                for k in ('pwd_reset_uid', 'pwd_reset_code', 'pwd_reset_expires_at', 'pwd_reset_attempts'):
                    request.session.pop(k, None)
                request.session.cycle_key()
                _record_audit(request, 'password_reset_completed', target=user_obj.username, actor_override=user_obj)
                step = 'done'
                messages.success(request, 'Password updated successfully.')

    return render(
        request,
        'accounts/password_reset.html',
        {
            'step': step,
            'target_username': target_username,
            'reset_code_hint': reset_code_hint,
            'reset_confirm_url': reset_confirm_url,
        },
    )


def password_reset_confirm_view(request, uidb64, token):
    """Time-limited token confirmation endpoint using Django's default_token_generator."""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user_obj = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user_obj = None

    token_valid = bool(user_obj and default_token_generator.check_token(user_obj, token))
    if not token_valid:
        messages.error(request, 'Password reset link is invalid or has expired.')
        return render(request, 'accounts/password_reset_confirm.html', {'token_valid': False}, status=400)

    if request.method == 'POST':
        new_pw = request.POST.get('new_password', '')
        confirm_pw = request.POST.get('confirm_password', '')
        if new_pw != confirm_pw:
            messages.error(request, 'New password and confirmation do not match.')
            return render(
                request,
                'accounts/password_reset_confirm.html',
                {'token_valid': True, 'target_user': user_obj},
                status=400,
            )
        try:
            validate_password(new_pw, user=user_obj)
        except ValidationError as exc:
            for err in exc.messages:
                messages.error(request, err)
            return render(
                request,
                'accounts/password_reset_confirm.html',
                {'token_valid': True, 'target_user': user_obj},
                status=400,
            )

        with transaction.atomic():
            user_obj.set_password(new_pw)
            user_obj.save()
            rp = getattr(user_obj, 'roleprofile', None)
            if rp is not None:
                rp.must_change_password = False
                rp.password_changed_at = timezone.now()
                rp.save(update_fields=['must_change_password', 'password_changed_at'])
        request.session.cycle_key()

        _record_audit(request, 'password_reset_token_confirmed', target=user_obj.username, actor_override=user_obj)
        messages.success(request, 'Password reset complete. You may now sign in with your new password.')
        role = _get_user_role(user_obj)
        if role == 'admin':
            return redirect('portal:admin_login')
        if role == 'faculty':
            return redirect('portal:faculty_login')
        return redirect('portal:login')

    return render(
        request,
        'accounts/password_reset_confirm.html',
        {'token_valid': True, 'target_user': user_obj},
    )


# -------------------------------------------------------------
# AUTHENTICATED STUDENT PORTAL VIEWS (@student_required)
# -------------------------------------------------------------

@student_required
def dashboard_view(request):
    profile = _get_or_create_student_profile(request.user)
    display_name = request.user.get_full_name() or request.user.username or "Devanath N"

    subjects = Subject.objects.all()

    default_goals = {'435C1A': 6.0, '435C1B': 8.0, '435E1A': 5.0, '435C1C': 8.0}
    iso_year, iso_week, _ = timezone.localdate().isocalendar()
    week_label = f'{iso_year}-W{iso_week:02d}'

    saved_goals = request.session.get('weekly_study_goal_hours', {})
    goal_hours = {**default_goals, **saved_goals}
    progress_key = f'weekly_study_minutes_{week_label}'
    logged_minutes = dict(request.session.get(progress_key, {}))

    if request.method == 'POST':
        goal_action = request.POST.get('goal_action', '')
        if goal_action == 'update_targets':
            updated_goals = dict(goal_hours)
            for code in default_goals:
                raw_val = request.POST.get(f'target_{code}')
                if raw_val:
                    try:
                        val = max(0.5, min(40.0, round(float(raw_val) * 2) / 2))
                        updated_goals[code] = val
                    except ValueError:
                        pass
            request.session['weekly_study_goal_hours'] = updated_goals
            messages.success(request, 'Weekly subject study targets saved.')
            return redirect('portal:dashboard')
        elif goal_action == 'log_minutes':
            subj_code = request.POST.get('subject_code', '').strip()
            try:
                mins = max(5, min(240, int(request.POST.get('minutes', 30) or 30)))
            except ValueError:
                mins = 30
            if subj_code:
                logged_minutes[subj_code] = int(logged_minutes.get(subj_code, 0)) + mins
                request.session[progress_key] = logged_minutes
                messages.success(request, f'Logged {mins} study minutes for {subj_code}.')
            return redirect('portal:dashboard')

    weekly_subject_goals = []
    for subj in subjects:
        target_hrs = float(goal_hours.get(subj.code, 6.0))
        mins_done = int(logged_minutes.get(subj.code, 0))
        hrs_done = round(mins_done / 60.0, 2)
        pct = min(100, round((hrs_done / target_hrs) * 100)) if target_hrs > 0 else 0
        weekly_subject_goals.append({
            'code': subj.code,
            'name': subj.name,
            'target_hours': target_hrs,
            'logged_hours': hrs_done,
            'percentage': pct,
            'completed': hrs_done >= target_hrs,
        })
    all_assignments = Assignment.objects.select_related('subject').all()
    submitted_assignment_ids = set(
        AssignmentSubmission.objects.filter(student=profile).values_list('assignment_id', flat=True)
    )
    pending_assignments = [a for a in all_assignments if a.id not in submitted_assignment_ids]
    submitted_assignments = [a for a in all_assignments if a.id in submitted_assignment_ids]

    all_exams = list(Examination.objects.select_related('subject').all())
    completed_results = list(
        ExaminationResult.objects.filter(student=profile)
        .select_related('examination', 'examination__subject')
        .order_by('-submitted_at')
    )
    completed_exam_ids = {r.examination_id for r in completed_results}
    upcoming_exams = [e for e in all_exams if e.id not in completed_exam_ids]

    active_notices = ImportantNotice.active_published()
    unread_notices_count = active_notices.exclude(read_by=request.user).count()
    unread_notifications_count = StudentNotification.objects.filter(student=profile, read=False).count()

    earned_achievements_count = AchievementRecord.objects.filter(student=profile).count()

    practice_attempts_qs = PracticeAttempt.objects.filter(student=profile).select_related('subject')
    practice_attempts_count = practice_attempts_qs.count()
    latest_practice_attempt = practice_attempts_qs.first()
    flashcard_decks_count = FlashcardDeck.objects.filter(student=profile).count()
    upcoming_events = AcademicCalendarEvent.objects.filter(
        Q(is_personal_reminder=False) | Q(created_by=request.user),
        event_date__gte=timezone.localdate(),
    ).select_related('subject')[:5]

    search_query = request.GET.get('q', '').strip()
    search_results = []
    if search_query:
        for subj in subjects.filter(
            Q(code__icontains=search_query)
            | Q(name__icontains=search_query)
            | Q(instructor__icontains=search_query)
        )[:4]:
            search_results.append({
                'category': 'Subject',
                'title': f'{subj.code} · {subj.name}',
                'subtitle': f'{subj.credits} Credits · {subj.instructor}',
                'url_name': 'portal:my_subjects',
            })
        for asg in all_assignments.filter(
            Q(title__icontains=search_query)
            | Q(topic__icontains=search_query)
            | Q(subject__code__icontains=search_query)
        )[:4]:
            search_results.append({
                'category': 'Assignment',
                'title': asg.title,
                'subtitle': f'{asg.subject.code} · Due {asg.due_date}',
                'url_name': 'portal:assignments',
            })
        for pdf in SubjectPDF.objects.filter(
            Q(title__icontains=search_query)
            | Q(file_name__icontains=search_query)
            | Q(chapter__icontains=search_query)
            | Q(subject__code__icontains=search_query)
        ).select_related('subject')[:4]:
            search_results.append({
                'category': 'PDF Resource',
                'title': pdf.title,
                'subtitle': f'{pdf.subject.code} · Unit {pdf.unit} · {pdf.file_name}',
                'url_name': 'portal:materials',
            })
        for note in GeneratedStudyNote.objects.filter(student=profile).filter(
            Q(title__icontains=search_query)
            | Q(topic__icontains=search_query)
            | Q(mode__icontains=search_query)
            | Q(subject__code__icontains=search_query)
        ).select_related('subject')[:4]:
            search_results.append({
                'category': 'Study Note',
                'title': note.title,
                'subtitle': f'{note.subject.code} · Unit {note.unit} · {note.mode}',
                'url_name': 'portal:materials',
            })
        for mat in LearningMaterial.objects.filter(
            Q(title__icontains=search_query)
            | Q(summary__icontains=search_query)
            | Q(subject__code__icontains=search_query)
        ).select_related('subject')[:4]:
            search_results.append({
                'category': 'Material',
                'title': mat.title,
                'subtitle': f'{mat.subject.code} · Unit {mat.unit}',
                'url_name': 'portal:materials',
            })

    return render(
        request,
        'portal/dashboard.html',
        {
            'student': profile,
            'display_name': display_name,
            'today_date': timezone.localdate(),
            'subjects': subjects,
            'recent_exams': upcoming_exams[:3],
            'total_subjects_count': subjects.count() or 4,
            'available_assignments_count': len(pending_assignments) + len(submitted_assignments),
            'pending_assignments_count': len(pending_assignments),
            'submitted_assignments_count': len(submitted_assignments),
            'upcoming_exams_count': len(upcoming_exams),
            'completed_exams_count': len(completed_results),
            'latest_exam_result': completed_results[0] if completed_results else None,
            'active_notices': active_notices,
            'unread_notices_count': unread_notices_count,
            'unread_notifications_count': unread_notifications_count + unread_notices_count,
            'earned_achievements_count': earned_achievements_count,
            'practice_attempts_count': practice_attempts_count,
            'latest_practice_attempt': latest_practice_attempt,
            'flashcard_decks_count': flashcard_decks_count,
            'upcoming_events': upcoming_events,
            'weekly_goal_week': week_label,
            'weekly_subject_goals': weekly_subject_goals,
            'search_query': search_query,
            'search_results': search_results,
            'active_tab': 'dashboard',
        },
    )


@student_required
def my_subjects_view(request):
    subjects = Subject.objects.all()
    return render(request, 'portal/my_subjects.html', {'subjects': subjects, 'active_tab': 'my_subjects'})


@student_required
def examinations_view(request):
    profile = _get_or_create_student_profile(request.user)
    if request.method == 'POST':
        exam_id, id_err = safe_int(request.POST.get('examination_id'), min_val=1)
        if id_err:
            messages.error(request, 'Invalid examination selected.')
            return redirect('portal:examinations')
        exam = get_object_or_404(Examination, id=exam_id)
        score_val, score_err = safe_int(
            request.POST.get('score'), default=0, min_val=0, max_val=exam.total_marks
        )
        if score_err:
            messages.error(request, f'Score must be an integer between 0 and {exam.total_marks}.')
            return redirect('portal:examinations')
        ExaminationResult.objects.update_or_create(
            student=profile,
            examination=exam,
            defaults={'score': score_val, 'passed': score_val >= exam.passing_marks},
        )
        messages.success(request, f'Recorded result for "{exam.title}": {score_val}/{exam.total_marks}.')
        return redirect('portal:examinations')

    exams = Examination.objects.select_related('subject').all()
    results = ExaminationResult.objects.filter(student=profile).select_related('examination', 'examination__subject').order_by('-submitted_at')
    return render(
        request,
        'portal/examinations.html',
        {'exams': exams, 'results': results, 'student': profile, 'active_tab': 'examinations'},
    )


@student_required
def coding_lab_view(request):
    problems = CodingProblem.objects.all()
    return render(request, 'portal/coding_lab.html', {'problems': problems, 'active_tab': 'coding_lab'})


@student_required
def materials_view(request):
    profile = _get_or_create_student_profile(request.user)
    subjects = Subject.objects.all()
    subject_code = request.GET.get('subject', '').strip()
    filter_type = request.GET.get('filter', 'all').strip()
    mode_filter = request.GET.get('mode', '').strip()
    search_q = request.GET.get('search', '').strip()
    note_id = request.GET.get('note_id', '').strip()

    notes_qs = GeneratedStudyNote.objects.filter(student=profile).select_related('subject', 'source_pdf')
    if subject_code:
        notes_qs = notes_qs.filter(subject__code=subject_code)
    if filter_type == 'bookmarked':
        notes_qs = notes_qs.filter(is_bookmarked=True)
    elif filter_type == 'revision':
        notes_qs = notes_qs.filter(needs_revision=True)
    elif filter_type == 'completed':
        notes_qs = notes_qs.filter(is_completed=True)
    if mode_filter:
        notes_qs = notes_qs.filter(mode=mode_filter)
    if search_q:
        notes_qs = notes_qs.filter(
            Q(title__icontains=search_q)
            | Q(topic__icontains=search_q)
            | Q(summary__icontains=search_q)
        )

    selected_note = notes_qs.filter(id=note_id).first() if note_id.isdigit() else notes_qs.first()
    materials = LearningMaterial.objects.select_related('subject').all()
    subject_pdfs = SubjectPDF.objects.select_related('subject').all()

    return render(
        request,
        'portal/materials.html',
        {
            'student': profile,
            'subjects': subjects,
            'materials': materials,
            'subject_pdfs': subject_pdfs,
            'notes': notes_qs,
            'selected_note': selected_note,
            'active_subject_code': subject_code,
            'filter_type': filter_type,
            'mode_filter': mode_filter,
            'search_q': search_q,
            'mode_choices': [c[0] for c in GeneratedStudyNote.MODE_CHOICES],
            'active_tab': 'materials',
        },
    )


@login_required
def download_material_view(request, material_id):
    role = _get_user_role(request.user)
    if role not in ('student', 'faculty', 'admin'):
        return HttpResponseForbidden('Authentication required.')
    mat = get_object_or_404(LearningMaterial, id=material_id)
    if not mat.file_path:
        raise Http404('No attachment available for this material.')
    try:
        fh = mat.file_path.open('rb')
    except FileNotFoundError:
        raise Http404('Material file is missing on server storage.')
    resp = FileResponse(fh, as_attachment=True, filename=os.path.basename(mat.file_path.name))
    resp['X-Content-Type-Options'] = 'nosniff'
    return resp


@student_required
def generate_study_notes_view(request):
    if request.method != 'POST':
        return redirect('portal:materials')

    profile = _get_or_create_student_profile(request.user)
    subject_code = request.POST.get('subject_code', '').strip()
    unit_raw = request.POST.get('unit', '1').strip()
    topic = request.POST.get('topic', '').strip()
    subtopic = request.POST.get('subtopic', '').strip()
    mode = request.POST.get('mode', 'Detailed Notes').strip()

    if not subject_code or not topic:
        messages.error(request, 'Please select a subject and enter a topic before generating study notes.')
        return redirect('portal:materials')

    subject = get_object_or_404(Subject, code=subject_code)
    unit, unit_err = safe_int(unit_raw, default=1, min_val=1, max_val=5)
    if unit_err:
        unit = 1

    valid_modes = {c[0] for c in GeneratedStudyNote.MODE_CHOICES}
    if mode not in valid_modes:
        mode = 'Detailed Notes'

    subject_pdfs = list(SubjectPDF.objects.filter(subject=subject))
    primary_pdf = next((p for p in subject_pdfs if p.unit == unit), subject_pdfs[0] if subject_pdfs else None)

    try:
        generated = generate_university_study_note(
            subject=subject,
            pdfs=subject_pdfs,
            unit=unit,
            topic=topic,
            subtopic=subtopic,
            mode=mode,
        )
    except StudyNoteGenerationError as exc:
        messages.error(request, str(exc))
        return redirect(f"{redirect('portal:materials').url}?subject={subject.code}")

    note = GeneratedStudyNote.objects.create(
        student=profile,
        subject=subject,
        source_pdf=primary_pdf,
        unit=unit,
        topic=topic,
        subtopic=subtopic,
        mode=mode,
        title=generated.get('title') or f'{subject.code} Unit {unit}: {topic} — {mode}',
        sections_json=generated.get('sections', []),
        summary=generated.get('summary', ''),
        important_points_json=generated.get('importantPoints', []),
        source_pdfs=generated.get('sourcePdfs') or ([primary_pdf.file_name] if primary_pdf else []),
        page_citations=generated.get('pageCitations', []),
        is_pdf_sufficient=bool(generated.get('isPdfSufficient', True)),
        supplementary_notice=generated.get('supplementaryNotice', ''),
    )
    messages.success(request, f'Generated university-level {mode} for {subject.code}: {note.title}.')
    return redirect(f"{redirect('portal:materials').url}?subject={subject.code}&note_id={note.id}")


@student_required
def study_note_action_view(request, note_id):
    if request.method != 'POST':
        return redirect('portal:materials')

    profile = _get_or_create_student_profile(request.user)
    note = get_object_or_404(GeneratedStudyNote, id=note_id, student=profile)
    action = request.POST.get('action', '').strip()

    if action == 'toggle_completed':
        note.is_completed = not note.is_completed
        note.save(update_fields=['is_completed'])
    elif action == 'toggle_bookmark':
        note.is_bookmarked = not note.is_bookmarked
        note.save(update_fields=['is_bookmarked'])
    elif action == 'toggle_revision':
        note.needs_revision = not note.needs_revision
        note.save(update_fields=['needs_revision'])
    elif action == 'delete':
        note.delete()
        messages.success(request, 'Study note deleted from your library.')
        return redirect('portal:materials')

    return redirect(f"{redirect('portal:materials').url}?note_id={note.id}")


@student_required
def bookmarks_view(request):
    profile = _get_or_create_student_profile(request.user)
    bookmarked_notes = GeneratedStudyNote.objects.filter(
        student=profile, is_bookmarked=True
    ).select_related('subject')
    return render(
        request,
        'portal/bookmarks.html',
        {'student': profile, 'bookmarked_notes': bookmarked_notes, 'active_tab': 'bookmarks'},
    )


@student_required
def analytics_view(request):
    profile = _get_or_create_student_profile(request.user)
    results = ExaminationResult.objects.filter(student=profile).select_related('examination', 'examination__subject')
    attempts = PracticeAttempt.objects.filter(student=profile).select_related('subject')
    return render(
        request,
        'portal/analytics.html',
        {'student': profile, 'results': results, 'attempts': attempts, 'active_tab': 'analytics'},
    )


@student_required
def reports_view(request):
    profile = _get_or_create_student_profile(request.user)
    display_name = request.user.get_full_name() or request.user.username or "Devanath N"
    results = ExaminationResult.objects.filter(student=profile).select_related('examination', 'examination__subject')
    submissions = AssignmentSubmission.objects.filter(student=profile).select_related('assignment', 'assignment__subject')
    return render(
        request,
        'portal/reports.html',
        {
            'student': profile,
            'display_name': display_name,
            'results': results,
            'submissions': submissions,
            'active_tab': 'reports',
        },
    )


@student_required
def assignments_view(request):
    profile = _get_or_create_student_profile(request.user)
    display_name = request.user.get_full_name() or request.user.username or "Devanath N"
    if request.method == 'POST':
        assignment_id, id_err = safe_int(request.POST.get('assignment_id'), min_val=1)
        response_text = request.POST.get('submission_text', '').strip()
        if id_err or not response_text:
            messages.error(request, 'Please select an assignment and enter your solution before submitting.')
            return redirect('portal:assignments')
        asg = get_object_or_404(Assignment, id=assignment_id)
        AssignmentSubmission.objects.update_or_create(
            assignment=asg,
            student=profile,
            defaults={
                'answers_json': {'response': response_text[:8000]},
                'status': 'Submitted',
            },
        )
        messages.success(request, f'Assignment "{asg.title}" submitted for evaluation.')
        return redirect('portal:assignments')

    assignments = Assignment.objects.select_related('subject').all()
    submissions = AssignmentSubmission.objects.filter(student=profile).select_related('assignment', 'assignment__subject')
    submitted_ids = {s.assignment_id for s in submissions}
    return render(
        request,
        'portal/assignments.html',
        {
            'student': profile,
            'display_name': display_name,
            'assignments': assignments,
            'submissions': submissions,
            'submitted_ids': submitted_ids,
            'active_tab': 'assignments',
        },
    )


@student_required
def notifications_view(request):
    profile = _get_or_create_student_profile(request.user)
    display_name = request.user.get_full_name() or request.user.username or "Devanath N"
    if request.method == 'POST':
        action = request.POST.get('action', '')
        if action == 'mark_all_read':
            StudentNotification.objects.filter(student=profile, read=False).update(read=True)
            messages.success(request, 'All notifications marked as read.')
        elif action == 'mark_read':
            nid, err = safe_int(request.POST.get('notification_id'), min_val=1)
            if not err:
                StudentNotification.objects.filter(id=nid, student=profile).update(read=True)
        return redirect('portal:notifications')
    notifications = StudentNotification.objects.filter(student=profile).order_by('-created_at')
    return render(
        request,
        'portal/notifications.html',
        {
            'student': profile,
            'display_name': display_name,
            'notifications': notifications,
            'active_tab': 'notifications',
        },
    )


@student_required
def profile_view(request):
    profile = _get_or_create_student_profile(request.user)
    display_name = request.user.get_full_name() or request.user.username or "Devanath N"
    return render(
        request,
        'portal/profile.html',
        {'student': profile, 'display_name': display_name, 'active_tab': 'profile'},
    )


@student_required
def achievements_view(request):
    profile = _get_or_create_student_profile(request.user)
    earned_records = AchievementRecord.objects.filter(student=profile).order_by('-earned_at')
    completed_exams = ExaminationResult.objects.filter(student=profile).count()
    submitted_assignments = AssignmentSubmission.objects.filter(student=profile).count()
    return render(
        request,
        'portal/achievements.html',
        {
            'student': profile,
            'achievements': earned_records,
            'completed_exams': completed_exams,
            'submitted_assignments': submitted_assignments,
            'active_tab': 'achievements',
        },
    )


@student_required
def practice_arena_view(request):
    profile = _get_or_create_student_profile(request.user)
    subjects = Subject.objects.all()

    if request.method == 'POST':
        subject_code = request.POST.get('subject_code', '').strip()
        subject = get_object_or_404(Subject, code=subject_code)
        topic = request.POST.get('topic', 'General Practice').strip() or 'General Practice'
        mode = request.POST.get('mode', 'Standard')
        if mode not in ('Standard', 'Timed Quiz'):
            mode = 'Standard'
        difficulty = request.POST.get('difficulty', 'Mixed')
        total_q, total_err = safe_int(request.POST.get('total_questions', 5), default=5, min_val=1, max_val=100)
        if total_err:
            messages.error(request, f'Invalid question count: {total_err}')
            return redirect('portal:practice_arena')
        correct_q, corr_err = safe_int(request.POST.get('correct_count', 0), default=0, min_val=0, max_val=total_q)
        if corr_err:
            messages.error(request, f'Invalid correct answer count: {corr_err}')
            return redirect('portal:practice_arena')
        duration_sec, dur_err = safe_int(request.POST.get('duration_seconds', 0), default=0, min_val=0, max_val=14400)
        if dur_err:
            duration_sec = 0
        score_pct = round((correct_q / total_q) * 100, 1)

        PracticeAttempt.objects.create(
            student=profile,
            subject=subject,
            topic=topic,
            mode=mode,
            difficulty=difficulty,
            total_questions=total_q,
            correct_count=correct_q,
            score_percent=score_pct,
            duration_seconds=duration_sec,
        )
        messages.success(request, f'Recorded practice score: {correct_q}/{total_q} ({score_pct}%).')
        return redirect('portal:practice_arena')

    attempts = PracticeAttempt.objects.filter(student=profile).select_related('subject')
    return render(
        request,
        'portal/practice_arena.html',
        {
            'student': profile,
            'subjects': subjects,
            'attempts': attempts,
            'active_tab': 'practice_arena',
        },
    )


@student_required
def flashcards_view(request):
    profile = _get_or_create_student_profile(request.user)
    subjects = Subject.objects.all()

    if request.method == 'POST':
        action = request.POST.get('action', 'create_deck')
        if action == 'create_deck':
            subject_code = request.POST.get('subject_code', '').strip()
            subject = get_object_or_404(Subject, code=subject_code)
            unit, unit_err = safe_int(request.POST.get('unit', 1), default=1, min_val=1, max_val=5)
            if unit_err:
                messages.error(request, 'Invalid unit number (expected 1–5).')
                return redirect('portal:flashcards')
            topic = request.POST.get('topic', '').strip() or f'Unit {unit} Revision'
            pdf = SubjectPDF.objects.filter(subject=subject, unit=unit).first() or SubjectPDF.objects.filter(subject=subject).first()

            if pdf is None:
                messages.warning(
                    request,
                    f'No study PDFs have been uploaded for {subject.code} yet. Upload a subject PDF first to ground flashcards.',
                )
                return redirect('portal:flashcards')

            with transaction.atomic():
                deck = FlashcardDeck.objects.create(
                    student=profile,
                    subject=subject,
                    source_pdf=pdf,
                    unit=unit,
                    topic=topic,
                    title=f"{subject.code} Unit {unit}: {topic}",
                )
                Flashcard.objects.create(
                    deck=deck,
                    question=f"Key concept from {pdf.title} (Unit {unit}): Explain {topic}.",
                    answer=f"Grounded in {pdf.file_name} (Unit {unit}, {pdf.chapter}).",
                    topic=topic,
                    unit=unit,
                    source_page_ref=1,
                )
            messages.success(request, f'Created flashcard deck "{deck.title}" grounded in {pdf.file_name}.')
            return redirect('portal:flashcards')

        elif action == 'update_card':
            card_id, card_err = safe_int(request.POST.get('card_id'), min_val=1)
            if card_err:
                messages.error(request, 'Invalid flashcard ID.')
                return redirect('portal:flashcards')
            status = request.POST.get('status', 'Known')
            card = get_object_or_404(Flashcard, id=card_id, deck__student=profile)
            if status in ('Unseen', 'Known', 'Need Revision'):
                card.status = status
                card.save()
            return redirect('portal:flashcards')

    decks = FlashcardDeck.objects.filter(student=profile).select_related('subject', 'source_pdf').prefetch_related('cards')
    return render(
        request,
        'portal/flashcards.html',
        {
            'student': profile,
            'subjects': subjects,
            'decks': decks,
            'active_tab': 'flashcards',
        },
    )


@student_required
def academic_calendar_view(request):
    profile = _get_or_create_student_profile(request.user)
    subjects = Subject.objects.all()

    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        parsed_date, date_err = safe_date(request.POST.get('event_date', ''))
        category = 'Study Reminder'
        subject_code = request.POST.get('subject_code', '').strip()
        description = request.POST.get('description', '').strip()

        if not title or date_err:
            messages.error(request, date_err or 'Reminder title and valid date are required.')
            return redirect('portal:academic_calendar')
        subj = Subject.objects.filter(code=subject_code).first() if subject_code else None
        AcademicCalendarEvent.objects.create(
            title=title[:200],
            event_date=parsed_date,
            category=category,
            subject=subj,
            description=description,
            created_by=request.user,
            is_personal_reminder=True,
        )
        messages.success(request, 'Calendar event saved.')
        return redirect('portal:academic_calendar')

    events = AcademicCalendarEvent.objects.filter(
        Q(is_personal_reminder=False) | Q(created_by=request.user)
    ).select_related('subject')
    timetable_slots = TimetableSlot.objects.select_related('subject').all()
    assignments = Assignment.objects.select_related('subject').all()
    examinations = Examination.objects.select_related('subject').all()

    return render(
        request,
        'portal/academic_calendar.html',
        {
            'student': profile,
            'subjects': subjects,
            'events': events,
            'timetable_slots': timetable_slots,
            'assignments': assignments,
            'examinations': examinations,
            'active_tab': 'academic_calendar',
        },
    )


@student_required
def mark_notice_read_view(request, notice_id):
    notice = get_object_or_404(ImportantNotice, id=notice_id)
    notice.read_by.add(request.user)
    next_url = request.POST.get('next', '').strip()
    if next_url and is_safe_url_for_host(next_url, request):
        return redirect(next_url)
    return redirect('portal:dashboard')


@login_required
def download_notice_attachment_view(request, notice_id):
    notice = get_object_or_404(ImportantNotice, id=notice_id)
    role = _get_user_role(request.user)
    today = timezone.localdate()
    is_visible_to_student = notice.is_published and (notice.expiry_date is None or notice.expiry_date >= today)
    if role not in ('admin', 'faculty') and not is_visible_to_student:
        return HttpResponseForbidden('Notice attachment is not available.')
    if not notice.attachment:
        raise Http404('Notice has no attachment.')
    try:
        fh = notice.attachment.open('rb')
    except FileNotFoundError:
        raise Http404('Notice attachment file is missing on server storage.')
    resp = FileResponse(fh, as_attachment=True, filename=os.path.basename(notice.attachment.name))
    resp['X-Content-Type-Options'] = 'nosniff'
    return resp


@login_required
def manage_notices_view(request):
    role = _get_user_role(request.user)
    if role not in ('admin', 'faculty'):
        return HttpResponseForbidden('Only authorized faculty or administrators can manage important notices.')

    if request.method == 'POST':
        action = request.POST.get('action', 'create')
        if action == 'create':
            title = request.POST.get('title', '').strip()
            description = request.POST.get('description', '').strip()
            pub_raw = request.POST.get('publication_date') or timezone.localdate().isoformat()
            pub_date, pub_err = safe_date(pub_raw)
            exp_date, exp_err = safe_date(request.POST.get('expiry_date', ''), allow_none=True)
            priority = request.POST.get('priority', 'Normal')
            category = request.POST.get('category', 'Academic Notice')
            if priority not in {'Normal', 'Important', 'Urgent'}:
                priority = 'Normal'
            if category not in {c[0] for c in ImportantNotice.CATEGORY_CHOICES}:
                category = 'Academic Notice'
            is_published = request.POST.get('is_published') == 'on'
            attachment = request.FILES.get('attachment')

            if not title or not description:
                messages.error(request, 'Notice title and description are required.')
                return redirect('portal:manage_notices')
            if pub_err or exp_err:
                messages.error(request, pub_err or exp_err)
                return redirect('portal:manage_notices')
            if exp_date is not None and pub_date is not None and exp_date < pub_date:
                messages.error(request, 'Expiry date cannot be earlier than publication date.')
                return redirect('portal:manage_notices')
            if attachment is not None:
                safe_name, upload_err = validate_uploaded_file(attachment)
                if upload_err:
                    messages.error(request, upload_err)
                    return redirect('portal:manage_notices')
                attachment.name = safe_name

            ImportantNotice.objects.create(
                title=title[:220],
                description=description,
                publication_date=pub_date,
                expiry_date=exp_date,
                priority=priority,
                category=category,
                is_published=is_published,
                attachment=attachment,
                created_by=request.user,
            )
            _record_audit(request, 'notice_created', target=title[:120])
            messages.success(request, 'Important notice saved.')
        elif action == 'toggle':
            notice_id, err = safe_int(request.POST.get('notice_id'), min_val=1)
            if not err:
                notice = get_object_or_404(ImportantNotice, id=notice_id)
                notice.is_published = not notice.is_published
                notice.save(update_fields=['is_published'])
        elif action == 'delete':
            notice_id, err = safe_int(request.POST.get('notice_id'), min_val=1)
            if not err:
                notice = get_object_or_404(ImportantNotice, id=notice_id)
                notice.delete()
        return redirect('portal:manage_notices')

    notices = ImportantNotice.objects.select_related('created_by').all()
    return render(
        request,
        'portal/notices_manage.html',
        {
            'notices': notices,
            'active_tab': 'dashboard',
        },
    )


@student_required
def coding_lab_execute_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required.'}, status=405)
    code = request.POST.get('code', '')
    expected_stdout = request.POST.get('expected_stdout', '')
    result = _execute_python_isolated(code, expected_stdout)
    status = result.pop('status', 200)
    return JsonResponse(result, status=status)


# -------------------------------------------------------------
# 8 INTEGRATED MCA SMART CAMPUS STUDENT MODULES (STUDENT ISOLATED)
# -------------------------------------------------------------

def _render_student_smart_module(request, tab_key, title, subtitle, extra=None):
    profile = _get_or_create_student_profile(request.user)
    ctx = {
        'student': profile,
        'subjects': Subject.objects.all(),
        'module_title': title,
        'module_subtitle': subtitle,
        'active_tab': tab_key,
    }
    if extra:
        ctx.update(extra)
    return render(request, 'portal/smart_campus_module.html', ctx)


@student_required
def academic_intelligence_view(request):
    profile = _get_or_create_student_profile(request.user)
    return _render_student_smart_module(
        request,
        'academic_intelligence',
        'Academic Intelligence & Weak-Area Engine',
        'Subject readiness diagnostics and early-warning risk analysis derived from assessments.',
        {'results': ExaminationResult.objects.filter(student=profile).select_related('examination', 'examination__subject')},
    )


@student_required
def skill_dna_view(request):
    profile = _get_or_create_student_profile(request.user)
    if request.method == 'POST':
        domain = request.POST.get('domain', '').strip()
        title = request.POST.get('title', '').strip()
        evidence_url = request.POST.get('evidence_url', '').strip()
        if domain and title:
            SkillEvidence.objects.create(
                student=profile,
                domain=domain[:100],
                title=title[:220],
                evidence_url=evidence_url[:400],
                status='Pending Review',
            )
            messages.success(request, 'Skill evidence submitted for faculty verification.')
        else:
            messages.error(request, 'Skill domain and title are required.')
        return redirect('portal:skill_dna')
    evidences = SkillEvidence.objects.filter(student=profile).select_related('reviewed_by')
    return _render_student_smart_module(
        request,
        'skill_dna',
        'Skill DNA & Verified Competency Profile',
        'Skills grow exclusively through verified labs, assessments, projects, and faculty-approved evidence — never passive note views.',
        {'evidences': evidences},
    )


@student_required
def project_studio_view(request):
    profile = _get_or_create_student_profile(request.user)
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        summary = request.POST.get('summary', '').strip()
        subject_code = request.POST.get('subject_code', '').strip()
        subj = Subject.objects.filter(code=subject_code).first() if subject_code else None
        if title and summary:
            StudentProject.objects.create(
                student=profile,
                subject=subj,
                title=title[:220],
                summary=summary,
                github_url=request.POST.get('github_url', '').strip()[:400],
                status='Under Review',
            )
            messages.success(request, 'Project submitted to Faculty Showcase review queue.')
        else:
            messages.error(request, 'Project title and summary are required.')
        return redirect('portal:project_studio')
    projects = StudentProject.objects.filter(student=profile).select_related('subject')
    return _render_student_smart_module(
        request,
        'project_studio',
        'Project Studio & Capstone Showcase',
        'Semester project milestones, repository tracking, and faculty evaluation.',
        {'projects': projects},
    )


@student_required
def career_readiness_view(request):
    profile = _get_or_create_student_profile(request.user)
    verified_skills = SkillEvidence.objects.filter(student=profile, status='Verified').select_related('reviewed_by')
    return _render_student_smart_module(
        request,
        'career_readiness',
        'Career Readiness & Technical Interview Prep',
        'Guided interview preparation and Skill DNA job-readiness matching (practice aid; does not guarantee job placement).',
        {'verified_skills': verified_skills},
    )


@student_required
def study_planner_view(request):
    return _render_student_smart_module(
        request,
        'study_planner',
        'Smart Study Planner & Revision Engine',
        'Personal weekly study blocks alongside read-only official exam dates and faculty revision advisories.',
    )


@student_required
def knowledge_graph_view(request):
    edges = KnowledgeEdge.objects.select_related('subject').all()
    return _render_student_smart_module(
        request,
        'knowledge_graph',
        'Academic Knowledge Graph',
        'Interactive prerequisite links connecting Semesters, Subjects, Syllabus Units, and Projects.',
        {'edges': edges},
    )


@student_required
def challenge_arena_view(request):
    profile = _get_or_create_student_profile(request.user)
    if request.method == 'POST':
        chal_id, id_err = safe_int(request.POST.get('challenge_id'), min_val=1)
        if id_err:
            messages.error(request, 'Invalid challenge selected.')
            return redirect('portal:challenge_arena')
        challenge = get_object_or_404(Challenge, id=chal_id, is_published=True)
        score_val, score_err = safe_int(request.POST.get('score', 80), default=80, min_val=0, max_val=100)
        if score_err:
            score_val = 0
        ChallengeAttempt.objects.create(
            challenge=challenge,
            student=profile,
            score=score_val,
            passed=score_val >= 60,
        )
        messages.success(request, f'Recorded attempt on "{challenge.title}": {score_val}%.')
        return redirect('portal:challenge_arena')

    challenges = Challenge.objects.filter(is_published=True).select_related('subject')
    attempts = ChallengeAttempt.objects.filter(student=profile).select_related('challenge', 'challenge__subject').order_by('-submitted_at')
    return _render_student_smart_module(
        request,
        'challenge_arena',
        'Competitive Challenge Arena',
        'Timed Coding Lab challenges and Subject Quizzes with leaderboard points.',
        {'challenges': challenges, 'attempts': attempts},
    )


@student_required
def digital_passport_view(request):
    profile = _get_or_create_student_profile(request.user)
    verified_skills = SkillEvidence.objects.filter(student=profile, status='Verified').select_related('reviewed_by')
    approved_projects = StudentProject.objects.filter(student=profile, showcase_approved=True).select_related('subject')
    certificates = IssuedCertificate.objects.filter(student=profile).select_related('issued_by')
    return _render_student_smart_module(
        request,
        'digital_passport',
        'MCA Digital Academic Passport',
        'Portable verified skills, showcase projects, badges, and certificates with explicit student privacy controls.',
        {
            'verified_skills': verified_skills,
            'approved_projects': approved_projects,
            'certificates': certificates,
        },
    )


# -------------------------------------------------------------
# DEDICATED FACULTY PORTAL VIEWS (SUBJECT & PERMISSION ISOLATED)
# -------------------------------------------------------------

def _faculty_context(request, active_tab, title):
    allocations = FacultyAllocation.objects.filter(faculty=request.user).select_related('subject')
    subjects = [alloc.subject for alloc in allocations]
    perms = set()
    for alloc in allocations:
        perms.update(alloc.permissions_json or [])
    if not allocations.exists():
        rp = getattr(request.user, 'roleprofile', None)
        perms.update((rp.faculty_permissions_json if rp else None) or [])
    return {
        'active_tab': active_tab,
        'page_title': title,
        'subjects': subjects,
        'faculty_permissions': sorted(perms),
        'advisor_name': request.user.get_full_name() or 'HCASICAN',
    }


@faculty_required
def faculty_overview_view(request):
    ctx = _faculty_context(request, 'faculty_overview', 'Faculty Academic Workspace')
    allocated_codes = _faculty_subject_codes(request.user)
    ctx.update({
        'pending_skills_count': SkillEvidence.objects.filter(status='Pending Review').count(),
        'pending_projects_count': StudentProject.objects.filter(
            Q(subject__code__in=allocated_codes) | Q(subject__isnull=True),
            status='Under Review',
        ).count(),
        'question_count': QuestionBankItem.objects.filter(subject__code__in=allocated_codes).count(),
        'materials_count': SubjectPDF.objects.filter(subject__code__in=allocated_codes).count(),
    })
    return render(request, 'faculty/overview.html', ctx)


@faculty_required
def faculty_subjects_view(request):
    ctx = _faculty_context(request, 'faculty_subjects', 'Assigned Subjects & Syllabus')
    return render(request, 'faculty/overview.html', ctx)


@faculty_permission_required('manage_materials')
def faculty_materials_view(request):
    allocated_codes = _faculty_subject_codes(request.user)
    if request.method == 'POST':
        subject_code = request.POST.get('subject_code', '').strip()
        if not _faculty_has_permission(request.user, 'manage_materials', subject_code=subject_code):
            _record_audit(request, 'blocked_unallocated_subject_write', target=subject_code)
            return HttpResponseForbidden(f'Access denied: Subject "{subject_code}" is not allocated to your faculty account.')
        subj = get_object_or_404(Subject, code=subject_code)
        title = request.POST.get('title', '').strip()
        chapter = request.POST.get('chapter', '').strip() or 'Core Unit'
        unit, unit_err = safe_int(request.POST.get('unit', 1), default=1, min_val=1, max_val=5)
        pdf_file = request.FILES.get('file')
        if not title or unit_err:
            messages.error(request, unit_err or 'Document title and unit (1–5) are required.')
            return redirect('portal:faculty_materials')
        file_name = request.POST.get('file_name', '').strip() or f'{subj.code.lower()}_unit_{unit}.pdf'
        if pdf_file is not None:
            safe_name, up_err = validate_uploaded_file(pdf_file, allowed_exts=('.pdf',))
            if up_err:
                messages.error(request, up_err)
                return redirect('portal:faculty_materials')
            file_name = safe_name
        SubjectPDF.objects.create(
            subject=subj,
            title=title[:200],
            file_name=file_name[:200],
            unit=unit,
            chapter=chapter[:200],
            uploaded_by=request.user.get_full_name() or request.user.username,
        )
        _record_audit(request, 'faculty_upload_pdf', target=f'{subj.code}: {title[:80]}')
        messages.success(request, f'Added PDF resource "{title}" to {subj.code}.')
        return redirect('portal:faculty_materials')

    ctx = _faculty_context(request, 'faculty_materials', 'Faculty Document Management')
    ctx['subject_pdfs'] = SubjectPDF.objects.filter(subject__code__in=allocated_codes).select_related('subject')
    return render(request, 'faculty/overview.html', ctx)


@faculty_permission_required('create_assessments')
def faculty_question_bank_view(request):
    allocated_codes = _faculty_subject_codes(request.user)
    if request.method == 'POST':
        subject_code = request.POST.get('subject_code', '').strip()
        if not _faculty_has_permission(request.user, 'create_assessments', subject_code=subject_code):
            _record_audit(request, 'blocked_unallocated_subject_write', target=subject_code)
            return HttpResponseForbidden(f'Access denied: Subject "{subject_code}" is not allocated to your faculty account.')
        subj = get_object_or_404(Subject, code=subject_code)
        prompt = request.POST.get('prompt', '').strip()
        unit_val, unit_err = safe_int(request.POST.get('unit', 1), default=1, min_val=1, max_val=5)
        if unit_err:
            messages.error(request, unit_err)
            return redirect('portal:faculty_question_bank')
        if prompt:
            QuestionBankItem.objects.create(
                subject=subj,
                unit=unit_val,
                topic=request.POST.get('topic', 'Core').strip() or 'Core',
                question_type=request.POST.get('question_type', 'MCQ'),
                prompt=prompt,
                answer=request.POST.get('answer', '').strip(),
                created_by=request.user,
            )
            messages.success(request, 'Question added to Faculty Question Bank.')
        return redirect('portal:faculty_question_bank')
    ctx = _faculty_context(request, 'faculty_question_bank', 'Faculty Question Bank')
    qs = QuestionBankItem.objects.filter(subject__code__in=allocated_codes).select_related('subject').order_by('-created_at')
    page_obj = Paginator(qs, 20).get_page(request.GET.get('page', 1))
    ctx['questions'] = page_obj.object_list
    ctx['page_obj'] = page_obj
    return render(request, 'faculty/overview.html', ctx)


@faculty_permission_required('create_assessments')
def faculty_assessments_view(request):
    allocated_codes = _faculty_subject_codes(request.user)
    if request.method == 'POST':
        kind = request.POST.get('kind', 'assignment')
        subject_code = request.POST.get('subject_code', '').strip()
        if not _faculty_has_permission(request.user, 'create_assessments', subject_code=subject_code):
            return HttpResponseForbidden(f'Access denied: Subject "{subject_code}" is not allocated to your faculty account.')
        subj = get_object_or_404(Subject, code=subject_code)
        title = request.POST.get('title', '').strip()
        due_date, date_err = safe_date(request.POST.get('due_date', ''))
        marks, marks_err = safe_int(request.POST.get('total_marks', 30), default=30, min_val=1, max_val=200)
        if not title or date_err or marks_err:
            messages.error(request, date_err or marks_err or 'Title, valid due date, and total marks are required.')
            return redirect('portal:faculty_assessments')
        if kind == 'examination':
            passing_marks = max(1, marks // 2)
            Examination.objects.create(
                title=title[:200],
                subject=subj,
                total_marks=marks,
                passing_marks=passing_marks,
                due_date=due_date,
            )
            messages.success(request, f'Examination "{title}" created.')
        else:
            Assignment.objects.create(
                title=title[:200],
                subject=subj,
                unit=1,
                chapter=request.POST.get('chapter', 'Unit 1').strip()[:200] or 'Unit 1',
                topic=request.POST.get('topic', title).strip()[:200] or title[:200],
                total_marks=marks,
                due_date=due_date,
            )
            messages.success(request, f'Assignment "{title}" created.')
        return redirect('portal:faculty_assessments')

    ctx = _faculty_context(request, 'faculty_assessments', 'Assessments & Examinations Authoring')
    ctx['assignments'] = Assignment.objects.filter(subject__code__in=allocated_codes).select_related('subject')
    ctx['examinations'] = Examination.objects.filter(subject__code__in=allocated_codes).select_related('subject')
    return render(request, 'faculty/overview.html', ctx)


@faculty_required
def faculty_coding_lab_view(request):
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        category = request.POST.get('category', 'Algorithms').strip()
        difficulty = request.POST.get('difficulty', 'Medium').strip()
        description = request.POST.get('description', '').strip()
        starter_code = request.POST.get('starter_code', '').strip() or 'print("Hello MCA")'
        if not title or not description:
            messages.error(request, 'Problem title and description are required.')
            return redirect('portal:faculty_coding_lab')
        CodingProblem.objects.create(
            title=title[:200],
            category=category[:100],
            difficulty=difficulty if difficulty in ('Easy', 'Medium', 'Hard') else 'Medium',
            description=description,
            starter_code=starter_code,
        )
        messages.success(request, f'Coding problem "{title}" added to lab.')
        return redirect('portal:faculty_coding_lab')
    ctx = _faculty_context(request, 'faculty_coding_lab', 'Coding Lab Authoring')
    ctx['problems'] = CodingProblem.objects.all()
    return render(request, 'faculty/overview.html', ctx)


@faculty_permission_required('evaluate_submissions')
def faculty_submissions_view(request):
    allocated_codes = _faculty_subject_codes(request.user)
    if request.method == 'POST':
        sub_id, id_err = safe_int(request.POST.get('submission_id'), min_val=1)
        if id_err:
            messages.error(request, 'Invalid submission selected.')
            return redirect('portal:faculty_submissions')
        sub = get_object_or_404(
            AssignmentSubmission.objects.select_related('assignment', 'assignment__subject'),
            id=sub_id,
        )
        if sub.assignment.subject.code not in allocated_codes:
            return HttpResponseForbidden('Access denied: Submission belongs to an unallocated subject.')
        max_marks = sub.assignment.total_marks or 100
        marks, marks_err = safe_int(request.POST.get('marks_obtained'), min_val=0, max_val=max_marks)
        if marks_err:
            messages.error(request, f'Marks must be an integer between 0 and {max_marks}.')
            return redirect('portal:faculty_submissions')
        sub.marks_obtained = marks
        sub.feedback = request.POST.get('feedback', '').strip()[:2000]
        sub.status = 'Evaluated'
        sub.save(update_fields=['marks_obtained', 'feedback', 'status'])
        messages.success(request, f'Evaluated submission for {sub.student.roll_number}: {marks}/{max_marks}.')
        return redirect('portal:faculty_submissions')

    ctx = _faculty_context(request, 'faculty_submissions', 'Student Submissions & Evaluation')
    qs = AssignmentSubmission.objects.filter(
        assignment__subject__code__in=allocated_codes
    ).select_related('assignment', 'assignment__subject', 'student', 'student__user').order_by('-submitted_at')
    page_obj = Paginator(qs, 20).get_page(request.GET.get('page', 1))
    ctx['submissions'] = page_obj.object_list
    ctx['page_obj'] = page_obj
    return render(request, 'faculty/overview.html', ctx)


@faculty_permission_required('review_projects')
def faculty_projects_view(request):
    allocated_codes = _faculty_subject_codes(request.user)
    if request.method == 'POST':
        proj_id, id_err = safe_int(request.POST.get('project_id'), min_val=1)
        if id_err:
            messages.error(request, 'Invalid project ID.')
            return redirect('portal:faculty_projects')
        proj = get_object_or_404(StudentProject.objects.select_related('subject'), id=proj_id)
        if proj.subject and proj.subject.code not in allocated_codes:
            return HttpResponseForbidden('Access denied: Project belongs to an unallocated subject.')
        proj.status = request.POST.get('status', 'Verified')
        proj.showcase_approved = request.POST.get('showcase_approved') == 'on'
        proj.faculty_feedback = request.POST.get('faculty_feedback', '')
        proj.save()
        messages.success(request, f'Project "{proj.title}" review updated.')
        return redirect('portal:faculty_projects')
    ctx = _faculty_context(request, 'faculty_projects', 'Project Review & Showcase Approval')
    ctx['projects'] = StudentProject.objects.filter(
        Q(subject__code__in=allocated_codes) | Q(subject__isnull=True)
    ).select_related('student', 'student__user', 'subject')
    return render(request, 'faculty/overview.html', ctx)


@faculty_permission_required('verify_skills')
def faculty_skill_dna_view(request):
    if request.method == 'POST':
        ev_id, id_err = safe_int(request.POST.get('evidence_id'), min_val=1)
        if id_err:
            messages.error(request, 'Invalid skill evidence ID.')
            return redirect('portal:faculty_skill_dna')
        ev = get_object_or_404(SkillEvidence, id=ev_id)
        ev.status = request.POST.get('status', 'Verified')
        ev.reviewed_by = request.user
        if ev.status == 'Verified':
            pts, pts_err = safe_int(request.POST.get('points', 15), default=15, min_val=0, max_val=100)
            ev.awarded_points = 15 if pts_err else pts
        ev.save()
        messages.success(request, f'Skill evidence "{ev.title}" updated.')
        return redirect('portal:faculty_skill_dna')
    ctx = _faculty_context(request, 'faculty_skill_dna', 'Skill DNA Verification Queue')
    ctx['evidences'] = SkillEvidence.objects.select_related('student', 'student__user').all()
    return render(request, 'faculty/overview.html', ctx)


@faculty_required
def faculty_knowledge_graph_view(request):
    allocated_codes = _faculty_subject_codes(request.user)
    if request.method == 'POST':
        subj_code = request.POST.get('subject_code', '').strip()
        if subj_code not in allocated_codes:
            return HttpResponseForbidden(f'Access denied: Subject "{subj_code}" is not allocated to your faculty account.')
        subj = get_object_or_404(Subject, code=subj_code)
        src = request.POST.get('source_node', '').strip()
        tgt = request.POST.get('target_node', '').strip()
        if src and tgt:
            KnowledgeEdge.objects.create(subject=subj, source_node=src, target_node=tgt, created_by=request.user)
            messages.success(request, 'Knowledge Graph link added.')
        return redirect('portal:faculty_knowledge_graph')
    ctx = _faculty_context(request, 'faculty_knowledge_graph', 'Knowledge Graph Curricular Links')
    ctx['edges'] = KnowledgeEdge.objects.filter(subject__code__in=allocated_codes).select_related('subject')
    return render(request, 'faculty/overview.html', ctx)


@faculty_permission_required('create_challenges')
def faculty_challenges_view(request):
    allocated_codes = _faculty_subject_codes(request.user)
    if request.method == 'POST':
        subject_code = request.POST.get('subject_code', '').strip()
        if not _faculty_has_permission(request.user, 'create_challenges', subject_code=subject_code):
            return HttpResponseForbidden(f'Access denied: Subject "{subject_code}" is not allocated to your faculty account.')
        subj = get_object_or_404(Subject, code=subject_code)
        title = request.POST.get('title', '').strip()
        duration, dur_err = safe_int(request.POST.get('duration_minutes', 20), default=20, min_val=5, max_val=180)
        if not title or dur_err:
            messages.error(request, dur_err or 'Challenge title is required.')
            return redirect('portal:faculty_challenges')
        Challenge.objects.create(
            title=title[:220],
            category=request.POST.get('category', 'Timed Coding').strip()[:60] or 'Timed Coding',
            difficulty=request.POST.get('difficulty', 'Medium').strip()[:20] or 'Medium',
            subject=subj,
            duration_minutes=duration,
            is_published=True,
            created_by=request.user,
        )
        messages.success(request, f'Challenge "{title}" published.')
        return redirect('portal:faculty_challenges')
    ctx = _faculty_context(request, 'faculty_challenges', 'Challenge Arena Creation')
    ctx['challenges'] = Challenge.objects.filter(subject__code__in=allocated_codes).select_related('subject')
    return render(request, 'faculty/overview.html', ctx)


# -------------------------------------------------------------
# DEDICATED ADMIN PORTAL VIEWS (ROLE-ISOLATED GOVERNANCE)
# -------------------------------------------------------------

def _admin_context(active_tab, title):
    return {
        'active_tab': active_tab,
        'page_title': title,
        'semesters': Semester.objects.all(),
        'subjects': Subject.objects.all(),
        'advisor_name': 'HCASICAN',
    }


@admin_required
def admin_overview_view(request):
    ctx = _admin_context('admin_overview', 'Institutional Admin Overview')
    ctx.update({
        'students_count': StudentProfile.objects.count(),
        'faculty_count': RoleProfile.objects.filter(role='faculty').count(),
        'subjects_count': Subject.objects.count(),
        'notices_count': ImportantNotice.active_published().count(),
    })
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_users_view(request):
    ctx = _admin_context('admin_users', 'User & Account Governance')
    if request.method == 'POST':
        action = request.POST.get('action', '').strip()

        if action == 'create_user':
            username = request.POST.get('username', '').strip().lower()
            email = request.POST.get('email', '').strip()
            full_name = request.POST.get('full_name', '').strip()
            institutional_id = request.POST.get('institutional_id', '').strip().upper()
            role = request.POST.get('role', 'student').strip().lower()
            temp_password = request.POST.get('temporary_password', '')

            if role not in ('student', 'faculty', 'admin'):
                messages.error(request, 'Invalid institutional role specified.')
                return redirect('portal:admin_users')
            if not username or not institutional_id or not temp_password:
                messages.error(request, 'Username, Institutional ID, and an initial temporary password are required.')
                return redirect('portal:admin_users')
            if User.objects.filter(username__iexact=username).exists() or RoleProfile.objects.filter(institutional_id__iexact=institutional_id).exists():
                messages.error(request, 'Username or Institutional ID is already registered.')
                return redirect('portal:admin_users')

            first_name, _, last_name = full_name.partition(' ')
            candidate_user = User(
                username=username,
                email=email,
                first_name=first_name or username,
                last_name=last_name,
                is_active=True,
                is_staff=(role in ('faculty', 'admin')),
                is_superuser=False,  # Ordinary MCA Smart Campus roles NEVER grant Django technical superuser
            )
            try:
                validate_password(temp_password, user=candidate_user)
            except ValidationError as exc:
                for err in exc.messages:
                    messages.error(request, err)
                return redirect('portal:admin_users')

            candidate_user.set_password(temp_password)
            with transaction.atomic():
                candidate_user.save()
                RoleProfile.objects.create(
                    user=candidate_user,
                    role=role,
                    institutional_id=institutional_id,
                    is_active=True,
                    must_change_password=True,
                    department='Department of Computer Applications',
                )
                if role == 'student':
                    StudentProfile.objects.create(
                        user=candidate_user,
                        student_id=institutional_id,
                        roll_number=institutional_id,
                        advisor_name='HCASICAN',
                    )
            _record_audit(request, 'admin_create_user', target=f'{username} ({role}, {institutional_id})')
            messages.success(request, f'Created {role} account "{username}" ({institutional_id}). First-login password setup enforced.')
            return redirect('portal:admin_users')

        elif action == 'change_role':
            rp = get_object_or_404(RoleProfile, id=request.POST.get('role_profile_id'))
            new_role = request.POST.get('role', '').strip().lower()
            if new_role in ('student', 'faculty', 'admin'):
                with transaction.atomic():
                    rp.role = new_role
                    rp.save(update_fields=['role'])
                    rp.user.is_staff = new_role in ('faculty', 'admin')
                    rp.user.is_superuser = False  # Strict separation from Django technical superuser
                    rp.user.save(update_fields=['is_staff', 'is_superuser'])
                    if new_role == 'student' and not hasattr(rp.user, 'studentprofile'):
                        StudentProfile.objects.create(
                            user=rp.user,
                            student_id=rp.institutional_id,
                            roll_number=rp.institutional_id,
                        )
                _record_audit(request, 'admin_change_role', target=f'{rp.user.username} -> {new_role}')
                messages.success(request, f'Updated role for {rp.user.username} to {new_role}.')
            return redirect('portal:admin_users')

        elif action == 'toggle_active':
            rp = get_object_or_404(RoleProfile, id=request.POST.get('role_profile_id'))
            if rp.user == request.user:
                messages.error(request, 'Administrators cannot deactivate their own active session account.')
                return redirect('portal:admin_users')
            new_state = not rp.is_active
            with transaction.atomic():
                rp.is_active = new_state
                rp.save(update_fields=['is_active'])
                rp.user.is_active = new_state
                rp.user.save(update_fields=['is_active'])
            _record_audit(request, 'admin_toggle_active', target=f'{rp.user.username} active={new_state}')
            messages.success(request, f'Account "{rp.user.username}" is now {"Active" if new_state else "Inactive"}.')
            return redirect('portal:admin_users')

        elif action == 'initiate_password_reset':
            rp = get_object_or_404(RoleProfile, id=request.POST.get('role_profile_id'))
            rp.must_change_password = True
            rp.save(update_fields=['must_change_password'])
            uidb64 = urlsafe_base64_encode(force_bytes(rp.user.pk))
            token = default_token_generator.make_token(rp.user)
            reset_url = reverse('portal:password_reset_confirm', kwargs={'uidb64': uidb64, 'token': token})
            _record_audit(request, 'admin_initiate_password_reset', target=rp.user.username)
            ctx['initiated_reset_url'] = reset_url
            ctx['initiated_reset_user'] = rp.user.username
            messages.success(request, f'Issued time-limited password reset link for {rp.user.username}.')

    rp_qs = RoleProfile.objects.select_related('user').all().order_by('role', 'institutional_id')
    page_obj = Paginator(rp_qs, 25).get_page(request.GET.get('page', 1))
    ctx['role_profiles'] = page_obj.object_list
    ctx['page_obj'] = page_obj
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_academics_view(request):
    if request.method == 'POST':
        action = request.POST.get('action', 'configure_semester')
        if action == 'add_subject':
            code = request.POST.get('code', '').strip().upper()
            name = request.POST.get('name', '').strip()
            credits, cred_err = safe_int(request.POST.get('credits', 4), default=4, min_val=1, max_val=8)
            instructor = request.POST.get('instructor', 'MCA Faculty').strip() or 'MCA Faculty'
            if not code or not name or cred_err:
                messages.error(request, cred_err or 'Subject code and name are required.')
                return redirect('portal:admin_academics')
            if Subject.objects.filter(code__iexact=code).exists():
                messages.error(request, f'Subject code "{code}" already exists.')
                return redirect('portal:admin_academics')
            Subject.objects.create(
                code=code[:20],
                name=name[:150],
                credits=credits,
                course_type=request.POST.get('course_type', 'Core').strip()[:50] or 'Core',
                instructor=instructor[:120],
                description=request.POST.get('description', '').strip() or f'{name} postgraduate curriculum.',
            )
            _record_audit(request, 'admin_add_subject', target=f'{code} - {name}')
            messages.success(request, f'Added subject {code} - {name}.')
            return redirect('portal:admin_academics')

        sem_num, sem_err = safe_int(request.POST.get('semester_number', 1), default=1, min_val=1, max_val=4)
        if sem_err:
            messages.error(request, 'Semester number must be between 1 and 4.')
            return redirect('portal:admin_academics')
        title = request.POST.get('title', '').strip()
        desc = request.POST.get('description', '').strip()
        sem, _ = Semester.objects.get_or_create(number=sem_num, defaults={'title': title or f'Semester {sem_num}'})
        if title:
            sem.title = title
        sem.description = desc
        sem.is_configured = request.POST.get('is_configured') == 'on'
        sem.is_active = request.POST.get('is_active') == 'on'
        sem.save()
        _record_audit(request, 'configure_semester', target=f'Semester {sem_num}')
        messages.success(request, f'Semester {sem_num} configuration updated.')
        return redirect('portal:admin_academics')
    ctx = _admin_context('admin_academics', 'Programme & Semesters 1–4 Configuration')
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_allocations_view(request):
    if request.method == 'POST':
        faculty_id = request.POST.get('faculty_id')
        faculty_user = get_object_or_404(User, id=faculty_id, roleprofile__role='faculty')
        selected_codes = request.POST.getlist('subject_codes')
        selected_perms = [p for p in request.POST.getlist('permissions') if p in ALL_FACULTY_PERMISSIONS]

        with transaction.atomic():
            FacultyAllocation.objects.filter(faculty=faculty_user).exclude(subject__code__in=selected_codes).delete()
            for code in selected_codes:
                subj = Subject.objects.filter(code=code).first()
                if subj:
                    FacultyAllocation.objects.update_or_create(
                        faculty=faculty_user,
                        subject=subj,
                        defaults={'permissions_json': selected_perms},
                    )
            rp = faculty_user.roleprofile
            rp.faculty_permissions_json = selected_perms
            rp.save(update_fields=['faculty_permissions_json'])
        _record_audit(request, 'admin_update_allocations', target=f'{faculty_user.username}: {selected_codes}')
        messages.success(request, f'Saved subject allocations & permissions for {faculty_user.username}.')
        return redirect('portal:admin_allocations')

    ctx = _admin_context('admin_allocations', 'Faculty Subject Allocations & Permissions')
    ctx['allocations'] = FacultyAllocation.objects.select_related('faculty', 'subject').all()
    ctx['faculty_profiles'] = RoleProfile.objects.filter(role='faculty').select_related('user')
    ctx['all_permissions'] = ALL_FACULTY_PERMISSIONS
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_materials_view(request):
    if request.method == 'POST':
        action = request.POST.get('action', 'add_pdf')
        if action == 'delete_pdf':
            pdf_id, err = safe_int(request.POST.get('pdf_id'), min_val=1)
            if not err:
                pdf = get_object_or_404(SubjectPDF, id=pdf_id)
                _record_audit(request, 'admin_delete_pdf', target=f'{pdf.subject.code}: {pdf.title}')
                pdf.delete()
                messages.success(request, 'Removed subject PDF record.')
            return redirect('portal:admin_materials')

        subject_code = request.POST.get('subject_code', '').strip()
        subj = get_object_or_404(Subject, code=subject_code)
        title = request.POST.get('title', '').strip()
        chapter = request.POST.get('chapter', '').strip() or 'Core Chapter'
        unit, unit_err = safe_int(request.POST.get('unit', 1), default=1, min_val=1, max_val=5)
        pdf_file = request.FILES.get('file')
        if not title or unit_err:
            messages.error(request, unit_err or 'Document title and unit (1–5) are required.')
            return redirect('portal:admin_materials')
        file_name = request.POST.get('file_name', '').strip() or f'{subj.code.lower()}_unit_{unit}.pdf'
        if pdf_file is not None:
            safe_name, up_err = validate_uploaded_file(pdf_file, allowed_exts=('.pdf',))
            if up_err:
                messages.error(request, up_err)
                return redirect('portal:admin_materials')
            file_name = safe_name
        SubjectPDF.objects.create(
            subject=subj,
            title=title[:200],
            file_name=file_name[:200],
            unit=unit,
            chapter=chapter[:200],
            uploaded_by=request.user.get_full_name() or 'Campus Admin',
        )
        _record_audit(request, 'admin_add_pdf', target=f'{subj.code}: {title[:80]}')
        messages.success(request, f'Added document "{title}" to {subj.code}.')
        return redirect('portal:admin_materials')

    ctx = _admin_context('admin_materials', 'Document & Material Governance')
    ctx['subject_pdfs'] = SubjectPDF.objects.select_related('subject').all()
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_notices_view(request):
    if request.method == 'POST':
        action = request.POST.get('action', '')
        notice_id, err = safe_int(request.POST.get('notice_id'), min_val=1)
        if not err:
            notice = get_object_or_404(ImportantNotice, id=notice_id)
            if action == 'toggle':
                notice.is_published = not notice.is_published
                notice.save(update_fields=['is_published'])
                _record_audit(request, 'admin_toggle_notice', target=f'{notice.title} published={notice.is_published}')
                messages.success(request, f'Notice "{notice.title}" visibility updated.')
            elif action == 'delete':
                _record_audit(request, 'admin_delete_notice', target=notice.title)
                notice.delete()
                messages.success(request, 'Notice deleted.')
        return redirect('portal:admin_notices')

    ctx = _admin_context('admin_notices', 'Notice Governance')
    ctx['notices'] = ImportantNotice.objects.select_related('created_by').all()
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_certificates_view(request):
    if request.method == 'POST':
        action = request.POST.get('action', 'issue')
        if action == 'revoke':
            cert_id, err = safe_int(request.POST.get('certificate_id'), min_val=1)
            if not err:
                cert = get_object_or_404(IssuedCertificate, id=cert_id)
                _record_audit(request, 'admin_revoke_certificate', target=cert.certificate_code)
                cert.delete()
                messages.success(request, 'Certificate revoked.')
            return redirect('portal:admin_certificates')

        student_id, id_err = safe_int(request.POST.get('student_id'), min_val=1)
        title = request.POST.get('title', '').strip()
        if id_err or not title:
            messages.error(request, 'Student selection and certificate title are required.')
            return redirect('portal:admin_certificates')
        student = get_object_or_404(StudentProfile, id=student_id)
        code = f'MCA-{timezone.localdate().year}-{secrets.token_hex(4).upper()}'
        IssuedCertificate.objects.create(
            student=student,
            title=title[:220],
            certificate_code=code,
            issued_by=request.user,
        )
        _record_audit(request, 'admin_issue_certificate', target=f'{student.roll_number}: {code}')
        messages.success(request, f'Issued certificate {code} to {student.roll_number}.')
        return redirect('portal:admin_certificates')

    ctx = _admin_context('admin_certificates', 'Certificates & Official Credentials')
    ctx['certificates'] = IssuedCertificate.objects.select_related('student', 'student__user', 'issued_by').all()
    ctx['students'] = StudentProfile.objects.select_related('user').all()
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_settings_view(request):
    ctx = _admin_context('admin_settings', 'Smart Campus Feature Governance')
    return render(request, 'admin/overview.html', ctx)


@admin_required
def admin_audit_logs_view(request):
    ctx = _admin_context('admin_audit_logs', 'System Audit Trail')
    logs_qs = AuditLog.objects.select_related('actor').all()
    page_obj = Paginator(logs_qs, 25).get_page(request.GET.get('page', 1))
    ctx['audit_logs'] = page_obj.object_list
    ctx['page_obj'] = page_obj
    return render(request, 'admin/overview.html', ctx)
