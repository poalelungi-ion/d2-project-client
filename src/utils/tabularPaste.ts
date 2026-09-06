/**
 * Spreadsheet copy-paste arrives as TSV (Excel/Sheets), CSV, or semicolon CSV.
 * A paste is tabular when the first non-empty line has one of those delimiters.
 */
export function isTabularPaste(text: string): boolean {
  const first = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!first) return false;
  return first.includes('\t') || first.includes(',') || first.includes(';');
}
