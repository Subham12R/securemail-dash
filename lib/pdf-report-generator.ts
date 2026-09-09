import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisDetailViewModel } from "./analysis-detail.ts";

export function generateForensicPdfReport(viewModel: AnalysisDetailViewModel): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const summary = viewModel.summary;

  // Header Banner
  doc.setFillColor(11, 19, 43); // #0B132B Dark SOC Navy
  doc.rect(0, 0, 210, 36, "F");

  // Logo / Title
  doc.setTextColor(0, 229, 255); // Cyan #00E5FF
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SECUREMAILSCOPE", 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("FORENSIC SECURITY AUDIT REPORT", 14, 22);

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toUTCString()}`, 14, 29);

  // Right side header metadata
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`REF: SMR-${summary.request_id.slice(0, 16)}`, 196, 15, { align: "right" });
  doc.setTextColor(148, 163, 184);
  doc.text("CLASSIFICATION: RESTRICTED / SOC ONLY", 196, 22, { align: "right" });
  doc.text(`CAPTURE: ${summary.capture_id || "Live Ingestion"}`, 196, 29, { align: "right" });

  let y = 46;

  // Executive Verdict Box
  const verdict = summary.final_verdict.toUpperCase();
  const riskScorePercent = Math.round(summary.risk_score * 100);

  let verdictColor: [number, number, number] = [16, 185, 129]; // Green
  if (verdict === "MALICIOUS" || summary.risk_score > 0.7) {
    verdictColor = [239, 68, 68]; // Red
  } else if (verdict === "SUSPICIOUS" || summary.risk_score > 0.4) {
    verdictColor = [245, 158, 11]; // Amber
  }

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("EXECUTIVE THREAT VERDICT", 20, y + 8);

  doc.setFontSize(14);
  doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.text(verdict, 20, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Posture: ${(summary.posture || "Unknown").toUpperCase()}`, 20, y + 23);

  // Risk Score on right of box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("RISK INDEX", 140, y + 8);

  doc.setFontSize(18);
  doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.text(`${riskScorePercent} / 100`, 140, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Evidence Triggers: ${summary.rule_triggers_count}`, 140, y + 23);

  y += 36;

  // Session & Network Telemetry Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Session & Protocol Telemetry", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Observed Value", "Parameter", "Observed Value"]],
    body: [
      ["Session ID", summary.session_id, "Protocol", summary.protocol || "Not observed"],
      ["Capture ID", summary.capture_id || "None", "Cryptographic Posture", summary.posture || "None"],
      ["Client ID", summary.client_id || "Unspecified", "Timestamp", summary.timestamp],
      ["Synthetic Trace", summary.is_synthetic ? "Yes" : "No", "Evidence Archived", String(summary.evidence_ref_count)],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 34 },
      1: { cellWidth: 56 },
      2: { fontStyle: "bold", cellWidth: 34 },
      3: { cellWidth: 56 },
    },
  });

  // @ts-expect-error - lastAutoTable injected by plugin
  y = doc.lastAutoTable.finalY + 10;

  // Security Rule Triggers & Citations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Deterministic Rule Findings & Standards Citations", 14, y);
  y += 3;

  const ruleRows = viewModel.model.rule_findings.map((finding) => [
    finding.label,
    (finding.severity || "LOW").toUpperCase(),
    finding.detail || "No additional detail",
    finding.citations.join(", ") || "N/A",
  ]);

  if (ruleRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Finding", "Severity", "Technical Detail", "Citations"]],
      body: ruleRows,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 38 },
        1: { cellWidth: 22 },
        2: { cellWidth: 80 },
        3: { cellWidth: 40 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const val = String(data.cell.raw).toUpperCase();
          if (val === "CRITICAL" || val === "HIGH") {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "MEDIUM") {
            data.cell.styles.textColor = [217, 119, 6];
          }
        }
      },
    });
    // @ts-expect-error - lastAutoTable injected by plugin
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("No deterministic rule violations observed for this session.", 14, y + 6);
    y += 14;
  }

  // Machine Learning Model Evaluation
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Ensemble Machine Learning Assessment", 14, y);
  y += 3;

  const mlRows = viewModel.model.evaluations.map((evalItem) => [
    evalItem.model,
    evalItem.prediction || "Not classified",
    evalItem.risk_probability !== null ? `${(evalItem.risk_probability * 100).toFixed(1)}%` : "N/A",
  ]);

  if (mlRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Model Name", "Predicted Posture", "Risk Probability"]],
      body: mlRows,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 60 },
        2: { cellWidth: 60 },
      },
    });
    // @ts-expect-error - lastAutoTable injected by plugin
    y = doc.lastAutoTable.finalY + 10;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("SecureMailScope SOC Forensics Engine • Cryptographic Verification & Threat Mitigation", 14, 290);
    doc.text(`Page ${i} of ${totalPages}`, 196, 290, { align: "right" });
  }

  return doc;
}

export function downloadForensicPdfReport(viewModel: AnalysisDetailViewModel) {
  const doc = generateForensicPdfReport(viewModel);
  const filename = `SecureMailScope-Forensic-Report-${viewModel.summary.session_id || viewModel.summary.request_id}.pdf`;
  doc.save(filename);
}
