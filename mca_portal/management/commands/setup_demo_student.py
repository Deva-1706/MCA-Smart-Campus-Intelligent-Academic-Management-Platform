from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
from mca_portal.models import (
    StudentProfile,
    Subject,
    RoleProfile,
    FacultyAllocation,
    Semester,
)


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


class Command(BaseCommand):
    help = 'Seed or verify MCA Smart Campus roles (Student, Faculty, Campus Admin), subjects, and allocations without superuser conflation.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-passwords',
            action='store_true',
            help='Explicitly reset passwords on existing seeded accounts to default development values.',
        )

    def handle(self, *args, **options):
        reset_passwords = bool(options.get('reset_passwords'))
        subjects_seed = [
            ('435C1A', 'Discrete Mathematics', 4, 'Core', 'Dr. R. Subramanian',
             'Mathematical logic, set theory, combinatorics, graph theory, and algebraic structures.'),
            ('435C1B', 'Data Structures and Algorithms', 4, 'Core', 'Prof. K. Meenakshi',
             'Asymptotic complexity, balanced trees, graphs, sorting, and dynamic programming.'),
            ('435E1A', 'Data Engineering and Management', 3, 'Elective', 'Dr. V. Aravind',
             'Relational database normalization, transactions, concurrency, warehousing, and NoSQL.'),
            ('435C1C', 'Python Programming', 4, 'Core', 'Prof. S. Karthikeyan',
             'Python data model, OOP, generators, NumPy/Pandas, and Django web development.'),
        ]
        seeded_subjects = []
        for code, name, credits, course_type, instructor, desc in subjects_seed:
            subj_obj, _ = Subject.objects.update_or_create(
                code=code,
                defaults={
                    'name': name,
                    'credits': credits,
                    'course_type': course_type,
                    'instructor': instructor,
                    'description': desc,
                },
            )
            seeded_subjects.append(subj_obj)

        Semester.objects.update_or_create(
            number=1,
            defaults={
                'title': 'MCA Semester 1 Foundation',
                'description': 'Core Semester 1 MCA curriculum (435C1A, 435C1B, 435E1A, 435C1C).',
                'is_configured': True,
                'is_active': True,
            },
        )

        # 1. Student Account (never staff/superuser)
        student_username = getattr(settings, 'DEMO_STUDENT_USERNAME', 'mca_demo_student')
        student_password = getattr(settings, 'DEMO_STUDENT_PASSWORD', 'McaDemo@2026!')
        student_user, created = User.objects.get_or_create(
            username=student_username,
            defaults={
                'first_name': 'Devanath',
                'last_name': 'N',
                'email': 'devanath016@gmail.com',
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            },
        )
        student_changed = False
        if not student_user.email:
            student_user.email = 'devanath016@gmail.com'
            student_changed = True
        if not student_user.first_name:
            student_user.first_name = 'Devanath'
            student_user.last_name = 'N'
            student_changed = True
        if not student_user.is_active or student_user.is_staff or student_user.is_superuser:
            student_user.is_active = True
            student_user.is_staff = False
            student_user.is_superuser = False
            student_changed = True
        if created or reset_passwords or not student_user.has_usable_password():
            student_user.set_password(student_password)
            student_changed = True
        if student_changed:
            student_user.save()

        RoleProfile.objects.update_or_create(
            user=student_user,
            defaults={
                'role': 'student',
                'institutional_id': 'MCA2401',
                'is_active': True,
                'must_change_password': False,
                'department': 'Department of Computer Applications',
                'designation': 'MCA Postgraduate Scholar',
            },
        )

        profile, _ = StudentProfile.objects.update_or_create(
            user=student_user,
            defaults={
                'student_id': 'MCA2401',
                'roll_number': 'P26CA125',
                'enrollment_year': 2024,
                'batch': 'MCA 2024–2026',
                'semester': 1,
                'current_sgpa': 8.85,
                'attendance_percentage': 92.40,
                'advisor_name': 'HCASICAN',
            },
        )

        # 2. Faculty Account (Faculty RoleProfile + explicit subject allocations)
        faculty_username = getattr(settings, 'DEMO_FACULTY_USERNAME', 'hcasican_faculty')
        faculty_password = getattr(settings, 'DEMO_FACULTY_PASSWORD', 'Faculty@2026!')
        faculty_user, fac_created = User.objects.get_or_create(
            username=faculty_username,
            defaults={
                'first_name': 'HCASICAN',
                'last_name': 'Coordinator',
                'email': 'hcasican@mcasmartcampus.edu',
                'is_active': True,
                'is_staff': True,
                'is_superuser': False,
            },
        )
        fac_changed = False
        if not faculty_user.email:
            faculty_user.email = 'hcasican@mcasmartcampus.edu'
            fac_changed = True
        if not faculty_user.is_active or not faculty_user.is_staff or faculty_user.is_superuser:
            faculty_user.is_active = True
            faculty_user.is_staff = True
            faculty_user.is_superuser = False
            fac_changed = True
        if fac_created or reset_passwords or not faculty_user.has_usable_password():
            faculty_user.set_password(faculty_password)
            fac_changed = True
        if fac_changed:
            faculty_user.save()

        RoleProfile.objects.update_or_create(
            user=faculty_user,
            defaults={
                'role': 'faculty',
                'institutional_id': 'FAC001',
                'is_active': True,
                'must_change_password': False,
                'department': 'Department of Computer Applications',
                'designation': 'Faculty Advisor & Subject Coordinator',
                'faculty_permissions_json': ALL_FACULTY_PERMISSIONS,
            },
        )

        for subj_obj in seeded_subjects:
            FacultyAllocation.objects.update_or_create(
                faculty=faculty_user,
                subject=subj_obj,
                defaults={'permissions_json': ALL_FACULTY_PERMISSIONS},
            )

        # 3. Ordinary MCA Smart Campus Admin (explicitly separated from Django technical is_superuser)
        admin_username = getattr(settings, 'DEMO_ADMIN_USERNAME', 'campus_admin')
        admin_password = getattr(settings, 'DEMO_ADMIN_PASSWORD', 'Admin@2026!')
        admin_user, adm_created = User.objects.get_or_create(
            username=admin_username,
            defaults={
                'first_name': 'Academic',
                'last_name': 'Administrator',
                'email': 'admin@mcasmartcampus.edu',
                'is_active': True,
                'is_staff': True,
                'is_superuser': False,
            },
        )
        adm_changed = False
        if not admin_user.email:
            admin_user.email = 'admin@mcasmartcampus.edu'
            adm_changed = True
        if not admin_user.is_active or not admin_user.is_staff or admin_user.is_superuser:
            admin_user.is_active = True
            admin_user.is_staff = True
            admin_user.is_superuser = False
            adm_changed = True
        if adm_created or reset_passwords or not admin_user.has_usable_password():
            admin_user.set_password(admin_password)
            adm_changed = True
        if adm_changed:
            admin_user.save()

        RoleProfile.objects.update_or_create(
            user=admin_user,
            defaults={
                'role': 'admin',
                'institutional_id': 'ADM001',
                'is_active': True,
                'must_change_password': False,
                'department': 'Department of Computer Applications',
                'designation': 'Institutional Academic Administrator',
            },
        )

        if (getattr(settings, 'DEMO_MODE', False) and settings.DEBUG) or getattr(settings, 'IS_TEST_RUNNER', False):
            sandbox_specs = [
                {
                    'username': 'demo_student',
                    'password': 'Student@123',
                    'first_name': 'Demo',
                    'last_name': 'Student',
                    'email': 'demo_student@demo.mcasmartcampus.local',
                    'is_staff': False,
                    'role': 'student',
                    'institutional_id': 'demo_student',
                    'designation': 'MCA Sandbox Demo Scholar',
                    'roll_number': 'DEMO-MCA-01',
                },
                {
                    'username': 'demo_faculty',
                    'password': 'Faculty@123',
                    'first_name': 'Demo',
                    'last_name': 'Faculty',
                    'email': 'demo_faculty@demo.mcasmartcampus.local',
                    'is_staff': True,
                    'role': 'faculty',
                    'institutional_id': 'demo_faculty',
                    'designation': 'Demo Faculty Coordinator',
                },
                {
                    'username': 'demo_admin',
                    'password': 'Admin@123',
                    'first_name': 'Demo',
                    'last_name': 'Administrator',
                    'email': 'demo_admin@demo.mcasmartcampus.local',
                    'is_staff': True,
                    'role': 'admin',
                    'institutional_id': 'demo_admin',
                    'designation': 'Demo Governance Administrator',
                },
            ]
            for spec in sandbox_specs:
                sb_user, sb_created = User.objects.get_or_create(
                    username=spec['username'],
                    defaults={
                        'first_name': spec['first_name'],
                        'last_name': spec['last_name'],
                        'email': spec['email'],
                        'is_active': True,
                        'is_staff': spec['is_staff'],
                        'is_superuser': False,
                    },
                )
                sb_changed = False
                if not sb_user.email:
                    sb_user.email = spec['email']
                    sb_changed = True
                if (
                    not sb_user.is_active
                    or sb_user.is_staff != spec['is_staff']
                    or sb_user.is_superuser
                ):
                    sb_user.is_active = True
                    sb_user.is_staff = spec['is_staff']
                    sb_user.is_superuser = False
                    sb_changed = True
                if sb_created or reset_passwords or not sb_user.has_usable_password():
                    sb_user.set_password(spec['password'])
                    sb_changed = True
                if sb_changed:
                    sb_user.save()

                RoleProfile.objects.update_or_create(
                    user=sb_user,
                    defaults={
                        'role': spec['role'],
                        'institutional_id': spec['institutional_id'],
                        'is_active': True,
                        'must_change_password': False,
                        'department': 'Department of Computer Applications',
                        'designation': spec['designation'],
                        'faculty_permissions_json': ALL_FACULTY_PERMISSIONS if spec['role'] != 'student' else [],
                    },
                )
                if spec['role'] == 'student':
                    StudentProfile.objects.update_or_create(
                        user=sb_user,
                        defaults={
                            'student_id': spec['institutional_id'],
                            'roll_number': spec['roll_number'],
                            'enrollment_year': 2024,
                            'batch': 'Demo Sandbox Batch',
                            'semester': 1,
                            'current_sgpa': 8.60,
                            'attendance_percentage': 94.00,
                            'advisor_name': 'Demo Faculty',
                        },
                    )
                elif spec['role'] == 'faculty':
                    for subj_obj in seeded_subjects:
                        FacultyAllocation.objects.update_or_create(
                            faculty=sb_user,
                            subject=subj_obj,
                            defaults={'permissions_json': ALL_FACULTY_PERMISSIONS},
                        )

        action = 'Created' if created else 'Verified'
        self.stdout.write(self.style.SUCCESS(
            f"{action} demo accounts (student='{student_user.username}'/{profile.roll_number}, "
            f"faculty='{faculty_user.username}', admin='{admin_user.username}' [is_superuser=False]) and 4 Semester 1 subjects."
        ))
