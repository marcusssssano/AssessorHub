"use client";

import { useEffect, useRef } from "react";
import { WEEKDAY_LABELS, formatDayLabel, formatWeekRange, weekdayDates } from "@/lib/worklog";
import type { WorkLogEntry } from "@/lib/types";

const WIDTH = 1400;
const MARGIN = 50;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const COLUMN_GAP = 36;
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP * 2) / 3;
const NAVY = "#0b1f3f";
const ACCENT = "#2f6fed";
const ACCENT_LIGHT = "#eaf1ff";
const SLATE = "#64748b";
const LINE_HEIGHT = 26;
const BODY_FONT = "400 18px Arial, sans-serif";
const LABEL_FONT = "700 14px Arial, sans-serif";
const DAY_HEADER_FONT = "700 21px Arial, sans-serif";
const BADGE_FONT = "700 15px Arial, sans-serif";
const META_FONT = "400 15px Arial, sans-serif";

const SECTIONS: { key: "completed_tasks" | "ongoing_tasks" | "next_tasks"; label: string; color: string }[] = [
  { key: "completed_tasks", label: "Completed Tasks", color: "#16a34a" },
  { key: "ongoing_tasks", label: "Ongoing Tasks", color: "#d97706" },
  { key: "next_tasks", label: "Next Tasks to Process", color: ACCENT },
];

interface ColumnLayout {
  label: string;
  color: string;
  lines: string[];
  height: number;
}

interface DayLayout {
  dayName: string;
  dateLabel: string;
  hasEntry: boolean;
  count: number;
  columns: ColumnLayout[];
  contentHeight: number;
  height: number;
}

function breakLongWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const chunks: string[] = [];
  let chunk = "";
  for (const char of word) {
    const testChunk = chunk + char;
    if (ctx.measureText(testChunk).width > maxWidth && chunk) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = testChunk;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      if (line) {
        lines.push(line);
        line = "";
      }
      const pieces = breakLongWord(ctx, word, maxWidth);
      pieces.slice(0, -1).forEach((p) => lines.push(p));
      line = pieces[pieces.length - 1] ?? "";
      continue;
    }
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

/** Free-form paragraphs: preserves the user's own line breaks, no auto-bulleting. */
function paragraphLines(ctx: CanvasRenderingContext2D, raw: string | null, maxWidth: number): string[] {
  if (!raw || !raw.trim()) return [];
  const paragraphs = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const lines: string[] = [];
  for (const p of paragraphs) {
    lines.push(...wrapLines(ctx, p, maxWidth));
  }
  return lines;
}

export default function WeeklyWorkLogChart({
  mondayDate,
  entriesByDate,
  fileNamePrefix,
}: {
  mondayDate: string;
  entriesByDate: Record<string, WorkLogEntry | undefined>;
  fileNamePrefix?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const measureCanvas = document.createElement("canvas");
    const mctx = measureCanvas.getContext("2d");
    if (!mctx) return;

    const dates = weekdayDates(mondayDate);
    const dayHeaderHeight = 46;
    const columnLabelHeight = 30;
    const noEntryHeight = 30;
    const dayBlockPadding = 34;

    const days: DayLayout[] = dates.map((date, i) => {
      const entry = entriesByDate[date];
      const hasEntry = !!entry;

      mctx.font = BODY_FONT;
      const columns: ColumnLayout[] = hasEntry
        ? SECTIONS.map((s) => {
            const lines = paragraphLines(mctx, entry![s.key], COLUMN_WIDTH);
            return {
              label: s.label,
              color: s.color,
              lines,
              height: lines.length > 0 ? columnLabelHeight + lines.length * LINE_HEIGHT : 0,
            };
          })
        : [];

      const contentHeight = Math.max(0, ...columns.map((c) => c.height));
      const anyTaskText = columns.some((c) => c.lines.length > 0);

      let height = dayHeaderHeight;
      if (!hasEntry) {
        height += noEntryHeight;
      } else if (!anyTaskText) {
        height += 22;
      } else {
        height += contentHeight;
      }
      height += dayBlockPadding;

      return {
        dayName: WEEKDAY_LABELS[i],
        dateLabel: formatDayLabel(date),
        hasEntry,
        count: entry?.return_mail_count ?? 0,
        columns,
        contentHeight,
        height,
      };
    });

    const headerHeight = 106;
    const contentTop = headerHeight + 34;
    const totalDaysHeight = days.reduce((sum, d) => sum + d.height, 0);
    const HEIGHT = contentTop + totalDaysHeight + 30;

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
    ctx.textBaseline = "alphabetic";

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Header band
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, WIDTH, headerHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Arial, sans-serif";
    ctx.fillText("Weekly Work Log", MARGIN, 54);
    ctx.font = "400 18px Arial, sans-serif";
    ctx.fillStyle = "#c7d3e8";
    ctx.fillText(formatWeekRange(mondayDate), MARGIN, 84);

    // Days
    let y = contentTop;
    days.forEach((day, i) => {
      const blockTop = y;

      // Day header row
      ctx.font = DAY_HEADER_FONT;
      ctx.fillStyle = NAVY;
      ctx.fillText(`${day.dayName.toUpperCase()} · ${day.dateLabel}`, MARGIN, y + 18);

      if (day.hasEntry) {
        const badgeText = `${day.count} Return Mail Processed`;
        ctx.font = BADGE_FONT;
        const badgeWidth = ctx.measureText(badgeText).width + 30;
        const badgeX = WIDTH - MARGIN - badgeWidth;
        ctx.fillStyle = ACCENT_LIGHT;
        roundRect(ctx, badgeX, y - 6, badgeWidth, 30, 15);
        ctx.fill();
        ctx.fillStyle = ACCENT;
        ctx.fillText(badgeText, badgeX + 15, y + 15);
      }

      const sectionTop = y + dayHeaderHeight;

      if (!day.hasEntry) {
        ctx.font = META_FONT;
        ctx.fillStyle = SLATE;
        ctx.fillText("No entry logged.", MARGIN, sectionTop + 6);
      } else if (day.contentHeight === 0) {
        ctx.font = META_FONT;
        ctx.fillStyle = SLATE;
        ctx.fillText(`${day.count} return mail processed. No task notes.`, MARGIN, sectionTop + 6);
      } else {
        day.columns.forEach((col, ci) => {
          if (col.lines.length === 0) return;
          const colX = MARGIN + ci * (COLUMN_WIDTH + COLUMN_GAP);

          ctx.font = LABEL_FONT;
          ctx.fillStyle = col.color;
          ctx.fillText(col.label.toUpperCase(), colX, sectionTop + 15);

          ctx.font = BODY_FONT;
          ctx.fillStyle = NAVY;
          col.lines.forEach((line, li) => {
            ctx.fillText(line, colX, sectionTop + columnLabelHeight + 15 + li * LINE_HEIGHT);
          });
        });
      }

      y = blockTop + day.height;

      // Divider between days
      if (i < days.length - 1) {
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(MARGIN, y - dayBlockPadding / 2);
        ctx.lineTo(WIDTH - MARGIN, y - dayBlockPadding / 2);
        ctx.stroke();
      }
    });
  }, [mondayDate, entriesByDate]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${fileNamePrefix ?? "work-log"}-${mondayDate}.png`;
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
