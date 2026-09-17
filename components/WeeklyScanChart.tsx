"use client";

import { useEffect, useRef } from "react";
import { formatMonth } from "@/lib/reports";
import type { WeeklyScanBranch } from "@/lib/types";

const WIDTH = 1300;
const MARGIN = 50;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const COL_GAP = 16;

const BRANCH_COL_WIDTH = 140;
const WEEK_COL_WIDTH = 80;
const NOTE_COL_WIDTH = CONTENT_WIDTH - BRANCH_COL_WIDTH - WEEK_COL_WIDTH * 5 - COL_GAP * 6;

const NAVY = "#0b1f3f";
const SLATE = "#64748b";
const BORDER = "#e2e8f0";
const ROW_ALT = "#f8fafc";
const DONE = "#16a34a";
const NOT_DONE = "#94a3b8";
const NOT_DONE_FILL = "#94a3b8";

const LINE_HEIGHT = 20;
const BODY_FONT = "400 14px Arial, sans-serif";
const HEADER_FONT = "700 12px Arial, sans-serif";

interface RowState {
  week1: boolean;
  week2: boolean;
  week3: boolean;
  week4: boolean;
  week5: boolean;
  note: string;
}

const WEEK_KEYS: (keyof RowState)[] = ["week1", "week2", "week3", "week4", "week5"];

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

function paragraphLines(ctx: CanvasRenderingContext2D, raw: string, maxWidth: number): string[] {
  const paragraphs = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const lines: string[] = [];
  for (const p of paragraphs) lines.push(...wrapLines(ctx, p, maxWidth));
  return lines;
}

export default function WeeklyScanChart({
  activityMonth,
  branches,
  rows,
  fileNamePrefix,
}: {
  activityMonth: string;
  branches: WeeklyScanBranch[];
  rows: Record<string, RowState>;
  fileNamePrefix?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) return;
    const mctx = measureCtx;

    const rowMinHeight = 48;
    const rowPad = 22;

    mctx.font = BODY_FONT;
    const rowLayouts = branches.map((b) => {
      const row = rows[b.id] ?? { week1: false, week2: false, week3: false, week4: false, week5: false, note: "" };
      const noteLines = row.note.trim() ? paragraphLines(mctx, row.note.trim(), NOTE_COL_WIDTH) : [];
      const height = Math.max(rowMinHeight, noteLines.length * LINE_HEIGHT + rowPad);
      return { branch: b, row, noteLines, height };
    });

    const title = `Weekly Scan Return Mail Tracker - ${formatMonth(activityMonth)} Report`;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = "700 26px Arial, sans-serif";
    const titleLines = wrapLines(ctx, title, WIDTH - 80);
    const titleLineHeight = 32;
    const headerHeight = 34 + titleLines.length * titleLineHeight;
    const tableHeaderHeight = 36;
    const contentTop = headerHeight + 26;
    const totalRowsHeight = rowLayouts.reduce((sum, r) => sum + r.height, 0);
    const HEIGHT = contentTop + tableHeaderHeight + Math.max(totalRowsHeight, 60) + 30;

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
    ctx.fillRect(0, 0, WIDTH, headerHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 26px Arial, sans-serif";
    titleLines.forEach((line, i) => ctx.fillText(line, MARGIN, 40 + i * titleLineHeight));

    function colX(index: number) {
      let x = MARGIN;
      if (index === 0) return x;
      x += BRANCH_COL_WIDTH + COL_GAP;
      for (let i = 1; i < index; i++) x += WEEK_COL_WIDTH + COL_GAP;
      return x;
    }
    const noteX = colX(6);

    let y = contentTop;

    ctx.font = HEADER_FONT;
    ctx.fillStyle = SLATE;
    ctx.fillText("BRANCH", colX(0), y + 22);
    for (let i = 0; i < 5; i++) {
      const label = `WK ${i + 1}`;
      const w = ctx.measureText(label).width;
      ctx.fillText(label, colX(i + 1) + WEEK_COL_WIDTH / 2 - w / 2, y + 22);
    }
    ctx.fillText("NOTE", noteX, y + 22);

    y += tableHeaderHeight;
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(WIDTH - MARGIN, y);
    ctx.stroke();

    if (rowLayouts.length === 0) {
      ctx.font = BODY_FONT;
      ctx.fillStyle = SLATE;
      ctx.fillText("No branches configured yet.", MARGIN, y + 30);
      y += 60;
    }

    rowLayouts.forEach((r, i) => {
      const rowTop = y;
      if (i % 2 === 1) {
        ctx.fillStyle = ROW_ALT;
        ctx.fillRect(MARGIN, rowTop, WIDTH - MARGIN * 2, r.height);
      }

      const textY = rowTop + 22;
      ctx.font = "700 14px Arial, sans-serif";
      ctx.fillStyle = NAVY;
      ctx.fillText(r.branch.name, colX(0), textY);

      WEEK_KEYS.forEach((wk, wi) => {
        const cx = colX(wi + 1) + WEEK_COL_WIDTH / 2;
        const cy = rowTop + r.height / 2;
        const done = r.row[wk];

        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, 2 * Math.PI);
        ctx.fillStyle = done ? DONE : NOT_DONE_FILL;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = done ? DONE : NOT_DONE;
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        if (done) {
          ctx.moveTo(cx - 4, cy);
          ctx.lineTo(cx - 1.3, cy + 3.2);
          ctx.lineTo(cx + 4.5, cy - 4);
        } else {
          ctx.moveTo(cx - 3.5, cy - 3.5);
          ctx.lineTo(cx + 3.5, cy + 3.5);
          ctx.moveTo(cx + 3.5, cy - 3.5);
          ctx.lineTo(cx - 3.5, cy + 3.5);
        }
        ctx.stroke();
      });

      ctx.font = BODY_FONT;
      ctx.fillStyle = "#475569";
      r.noteLines.forEach((line, li) => ctx.fillText(line, noteX, textY + li * LINE_HEIGHT));

      y = rowTop + r.height;
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(WIDTH - MARGIN, y);
      ctx.stroke();
    });
  }, [activityMonth, branches, rows]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const monthLabel = activityMonth.slice(0, 7);
    link.download = `${fileNamePrefix ?? "weekly-scan-tracker"}-${monthLabel}.png`;
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
