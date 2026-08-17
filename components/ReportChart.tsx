"use client";

import { useEffect, useRef } from "react";
import { addMonths, categoryLabel, CATEGORIES, formatMonth, type CategoryKey } from "@/lib/reports";

const WIDTH = 900;
const HEIGHT = 600;
const NAVY = "#0b1f3f";
const ACCENT = "#2f6fed";
const ACCENT_LIGHT = "#eaf1ff";
const SLATE = "#64748b";

export default function ReportChart({
  activityMonth,
  branch,
  counts,
  fileNamePrefix,
}: {
  activityMonth: string;
  branch: string;
  counts: Record<CategoryKey, number>;
  fileNamePrefix?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 2;
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Header band
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, WIDTH, 140);

    const reportTitle = formatMonth(addMonths(activityMonth, 1));
    const activityLabel = formatMonth(activityMonth);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Arial, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(reportTitle, 40, 58);

    ctx.font = "400 16px Arial, sans-serif";
    ctx.fillStyle = "#c7d3e8";
    ctx.fillText(
      `Please note that this data is for the ${activityLabel} activity.`,
      40,
      86
    );

    ctx.font = "700 15px Arial, sans-serif";
    ctx.fillStyle = ACCENT_LIGHT;
    ctx.fillText(`BRANCH: ${branch}`, 40, 118);

    // Bars
    const chartTop = 190;
    const chartBottom = HEIGHT - 90;
    const chartHeight = chartBottom - chartTop;
    const maxCount = Math.max(1, ...CATEGORIES.map((c) => counts[c.key] ?? 0));

    const barAreaWidth = WIDTH - 160;
    const barWidth = 140;
    const gap = (barAreaWidth - barWidth * CATEGORIES.length) / (CATEGORIES.length + 1);

    CATEGORIES.forEach((cat, i) => {
      const count = counts[cat.key] ?? 0;
      const barHeight = (count / maxCount) * chartHeight;
      const x = 80 + gap + i * (barWidth + gap);
      const y = chartBottom - barHeight;

      // Bar (skip drawing entirely when there's nothing to show)
      if (barHeight > 0) {
        ctx.fillStyle = ACCENT;
        const radius = Math.min(10, barHeight / 2);
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
        ctx.lineTo(x + barWidth, chartBottom);
        ctx.lineTo(x, chartBottom);
        ctx.closePath();
        ctx.fill();
      }

      // Count label above bar
      ctx.fillStyle = NAVY;
      ctx.font = "700 26px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(count), x + barWidth / 2, y - 14);

      // Category label below bar (wrapped)
      ctx.font = "600 14px Arial, sans-serif";
      ctx.fillStyle = SLATE;
      wrapText(ctx, categoryLabel(cat.key), x + barWidth / 2, chartBottom + 26, barWidth + 20, 18);
      ctx.textAlign = "left";
    });

    // Baseline
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, chartBottom + 0.5);
    ctx.lineTo(WIDTH - 40, chartBottom + 0.5);
    ctx.stroke();
  }, [activityMonth, branch, counts]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const monthLabel = activityMonth.slice(0, 7);
    link.download = `${fileNamePrefix ?? "report"}-${branch}-${monthLabel}.png`;
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
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

  const prevAlign = ctx.textAlign;
  ctx.textAlign = "center";
  lines.forEach((l, i) => ctx.fillText(l, centerX, y + i * lineHeight));
  ctx.textAlign = prevAlign;
}
