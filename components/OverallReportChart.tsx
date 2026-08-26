"use client";

import { useEffect, useRef } from "react";
import { addMonths, BRANCHES, defaultOverallDescription, formatMonth, OVERALL_REPORT_CATEGORIES } from "@/lib/reports";

const WIDTH = 900;
const MARGIN = 40;
const NAVY = "#0b1f3f";
const ACCENT = "#2f6fed";
const SLATE = "#64748b";
const BORDER = "#e2e8f0";
const ROW_ALT = "#f8fafc";
const ROW_HEIGHT = 32;

export type BranchCounts = Record<string, { exempted_reason_code: number; incorrect_scanned_label: number }>;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function OverallReportChart({
  activityMonth,
  countsByBranch,
  description,
  fileNamePrefix,
}: {
  activityMonth: string;
  countsByBranch: BranchCounts;
  description?: string | null;
  fileNamePrefix?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.textBaseline = "alphabetic";
    ctx.font = "400 15px Arial, sans-serif";
    const subtitle = description?.trim() || defaultOverallDescription(activityMonth);
    const descLines = wrapLines(ctx, subtitle, WIDTH - MARGIN * 2);

    const subtitleStartY = 84;
    const subtitleLineHeight = 22;
    const headerHeight = subtitleStartY + (descLines.length - 1) * subtitleLineHeight + 26;

    const colLabels = ["BRANCH", ...OVERALL_REPORT_CATEGORIES.map((c) => c.label.toUpperCase()), "TOTAL"];
    const colCount = colLabels.length;
    const branchColWidth = 130;
    const numColWidth = (WIDTH - MARGIN * 2 - branchColWidth) / (colCount - 1);

    const tableHeaderHeight = 34;
    const rowsCount = BRANCHES.length + 1; // + TOTAL row
    const tableTop = headerHeight + 24;
    const HEIGHT = tableTop + tableHeaderHeight + rowsCount * ROW_HEIGHT + 30;

    const scale = 2;
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(scale, scale);
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Header band
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, WIDTH, headerHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText(`${formatMonth(addMonths(activityMonth, 1))} — Overall Report`, MARGIN, 52);
    ctx.font = "400 15px Arial, sans-serif";
    ctx.fillStyle = "#c7d3e8";
    descLines.forEach((line, i) => ctx.fillText(line, MARGIN, subtitleStartY + i * subtitleLineHeight));

    function colX(i: number) {
      return i === 0 ? MARGIN : MARGIN + branchColWidth + (i - 1) * numColWidth;
    }

    let y = tableTop;

    // Table header row
    ctx.font = "700 12px Arial, sans-serif";
    ctx.fillStyle = SLATE;
    colLabels.forEach((label, i) => {
      if (i === 0) {
        ctx.textAlign = "left";
        ctx.fillText(label, colX(i), y + 22);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(label, colX(i) + numColWidth - 8, y + 22);
      }
    });
    ctx.textAlign = "left";
    y += tableHeaderHeight;

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(WIDTH - MARGIN, y);
    ctx.stroke();

    const totals = OVERALL_REPORT_CATEGORIES.map(() => 0);

    BRANCHES.forEach((branch, i) => {
      const rowTop = y;
      if (i % 2 === 1) {
        ctx.fillStyle = ROW_ALT;
        ctx.fillRect(MARGIN, rowTop, WIDTH - MARGIN * 2, ROW_HEIGHT);
      }

      const counts = countsByBranch[branch] ?? { exempted_reason_code: 0, incorrect_scanned_label: 0 };
      const values = OVERALL_REPORT_CATEGORIES.map((c) => counts[c.key as keyof typeof counts] ?? 0);
      const rowTotal = values.reduce((a, b) => a + b, 0);
      values.forEach((v, ci) => (totals[ci] += v));

      const textY = rowTop + 21;
      ctx.font = "700 13px Arial, sans-serif";
      ctx.fillStyle = NAVY;
      ctx.textAlign = "left";
      ctx.fillText(branch, colX(0), textY);

      ctx.font = "400 13px Arial, sans-serif";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "right";
      values.forEach((v, ci) => ctx.fillText(String(v), colX(ci + 1) + numColWidth - 8, textY));

      ctx.font = "700 13px Arial, sans-serif";
      ctx.fillStyle = ACCENT;
      ctx.fillText(String(rowTotal), colX(colCount - 1) + numColWidth - 8, textY);
      ctx.textAlign = "left";

      y = rowTop + ROW_HEIGHT;
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(WIDTH - MARGIN, y);
      ctx.stroke();
    });

    // TOTAL row
    const grandTotal = totals.reduce((a, b) => a + b, 0);
    const rowTop = y;
    ctx.fillStyle = "#eef2f7";
    ctx.fillRect(MARGIN, rowTop, WIDTH - MARGIN * 2, ROW_HEIGHT);

    const textY = rowTop + 21;
    ctx.font = "700 13px Arial, sans-serif";
    ctx.fillStyle = NAVY;
    ctx.textAlign = "left";
    ctx.fillText("TOTAL", colX(0), textY);

    ctx.textAlign = "right";
    totals.forEach((v, ci) => ctx.fillText(String(v), colX(ci + 1) + numColWidth - 8, textY));
    ctx.fillStyle = ACCENT;
    ctx.fillText(String(grandTotal), colX(colCount - 1) + numColWidth - 8, textY);
    ctx.textAlign = "left";
  }, [activityMonth, countsByBranch, description]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const monthLabel = activityMonth.slice(0, 7);
    link.download = `${fileNamePrefix ?? "overall-report"}-${monthLabel}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm"
        style={{ width: WIDTH, maxWidth: "100%" }}
      >
        <canvas ref={canvasRef} className="block" />
      </div>
      <button
        onClick={handleDownload}
        className="self-start rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
      >
        Download PNG
      </button>
    </div>
  );
}
