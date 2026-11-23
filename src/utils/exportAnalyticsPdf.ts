import { jsPDF } from 'jspdf';
import { StudentUser, Assignment } from '../types';

export interface SubjectReportRow {
  code: string;
  name: string;
  credits: number;
  completedUnits: number;
  totalUnits: number;
  assignmentAvg: number | null;
  examAvg: number | null;
  internalScore: number;
  projectedFinalPercent: number;
  grade: string;
  gradePoints: number;
}

export interface ExamResultSummary {
  examId: string;
  examTitle: string;
  subjectCode: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface AnalyticsPdfPayload {
  student: StudentUser;
  projectedSGPA: number;
  avgCurriculumMastery: string;
  subjectRows: SubjectReportRow[];
  completedExams: ExamResultSummary[];
  assignments: Assignment[];
  weeklyStudyHours: { day: string; hours: number }[];
}

export function exportAnalyticsSummaryPdf(payload: AnalyticsPdfPayload): string {
  const {
    student,
    projectedSGPA,
    avgCurriculumMastery,
    subjectRows,
    completedExams,
    assignments,
    weeklyStudyHours
  } = payload;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = 0;

  // Top Red Accent Bar (#B83232)
  doc.setFillColor(184, 50, 50);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Dark Gray Header Banner (#292929)
  doc.setFillColor(41, 41, 41);
  doc.rect(0, 4, pageWidth, 30, 'F');

  doc.setTextColor(242, 201, 76); // Yellow (#F2C94C)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('MCA ACADEMIC PORTAL · DEPARTMENT OF COMPUTER APPLICATIONS', margin, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('Academic Grades & Learning Progress Report', margin, 21.5);

  doc.setTextColor(215, 204, 200);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `${student.program} (Semester ${student.semester}) · Batch ${student.batch}`,
    margin,
    28
  );

  // Right-aligned Generated Date
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(242, 201, 76);
  doc.text(`ID: ${student.studentId}`, pageWidth - margin, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 21.5, { align: 'right' });
  doc.text(`Advisor: ${student.advisorName}`, pageWidth - margin, 28, { align: 'right' });

  y = 42;

  // Student Profile Box (#F7F5F2)
  doc.setFillColor(247, 245, 242);
  doc.setDrawColor(215, 204, 200);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(121, 85, 72); // Brown (#795548)
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT NAME', margin + 4, y + 6);
  doc.text('ROLL NUMBER', margin + 54, y + 6);
  doc.text('EMAIL', margin + 92, y + 6);
  doc.text('CREDITS PROGRESS', margin + 148, y + 6);

  doc.setFontSize(9.5);
  doc.setTextColor(41, 41, 41);
  doc.text(student.name, margin + 4, y + 12.5);
  doc.text(student.rollNumber, margin + 54, y + 12.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(student.email, margin + 92, y + 12.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${student.completedCredits} / ${student.totalCredits} Credits`, margin + 148, y + 12.5);

  // KPI strip inside bottom half of profile box
  doc.setDrawColor(230, 224, 218);
  doc.line(margin + 4, y + 15.5, pageWidth - margin - 4, y + 15.5);
  doc.setFontSize(8.5);
  doc.setTextColor(41, 41, 41);
  doc.text(`Current SGPA: ${student.currentSGPA.toFixed(2)}`, margin + 4, y + 21);
  doc.setTextColor(184, 50, 50);
  doc.text(`Projected End-Sem SGPA: ${projectedSGPA.toFixed(2)}`, margin + 48, y + 21);
  doc.setTextColor(41, 41, 41);
  doc.text(`Target SGPA: ${student.targetSGPA.toFixed(2)}`, margin + 104, y + 21);
  doc.text(`Syllabus Mastery: ${avgCurriculumMastery}%`, margin + 148, y + 21);

  y += 31;

  // Section 1: Syllabus Mastery & Study Cadence
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(41, 41, 41);
  doc.text('1. Curriculum Completion & Weekly Study Progress', margin, y);
  y += 4;

  const masteryPct = Math.min(100, Math.max(0, Number(avgCurriculumMastery) || 0));
  const totalWeeklyHours = weeklyStudyHours.reduce((s, d) => s + d.hours, 0).toFixed(1);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(225, 219, 214);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(41, 41, 41);
  doc.setFont('helvetica', 'bold');
  doc.text(`Overall Curriculum Mastery: ${masteryPct.toFixed(1)}%`, margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(121, 85, 72);
  doc.text(
    `Credits Earned: ${student.completedCredits}/${student.totalCredits} · Semester ${student.semester}`,
    margin + 68,
    y + 6.5
  );

  // Curriculum Progress Bar
  const barX = margin + 4;
  const barY = y + 9.5;
  const barW = contentWidth - 8;
  const barH = 4;
  doc.setFillColor(235, 230, 225);
  doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');
  doc.setFillColor(184, 50, 50);
  doc.roundedRect(barX, barY, (barW * masteryPct) / 100, barH, 1, 1, 'F');

  doc.setFontSize(8);
  doc.setTextColor(121, 85, 72);
  const studySummaryText = weeklyStudyHours.map(d => `${d.day}: ${d.hours}h`).join('  |  ');
  doc.text(`Weekly Study Total: ${totalWeeklyHours} hrs  (${studySummaryText})`, margin + 4, y + 20);

  y += 31;

  // Section 2: Course-Wise Grades & Progress Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(41, 41, 41);
  doc.text('2. Course-Wise Academic Standing & Grade Forecast', margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(41, 41, 41);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  const cols = {
    code: margin + 3,
    title: margin + 21,
    credits: margin + 82,
    units: margin + 95,
    assign: margin + 114,
    exam: margin + 135,
    finalPct: margin + 153,
    grade: margin + 170
  };

  doc.text('CODE', cols.code, y + 5.3);
  doc.text('SUBJECT TITLE', cols.title, y + 5.3);
  doc.text('CR', cols.credits, y + 5.3);
  doc.text('UNITS', cols.units, y + 5.3);
  doc.text('ASSIGN.', cols.assign, y + 5.3);
  doc.text('EXAMS', cols.exam, y + 5.3);
  doc.text('EST.%', cols.finalPct, y + 5.3);
  doc.text('GRADE', cols.grade, y + 5.3);
  y += 8;

  subjectRows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 242);
    doc.setDrawColor(230, 224, 218);
    doc.rect(margin, y, contentWidth, 9, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(184, 50, 50);
    doc.text(row.code, cols.code, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(41, 41, 41);
    const trimmedName = row.name.length > 31 ? row.name.slice(0, 29) + '...' : row.name;
    doc.text(trimmedName, cols.title, y + 6);

    doc.text(String(row.credits), cols.credits + 1, y + 6);
    doc.text(`${row.completedUnits}/${row.totalUnits}`, cols.units, y + 6);
    doc.text(row.assignmentAvg !== null ? `${row.assignmentAvg}%` : 'Pending', cols.assign, y + 6);
    doc.text(row.examAvg !== null ? `${row.examAvg}%` : 'Pending', cols.exam, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(`${row.projectedFinalPercent}%`, cols.finalPct, y + 6);
    doc.setTextColor(184, 50, 50);
    doc.text(`${row.grade} (${row.gradePoints})`, cols.grade, y + 6);

    y += 9;
  });

  y += 8;

  // Section 3: Recorded Examination & Assignment Evaluations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(41, 41, 41);
  doc.text('3. Recorded Examination & Assignment Evaluations', margin, y);
  y += 5;

  const evaluatedOrSubmittedAssignments = assignments.filter(
    a => a.status === 'Evaluated' || a.status === 'Submitted'
  );

  doc.setFontSize(8.5);
  if (completedExams.length === 0 && evaluatedOrSubmittedAssignments.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(121, 85, 72);
    doc.text('No completed exams or submitted assignments recorded yet.', margin, y);
    y += 7;
  } else {
    completedExams.forEach(exam => {
      if (y > pageHeight - 28) {
        doc.addPage();
        y = 18;
      }
      doc.setFillColor(247, 245, 242);
      doc.setDrawColor(225, 219, 214);
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(184, 50, 50);
      doc.text(`[EXAM] ${exam.subjectCode}`, margin + 3, y + 6.3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(41, 41, 41);
      const titleText = exam.examTitle.length > 52 ? exam.examTitle.slice(0, 50) + '...' : exam.examTitle;
      doc.text(titleText, margin + 29, y + 6.3);

      doc.setFont('helvetica', 'bold');
      doc.text(
        `${exam.score}/${exam.totalMarks} (${exam.percentage}%) · ${exam.passed ? 'PASS' : 'REVIEW'}`,
        pageWidth - margin - 3,
        y + 6.3,
        { align: 'right' }
      );
      y += 12;
    });

    evaluatedOrSubmittedAssignments.forEach(asg => {
      if (y > pageHeight - 28) {
        doc.addPage();
        y = 18;
      }
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(225, 219, 214);
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(121, 85, 72);
      doc.text(`[ASG] ${asg.subjectCode}`, margin + 3, y + 6.3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(41, 41, 41);
      const asgTitle = asg.title.length > 52 ? asg.title.slice(0, 50) + '...' : asg.title;
      doc.text(asgTitle, margin + 29, y + 6.3);

      doc.setFont('helvetica', 'bold');
      const marksObtained = asg.studentSubmission?.marksObtained;
      const scoreText =
        marksObtained !== undefined
          ? `${marksObtained}/${asg.totalMarks} (${Math.round((marksObtained / asg.totalMarks) * 100)}%) · EVALUATED`
          : 'Submitted · Pending Evaluation';
      doc.text(scoreText, pageWidth - margin - 3, y + 6.3, { align: 'right' });
      y += 12;
    });
  }

  // Footer
  const footerY = pageHeight - 12;
  doc.setDrawColor(215, 204, 200);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(121, 85, 72);
  doc.text(
    `MCA Semester 1 Academic Assessment & Learning Portal · Certified by Faculty Advisor ${student.advisorName}`,
    margin,
    footerY
  );
  doc.text('Official Student Analytics Export', pageWidth - margin, footerY, { align: 'right' });

  const safeStudentName = student.name.replace(/[^a-zA-Z0-9]+/g, '_');
  const fileName = `${safeStudentName}_${student.studentId}_Analytics_Summary.pdf`;
  doc.save(fileName);
  return fileName;
}
