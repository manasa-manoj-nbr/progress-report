import { useState } from "react";

export default function AtRiskCard({ student }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = student.tutor_alert_message || "";

    if (!text) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch {
      // Fallback for non-HTTPS or older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copiedText = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (!copiedText) {
        return;
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white border border-red-200 rounded-xl shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
          <p className="text-xs text-slate-400">{student.student_id}</p>
        </div>
        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
          AT RISK
        </span>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        <p className="text-xs font-semibold text-red-700 mb-0.5">Risk Reason</p>
        <p className="text-sm text-slate-700">{student.risk_reason}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
          {student.recommended_action}
        </span>
      </div>

      {student.tutor_alert_message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-green-800">
              📱 WhatsApp Message
            </p>
            <button
              onClick={handleCopy}
              type="button"
              className="text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 transition px-2.5 py-1 rounded-md cursor-pointer"
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {student.tutor_alert_message}
          </p>
        </div>
      )}
    </div>
  );
}
