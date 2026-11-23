import { jsPDF } from 'jspdf';
import { GeneratedStudyNote, StudentUser } from '../types';

export function exportStudyNoteToPdf(note: GeneratedStudyNote, student?: StudentUser | null): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  // Academic Top Header Banner (#292929 + #B83232 stripe)
  doc.setFillColor(41, 41, 41);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(184, 50, 50);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  doc.setTextColor(242, 201, 76);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`MCA SEMESTER 1  ·  ${note.subjectCode} · UNIT ${note.unit}  ·  ${note.mode.toUpperCase()}`, margin, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(note.title, maxWidth);
  doc.text(titleLines[0] || note.topic, margin, 20);

  y = 38;

  // Candidate & Source Meta
  doc.setTextColor(80, 75, 72);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const studentLine = `Candidate: ${student?.name || 'Devanath N'} (${student?.rollNumber || 'P26CA125'})  |  Advisor: ${student?.advisorName || 'HCASICAN'}  |  Date: ${note.createdAt}`;
  doc.text(studentLine, margin, y);
  y += 5;

  const sourceLine =
    note.sourcePdfTitles.length > 0
      ? `Primary PDF Source(s): ${note.sourcePdfTitles.join(', ')}${note.sourcePageCitations.length > 0 ? `  [Pages: ${note.sourcePageCitations.join(', ')}]` : ''}`
      : 'Source Disclosure: Supplementary AI Academic Explanation (no matching PDF uploaded for this topic).';
  const sourceWrapped = doc.splitTextToSize(sourceLine, maxWidth);
  doc.text(sourceWrapped, margin, y);
  y += sourceWrapped.length * 4 + 4;

  // Summary Box
  if (note.summary) {
    const summaryLines = doc.splitTextToSize(note.summary, maxWidth - 8);
    const boxHeight = summaryLines.length * 4.5 + 10;
    ensureSpace(boxHeight);
    doc.setFillColor(247, 245, 242);
    doc.setDrawColor(184, 50, 50);
    doc.rect(margin, y, maxWidth, boxHeight, 'FD');
    doc.setTextColor(184, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('EXECUTIVE TOPIC SUMMARY', margin + 4, y + 6);
    doc.setTextColor(41, 41, 41);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(summaryLines, margin + 4, y + 11);
    y += boxHeight + 6;
  }

  // Sections
  note.sections.forEach(sec => {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(184, 50, 50);
    const headingWrapped = doc.splitTextToSize(`${sec.heading}  [${sec.sourceType}]`, maxWidth);
    doc.text(headingWrapped, margin, y);
    y += headingWrapped.length * 5 + 2;

    if (sec.formulaBox) {
      const fLines = doc.splitTextToSize(sec.formulaBox, maxWidth - 8);
      const fHeight = fLines.length * 4.5 + 6;
      ensureSpace(fHeight);
      doc.setFillColor(254, 249, 231);
      doc.setDrawColor(242, 201, 76);
      doc.rect(margin, y, maxWidth, fHeight, 'FD');
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(41, 41, 41);
      doc.text(fLines, margin + 4, y + 5);
      y += fHeight + 4;
    }

    const cleanBody = sec.contentMarkdown
      .replace(/```[\w]*\n([\s\S]*?)```/g, '$1')
      .replace(/\*\*/g, '');
    const bodyLines = doc.splitTextToSize(cleanBody, maxWidth);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(41, 41, 41);
    bodyLines.forEach((line: string) => {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 4.5;
    });
    y += 3;

    if (sec.diagramText) {
      const dLines = doc.splitTextToSize(sec.diagramText, maxWidth - 8);
      const dHeight = dLines.length * 4 + 6;
      ensureSpace(dHeight);
      doc.setFillColor(244, 241, 238);
      doc.rect(margin, y, maxWidth, dHeight, 'F');
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(41, 41, 41);
      doc.text(dLines, margin + 4, y + 4.5);
      y += dHeight + 4;
    }

    if (sec.codeSnippet?.code) {
      const cLines = doc.splitTextToSize(sec.codeSnippet.code, maxWidth - 8);
      const cHeight = cLines.length * 4 + 8;
      ensureSpace(cHeight);
      doc.setFillColor(41, 41, 41);
      doc.rect(margin, y, maxWidth, cHeight, 'F');
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(242, 201, 76);
      doc.text(cLines, margin + 4, y + 5.5);
      y += cHeight + 4;
    }

    if (sec.citations && sec.citations.length > 0) {
      ensureSpace(6);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(121, 85, 72);
      const citeStr = `Source: ${sec.citations.map(c => `${c.pdfTitle} (Page ${c.pageNumber})`).join('; ')}`;
      doc.text(doc.splitTextToSize(citeStr, maxWidth), margin, y);
      y += 5;
    }

    y += 3;
  });

  // Important Points
  if (note.importantPoints.length > 0) {
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(184, 50, 50);
    doc.text('Key Exam Takeaways', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(41, 41, 41);
    note.importantPoints.forEach(pt => {
      const pLines = doc.splitTextToSize(`• ${pt}`, maxWidth);
      ensureSpace(pLines.length * 4.5);
      doc.text(pLines, margin, y);
      y += pLines.length * 4.5 + 1;
    });
  }

  const safeSlug = `${note.subjectCode}_Unit${note.unit}_${note.topic.replace(/[^a-z0-9]+/gi, '_')}`;
  doc.save(`${safeSlug}.pdf`);
}
