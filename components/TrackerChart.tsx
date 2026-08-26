"use client";

import { useEffect, useRef } from "react";
import { formatMonth } from "@/lib/reports";
import type { TrackerBranch } from "@/lib/types";

const WIDTH = 900;
const NAVY = "#0b1f3f";
const SLATE = "#64748b";
const COMPLETE = "#16a34a";
const NOT_STARTED = "#ef4444";
const ROW_HEIGHT = 34;

export default function TrackerChart({
  activityMonth,
  branches,
  statuses,
  title,
  fileNamePrefix,
}: {
  activityMonth: string;
  branches: TrackerBranch[];
  statuses: Record<string, boolean>;
  title?: string;
  fileNamePrefix?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fullTitle = `${title?.trim() || "CSSC Return Mail Tracker"} - ${formatMonth(activityMonth)} Report`;
    ctx.font = "700 26px Arial, sans-serif";
    const titleLines = wrapLines(ctx, fullTitle, WIDTH - 80);
    const titleLineHeight = 32;

    const headerHeight = 40 + titleLines.length * titleLineHeight;
    const tableTop = headerHeight + 55;
    const contentHeight = Math.max(branches.length * ROW_HEIGHT + 40, 320);
    const HEIGHT = headerHeight + contentHeight + 50;

    const scale = 2;
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(scale, scale);
    ctx.textBaseline = "alphabetic";

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Header band
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, WIDTH, headerHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 26px Arial, sans-serif";
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 40, 42 + i * titleLineHeight);
    });

    const total = branches.length;
    const completedCount = branches.filter((b) => statuses[b.id]).length;
    const completedFrac = total > 0 ? completedCount / total : 0;
    const completedPct = Math.round(completedFrac * 100);
    const notStartedPct = 100 - completedPct;

    // Left: Branch / Status table
    ctx.font = "700 14px Arial, sans-serif";
    ctx.fillStyle = SLATE;
    ctx.fillText("BRANCH", 40, tableTop);
    ctx.fillText("STATUS", 300, tableTop);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, tableTop + 12);
    ctx.lineTo(380, tableTop + 12);
    ctx.stroke();

    branches.forEach((b, i) => {
      const y = tableTop + 40 + i * ROW_HEIGHT;
      const completed = !!statuses[b.id];

      ctx.font = "500 15px Arial, sans-serif";
      ctx.fillStyle = NAVY;
      ctx.fillText(b.name, 40, y);

      // row divider
      if (i > 0) {
        ctx.strokeStyle = "#f1f5f9";
        ctx.beginPath();
        ctx.moveTo(40, y - ROW_HEIGHT + 10);
        ctx.lineTo(380, y - ROW_HEIGHT + 10);
        ctx.stroke();
      }

      // status icon
      const iconX = 320;
      const iconY = y - 5;
      ctx.beginPath();
      ctx.arc(iconX, iconY, 10, 0, 2 * Math.PI);
      ctx.fillStyle = completed ? COMPLETE : NOT_STARTED;
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (completed) {
        ctx.beginPath();
        ctx.moveTo(iconX - 4.5, iconY);
        ctx.lineTo(iconX - 1.5, iconY + 3.5);
        ctx.lineTo(iconX + 5, iconY - 4.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(iconX - 4, iconY - 4);
        ctx.lineTo(iconX + 4, iconY + 4);
        ctx.moveTo(iconX + 4, iconY - 4);
        ctx.lineTo(iconX - 4, iconY + 4);
        ctx.stroke();
      }
    });

    if (total === 0) {
      ctx.font = "400 14px Arial, sans-serif";
      ctx.fillStyle = SLATE;
      ctx.fillText("No branches configured yet.", 40, tableTop + 40);
    }

    // Right: donut chart
    const cx = 650;
    const cy = headerHeight + contentHeight / 2 + 10;
    const outerR = 105;
    const innerR = 62;
    const startAngle = -Math.PI / 2;
    const completedEnd = startAngle + completedFrac * 2 * Math.PI;

    if (total > 0) {
      if (completedFrac > 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, completedEnd);
        ctx.closePath();
        ctx.fillStyle = COMPLETE;
        ctx.fill();
      }
      if (completedFrac < 1) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, completedEnd, startAngle + 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = NOT_STARTED;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.fillStyle = NAVY;
      ctx.font = "700 32px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${completedPct}%`, cx, cy + 11);
      ctx.textAlign = "left";

      // Legend (stacked, larger text)
      const legendFont = "700 20px Arial, sans-serif";
      const legendLineHeight = 32;
      const legendRow1Y = cy + outerR + 46;
      const legendRow2Y = legendRow1Y + legendLineHeight;

      ctx.textAlign = "left";
      ctx.beginPath();
      ctx.arc(cx - 88, legendRow1Y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = COMPLETE;
      ctx.fill();
      ctx.font = legendFont;
      ctx.fillStyle = NAVY;
      ctx.fillText(`Completed ${completedPct}%`, cx - 72, legendRow1Y + 7);

      ctx.beginPath();
      ctx.arc(cx - 88, legendRow2Y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = NOT_STARTED;
      ctx.fill();
      ctx.fillStyle = NAVY;
      ctx.fillText(`Not Started ${notStartedPct}%`, cx - 72, legendRow2Y + 7);
    }
  }, [activityMonth, branches, statuses, title]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const monthLabel = activityMonth.slice(0, 7);
    link.download = `${fileNamePrefix ?? "tracker"}-${monthLabel}.png`;
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
