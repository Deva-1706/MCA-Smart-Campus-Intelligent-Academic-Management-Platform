from django.urls import path
from . import views

app_name = 'portal'

urlpatterns = [
    # Deployment Health Check
    path('health/', views.health_check_view, name='health_check'),

    # Public Pages
    path('', views.home_view, name='home'),
    path('about/', views.about_view, name='about'),
    path('subjects/', views.subjects_view, name='subjects'),
    path('subjects/<str:code>/', views.subject_detail_view, name='subject_detail'),
    path('features/', views.features_view, name='features'),
    path('how-it-works/', views.how_it_works_view, name='how_it_works'),
    path('contact/', views.contact_view, name='contact'),
    path('faq/', views.faq_view, name='faq'),

    # Separate Role Login Portals & Accounts
    path('student-login/', views.student_login_view, name='student_login'),
    path('faculty-login/', views.faculty_login_view, name='faculty_login'),
    path('admin-login/', views.admin_login_view, name='admin_login'),
    path('portal-select/enter/<str:role>/', views.demo_portal_enter_view, name='demo_portal_enter'),
    path('accounts/login/', views.login_view, name='login'),
    path('accounts/logout/', views.logout_view, name='logout'),
    path('accounts/change-password/', views.change_password_view, name='change_password'),
    path('accounts/password-reset/', views.password_reset_view, name='password_reset'),
    path('accounts/password-reset/confirm/<uidb64>/<token>/', views.password_reset_confirm_view, name='password_reset_confirm'),

    # Student Portal (Student Role Only)
    path('portal/dashboard/', views.dashboard_view, name='dashboard'),
    path('portal/my-subjects/', views.my_subjects_view, name='my_subjects'),
    path('portal/assignments/', views.assignments_view, name='assignments'),
    path('portal/examinations/', views.examinations_view, name='examinations'),
    path('portal/coding-lab/', views.coding_lab_view, name='coding_lab'),
    path('portal/coding-lab/execute/', views.coding_lab_execute_view, name='coding_lab_execute'),
    path('portal/materials/', views.materials_view, name='materials'),
    path('portal/materials/<int:material_id>/download/', views.download_material_view, name='download_material'),
    path('portal/materials/generate-notes/', views.generate_study_notes_view, name='generate_study_notes'),
    path('portal/materials/notes/<int:note_id>/action/', views.study_note_action_view, name='study_note_action'),
    path('portal/bookmarks/', views.bookmarks_view, name='bookmarks'),
    path('portal/analytics/', views.analytics_view, name='analytics'),
    path('portal/reports/', views.reports_view, name='reports'),
    path('portal/notifications/', views.notifications_view, name='notifications'),
    path('portal/profile/', views.profile_view, name='profile'),

    # Student Feature Modules & Smart Campus Growth Modules
    path('portal/achievements/', views.achievements_view, name='achievements'),
    path('portal/practice-arena/', views.practice_arena_view, name='practice_arena'),
    path('portal/flashcards/', views.flashcards_view, name='flashcards'),
    path('portal/academic-calendar/', views.academic_calendar_view, name='academic_calendar'),
    path('portal/notices/<int:notice_id>/read/', views.mark_notice_read_view, name='mark_notice_read'),
    path('portal/notices/<int:notice_id>/attachment/', views.download_notice_attachment_view, name='download_notice_attachment'),
    path('portal/notices/manage/', views.manage_notices_view, name='manage_notices'),
    path('portal/academic-intelligence/', views.academic_intelligence_view, name='academic_intelligence'),
    path('portal/skill-dna/', views.skill_dna_view, name='skill_dna'),
    path('portal/project-studio/', views.project_studio_view, name='project_studio'),
    path('portal/career-readiness/', views.career_readiness_view, name='career_readiness'),
    path('portal/study-planner/', views.study_planner_view, name='study_planner'),
    path('portal/knowledge-graph/', views.knowledge_graph_view, name='knowledge_graph'),
    path('portal/challenge-arena/', views.challenge_arena_view, name='challenge_arena'),
    path('portal/digital-passport/', views.digital_passport_view, name='digital_passport'),

    # Dedicated Faculty Portal (Faculty Role Only)
    path('faculty-portal/overview/', views.faculty_overview_view, name='faculty_overview'),
    path('faculty-portal/subjects/', views.faculty_subjects_view, name='faculty_subjects'),
    path('faculty-portal/materials/', views.faculty_materials_view, name='faculty_materials'),
    path('faculty-portal/question-bank/', views.faculty_question_bank_view, name='faculty_question_bank'),
    path('faculty-portal/assessments/', views.faculty_assessments_view, name='faculty_assessments'),
    path('faculty-portal/coding-lab/', views.faculty_coding_lab_view, name='faculty_coding_lab'),
    path('faculty-portal/submissions/', views.faculty_submissions_view, name='faculty_submissions'),
    path('faculty-portal/projects/', views.faculty_projects_view, name='faculty_projects'),
    path('faculty-portal/skill-dna/', views.faculty_skill_dna_view, name='faculty_skill_dna'),
    path('faculty-portal/knowledge-graph/', views.faculty_knowledge_graph_view, name='faculty_knowledge_graph'),
    path('faculty-portal/challenges/', views.faculty_challenges_view, name='faculty_challenges'),

    # Dedicated Admin Portal (Admin Role Only)
    path('admin-portal/overview/', views.admin_overview_view, name='admin_overview'),
    path('admin-portal/users/', views.admin_users_view, name='admin_users'),
    path('admin-portal/academics/', views.admin_academics_view, name='admin_academics'),
    path('admin-portal/allocations/', views.admin_allocations_view, name='admin_allocations'),
    path('admin-portal/materials/', views.admin_materials_view, name='admin_materials'),
    path('admin-portal/notices/', views.admin_notices_view, name='admin_notices'),
    path('admin-portal/certificates/', views.admin_certificates_view, name='admin_certificates'),
    path('admin-portal/settings/', views.admin_settings_view, name='admin_settings'),
    path('admin-portal/audit-logs/', views.admin_audit_logs_view, name='admin_audit_logs'),
]
