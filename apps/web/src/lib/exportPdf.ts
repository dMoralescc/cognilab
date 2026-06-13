import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExerciseResult {
  title: string;
  cognitiveArea: string;
  level: number;
  hits: number;
  errors: number;
  reactionTimeMs: number | null;
  completedAt: string;
}

interface SessionData {
  createdAt: string;
  exercises: ExerciseResult[];
}

interface PatientReport {
  patientName: string;
  diagnosis: string | null;
  centerName: string;
  sessions: SessionData[];
}

const AREA_LABEL: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'Func. Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cog. Social',
};

function pct(hits: number, errors: number): string {
  const total = hits + errors;
  if (total === 0) return '—';
  return `${Math.round((hits / total) * 100)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function exportPatientPdf(report: PatientReport) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ─── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Cognilab', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Informe de progreso cognitivo', margin, 19);

  if (report.centerName) {
    doc.text(report.centerName, pageW - margin, 12, { align: 'right' });
  }
  doc.text(`Generado: ${formatDate(new Date().toISOString())}`, pageW - margin, 19, { align: 'right' });

  // ─── Patient info ─────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(report.patientName, margin, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (report.diagnosis) doc.text(`Diagnóstico: ${report.diagnosis}`, margin, 47);

  // ─── Summary table ────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen por sesión', margin, 58);

  const summaryRows = report.sessions.map((s, i) => {
    const totalHits   = s.exercises.reduce((a, e) => a + e.hits, 0);
    const totalErrors = s.exercises.reduce((a, e) => a + e.errors, 0);
    const areas = [...new Set(s.exercises.map((e) => AREA_LABEL[e.cognitiveArea] ?? e.cognitiveArea))].join(', ');
    return [
      `S${i + 1}`,
      formatDate(s.createdAt),
      String(s.exercises.length),
      pct(totalHits, totalErrors),
      areas,
    ];
  });

  autoTable(doc, {
    startY: 62,
    head: [['Sesión', 'Fecha', 'Ejercicios', 'Precisión', 'Áreas trabajadas']],
    body: summaryRows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: margin, right: margin },
  });

  // ─── Detail per session ───────────────────────────────────────────────────
  for (const [si, session] of report.sessions.entries()) {
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    const yAfterGap = finalY + 10;

    if (yAfterGap > 260) doc.addPage();

    const titleY = yAfterGap > 260 ? 20 : yAfterGap;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(`Sesión ${si + 1} — ${formatDate(session.createdAt)}`, margin, titleY);

    const rows = session.exercises.map((ex) => [
      ex.title,
      AREA_LABEL[ex.cognitiveArea] ?? ex.cognitiveArea,
      String(ex.level),
      String(ex.hits),
      String(ex.errors),
      pct(ex.hits, ex.errors),
      ex.reactionTimeMs ? `${Math.round(ex.reactionTimeMs)}ms` : '—',
    ]);

    autoTable(doc, {
      startY: titleY + 3,
      head: [['Ejercicio', 'Área', 'Nivel', 'Aciertos', 'Errores', 'Precisión', 'TR medio']],
      body: rows,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 28 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 22, halign: 'center' },
      },
    });
  }

  // ─── Footer on each page ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Cognilab · Informe generado el ${formatDate(new Date().toISOString())} · Pág. ${p} / ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  doc.save(`Informe_${report.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
