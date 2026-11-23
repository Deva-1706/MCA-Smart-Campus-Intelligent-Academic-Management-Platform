from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mca_portal', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='assignmentsubmission',
            index=models.Index(fields=['student', '-submitted_at'], name='idx_subm_student_date'),
        ),
        migrations.AddIndex(
            model_name='assignmentsubmission',
            index=models.Index(fields=['assignment', 'status'], name='idx_subm_assign_status'),
        ),
        migrations.AddIndex(
            model_name='examinationresult',
            index=models.Index(fields=['student', '-submitted_at'], name='idx_examres_student_date'),
        ),
        migrations.AddIndex(
            model_name='studentnotification',
            index=models.Index(fields=['student', 'read', '-created_at'], name='idx_notif_student_read'),
        ),
        migrations.AddIndex(
            model_name='importantnotice',
            index=models.Index(fields=['is_published', 'expiry_date'], name='idx_notice_pub_exp'),
        ),
        migrations.AddIndex(
            model_name='importantnotice',
            index=models.Index(fields=['priority', '-publication_date'], name='idx_notice_prio_pub'),
        ),
        migrations.AddIndex(
            model_name='skillevidence',
            index=models.Index(fields=['student', 'status'], name='idx_skill_student_status'),
        ),
        migrations.AddIndex(
            model_name='studentproject',
            index=models.Index(fields=['student', 'status'], name='idx_proj_student_status'),
        ),
        migrations.AddIndex(
            model_name='studentproject',
            index=models.Index(fields=['showcase_approved'], name='idx_proj_showcase'),
        ),
        migrations.AddIndex(
            model_name='challengeattempt',
            index=models.Index(fields=['student', 'challenge'], name='idx_chal_student_chal'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['role', '-timestamp'], name='idx_audit_role_ts'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['actor', '-timestamp'], name='idx_audit_actor_ts'),
        ),
    ]
