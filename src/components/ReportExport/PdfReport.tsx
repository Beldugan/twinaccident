import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import type { EdrRecord } from '../../edr/schema';
import type { ReconstructionResult } from '../../analysis/reconstruction';
import type { BehaviorAnalysis } from '../../analysis/driverBehavior';
import type { SafetyAudit } from '../../analysis/safetyAudit';
import type { AnalysisConclusions } from '../../analysis/conclusions';
import { Button } from '../ui/Button';
import { fmtSpeed, fmtTime, fmtEnergy } from '../../utils/formatting';

interface PdfReportProps {
  record: EdrRecord;
  reconstruction: ReconstructionResult;
  behavior: BehaviorAnalysis;
  audit: SafetyAudit;
  conclusions: AnalysisConclusions;
}

function addSection(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(30, 30, 35);
  doc.rect(14, y - 4, 182, 10, 'F');
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 16, y + 2);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  return y + 12;
}

function addRow(doc: jsPDF, label: string, value: string, y: number, indent = 16): number {
  doc.setTextColor(150, 150, 160);
  doc.text(label + ':', indent, y);
  doc.setTextColor(220, 220, 230);
  doc.text(value, indent + 65, y);
  return y + 6;
}

export function PdfReport({ record, reconstruction, behavior, audit, conclusions }: PdfReportProps) {
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 100));

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;

    // Title page
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, W, 297, 'F');

    doc.setFillColor(239, 68, 68);
    doc.rect(0, 0, W, 3, 'F');

    doc.setTextColor(239, 68, 68);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPORT DE ANALIZA EDR', 14, 35);
    doc.setTextColor(180, 180, 190);
    doc.setFontSize(14);
    doc.text('DIGITAL TWIN POST-ACCIDENT', 14, 45);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 130);
    doc.setFont('helvetica', 'normal');
    doc.text(`Record ID: ${record.recordId}`, 14, 62);
    doc.text(`Data analizei: ${new Date().toLocaleDateString('ro-RO')}`, 14, 68);
    doc.text(`Vehicul: ${record.vehicle.category} / ${record.vehicle.bodyType} / ${record.vehicle.mass_total_kg} kg`, 14, 74);
    doc.text(`Generat cu TwinAccident v1.0 | Master IVM 2026 | FIMIM Constanta`, 14, 80);

    // Summary box
    doc.setFillColor(20, 20, 28);
    doc.roundedRect(14, 92, 182, 30, 3, 3, 'F');
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMAR EXECUTIV', 18, 100);
    doc.setTextColor(200, 200, 210);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const summaryLines = doc.splitTextToSize(conclusions.summary, 170);
    doc.text(summaryLines.slice(0, 3), 18, 107);

    // Page 2 – Reconstruction
    doc.addPage();
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, W, 297, 'F');

    let y = 20;
    y = addSection(doc, 'MODUL 1: RECONSTRUCTIE CINEMATICA', y);

    y = addRow(doc, 'Viteza medie pre-crash', fmtSpeed(reconstruction.averageSpeed_kmh), y);
    y = addRow(doc, 'Viteza maxima pre-crash', fmtSpeed(reconstruction.maxSpeed_kmh), y);
    y = addRow(doc, 'Viteza la impact', fmtSpeed(reconstruction.impactSpeed_kmh), y);
    y = addRow(doc, 'Distanta parcursa (5s)', `${reconstruction.totalDistanceTraveled_m.toFixed(1)} m`, y);
    y += 4;
    y = addRow(doc, 'Delta-V longitudinal', fmtSpeed(reconstruction.deltaV_longitudinal_kmh), y);
    y = addRow(doc, 'Delta-V lateral', fmtSpeed(reconstruction.deltaV_lateral_kmh), y);
    y = addRow(doc, 'Delta-V total', fmtSpeed(reconstruction.deltaV_total_kmh), y);
    y += 4;
    y = addRow(doc, 'Energie cinetica la impact', fmtEnergy(reconstruction.impactKineticEnergy_J), y);
    y = addRow(doc, 'Energie disipata la impact', fmtEnergy(reconstruction.energyDissipatedAtImpact_J), y);
    y = addRow(doc, 'Raport energie disipata', `${(reconstruction.energyRatio * 100).toFixed(1)}%`, y);
    y += 4;
    y = addRow(doc, 'Decelerare de varf', `${reconstruction.peakDeceleration_g.toFixed(2)} g`, y);
    y = addRow(doc, 'Durata crash', `${reconstruction.crashDuration_ms.toFixed(0)} ms`, y);
    y = addRow(doc, 'Clasa de severitate', reconstruction.severityClass.toUpperCase(), y);

    y += 8;
    y = addSection(doc, 'MODUL 2: COMPORTAMENT SOFER', y);

    y = addRow(doc, 'PRT calculat', fmtTime(behavior.prtCalculated_s), y);
    y = addRow(doc, 'Evaluare PRT', behavior.prtAssessment.toUpperCase(), y);
    y = addRow(doc, 'Prima aplicare frana', behavior.firstBrakeApplication_t !== null ? fmtTime(Math.abs(behavior.firstBrakeApplication_t)) + ' inainte de impact' : 'Nicio frana detectata', y);
    y = addRow(doc, 'Distanta oprire teoretica', `${behavior.theoreticalStoppingDistance_m.toFixed(1)} m`, y);
    y = addRow(doc, 'Distanta oprire reala', `${behavior.actualStoppingDistance_m.toFixed(1)} m`, y);
    y = addRow(doc, 'Putea evita accidentul', behavior.couldHaveAvoided ? 'DA' : 'NU', y);
    y = addRow(doc, 'Vina estimata sofer', `${behavior.driverFault_estimated_percent}%`, y);

    y += 8;
    y = addSection(doc, 'MODUL 3: AUDIT SISTEME SIGURANTA', y);

    y = addRow(doc, 'ABS', `${audit.abs.triggered ? 'ACTIVAT' : 'NEACTIVAT'} — ${audit.abs.assessment.replace(/_/g, ' ')}`, y);
    y = addRow(doc, 'ESC', `${audit.esc.triggered ? 'ACTIVAT' : 'NEACTIVAT'} — ${audit.esc.assessment.replace(/_/g, ' ')}`, y);
    y = addRow(doc, 'Airbag frontal', `${audit.airbag.deployed ? 'DECLANSAT' : 'NEDECLANSAT'} — ${audit.airbag.deploymentAssessment.replace(/_/g, ' ')}`, y);
    if (audit.airbag.deployed) {
      y = addRow(doc, '  Timp declansare airbag', `${audit.airbag.deploymentTime_ms.toFixed(1)} ms`, y);
    }
    y = addRow(doc, 'Centura sofer', `${audit.seatbelt.driverBuckled ? 'PURTATA' : 'NEPURTATA'} — ${audit.seatbelt.assessment.replace(/_/g, ' ')}`, y);
    y = addRow(doc, 'Performanta globala sisteme', audit.overallSystemPerformance.replace(/_/g, ' ').toUpperCase(), y);

    // Page 3 – Conclusions
    doc.addPage();
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, W, 297, 'F');

    y = 20;
    y = addSection(doc, 'CONCLUZII SI RECOMANDARI', y);

    doc.setTextColor(200, 200, 210);
    doc.setFontSize(8.5);
    const causeLines = doc.splitTextToSize(conclusions.causeDescription, 178);
    doc.text(causeLines, 16, y);
    y += causeLines.length * 5 + 8;

    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomandari:', 16, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 180);
    for (const rec of conclusions.recommendations) {
      const lines = doc.splitTextToSize(`• ${rec}`, 178);
      doc.text(lines, 16, y);
      y += lines.length * 5;
    }

    y += 6;
    doc.setTextColor(100, 100, 110);
    doc.setFontSize(7.5);
    const disclaimerLines = doc.splitTextToSize(conclusions.disclaimer, 178);
    doc.text(disclaimerLines, 16, y);

    // Footer on all pages
    for (let pg = 1; pg <= doc.getNumberOfPages(); pg++) {
      doc.setPage(pg);
      doc.setFillColor(239, 68, 68);
      doc.rect(0, 294, W, 3, 'F');
      doc.setTextColor(100, 100, 110);
      doc.setFontSize(7);
      doc.text(`TwinAccident v1.0 | ${record.recordId} | Pag. ${pg}/${doc.getNumberOfPages()}`, 14, 293);
    }

    doc.save(`TwinAccident_${record.recordId}_${new Date().toISOString().slice(0, 10)}.pdf`);
    setGenerating(false);
  };

  return (
    <Button variant="primary" onClick={generate} disabled={generating}>
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {generating ? 'Generez PDF...' : 'Descarcă raport PDF'}
    </Button>
  );
}
