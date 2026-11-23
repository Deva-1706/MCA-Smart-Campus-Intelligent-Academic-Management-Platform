from datetime import date, timedelta
from unittest.mock import patch
from django.test import TestCase, Client
from django.urls import reverse
from django.core.management import call_command
from django.contrib.auth.models import User
from django.conf import settings

from .models import (
    StudentProfile,
    Subject,
    SubjectPDF,
    PracticeAttempt,
    FlashcardDeck,
    Flashcard,
    AcademicCalendarEvent,
    ImportantNotice,
    GeneratedStudyNote,
    RoleProfile,
)
from .services.notes_generator import StudyNoteGenerationError


class PortalSecurityAndFeatureTests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')
        self.demo_user = User.objects.get(username=settings.DEMO_STUDENT_USERNAME)
        self.other_user = User.objects.create_user(username='other_student', password='OtherPassword!1')
        self.other_profile = StudentProfile.objects.create(
            user=self.other_user,
            student_id='MCA2499',
            roll_number='P26CA199',
        )
        self.staff_user = User.objects.create_user(
            username='faculty_hcasican',
            password='FacultyPassword!1',
            is_staff=True,
        )
        self.subject = Subject.objects.get(code='435C1A')

    def test_public_homepage_loads_and_shows_empty_notices_initially(self):
        response = self.client.get(reverse('portal:home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Your Academic Journey, Smarter.')
        self.assertContains(response, 'No important notices available at the moment.')

    def test_protected_student_pages_redirect_anonymous_users(self):
        protected_urls = [
            'portal:dashboard',
            'portal:achievements',
            'portal:practice_arena',
            'portal:flashcards',
            'portal:academic_calendar',
        ]
        for url_name in protected_urls:
            resp = self.client.get(reverse(url_name))
            self.assertEqual(resp.status_code, 302)
            self.assertIn('/accounts/login/', resp.url)

    def test_demo_student_login_and_logout_flow(self):
        resp = self.client.post(
            reverse('portal:login'),
            {
                'username': settings.DEMO_STUDENT_USERNAME,
                'password': settings.DEMO_STUDENT_PASSWORD,
            },
        )
        self.assertRedirects(resp, reverse('portal:dashboard'))
        dash = self.client.get(reverse('portal:dashboard'))
        self.assertEqual(dash.status_code, 200)
        self.assertContains(dash, 'Devanath')
        self.assertContains(dash, 'P26CA125')

        logout_resp = self.client.get(reverse('portal:logout'))
        self.assertRedirects(logout_resp, reverse('portal:home'))

    def test_faculty_communication_completely_removed_from_portal(self):
        self.client.force_login(self.demo_user)
        removed_resp = self.client.get('/portal/faculty-communication/')
        self.assertEqual(removed_resp.status_code, 404)
        dash = self.client.get(reverse('portal:dashboard'))
        self.assertEqual(dash.status_code, 200)
        self.assertNotContains(dash, 'Faculty Communication')
        self.assertNotContains(dash, '/portal/faculty-communication/')

    def test_attendance_tracker_completely_removed_from_portal(self):
        self.client.force_login(self.demo_user)
        removed_resp = self.client.get('/portal/attendance/')
        self.assertEqual(removed_resp.status_code, 404)
        dash = self.client.get(reverse('portal:dashboard'))
        self.assertEqual(dash.status_code, 200)
        self.assertNotContains(dash, 'Attendance Tracker')
        self.assertNotContains(dash, '/portal/attendance/')

    def test_practice_arena_and_flashcard_persistence(self):
        SubjectPDF.objects.create(
            subject=self.subject,
            title='Unit 1 Logic Notes',
            file_name='unit1_logic.pdf',
            unit=1,
            chapter='Propositional Logic',
        )
        self.client.force_login(self.demo_user)
        self.client.post(
            reverse('portal:practice_arena'),
            {
                'subject_code': '435C1A',
                'topic': 'Propositional Logic',
                'mode': 'Timed Quiz',
                'difficulty': 'Medium',
                'total_questions': 5,
                'correct_count': 4,
                'duration_seconds': 120,
            },
        )
        self.assertEqual(PracticeAttempt.objects.filter(student=self.demo_user.studentprofile).count(), 1)

        self.client.post(
            reverse('portal:flashcards'),
            {
                'action': 'create_deck',
                'subject_code': '435C1A',
                'unit': 1,
                'topic': 'Normal Forms',
            },
        )
        deck = FlashcardDeck.objects.get(student=self.demo_user.studentprofile)
        card = Flashcard.objects.get(deck=deck)
        self.client.post(
            reverse('portal:flashcards'),
            {'action': 'update_card', 'card_id': card.id, 'status': 'Known'},
        )
        card.refresh_from_db()
        self.assertEqual(card.status, 'Known')

    def test_important_notices_visibility_and_expiry_rules(self):
        today = date.today()
        ImportantNotice.objects.create(
            title='Active Exam Schedule Notice',
            description='Published active notice.',
            publication_date=today,
            expiry_date=today + timedelta(days=5),
            priority='Urgent',
            category='Examination Notice',
            is_published=True,
        )
        ImportantNotice.objects.create(
            title='Expired Notice Hidden',
            description='Should not appear publicly.',
            publication_date=today - timedelta(days=10),
            expiry_date=today - timedelta(days=1),
            is_published=True,
        )
        ImportantNotice.objects.create(
            title='Unpublished Draft Hidden',
            description='Draft only.',
            publication_date=today,
            is_published=False,
        )
        resp = self.client.get(reverse('portal:home'))
        self.assertContains(resp, 'Active Exam Schedule Notice')
        self.assertNotContains(resp, 'Expired Notice Hidden')
        self.assertNotContains(resp, 'Unpublished Draft Hidden')

    def test_calendar_personal_study_reminder(self):
        self.client.force_login(self.demo_user)
        self.client.post(
            reverse('portal:academic_calendar'),
            {
                'title': 'Revise Graph Theory Unit 4',
                'event_date': (date.today() + timedelta(days=3)).isoformat(),
                'category': 'Study Reminder',
                'subject_code': '435C1A',
            },
        )
        self.assertEqual(AcademicCalendarEvent.objects.filter(title='Revise Graph Theory Unit 4').count(), 1)

    def test_dashboard_global_search_and_study_notes_isolation(self):
        GeneratedStudyNote.objects.create(
            student=self.other_profile,
            subject=self.subject,
            unit=1,
            topic='Private Logic Proof',
            mode='Detailed Notes',
            title='Private Other Student Note',
            sections_json=[{'id': 's1', 'heading': 'Intro', 'sourceTag': 'PDF-Grounded', 'markdown': 'Secret'}],
        )
        demo_note = GeneratedStudyNote.objects.create(
            student=self.demo_user.studentprofile,
            subject=self.subject,
            unit=1,
            topic='CNF Equivalence',
            mode='2-Mark Questions',
            title='435C1A CNF 2-Mark Bank',
            sections_json=[{'id': 's1', 'heading': 'Q1', 'sourceTag': 'PDF-Grounded', 'markdown': 'Definition & example.'}],
        )

        self.client.force_login(self.demo_user)
        search_resp = self.client.get(reverse('portal:dashboard'), {'q': 'CNF'})
        self.assertEqual(search_resp.status_code, 200)
        self.assertContains(search_resp, '435C1A CNF 2-Mark Bank')
        self.assertNotContains(search_resp, 'Private Other Student Note')

        # Other user cannot toggle or delete demo_user's study note
        self.client.force_login(self.other_user)
        forbidden_toggle = self.client.post(
            reverse('portal:study_note_action', args=[demo_note.id]),
            {'action': 'toggle_bookmark'},
        )
        self.assertEqual(forbidden_toggle.status_code, 404)

        # Owner can bookmark, complete, and mark for revision
        self.client.force_login(self.demo_user)
        self.client.post(reverse('portal:study_note_action', args=[demo_note.id]), {'action': 'toggle_bookmark'})
        self.client.post(reverse('portal:study_note_action', args=[demo_note.id]), {'action': 'toggle_completed'})
        self.client.post(reverse('portal:study_note_action', args=[demo_note.id]), {'action': 'toggle_revision'})
        demo_note.refresh_from_db()
        self.assertTrue(demo_note.is_bookmarked)
        self.assertTrue(demo_note.is_completed)
        self.assertTrue(demo_note.needs_revision)

    @patch('mca_portal.views.generate_university_study_note')
    def test_study_note_generation_success_and_error_handling(self, mock_gen):
        self.client.force_login(self.demo_user)

        # Validation: empty topic does not invoke AI or persist
        self.client.post(reverse('portal:generate_study_notes'), {'subject_code': '435C1B', 'topic': ''})
        self.assertEqual(GeneratedStudyNote.objects.count(), 0)

        # Error handling: API failure must not create fake notes
        mock_gen.side_effect = StudyNoteGenerationError('AI service unavailable')
        self.client.post(
            reverse('portal:generate_study_notes'),
            {'subject_code': '435C1B', 'unit': '2', 'topic': 'AVL Trees', 'mode': '10-Mark Questions'},
        )
        self.assertEqual(GeneratedStudyNote.objects.count(), 0)

        # Successful structured generation
        mock_gen.side_effect = None
        mock_gen.return_value = {
            'title': '435C1B Unit 2: AVL Trees — 10-Mark Questions',
            'summary': 'Self-balancing BST invariants and LR/RL rotations.',
            'isPdfSufficient': True,
            'supplementaryNotice': '',
            'importantPoints': ['Balance factor in {-1, 0, +1}', 'O(log n) worst-case height'],
            'sourcePdfs': ['MCA-435C1B-DSA-Core-Textbook-Reference.pdf'],
            'pageCitations': [14, 15],
            'sections': [
                {
                    'id': 'sec-1',
                    'heading': 'Introduction, Classification & Rotations',
                    'sourceTag': 'PDF-Grounded',
                    'markdown': 'AVL trees maintain balance factor invariants across insertions.',
                    'diagram': 'z -> y -> x',
                }
            ],
        }
        resp = self.client.post(
            reverse('portal:generate_study_notes'),
            {'subject_code': '435C1B', 'unit': '2', 'topic': 'AVL Trees', 'mode': '10-Mark Questions'},
        )
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(GeneratedStudyNote.objects.filter(student=self.demo_user.studentprofile).count(), 1)


class LayoutSeparationAcceptanceTests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')
        self.demo_user = User.objects.get(username=settings.DEMO_STUDENT_USERNAME)

    def test_public_pages_use_public_layout_only(self):
        public_urls = [
            'portal:home',
            'portal:about',
            'portal:subjects',
            'portal:features',
            'portal:how_it_works',
            'portal:contact',
            'portal:faq',
            'portal:login',
        ]
        for url_name in public_urls:
            resp = self.client.get(reverse(url_name))
            self.assertEqual(resp.status_code, 200, f'Expected 200 for {url_name}')
            self.assertContains(resp, 'class="academic-body public-layout"')
            self.assertContains(resp, 'academic-navbar')
            self.assertContains(resp, 'How It Works')
            self.assertNotContains(resp, 'class="student-sidebar')

    def test_authenticated_student_pages_never_render_public_navbar_or_footer(self):
        self.client.force_login(self.demo_user)
        portal_urls = [
            'portal:dashboard',
            'portal:my_subjects',
            'portal:assignments',
            'portal:examinations',
            'portal:coding_lab',
            'portal:materials',
            'portal:bookmarks',
            'portal:analytics',
            'portal:reports',
            'portal:achievements',
            'portal:practice_arena',
            'portal:flashcards',
            'portal:academic_calendar',
            'portal:profile',
            'portal:notifications',
        ]
        for url_name in portal_urls:
            resp = self.client.get(reverse(url_name))
            self.assertEqual(resp.status_code, 200, f'Expected 200 for {url_name}')
            self.assertContains(resp, 'student-portal-layout')
            self.assertContains(resp, 'student-portal-header')
            self.assertContains(resp, 'student-sidebar')
            self.assertNotContains(resp, 'academic-navbar')
            self.assertNotContains(resp, 'academic-footer')
            self.assertNotContains(resp, '>How It Works<')
            self.assertNotContains(resp, '>FAQ<')


class PublicWebsiteAuditTests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')

    def test_all_public_routes_return_200_with_public_base(self):
        public_routes = [
            ('portal:home', {}),
            ('portal:about', {}),
            ('portal:subjects', {}),
            ('portal:subject_detail', {'code': '435C1A'}),
            ('portal:features', {}),
            ('portal:how_it_works', {}),
            ('portal:contact', {}),
            ('portal:faq', {}),
            ('portal:login', {}),
            ('portal:password_reset', {}),
        ]
        for url_name, kwargs in public_routes:
            resp = self.client.get(reverse(url_name, kwargs=kwargs))
            self.assertEqual(resp.status_code, 200, f'Expected HTTP 200 for {url_name}')
            self.assertContains(resp, 'academic-navbar')
            self.assertNotContains(resp, 'student-sidebar')

    def test_public_contact_ticket_submission(self):
        resp = self.client.post(
            reverse('portal:contact'),
            {
                'full_name': 'MCA Applicant',
                'email': 'applicant@example.com',
                'subject': 'Semester 1 Syllabus Query',
                'message': 'Requesting clarification on 435C1A practical exam schedule.',
            },
        )
        self.assertRedirects(resp, reverse('portal:contact'))


class AuthenticationAndPasswordResetTests(TestCase):
    ALL_PORTAL_ROUTE_NAMES = [
        'portal:dashboard',
        'portal:my_subjects',
        'portal:assignments',
        'portal:examinations',
        'portal:coding_lab',
        'portal:materials',
        'portal:bookmarks',
        'portal:analytics',
        'portal:reports',
        'portal:achievements',
        'portal:practice_arena',
        'portal:flashcards',
        'portal:academic_calendar',
        'portal:profile',
        'portal:notifications',
    ]

    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')
        self.demo_user = User.objects.get(username=settings.DEMO_STUDENT_USERNAME)

    def test_all_15_student_portal_routes_require_authentication(self):
        for url_name in self.ALL_PORTAL_ROUTE_NAMES:
            target = reverse(url_name)
            resp = self.client.get(target)
            self.assertEqual(resp.status_code, 302, f'Anonymous GET {url_name} should redirect')
            self.assertIn('/accounts/login/', resp.url)

    def test_login_with_student_id_and_remember_me_session_expiry(self):
        bad_resp = self.client.post(
            reverse('portal:login'),
            {'username': 'MCA2401', 'password': 'WrongPassword!'},
        )
        self.assertEqual(bad_resp.status_code, 200)
        self.assertContains(bad_resp, 'Invalid Student ID or Password')

        ok_resp = self.client.post(
            reverse('portal:login'),
            {
                'username': 'MCA2401',
                'password': settings.DEMO_STUDENT_PASSWORD,
                'remember_me': 'on',
            },
        )
        self.assertRedirects(ok_resp, reverse('portal:dashboard'))
        remember_cookie_name = getattr(settings, 'REMEMBER_ME_COOKIE_NAME', 'mca_remembered_user')
        raw_cookie = self.client.cookies[remember_cookie_name].value
        self.assertNotEqual(raw_cookie, settings.DEMO_STUDENT_USERNAME)
        self.assertTrue(raw_cookie.startswith('v1.'))
        from mca_portal.security import decrypt_cookie_value
        self.assertEqual(
            decrypt_cookie_value(raw_cookie, settings.COOKIE_ENCRYPTION_SECRET),
            settings.DEMO_STUDENT_USERNAME,
        )
        self.assertFalse(self.client.session.get_expire_at_browser_close())

        # Authenticated users visiting login or password reset redirect cleanly to dashboard
        self.assertRedirects(self.client.get(reverse('portal:login')), reverse('portal:dashboard'))
        self.assertRedirects(self.client.get(reverse('portal:password_reset')), reverse('portal:dashboard'))

    def test_password_reset_verification_workflow(self):
        req_resp = self.client.post(
            reverse('portal:password_reset'),
            {'action': 'request_code', 'identifier': 'MCA2401'},
        )
        self.assertEqual(req_resp.status_code, 200)
        code = self.client.session.get('pwd_reset_code')
        self.assertTrue(code)

        # Invalid verification code should fail without changing password
        wrong_code = self.client.post(
            reverse('portal:password_reset'),
            {
                'action': 'confirm_reset',
                'verification_code': '000000',
                'new_password': 'UpdatedPass2026!',
                'confirm_password': 'UpdatedPass2026!',
            },
        )
        self.assertEqual(wrong_code.status_code, 200)
        self.assertContains(wrong_code, 'Invalid verification code.')

        # Valid code updates password and permits login
        done_resp = self.client.post(
            reverse('portal:password_reset'),
            {
                'action': 'confirm_reset',
                'verification_code': code,
                'new_password': 'UpdatedPass2026!',
                'confirm_password': 'UpdatedPass2026!',
            },
        )
        self.assertEqual(done_resp.status_code, 200)
        self.assertContains(done_resp, 'Password updated successfully.')

        login_resp = self.client.post(
            reverse('portal:login'),
            {'username': settings.DEMO_STUDENT_USERNAME, 'password': 'UpdatedPass2026!'},
        )
        self.assertRedirects(login_resp, reverse('portal:dashboard'))


class WeeklyStudyGoalsAndPortalAuditTests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')
        self.demo_user = User.objects.get(username=settings.DEMO_STUDENT_USERNAME)
        self.client.force_login(self.demo_user)

    def test_dashboard_weekly_study_goals_update_and_log_minutes(self):
        upd_resp = self.client.post(
            reverse('portal:dashboard'),
            {
                'goal_action': 'update_targets',
                'target_435C1A': '10',
                'target_435C1B': '12',
                'target_435E1A': '6',
                'target_435C1C': '9',
            },
        )
        self.assertRedirects(upd_resp, reverse('portal:dashboard'))
        self.assertEqual(self.client.session['weekly_study_goal_hours']['435C1A'], 10.0)

        log_resp = self.client.post(
            reverse('portal:dashboard'),
            {
                'goal_action': 'log_minutes',
                'subject_code': '435C1A',
                'minutes': '60',
            },
        )
        self.assertRedirects(log_resp, reverse('portal:dashboard'))
        dash_resp = self.client.get(reverse('portal:dashboard'))
        self.assertEqual(dash_resp.status_code, 200)
        self.assertContains(dash_resp, 'Weekly Study Goals')

    def test_removed_feature_routes_return_404(self):
        for obsolete_path in [
            '/portal/faculty-communication/',
            '/portal/attendance/',
            '/portal/attendance-tracker/',
        ]:
            resp = self.client.get(obsolete_path)
            self.assertEqual(resp.status_code, 404, f'Expected 404 for removed route {obsolete_path}')


class SmartCampusRoleAndSecurityTests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')
        self.student_user = User.objects.get(username=settings.DEMO_STUDENT_USERNAME)
        self.faculty_user = User.objects.get(username=settings.DEMO_FACULTY_USERNAME)
        self.admin_user = User.objects.get(username=settings.DEMO_ADMIN_USERNAME)

    def test_public_role_login_pages_and_branding(self):
        for route_name in ['portal:student_login', 'portal:faculty_login', 'portal:admin_login']:
            resp = self.client.get(reverse(route_name))
            self.assertEqual(resp.status_code, 200)
            self.assertContains(resp, 'MCA SMART CAMPUS')
            self.assertNotContains(resp, 'Django Files')
            self.assertNotContains(resp, 'Blueprint')
            self.assertNotContains(resp, settings.DEMO_STUDENT_PASSWORD)
            self.assertNotContains(resp, settings.DEMO_FACULTY_PASSWORD)
            self.assertNotContains(resp, settings.DEMO_ADMIN_PASSWORD)

    def test_strict_role_isolation_between_student_faculty_and_admin(self):
        # Student cannot enter faculty or admin portal
        self.client.force_login(self.student_user)
        self.assertEqual(self.client.get(reverse('portal:faculty_overview')).status_code, 403)
        self.assertEqual(self.client.get(reverse('portal:admin_overview')).status_code, 403)

        # Faculty can open faculty portal, blocked from admin and student portal
        self.client.force_login(self.faculty_user)
        self.assertEqual(self.client.get(reverse('portal:faculty_overview')).status_code, 200)
        self.assertEqual(self.client.get(reverse('portal:admin_overview')).status_code, 403)
        self.assertEqual(self.client.get(reverse('portal:dashboard')).status_code, 403)

        # Admin can open admin overview & configure semester 2 (without is_superuser=True)
        self.assertFalse(self.admin_user.is_superuser)
        self.client.force_login(self.admin_user)
        self.assertEqual(self.client.get(reverse('portal:admin_overview')).status_code, 200)
        self.assertEqual(self.client.get(reverse('portal:dashboard')).status_code, 403)
        self.assertEqual(self.client.get(reverse('portal:faculty_overview')).status_code, 403)
        post_resp = self.client.post(
            reverse('portal:admin_academics'),
            {'semester_number': 2, 'title': 'Semester 2 Core', 'description': 'Configured by admin', 'is_configured': 'on'},
        )
        self.assertEqual(post_resp.status_code, 302)

    def test_isolated_coding_lab_runner_and_sandbox_guard(self):
        self.client.force_login(self.student_user)
        ok_resp = self.client.post(
            reverse('portal:coding_lab_execute'),
            {'code': 'print(2 + 3)', 'expected_stdout': '5'},
        )
        self.assertEqual(ok_resp.status_code, 200)
        self.assertTrue(ok_resp.json()['passed'])

        blocked_resp = self.client.post(
            reverse('portal:coding_lab_execute'),
            {'code': 'import os\nprint(os.listdir())'},
        )
        self.assertEqual(blocked_resp.status_code, 403)


class ComprehensiveAuthIdentityTests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')
        self.student_user = User.objects.get(username=settings.DEMO_STUDENT_USERNAME)
        self.faculty_user = User.objects.get(username=settings.DEMO_FACULTY_USERNAME)
        self.admin_user = User.objects.get(username=settings.DEMO_ADMIN_USERNAME)

    def test_valid_login_with_email_and_role_redirects(self):
        # Student email login -> Student Dashboard
        s_resp = self.client.post(
            reverse('portal:student_login'),
            {'username': 'devanath016@gmail.com', 'password': settings.DEMO_STUDENT_PASSWORD},
        )
        self.assertRedirects(s_resp, reverse('portal:dashboard'))
        self.client.get(reverse('portal:logout'))

        # Faculty email login -> Faculty Overview
        f_resp = self.client.post(
            reverse('portal:faculty_login'),
            {'username': 'hcasican@mcasmartcampus.edu', 'password': settings.DEMO_FACULTY_PASSWORD},
        )
        self.assertRedirects(f_resp, reverse('portal:faculty_overview'))
        self.client.get(reverse('portal:logout'))

        # Admin email login -> Admin Overview
        a_resp = self.client.post(
            reverse('portal:admin_login'),
            {'username': 'admin@mcasmartcampus.edu', 'password': settings.DEMO_ADMIN_PASSWORD},
        )
        self.assertRedirects(a_resp, reverse('portal:admin_overview'))

    def test_wrong_role_login_blocked_and_unauthenticated_urls_redirect(self):
        for route_name in ['portal:admin_overview', 'portal:admin_users']:
            resp = self.client.get(reverse(route_name))
            self.assertEqual(resp.status_code, 302)
            self.assertIn('/admin-login/', resp.url)

        for route_name in ['portal:faculty_overview', 'portal:faculty_submissions']:
            resp = self.client.get(reverse(route_name))
            self.assertEqual(resp.status_code, 302)
            self.assertIn('/faculty-login/', resp.url)

        wrong_admin = self.client.post(
            reverse('portal:admin_login'),
            {'username': 'MCA2401', 'password': settings.DEMO_STUDENT_PASSWORD},
        )
        self.assertEqual(wrong_admin.status_code, 403)
        self.assertContains(wrong_admin, 'restricted to admin accounts', status_code=403)

    def test_logout_invalidates_session_and_inactive_account_blocked(self):
        self.client.post(
            reverse('portal:login'),
            {'username': 'MCA2401', 'password': settings.DEMO_STUDENT_PASSWORD},
        )
        self.assertEqual(self.client.get(reverse('portal:dashboard')).status_code, 200)
        self.client.get(reverse('portal:logout'))
        self.assertEqual(self.client.get(reverse('portal:dashboard')).status_code, 302)

        rp = self.student_user.roleprofile
        rp.is_active = False
        rp.save()
        blocked = self.client.post(
            reverse('portal:login'),
            {'username': 'MCA2401', 'password': settings.DEMO_STUDENT_PASSWORD},
        )
        self.assertEqual(blocked.status_code, 403)
        self.assertContains(blocked, 'inactive', status_code=403)

    def test_rate_limiting_after_repeated_failed_logins(self):
        for _ in range(5):
            self.client.post(
                reverse('portal:login'),
                {'username': 'MCA2401', 'password': 'WrongPassword!1'},
            )
        locked = self.client.post(
            reverse('portal:login'),
            {'username': 'MCA2401', 'password': settings.DEMO_STUDENT_PASSWORD},
        )
        self.assertEqual(locked.status_code, 429)
        self.assertContains(locked, 'Too many failed login attempts', status_code=429)

    def test_tokenized_password_reset_change_password_and_first_login_setup(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        uidb64 = urlsafe_base64_encode(force_bytes(self.student_user.pk))
        token = default_token_generator.make_token(self.student_user)
        confirm_url = reverse('portal:password_reset_confirm', kwargs={'uidb64': uidb64, 'token': token})

        # Weak password rejected by Django validators
        weak = self.client.post(
            confirm_url,
            {'new_password': 'password', 'confirm_password': 'password'},
        )
        self.assertEqual(weak.status_code, 400)

        # Valid strong password succeeds
        ok = self.client.post(
            confirm_url,
            {'new_password': 'StrongCampus#2026!', 'confirm_password': 'StrongCampus#2026!'},
        )
        self.assertRedirects(ok, reverse('portal:login'))

        # Admin creates a new faculty account -> must_change_password forces first-login setup
        self.client.force_login(self.admin_user)
        self.client.post(
            reverse('portal:admin_users'),
            {
                'action': 'create_user',
                'full_name': 'Dr. Priya Nair',
                'institutional_id': 'FAC002',
                'username': 'priya_faculty',
                'email': 'priya@mcasmartcampus.edu',
                'role': 'faculty',
                'temporary_password': 'TempInit#2026!',
            },
        )
        created_fac = User.objects.get(username='priya_faculty')
        self.assertFalse(created_fac.is_superuser)
        self.assertTrue(created_fac.roleprofile.must_change_password)
        self.client.get(reverse('portal:logout'))

        first_login = self.client.post(
            reverse('portal:faculty_login'),
            {'username': 'priya_faculty', 'password': 'TempInit#2026!'},
        )
        self.assertRedirects(first_login, reverse('portal:change_password'))

        # Complete first-login setup unlocks faculty overview
        set_pw = self.client.post(
            reverse('portal:change_password'),
            {
                'current_password': 'TempInit#2026!',
                'new_password': 'FacultyNew#2026!',
                'confirm_password': 'FacultyNew#2026!',
            },
        )
        self.assertRedirects(set_pw, reverse('portal:faculty_overview'))

    def test_faculty_subject_and_individual_permission_enforcement(self):
        from .models import FacultyAllocation
        # Restrict faculty strictly to 435C1A without 'verify_skills'
        FacultyAllocation.objects.filter(faculty=self.faculty_user).exclude(subject__code='435C1A').delete()
        alloc = FacultyAllocation.objects.get(faculty=self.faculty_user, subject__code='435C1A')
        alloc.permissions_json = ['create_assessments']
        alloc.save()
        rp = self.faculty_user.roleprofile
        rp.faculty_permissions_json = ['create_assessments']
        rp.save()

        self.client.force_login(self.faculty_user)
        self.assertEqual(self.client.get(reverse('portal:faculty_skill_dna')).status_code, 403)
        self.assertEqual(
            self.client.post(
                reverse('portal:faculty_question_bank'),
                {'subject_code': '435C1B', 'prompt': 'Unauthorized subject write', 'answer': 'x'},
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                reverse('portal:faculty_question_bank'),
                {'subject_code': '435C1A', 'prompt': 'Authorized subject write', 'answer': 'x'},
            ).status_code,
            302,
        )

    def test_student_isolated_to_own_academic_records(self):
        from .models import Examination, ExaminationResult
        other_user = User.objects.create_user(username='other_mca', password='OtherPassword#2026!')
        other_sp = StudentProfile.objects.create(user=other_user, student_id='MCA2498', roll_number='P26CA198')
        subj = Subject.objects.get(code='435C1A')
        exam = Examination.objects.create(title='Midterm DM', subject=subj, due_date=date.today())
        ExaminationResult.objects.create(student=other_sp, examination=exam, score=28, passed=True)

        self.client.force_login(self.student_user)
        reports = self.client.get(reverse('portal:reports'))
        self.assertEqual(reports.status_code, 200)
        self.assertNotContains(reports, 'P26CA198')

    def test_public_navbar_single_login_dropdown(self):
        home_resp = self.client.get(reverse('portal:home'))
        self.assertEqual(home_resp.status_code, 200)
        self.assertNotContains(home_resp, 'Login Portals')
        self.assertContains(home_resp, 'id="navbarLoginMenu"')
        self.assertContains(home_resp, 'Admin Login')
        self.assertContains(home_resp, 'Faculty Login')
        self.assertContains(home_resp, 'Student Login')
        for section_id in [
            'id="home"',
            'id="about"',
            'id="subjects"',
            'id="features"',
            'id="important-notices"',
            'id="how-it-works"',
            'id="login-portals"',
            'id="contact"',
            'id="faq"',
        ]:
            self.assertContains(home_resp, section_id)

    def test_phase2_student_workflows_and_validation_no_500(self):
        from .models import Assignment, AssignmentSubmission, ContactTicket, Examination, ExaminationResult

        subj = Subject.objects.get(code='435C1C')
        asg = Assignment.objects.create(
            title='Recursion Lab 1',
            subject=subj,
            unit=1,
            chapter='Functions',
            topic='Recursion',
            total_marks=30,
            due_date=date.today(),
        )
        exam = Examination.objects.create(
            title='Python Unit 1 Quiz',
            subject=subj,
            total_marks=30,
            passing_marks=15,
            due_date=date.today(),
        )

        # Invalid contact submission returns 400 and does NOT save empty ticket
        bad_contact = self.client.post(
            reverse('portal:contact'),
            {'full_name': 'A', 'email': 'not-an-email', 'subject': '', 'message': 'short'},
        )
        self.assertEqual(bad_contact.status_code, 400)
        self.assertEqual(ContactTicket.objects.count(), 0)

        self.client.force_login(self.student_user)
        # Student assignment submission
        sub_resp = self.client.post(
            reverse('portal:assignments'),
            {'assignment_id': asg.id, 'submission_text': 'def fact(n): return 1 if n < 2 else n * fact(n - 1)'},
        )
        self.assertEqual(sub_resp.status_code, 302)
        self.assertEqual(AssignmentSubmission.objects.count(), 1)

        # Student exam submission
        ex_resp = self.client.post(
            reverse('portal:examinations'),
            {'examination_id': exam.id, 'score': '24'},
        )
        self.assertEqual(ex_resp.status_code, 302)
        self.assertEqual(ExaminationResult.objects.filter(student=self.student_user.studentprofile, passed=True).count(), 1)

        # Malformed numeric / date inputs redirect cleanly with message (never 500)
        self.assertEqual(
            self.client.post(
                reverse('portal:practice_arena'),
                {'subject_code': '435C1C', 'topic': 'Loops', 'total_questions': 'abc', 'correct_count': '1'},
            ).status_code,
            302,
        )
        self.assertEqual(
            self.client.post(
                reverse('portal:academic_calendar'),
                {'title': 'Bad Reminder', 'event_date': 'not-a-date'},
            ).status_code,
            302,
        )

    def test_phase3_coding_lab_ast_sandbox_and_upload_download_security(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.force_login(self.student_user)
        for dangerous in (
            'import sys\nprint(sys.version)',
            'import importlib\nprint(importlib)',
            'print(getattr(__builtins__, "open"))',
            'print((1).__class__.__base__.__subclasses__())',
        ):
            resp = self.client.post(reverse('portal:coding_lab_execute'), {'code': dangerous})
            self.assertEqual(resp.status_code, 403)

        ok_resp = self.client.post(reverse('portal:coding_lab_execute'), {'code': 'import math\nprint(int(math.sqrt(144)))'})
        self.assertEqual(ok_resp.status_code, 200)
        self.assertEqual(ok_resp.json().get('stdout'), '12')

        # Invalid non-PDF/script file rejected by manage_notices upload validator
        self.client.force_login(self.admin_user)
        bad_file = SimpleUploadedFile('exploit.html', b'<script>alert(1)</script>', content_type='text/html')
        self.client.post(
            reverse('portal:manage_notices'),
            {
                'action': 'create',
                'title': 'Malicious Upload Attempt',
                'description': 'Should reject non-PDF',
                'attachment': bad_file,
            },
        )
        from .models import ImportantNotice
        self.assertFalse(ImportantNotice.objects.filter(title='Malicious Upload Attempt').exists())

        # Valid PDF attachment saves and respects protected download
        good_pdf = SimpleUploadedFile('circular.pdf', b'%PDF-1.4\n%Test\n', content_type='application/pdf')
        self.client.post(
            reverse('portal:manage_notices'),
            {
                'action': 'create',
                'title': 'Exam Circular',
                'description': 'Valid attachment notice',
                'is_published': 'on',
                'attachment': good_pdf,
            },
        )
        notice = ImportantNotice.objects.get(title='Exam Circular')
        self.client.logout()
        anon_dl = self.client.get(reverse('portal:download_notice_attachment', args=[notice.id]))
        self.assertEqual(anon_dl.status_code, 302)

    def test_admin_role_group_ordinary_admin_and_demo_autofill_safety(self):
        from django.contrib.auth.models import Group
        from django.core.management import call_command

        # 1. Ordinary admin with RoleProfile(role='Admin', is_superuser=False) authenticates cleanly
        ordinary_admin = User.objects.create_user(
            username='ord_admin',
            email='ord_admin@mcasmartcampus.edu',
            password='OrdAdmin#2026!',
            is_staff=True,
            is_superuser=False,
        )
        RoleProfile.objects.create(
            user=ordinary_admin,
            role='Admin',
            institutional_id='ADM099',
            department='Administration',
            must_change_password=False,
        )
        resp_ord = self.client.post(
            reverse('portal:admin_login'),
            {'username': 'ADM099', 'password': 'OrdAdmin#2026!'},
        )
        self.assertRedirects(resp_ord, reverse('portal:admin_overview'))
        self.assertEqual(self.client.get(reverse('portal:admin_overview')).status_code, 200)
        self.client.get(reverse('portal:logout'))

        # 2. Admin placed in Django 'Admin' group (no RoleProfile, is_superuser=False) resolves to admin
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        group_admin = User.objects.create_user(
            username='grp_admin',
            email='grp_admin@mcasmartcampus.edu',
            password='GrpAdmin#2026!',
            is_staff=True,
            is_superuser=False,
        )
        group_admin.groups.add(admin_group)
        resp_grp = self.client.post(
            reverse('portal:admin_login'),
            {'username': 'grp_admin', 'password': 'GrpAdmin#2026!'},
        )
        self.assertRedirects(resp_grp, reverse('portal:admin_overview'))
        self.client.get(reverse('portal:logout'))

        # 3. Bare technical Django superuser without RoleProfile or Group stays separated from ordinary portals
        tech_super = User.objects.create_superuser(
            username='tech_super',
            email='tech_super@mcasmartcampus.edu',
            password='TechSuper#2026!',
        )
        resp_super = self.client.post(
            reverse('portal:admin_login'),
            {'username': 'tech_super', 'password': 'TechSuper#2026!'},
        )
        self.assertEqual(resp_super.status_code, 403)
        self.assertContains(resp_super, 'restricted to admin accounts', status_code=403)

        # 4. Run setup_demo_student, verify demo accounts + autofill status element + password preservation
        call_command('setup_demo_student')
        demo_admin = User.objects.get(username='demo_admin')
        demo_admin.set_password('CustomAdminKeep#2026!')
        demo_admin.save(update_fields=['password'])

        # Running setup_demo_student without --reset-passwords must preserve existing custom password
        call_command('setup_demo_student')
        demo_admin.refresh_from_db()
        self.assertTrue(demo_admin.check_password('CustomAdminKeep#2026!'))
        self.assertFalse(demo_admin.is_superuser)

        # Passing --reset-passwords restores sandbox demo password
        call_command('setup_demo_student', '--reset-passwords')
        demo_admin.refresh_from_db()
        self.assertTrue(demo_admin.check_password('Admin@123'))

        # Verify demo credentials work across all 3 portals and isolate cross-portal attempts
        for login_name, uid, pwd, dash_name, wrong_login in [
            ('portal:login', 'demo_student', 'Student@123', 'portal:dashboard', 'portal:admin_login'),
            ('portal:faculty_login', 'demo_faculty', 'Faculty@123', 'portal:faculty_overview', 'portal:admin_login'),
            ('portal:admin_login', 'demo_admin', 'Admin@123', 'portal:admin_overview', 'portal:faculty_login'),
        ]:
            bad_role = self.client.post(reverse(wrong_login), {'username': uid, 'password': pwd})
            self.assertEqual(bad_role.status_code, 403)

            ok_login = self.client.post(reverse(login_name), {'username': uid, 'password': pwd})
            self.assertRedirects(ok_login, reverse(dash_name))
            self.client.get(reverse('portal:logout'))

    def test_demo_portal_access_one_click_dev_and_production_protection(self):
        from django.test import override_settings

        # 1. Development mode (DEBUG=True, DEMO_MODE=True, DEMO_PORTAL_ACCESS=True) renders 3-option portal selector with zero password fields
        with override_settings(
            DEBUG=True,
            DJANGO_ENV='development',
            DEMO_MODE=True,
            DEMO_PORTAL_ACCESS=True,
            DEMO_PORTAL_ALLOWED_HOSTS=['testserver', 'localhost'],
        ):
            select_page = self.client.get(reverse('portal:login'))
            self.assertEqual(select_page.status_code, 200)
            self.assertContains(select_page, 'Enter Student Portal')
            self.assertContains(select_page, 'Enter Faculty Portal')
            self.assertContains(select_page, 'Enter Admin Portal')
            self.assertNotContains(select_page, 'type="password"')
            self.assertNotContains(select_page, 'Autofill Demo Credentials')

            # GET must never grant privileges via URL
            get_blocked = self.client.get(reverse('portal:demo_portal_enter', args=['admin']))
            self.assertEqual(get_blocked.status_code, 405)

            for role, dash_name in [
                ('student', 'portal:dashboard'),
                ('faculty', 'portal:faculty_overview'),
                ('admin', 'portal:admin_overview'),
            ]:
                enter_resp = self.client.post(reverse('portal:demo_portal_enter', args=[role]))
                self.assertRedirects(enter_resp, reverse(dash_name))
                self.assertEqual(self.client.get(reverse(dash_name)).status_code, 200)
                self.client.get(reverse('portal:logout'))

        # 2. Production mode (DEBUG=False) blocks demo_portal_enter (403) and redirects unauthenticated dashboards to login
        with override_settings(DEBUG=False, DJANGO_ENV='production', DEMO_MODE=False, DEMO_PORTAL_ACCESS=False):
            for role in ('student', 'faculty', 'admin'):
                blocked = self.client.post(reverse('portal:demo_portal_enter', args=[role]))
                self.assertEqual(blocked.status_code, 403)

            for dash_name in ('portal:dashboard', 'portal:faculty_overview', 'portal:admin_overview'):
                anon = self.client.get(reverse(dash_name))
                self.assertEqual(anon.status_code, 302)

            prod_login = self.client.get(reverse('portal:login'))
            self.assertEqual(prod_login.status_code, 200)
            self.assertContains(prod_login, 'type="password"')
            self.assertNotContains(prod_login, 'Enter Admin Portal')

            health = self.client.get(reverse('portal:health_check'))
            self.assertEqual(health.status_code, 200)
            self.assertEqual(health.json().get('status'), 'ok')


class RoleBasedDemoCredentialsTests(TestCase):
    def setUp(self):
        self.client = Client()
        call_command('setup_demo_student')

    def test_student_role_login_displays_student_demo_credentials_only(self):
        from django.test import override_settings

        with override_settings(
            DEBUG=True,
            DJANGO_ENV='development',
            DEMO_MODE=True,
            DEMO_CREDENTIALS_ENABLED=True,
            DEMO_PORTAL_ACCESS=False,
        ):
            for route_name in ('portal:login', 'portal:student_login'):
                resp = self.client.get(reverse(route_name))
                self.assertEqual(resp.status_code, 200)
                content = resp.content.decode('utf-8')

                # Check demo access card is present with role-specific student styling and icon
                self.assertIn('id="demoAccessCard"', content)
                self.assertIn('data-current-role="student"', content)
                self.assertIn('Student Demo Access', content)
                self.assertIn('auth-demo-badge auth-role-icon--student', content)
                self.assertIn('STD', content)

                # Active credential elements must display student credentials
                self.assertIn(f'id="demoUsernameVal">{settings.DEMO_STUDENT_USERNAME}</code>', content)
                self.assertIn(f'id="demoPasswordVal">{settings.DEMO_STUDENT_PASSWORD}</code>', content)

                # Active credential elements must NOT display faculty or admin credentials
                self.assertNotIn(f'id="demoUsernameVal">{settings.DEMO_FACULTY_USERNAME}</code>', content)
                self.assertNotIn(f'id="demoPasswordVal">{settings.DEMO_FACULTY_PASSWORD}</code>', content)
                self.assertNotIn(f'id="demoUsernameVal">{settings.DEMO_ADMIN_USERNAME}</code>', content)
                self.assertNotIn(f'id="demoPasswordVal">{settings.DEMO_ADMIN_PASSWORD}</code>', content)

                # Verify copy buttons are present with correct data
                self.assertIn('id="copyUsernameBtn"', content)
                self.assertIn('id="copyPasswordBtn"', content)
                self.assertIn('Copy Username', content)
                self.assertIn('Copy Password', content)
                self.assertIn(f'data-copy-value="{settings.DEMO_STUDENT_USERNAME}"', content)
                self.assertIn(f'data-copy-value="{settings.DEMO_STUDENT_PASSWORD}"', content)

                # Verify JSON data for dynamic role switching is embedded
                self.assertIn('id="demo-credentials-data"', content)

    def test_dynamic_role_switcher_payload_and_data_attributes(self):
        import json
        from django.test import override_settings

        with override_settings(
            DEBUG=True,
            DJANGO_ENV='development',
            DEMO_MODE=True,
            DEMO_CREDENTIALS_ENABLED=True,
            DEMO_PORTAL_ACCESS=False,
        ):
            resp = self.client.get(reverse('portal:login'))
            self.assertEqual(resp.status_code, 200)
            content = resp.content.decode('utf-8')

            # Verify switcher tabs have data-role attributes for dynamic switching
            self.assertIn('data-role="student"', content)
            self.assertIn('data-role="faculty"', content)
            self.assertIn('data-role="admin"', content)

            # Extract and parse demo-credentials-data JSON script
            start_tag = '<script id="demo-credentials-data" type="application/json">'
            self.assertIn(start_tag, content)
            json_str = content.split(start_tag)[1].split('</script>')[0]
            data = json.loads(json_str)

            self.assertIn('student', data)
            self.assertIn('faculty', data)
            self.assertIn('admin', data)

            # Check student payload
            self.assertEqual(data['student']['username'], settings.DEMO_STUDENT_USERNAME)
            self.assertEqual(data['student']['password'], settings.DEMO_STUDENT_PASSWORD)
            self.assertEqual(data['student']['badge'], 'STD')
            self.assertEqual(data['student']['accent_color'], '#B83232')

            # Check faculty payload
            self.assertEqual(data['faculty']['username'], settings.DEMO_FACULTY_USERNAME)
            self.assertEqual(data['faculty']['password'], settings.DEMO_FACULTY_PASSWORD)
            self.assertEqual(data['faculty']['badge'], 'FAC')
            self.assertEqual(data['faculty']['accent_color'], '#795548')

            # Check admin payload
            self.assertEqual(data['admin']['username'], settings.DEMO_ADMIN_USERNAME)
            self.assertEqual(data['admin']['password'], settings.DEMO_ADMIN_PASSWORD)
            self.assertEqual(data['admin']['badge'], 'ADM')
            self.assertEqual(data['admin']['accent_color'], '#292929')

    def test_faculty_role_login_displays_faculty_demo_credentials_only(self):
        from django.test import override_settings

        with override_settings(
            DEBUG=True,
            DJANGO_ENV='development',
            DEMO_MODE=True,
            DEMO_CREDENTIALS_ENABLED=True,
            DEMO_PORTAL_ACCESS=False,
        ):
            resp = self.client.get(reverse('portal:faculty_login'))
            self.assertEqual(resp.status_code, 200)
            content = resp.content.decode('utf-8')

            # Check demo access card is present with role-specific faculty styling and icon
            self.assertIn('id="demoAccessCard"', content)
            self.assertIn('data-current-role="faculty"', content)
            self.assertIn('Faculty Demo Access', content)
            self.assertIn('auth-demo-badge auth-role-icon--faculty', content)
            self.assertIn('FAC', content)

            # Active credential elements must display faculty credentials
            self.assertIn(f'id="demoUsernameVal">{settings.DEMO_FACULTY_USERNAME}</code>', content)
            self.assertIn(f'id="demoPasswordVal">{settings.DEMO_FACULTY_PASSWORD}</code>', content)

            # Active credential elements must NOT display student or admin credentials
            self.assertNotIn(f'id="demoUsernameVal">{settings.DEMO_STUDENT_USERNAME}</code>', content)
            self.assertNotIn(f'id="demoPasswordVal">{settings.DEMO_STUDENT_PASSWORD}</code>', content)
            self.assertNotIn(f'id="demoUsernameVal">{settings.DEMO_ADMIN_USERNAME}</code>', content)
            self.assertNotIn(f'id="demoPasswordVal">{settings.DEMO_ADMIN_PASSWORD}</code>', content)

            # Verify copy buttons
            self.assertIn('id="copyUsernameBtn"', content)
            self.assertIn('id="copyPasswordBtn"', content)
            self.assertIn(f'data-copy-value="{settings.DEMO_FACULTY_USERNAME}"', content)
            self.assertIn(f'data-copy-value="{settings.DEMO_FACULTY_PASSWORD}"', content)

    def test_admin_role_login_displays_admin_demo_credentials_only(self):
        from django.test import override_settings

        with override_settings(
            DEBUG=True,
            DJANGO_ENV='development',
            DEMO_MODE=True,
            DEMO_CREDENTIALS_ENABLED=True,
            DEMO_PORTAL_ACCESS=False,
        ):
            resp = self.client.get(reverse('portal:admin_login'))
            self.assertEqual(resp.status_code, 200)
            content = resp.content.decode('utf-8')

            # Check demo access card is present with role-specific admin styling and icon
            self.assertIn('id="demoAccessCard"', content)
            self.assertIn('data-current-role="admin"', content)
            self.assertIn('Admin Demo Access', content)
            self.assertIn('auth-demo-badge auth-role-icon--admin', content)
            self.assertIn('ADM', content)

            # Active credential elements must display admin credentials
            self.assertIn(f'id="demoUsernameVal">{settings.DEMO_ADMIN_USERNAME}</code>', content)
            self.assertIn(f'id="demoPasswordVal">{settings.DEMO_ADMIN_PASSWORD}</code>', content)

            # Active credential elements must NOT display student or faculty credentials
            self.assertNotIn(f'id="demoUsernameVal">{settings.DEMO_STUDENT_USERNAME}</code>', content)
            self.assertNotIn(f'id="demoPasswordVal">{settings.DEMO_STUDENT_PASSWORD}</code>', content)
            self.assertNotIn(f'id="demoUsernameVal">{settings.DEMO_FACULTY_USERNAME}</code>', content)
            self.assertNotIn(f'id="demoPasswordVal">{settings.DEMO_FACULTY_PASSWORD}</code>', content)

            # Verify copy buttons
            self.assertIn('id="copyUsernameBtn"', content)
            self.assertIn('id="copyPasswordBtn"', content)
            self.assertIn(f'data-copy-value="{settings.DEMO_ADMIN_USERNAME}"', content)
            self.assertIn(f'data-copy-value="{settings.DEMO_ADMIN_PASSWORD}"', content)

    def test_demo_credentials_strictly_hidden_when_debug_false_or_disabled(self):
        from django.test import override_settings

        with override_settings(
            DEBUG=False,
            DJANGO_ENV='production',
            DEMO_MODE=False,
            DEMO_CREDENTIALS_ENABLED=False,
            DEMO_PORTAL_ACCESS=False,
        ):
            for route_name in ('portal:login', 'portal:student_login', 'portal:faculty_login', 'portal:admin_login'):
                resp = self.client.get(reverse(route_name))
                self.assertEqual(resp.status_code, 200)
                content = resp.content.decode('utf-8')
                self.assertNotIn('id="demoAccessCard"', content)
                self.assertNotIn('id="demo-credentials-data"', content)
                self.assertNotIn('Copy Username', content)
                self.assertNotIn('Copy Password', content)
                self.assertNotIn('DEV DEMO', content)
                # Ensure production admin credentials are never leaked
                self.assertNotIn('campus_admin', content)
                self.assertNotIn('Admin@2026!', content)

    def test_demo_credentials_authentication_and_session_redirects(self):
        # 1. Student demo credential login
        student_resp = self.client.post(
            reverse('portal:login'),
            {'username': settings.DEMO_STUDENT_USERNAME, 'password': settings.DEMO_STUDENT_PASSWORD},
        )
        self.assertRedirects(student_resp, reverse('portal:dashboard'))
        self.client.get(reverse('portal:logout'))

        # 2. Faculty demo credential login
        faculty_resp = self.client.post(
            reverse('portal:faculty_login'),
            {'username': settings.DEMO_FACULTY_USERNAME, 'password': settings.DEMO_FACULTY_PASSWORD},
        )
        self.assertRedirects(faculty_resp, reverse('portal:faculty_overview'))
        self.client.get(reverse('portal:logout'))

        # 3. Admin demo credential login
        admin_resp = self.client.post(
            reverse('portal:admin_login'),
            {'username': settings.DEMO_ADMIN_USERNAME, 'password': settings.DEMO_ADMIN_PASSWORD},
        )
        self.assertRedirects(admin_resp, reverse('portal:admin_overview'))
        self.client.get(reverse('portal:logout'))

        # 4. Cross-role authentication isolation: student cannot login via admin or faculty portals
        cross_admin = self.client.post(
            reverse('portal:admin_login'),
            {'username': settings.DEMO_STUDENT_USERNAME, 'password': settings.DEMO_STUDENT_PASSWORD},
        )
        self.assertEqual(cross_admin.status_code, 403)









