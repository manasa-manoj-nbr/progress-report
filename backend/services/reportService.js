"use strict";

const fs = require("fs");
const path = require("path");

const SKILLS = ["speaking", "writing", "reading", "listening"];
const ACTIVE_WINDOW_DAYS = 5;

function parseDateOnly(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatDateOnly(dateMs) {
  return new Date(dateMs).toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  return formatDateOnly(parseDateOnly(dateStr) + days * 24 * 60 * 60 * 1000);
}

function loadBatchData(batchId) {
  const filePath = path.join(__dirname, "../data/mock_students.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return data.batch_id === batchId ? data : null;
}

function avgBand(band) {
  return SKILLS.reduce((sum, s) => sum + band[s], 0) / SKILLS.length;
}

function daysBetween(earlierDateStr, laterDateStr) {
  const ms = parseDateOnly(laterDateStr) - parseDateOnly(earlierDateStr);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function deriveReportDate(batchData) {
  if (!batchData.students || batchData.students.length === 0) {
    return new Date().toISOString().slice(0, 10);
  }

  const latestActive = batchData.students.reduce((latest, student) => {
    return parseDateOnly(student.last_active) > parseDateOnly(latest)
      ? student.last_active
      : latest;
  }, batchData.students[0].last_active);

  return addDays(latestActive, 1);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function computeDelta(student) {
  const skillDeltas = {};
  SKILLS.forEach((skill) => {
    skillDeltas[skill] = parseFloat(
      (student.current_band[skill] - student.diagnostic_band[skill]).toFixed(2),
    );
  });
  const avgDelta = parseFloat(
    (
      SKILLS.reduce((sum, s) => sum + skillDeltas[s], 0) / SKILLS.length
    ).toFixed(4),
  );
  return { skillDeltas, avgDelta };
}

// At-risk classification — all 3 rules checked independently.
// A student meeting ANY one condition is classified as at-risk.
function checkAtRisk(student, reportDate) {
  const reasons = [];

  // Rule 1: Inactive for 5+ days
  const daysInactive = daysBetween(student.last_active, reportDate);
  if (daysInactive >= 5) {
    reasons.push(`Inactive for ${daysInactive} days.`);
  }

  // Rule 2: Any skill band declined from diagnostic
  SKILLS.forEach((skill) => {
    const delta = student.current_band[skill] - student.diagnostic_band[skill];
    if (delta < 0) {
      reasons.push(
        `Band declining in ${capitalize(skill)} (${student.diagnostic_band[skill]} → ${student.current_band[skill]}).`,
      );
    }
  });

  // Rule 3: Exam within 30 days AND avg current band > 1.5 below target
  const daysUntilExam = daysBetween(reportDate, student.exam_date);
  if (daysUntilExam <= 30) {
    const avgCurrent = avgBand(student.current_band);
    const gap = student.target_band - avgCurrent;
    if (gap > 1.5) {
      reasons.push(
        `Exam in ${daysUntilExam} days with avg band ${avgCurrent.toFixed(2)} (${gap.toFixed(2)} below target of ${student.target_band}).`,
      );
    }
  }

  return {
    isAtRisk: reasons.length > 0,
    reasons,
    daysInactive,
    daysUntilExam: daysBetween(reportDate, student.exam_date),
  };
}

function getRecommendedAction(reasons) {
  if (reasons.some((r) => r.includes("declining") || r.includes("Exam in"))) {
    return "Immediate tutor contact";
  }
  return "Follow up to re-engage student";
}

function generateReport(batchData, requestedReportDate) {
  const { exam_type, students } = batchData;
  const reportDate = requestedReportDate || deriveReportDate(batchData);

  const enriched = students.map((student) => {
    const { skillDeltas, avgDelta } = computeDelta(student);
    const { isAtRisk, reasons, daysInactive, daysUntilExam } = checkAtRisk(
      student,
      reportDate,
    );
    return {
      ...student,
      skillDeltas,
      avgDelta,
      isAtRisk,
      riskReasons: reasons,
      daysInactive,
      daysUntilExam,
      avgCurrentBand: parseFloat(avgBand(student.current_band).toFixed(2)),
      avgDiagBand: parseFloat(avgBand(student.diagnostic_band).toFixed(2)),
    };
  });

  // All arithmetic computed in code
  const totalStudents = enriched.length;
  const activeThisWeek = enriched.filter(
    (s) => s.daysInactive <= ACTIVE_WINDOW_DAYS,
  ).length;
  const atRiskStudents = enriched.filter((s) => s.isAtRisk);

  // Most improved = largest average band delta across all skills
  const mostImproved = enriched.reduce((best, s) =>
    s.avgDelta > best.avgDelta ? s : best,
  );
  const batchAvgImprovement = parseFloat(
    (enriched.reduce((sum, s) => sum + s.avgDelta, 0) / totalStudents).toFixed(
      4,
    ),
  );

  const summaryStats = {
    total_students: totalStudents,
    active_this_week: activeThisWeek,
    at_risk: atRiskStudents.length,
    most_improved_student: mostImproved.name,
    most_improved_delta: mostImproved.avgDelta,
    batch_average_improvement: batchAvgImprovement,
  };

  const atRiskList = atRiskStudents.map((s) => ({
    student_id: s.id,
    name: s.name,
    risk_reason: s.riskReasons.join(" "),
    recommended_action: getRecommendedAction(s.riskReasons),
    _aiContext: (function () {
      const improved = [];
      const declined = [];
      Object.keys(s.skillDeltas).forEach((skill) => {
        const val = parseFloat(s.skillDeltas[skill]);
        if (val > 0) improved.push(`${skill} (+${val.toFixed(2)})`);
        else if (val < 0) declined.push(`${skill} (${val.toFixed(2)})`);
      });

      // choose weakest skill as recommendation when no explicit decline
      const weakestSkill = Object.keys(s.skillDeltas).reduce(
        (low, k) => (s.skillDeltas[k] < s.skillDeltas[low] ? k : low),
        Object.keys(s.skillDeltas)[0],
      );
      const recommended_focus =
        declined.length > 0
          ? `Please focus on ${declined.map((d) => d.split(" ")[0]).join(", ")} exercises and targeted practice.`
          : `Keep reinforcing strengths; add focused practice on ${weakestSkill}.`;

      return {
        name: s.name,
        reasons: s.riskReasons,
        target_band: s.target_band,
        avg_current_band: s.avgCurrentBand,
        days_until_exam: s.daysUntilExam,
        days_inactive: s.daysInactive,
        exam_type,
        improved_skills: improved,
        declined_skills: declined,
        recommended_focus,
      };
    })(),
  }));

  const studentSummaries = enriched.map((s) => ({
    student_id: s.id,
    name: s.name,
    sessions_completed: s.sessions_completed,
    last_active: s.last_active,
    days_inactive: s.daysInactive,
    exam_date: s.exam_date,
    days_until_exam: s.daysUntilExam,
    target_band: s.target_band,
    diagnostic_band: s.diagnostic_band,
    current_band: s.current_band,
    skill_deltas: s.skillDeltas,
    avg_band_delta: s.avgDelta,
    avg_current_band: s.avgCurrentBand,
    avg_diagnostic_band: s.avgDiagBand,
    is_at_risk: s.isAtRisk,
    risk_reasons: s.riskReasons,
  }));

  // AI context contains only pre-computed numbers, never raw student data
  const aiContext = {
    exam_type,
    summaryStats,
    atRiskNames: atRiskStudents.map((s) => s.name),
    mostImprovedStudent: mostImproved.name,
  };

  return { reportDate, summaryStats, atRiskList, studentSummaries, aiContext };
}

module.exports = { loadBatchData, generateReport };
