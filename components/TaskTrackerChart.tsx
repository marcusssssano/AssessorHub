"use client";

import { useEffect, useRef } from "react";
import { computeTimeToFinish, formatDate, formatLoggedDate, rowAccentColor, statusColor, TONE_COLORS } from "@/lib/tasktracker";
import type { TaskTrackerEntry } from "@/lib/types";

const WIDTH = 1600;
const MARGIN = 50;
const ACCENT_BAR_WIDTH = 5;
const CONTENT_X = MARGIN + ACCENT_BAR_WIDTH + 10;
const CONTENT_WIDTH = WIDTH - MARGIN * 2 - ACCENT_BAR_WIDTH - 10;
const COL_GAP = 16;

const COL_WIDTHS = {
  task: 330,
  logged: 105,
  deadline: 115,
  ttf: 135,
  status: 110,
};
const NOTE_WIDTH =
  CONTENT_WIDTH -
  COL_WIDTHS.task -
  COL_WIDTHS.logged -
  COL_WIDTHS.deadline -
  COL_WIDTHS.ttf -
  COL_WIDTHS.status -
  COL_GAP * 5;

const NAVY = "#0b1f3f";
const SLATE = "#64748b";
const BORDER = "#e2e8f0";
const ROW_ALT = "#f8fafc";
const SECTION_BG = "#eef2f7";

const LINE_HEIGHT = 22;
const BODY_FONT = "400 15px Arial, sans-serif";
const BOLD_FONT = "700 15px Arial, sans-serif";
const HEADER_FONT = "700 13px Arial, sans-serif";
const BADGE_FONT = "700 12px Arial, sans-serif";
const SECTION_FONT = "700 13px Arial, sans-serif";

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

type Row =
  | { kind: "section"; label: string; count: number; height: number }
  | {
      kind: "data";
      entry: TaskTrackerEntry;
      taskLines: string[];
      noteLines: string[];
      accent: string;
      height: number;
    };

export default function TaskTrackerChart({
  entries,
  fileNamePrefix,
}: {
  entries: TaskTrackerEntry[];
  fileNamePrefix?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) return;
    const mctx = measureCtx;

    const rowPad = 20;
    const rowMinHeight = 52;
    const sectionHeight = 38;

    const openEntries = entries.filter((e) => e.status !== "Completed");
    const doneEntries = entries.filter((e) => e.status === "Completed");
    const overdueCount = openEntries.filter(
      (e) => computeTimeToFinish(e.deadline, e.status, e.completed_at).tone === "overdue"
    ).length;

    function buildDataRow(entry: TaskTrackerEntry): Row {
      mctx.font = BOLD_FONT;
      const taskLines = wrapLines(mctx, entry.task, COL_WIDTHS.task);
      mctx.font = BODY_FONT;
      const noteLines = paragraphLines(mctx, entry.note, NOTE_WIDTH);
      const maxLines = Math.max(1, taskLines.length, noteLines.length);
      const height = Math.max(rowMinHeight, maxLines * LINE_HEIGHT + rowPad);
      return {
        kind: "data",
        entry,
        taskLines,
        noteLines,
        accent: rowAccentColor(entry.status, entry.deadline, entry.completed_at),
        height,
      };
    }

    const rows: Row[] = [];
    if (openEntries.length > 0) {
      rows.push({ kind: "section", label: "OPEN TASKS", count: openEntries.length, height: sectionHeight });
      openEntries.forEach((e) => rows.push(buildDataRow(e)));
    }
    if (doneEntries.length > 0) {
      rows.push({ kind: "section", label: "COMPLETED", count: doneEntries.length, height: sectionHeight });
      doneEntries.forEach((e) => rows.push(buildDataRow(e)));
    }

    const headerBandHeight = 110;
    const tableHeaderHeight = 40;
    const contentTop = headerBandHeight + 30;
    const totalRowsHeight = rows.reduce((sum, r) => sum + r.height, 0);
    const HEIGHT = contentTop + tableHeaderHeight + Math.max(totalRowsHeight, 60) + 30;

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

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, WIDTH, headerBandHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText("Task Tracker", MARGIN, 46);

    ctx.font = "400 15px Arial, sans-serif";
    ctx.fillStyle = "#c7d3e8";
    const generatedOn = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    ctx.fillText(`Generated ${generatedOn}`, MARGIN, 70);

    ctx.font = "700 15px Arial, sans-serif";
    const summaryParts = [
      `${entries.length} Task${entries.length === 1 ? "" : "s"}`,
      `${overdueCount} Overdue`,
      `${doneEntries.length} Completed`,
    ];
    let sx = MARGIN;
    summaryParts.forEach((part, i) => {
      const color = i === 1 && overdueCount > 0 ? "#fca5a5" : i === 2 ? "#86efac" : "#ffffff";
      ctx.fillStyle = color;
      ctx.fillText(part, sx, 94);
      sx += ctx.measureText(part).width + 16;
      if (i < summaryParts.length - 1) {
        ctx.fillStyle = "#5b6b8a";
        ctx.fillText("·", sx - 12, 94);
      }
    });

    function colX(col: keyof typeof COL_WIDTHS | "note") {
      const order: (keyof typeof COL_WIDTHS | "note")[] = ["task", "logged", "deadline", "ttf", "status", "note"];
      let x = CONTENT_X;
      for (const c of order) {
        if (c === col) return x;
        x += (c === "note" ? NOTE_WIDTH : COL_WIDTHS[c]) + COL_GAP;
      }
      return x;
    }

    let y = contentTop;

    // Table header
    ctx.font = HEADER_FONT;
    ctx.fillStyle = SLATE;
    ctx.fillText("TASK", colX("task"), y + 24);
    ctx.fillText("LOGGED", colX("logged"), y + 24);
    ctx.fillText("DEADLINE", colX("deadline"), y + 24);
    ctx.fillText("TIME TO FINISH", colX("ttf"), y + 24);
    ctx.fillText("STATUS", colX("status"), y + 24);
    ctx.fillText("NOTE", colX("note"), y + 24);

    y += tableHeaderHeight;
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(WIDTH - MARGIN, y);
    ctx.stroke();

    if (rows.length === 0) {
      ctx.font = BODY_FONT;
      ctx.fillStyle = SLATE;
      ctx.fillText("No tasks to show.", CONTENT_X, y + 30);
      y += 60;
    }

    let dataRowIndex = 0;
    rows.forEach((row) => {
      const rowTop = y;

      if (row.kind === "section") {
        ctx.fillStyle = SECTION_BG;
        ctx.fillRect(MARGIN, rowTop, WIDTH - MARGIN * 2, row.height);
        ctx.font = SECTION_FONT;
        ctx.fillStyle = "#334155";
        ctx.fillText(`${row.label} (${row.count})`, CONTENT_X, rowTop + 24);
        y = rowTop + row.height;
        dataRowIndex = 0;
        return;
      }

      if (dataRowIndex % 2 === 1) {
        ctx.fillStyle = ROW_ALT;
        ctx.fillRect(MARGIN, rowTop, WIDTH - MARGIN * 2, row.height);
      }
      dataRowIndex++;

      ctx.fillStyle = row.accent;
      ctx.fillRect(MARGIN, rowTop, ACCENT_BAR_WIDTH, row.height);

      const textY = rowTop + 24;

      ctx.font = BOLD_FONT;
      ctx.fillStyle = NAVY;
      row.taskLines.forEach((line, li) => ctx.fillText(line, colX("task"), textY + li * LINE_HEIGHT));

      ctx.font = BODY_FONT;
      ctx.fillStyle = "#334155";
      ctx.fillText(formatLoggedDate(row.entry.created_at), colX("logged"), textY);

      ctx.fillStyle = "#334155";
      ctx.fillText(formatDate(row.entry.deadline), colX("deadline"), textY);

      const ttf = computeTimeToFinish(row.entry.deadline, row.entry.status, row.entry.completed_at);
      ctx.font = BOLD_FONT;
      ctx.fillStyle = TONE_COLORS[ttf.tone];
      wrapLines(ctx, ttf.label, COL_WIDTHS.ttf).forEach((line, li) =>
        ctx.fillText(line, colX("ttf"), textY + li * LINE_HEIGHT)
      );

      const sColor = statusColor(row.entry.status);
      ctx.font = BADGE_FONT;
      const badgeWidth = ctx.measureText(row.entry.status).width + 22;
      ctx.fillStyle = sColor + "1a";
      roundRect(ctx, colX("status"), rowTop + 14, badgeWidth, 24, 12);
      ctx.fill();
      ctx.fillStyle = sColor;
      ctx.fillText(row.entry.status, colX("status") + 11, rowTop + 30);

      ctx.font = BODY_FONT;
      ctx.fillStyle = "#475569";
      row.noteLines.forEach((line, li) => ctx.fillText(line, colX("note"), textY + li * LINE_HEIGHT));

      y = rowTop + row.height;

      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(WIDTH - MARGIN, y);
      ctx.stroke();
    });
  }, [entries]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${fileNamePrefix ?? "task-tracker"}-${new Date().toISOString().slice(0, 10)}.png`;
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
