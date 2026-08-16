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
        setUrlCol(guessColumn(fields, [/url/i, /link/i]));
        setNotesCol(guessColumn(fields, [/note/i, /comment/i]));
      },
      error: (err) => setError(err.message),
    });
  }

  const mappedRows = rows
    .map((row) => ({
      title: titleCol !== NONE ? (row[titleCol] ?? "").trim() : "",
      url: urlCol !== NONE ? (row[urlCol] ?? "").trim() : "",
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
      <div className="rounded-lg border border-dashed border-black/20 bg-white p-6 text-center">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-sm"
        />
        <p className="mt-2 text-xs text-gray-500">
          Upload a CSV export of your spreadsheet. The first row must be column headers.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && <p className="text-sm text-green-600">{result}</p>}

      {headers.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <ColumnSelect label="Title column" headers={headers} value={titleCol} onChange={setTitleCol} />
            <ColumnSelect label="URL column" headers={headers} value={urlCol} onChange={setUrlCol} />
            <ColumnSelect label="Notes column (optional)" headers={headers} value={notesCol} onChange={setNotesCol} />
          </div>

          <p className="text-sm text-gray-600">
            {mappedRows.length} of {rows.length} rows have both a title and URL and will be
            imported.
          </p>

          <div className="rounded-lg border border-black/10 bg-white overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {mappedRows.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2 truncate max-w-xs">{row.url}</td>
                    <td className="px-3 py-2 text-gray-500">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mappedRows.length > 20 && (
              <p className="px-3 py-2 text-xs text-gray-400">
                +{mappedRows.length - 20} more row{mappedRows.length - 20 === 1 ? "" : "s"}...
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || mappedRows.length === 0}
            className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50"
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
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
