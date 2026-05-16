"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { loadBatchData, generateReport } = require("./services/reportService");
const {
  generateNarrative,
  generateWhatsAppMessage,
} = require("./services/aiService");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// POST /api/batch-report — generates the full batch progress report
app.post("/api/batch-report", async (req, res) => {
  try {
    const { batch_id, report_date: requestedReportDate } = req.body;

    if (!batch_id) {
      return res
        .status(400)
        .json({ error: "batch_id is required in request body." });
    }

    const batchData = loadBatchData(batch_id);
    if (!batchData) {
      return res.status(404).json({ error: `Batch '${batch_id}' not found.` });
    }

    // All numeric calculations done in code — no AI involvement
    const {
      reportDate,
      summaryStats,
      atRiskList,
      studentSummaries,
      aiContext,
    } = generateReport(batchData, requestedReportDate);

    // AI generates narrative from pre-computed stats only
    const aiNarrative = await generateNarrative(aiContext);

    // Bonus: AI generates WhatsApp-ready message per at-risk student
    const atRiskWithMessages = await Promise.all(
      atRiskList.map(async (student) => {
        const tutorAlertMessage = await generateWhatsAppMessage(
          student._aiContext,
        );
        const { _aiContext, ...clean } = student;
        return { ...clean, tutor_alert_message: tutorAlertMessage };
      }),
    );

    return res.json({
      batch_id,
      report_date: reportDate,
      summary_stats: summaryStats,
      at_risk_students: atRiskWithMessages,
      ai_narrative: aiNarrative,
      student_summaries: studentSummaries,
    });
  } catch (err) {
    console.error("[ERROR]", err.message);
    return res.status(500).json({
      error: "Report generation failed.",
      details: err.message,
    });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`\n  TestCrack Report Server → http://localhost:${PORT}`);
  console.log(`  POST /api/batch-report`);
  console.log(`  GET  /health\n`);
});
