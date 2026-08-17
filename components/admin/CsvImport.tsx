"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";

type CsvRow = Record<string, string>;

const NONE = "__none__";

function guessColumn(headers: string[], patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = headers.find((h) => pattern.test(h));
    if (match) return match;
  }
  return NONE;
}

export default function CsvImport() {
  const supabase = useMemo(() => createClient(), []);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [titleCol, setTitleCol] = useState(NONE);
  const [urlCol, setUrlCol] = useState(NONE);
  const [countyCol, setCountyCol] = useState(NONE);
  const [notesCol, setNotesCol] = useState(NONE);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    setResult(null);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields ?? [];
        setHeaders(fields);
        setRows(results.data);
        setTitleCol(guessColumn(fields, [/title/i, /name/i]));
        setUrlCol(guessColumn(fields, [/url/i, /link/i, /site/i]));
        setCountyCol(guessColumn(fields, [/county/i]));
        setNotesCol(guessColumn(fields, [/note/i, /comment/i]));
      },
      error: (err) => setError(err.message),
    });
  }

  const mappedRows = rows
    .map((row) => ({
      title: titleCol !== NONE ? (row[titleCol] ?? "").trim() : "",
      url: urlCol !== NONE ? (row[urlCol] ?? "").trim() : "",
      county: countyCol !== NONE ? (row[countyCol] ?? "").trim() || null : null,
      notes: notesCol !== NONE ? (row[notesCol] ?? "").trim() || null : null,
    }))
    .filter((r) => r.title && r.url);

  async function handleImport() {
    setImporting(true);
    setError(null);
    setResult(null);

    const chunkSize = 200;
    let inserted = 0;

    try {
      for (let i = 0; i < mappedRows.length; i += chunkSize) {
        const chunk = mappedRows.slice(i, i + chunkSize);
        const { error } = await supabase.from("links").insert(chunk);
        if (error) throw error;
        inserted += chunk.length;
      }
      setResult(`Imported ${inserted} link${inserted === 1 ? "" : "s"} successfully.`);
      setRows([]);
      setHeaders([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
          </svg>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-sm mx-auto file:mr-4 file:rounded-full file:border-0 file:bg-[var(--navy-900)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--navy-800)] file:cursor-pointer file:transition-colors"
        />
        <p className="mt-3 text-xs text-slate-400">
          Upload a CSV export of your spreadsheet. The first row must be column headers.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && <p className="text-sm text-emerald-600">{result}</p>}

      {headers.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <ColumnSelect label="Title column" headers={headers} value={titleCol} onChange={setTitleCol} />
            <ColumnSelect label="URL column" headers={headers} value={urlCol} onChange={setUrlCol} />
            <ColumnSelect label="County column (optional)" headers={headers} value={countyCol} onChange={setCountyCol} />
            <ColumnSelect label="Notes column (optional)" headers={headers} value={notesCol} onChange={setNotesCol} />
          </div>

          <p className="text-sm text-slate-500">
            {mappedRows.length} of {rows.length} rows have both a title and URL and will be
            imported.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden max-h-80 overflow-y-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-400 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">URL</th>
                  <th className="px-4 py-2.5">County</th>
                  <th className="px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappedRows.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-[var(--navy-900)]">{row.title}</td>
                    <td className="px-4 py-2.5 truncate max-w-xs text-slate-500">{row.url}</td>
                    <td className="px-4 py-2.5 text-slate-400">{row.county}</td>
                    <td className="px-4 py-2.5 text-slate-400">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mappedRows.length > 20 && (
              <p className="px-4 py-2.5 text-xs text-slate-400">
                +{mappedRows.length - 20} more row{mappedRows.length - 20 === 1 ? "" : "s"}...
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || mappedRows.length === 0}
            className="self-start rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
          >
            {importing ? "Importing..." : `Import ${mappedRows.length} links`}
          </button>
        </div>
      )}
    </div>
  );
}

function ColumnSelect({
  label,
  headers,
  value,
  onChange,
}: {
  label: string;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
      >
        <option value={NONE}>-- none --</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}
