"use client";

import { useEffect, useRef } from "react";
import { WEEKDAY_LABELS, formatDayLabel, formatWeekRange, weekdayDates } from "@/lib/worklog";
import type { WorkLogEntry } from "@/lib/types";

const WIDTH = 1600;
const MARGIN = 50;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const LABEL_COL_WIDTH = 190;
const COL_GAP = 16;
const DAY_COUNT = 5;
const DAY_COL_WIDTH = (CONTENT_WIDTH - LABEL_COL_WIDTH - COL_GAP * DAY_COUNT) / DAY_COUNT;

const NAVY = "#0b1f3f";
const ACCENT = "#2f6fed";
const ACCENT_LIGHT = "#eaf1ff";
const SLATE = "#64748b";
const BORDER = "#e2e8f0";

const LINE_HEIGHT = 24;
const BODY_FONT = "400 16px Arial, sans-serif";
const ROW_LABEL_FONT = "700 15px Arial, sans-serif";
const DAY_NAME_FONT = "700 19px Arial, sans-serif";
const DAY_DATE_FONT = "400 14px Arial, sans-serif";
const COUNT_FONT = "700 22px Arial, sans-serif";
const EMPTY_FONT = "400 15px Arial, sans-serif";
const COUNT_ROW_HEIGHT = 56;

const SECTIONS: { key: "completed_tasks" | "ongoing_tasks" | "next_tasks"; label: string; color: string }[] = [
  { key: "completed_tasks", label: "Completed Tasks", color: "#16a34a" },
  { key: "ongoing_tasks", label: "Ongoing Tasks", color: "#d97706" },
  { key: "next_tasks", label: "Next Tasks to Process", color: ACCENT },
];

interface DayInfo {
  dayName: string;
  dateLabel: string;
  hasEntry: boolean;
  count: number;
}

interface RowLayout {
  label: string;
  color: string;
  cells: string[][];
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
    const days: DayInfo[] = dates.map((date, i) => {
      const entry = entriesByDate[date];
      return {
        dayName: WEEKDAY_LABELS[i],
        dateLabel: formatDayLabel(date),
        hasEntry: !!entry,
        count: entry?.return_mail_count ?? 0,
      };
    });

    const dayHeaderRowHeight = 92;
    const rowLabelPad = 30;
    const rowMinHeight = 56;

    mctx.font = BODY_FONT;
    const rows: RowLayout[] = SECTIONS.map((s) => {
      const cells = dates.map((date) => {
        const entry = entriesByDate[date];
        if (!entry) return [];
        return paragraphLines(mctx, entry[s.key], DAY_COL_WIDTH);
      });
      const maxLines = Math.max(1, ...cells.map((c) => c.length));
      const height = Math.max(rowMinHeight, rowLabelPad + maxLines * LINE_HEIGHT + 10);
      return { label: s.label, color: s.color, cells, height };
    });

    const headerHeight = 106;
    const contentTop = headerHeight + 34;
    const totalRowsHeight = rows.reduce((sum, r) => sum + r.height, 0);
    const HEIGHT = contentTop + dayHeaderRowHeight + COUNT_ROW_HEIGHT + totalRowsHeight + 30;

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

    function dayColX(i: number) {
      return MARGIN + LABEL_COL_WIDTH + COL_GAP + i * (DAY_COL_WIDTH + COL_GAP);
    }

    // Day header row
    const headerRowTop = contentTop;
    days.forEach((day, i) => {
      const x = dayColX(i);
      ctx.font = DAY_NAME_FONT;
      ctx.fillStyle = NAVY;
      ctx.fillText(day.dayName.toUpperCase(), x, headerRowTop + 22);

      ctx.font = DAY_DATE_FONT;
      ctx.fillStyle = SLATE;
      ctx.fillText(day.dateLabel, x, headerRowTop + 42);

      if (!day.hasEntry) {
        ctx.font = EMPTY_FONT;
        ctx.fillStyle = SLATE;
        ctx.fillText("No entry", x, headerRowTop + 66);
      }
    });

    // Divider under day header row
    let y = contentTop + dayHeaderRowHeight;
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(WIDTH - MARGIN, y);
    ctx.stroke();

    // "# of Return Mail Processed" row
    {
      const rowTop = y;
      ctx.font = ROW_LABEL_FONT;
      ctx.fillStyle = ACCENT;
      const labelLines = wrapLines(ctx, "# OF RETURN MAIL PROCESSED", LABEL_COL_WIDTH - 10);
      labelLines.forEach((line, li) => {
        ctx.fillText(line, MARGIN, rowTop + 24 + li * 19);
      });

      days.forEach((day, i) => {
        const x = dayColX(i);
        if (!day.hasEntry) {
          ctx.font = EMPTY_FONT;
          ctx.fillStyle = "#cbd5e1";
          ctx.fillText("—", x, rowTop + 34);
          return;
        }
        ctx.fillStyle = ACCENT_LIGHT;
        roundRect(ctx, x, rowTop + 8, 64, 34, 8);
        ctx.fill();
        ctx.font = COUNT_FONT;
        ctx.fillStyle = ACCENT;
        ctx.fillText(String(day.count), x + 12, rowTop + 32);
      });

      y = rowTop + COUNT_ROW_HEIGHT;

      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(WIDTH - MARGIN, y);
      ctx.stroke();
    }

    // Task rows
    rows.forEach((row) => {
      const rowTop = y;

      ctx.font = ROW_LABEL_FONT;
      ctx.fillStyle = row.color;
      const labelLines = wrapLines(ctx, row.label.toUpperCase(), LABEL_COL_WIDTH - 10);
      labelLines.forEach((line, li) => {
        ctx.fillText(line, MARGIN, rowTop + 24 + li * 19);
      });

      row.cells.forEach((lines, i) => {
        const x = dayColX(i);
        if (lines.length === 0) {
          ctx.font = EMPTY_FONT;
          ctx.fillStyle = "#cbd5e1";
          ctx.fillText("—", x, rowTop + 24);
          return;
        }
        ctx.font = BODY_FONT;
        ctx.fillStyle = NAVY;
        lines.forEach((line, li) => {
          ctx.fillText(line, x, rowTop + 24 + li * LINE_HEIGHT);
        });
      });

      y = rowTop + row.height;

      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(WIDTH - MARGIN, y);
      ctx.stroke();
    });

    // Vertical separators between day columns (and label column)
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    for (let i = 0; i <= DAY_COUNT; i++) {
      const x =
        i === 0
          ? MARGIN + LABEL_COL_WIDTH + COL_GAP / 2
          : i === DAY_COUNT
            ? dayColX(DAY_COUNT - 1) + DAY_COL_WIDTH + COL_GAP / 2
            : dayColX(i) - COL_GAP / 2;
      ctx.beginPath();
      ctx.moveTo(x, contentTop);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
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
