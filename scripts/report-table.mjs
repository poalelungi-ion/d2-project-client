// Shared console helpers for the CI summary scripts.

export const table = (rows, headers) => {
  const all = [headers, ...rows];
  const widths = headers.map((_, i) => Math.max(...all.map((r) => String(r[i]).length)));
  const sep = `+${widths.map((w) => '-'.repeat(w + 2)).join('+')}+`;
  const row = (r) => `| ${r.map((c, i) => String(c).padEnd(widths[i])).join(' | ')} |`;
  console.log(sep);
  console.log(row(headers));
  console.log(sep);
  rows.forEach((r) => console.log(row(r)));
  console.log(sep);
};

export const rel = (path) => String(path).replace(`${process.cwd()}/`, '');

export const countBy = (items, key) =>
  [...items.reduce((m, i) => m.set(key(i), (m.get(key(i)) ?? 0) + 1), new Map())].sort(
    (a, b) => b[1] - a[1],
  );
