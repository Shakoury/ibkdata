export function sanitizeCsvValue(value: unknown): string {
  const str = String(value ?? '');
  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  // Wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }
  // Prevent formula injection: prefix dangerous leading chars
  if (/^[=+\-@]/.test(escaped)) {
    return `'${escaped}`;
  }
  return escaped;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(sanitizeCsvValue).join(',')).join('\n');
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = toCsv(rows);
  // Prepend BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
