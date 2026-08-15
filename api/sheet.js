const { parse } = require("csv-parse/sync");

module.exports = async function handler(req, res) {
  try {
    const sheetUrl = String(req.query.url || "");
    const teacherName = String(req.query.teacher || "").trim();
    if (!sheetUrl || !teacherName) {
      return res.status(400).json({ error: "Thiếu link Google Sheets hoặc tên giáo viên." });
    }

    const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) return res.status(400).json({ error: "Link Google Sheets không hợp lệ." });
    const spreadsheetId = idMatch[1];

    const gidMatch = sheetUrl.match(/[?#&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";

    // Sheet phải cho phép người có link xem.
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    const r = await fetch(csvUrl, { redirect: "follow" });
    if (!r.ok) {
      return res.status(400).json({
        error: "Không đọc được Google Sheets. Hãy đặt quyền chia sẻ: Anyone with the link / Bất kỳ ai có đường liên kết đều có thể xem."
      });
    }

    const csv = await r.text();
    if (/<!doctype html/i.test(csv) || /<html/i.test(csv.slice(0,300))) {
      return res.status(400).json({
        error: "Google trả về trang đăng nhập thay vì dữ liệu. Hãy bật quyền xem bằng đường liên kết."
      });
    }

    const values = parse(csv, { relax_quotes: true, relax_column_count: true, skip_empty_lines: false });
    if (!values.length) return res.status(400).json({ error: "Sheet không có dữ liệu." });

    const headers = values[0];
    const classStartCol = 3;
    const classes = headers.slice(classStartCol).map(cleanClassHeader);
    const teacherKey = normalize(teacherName);

    let currentDay = "";
    let currentSession = "";
    const rows = [];

    for (let rIdx = 1; rIdx < values.length; rIdx++) {
      const row = values[rIdx] || [];
      if (String(row[0] || "").trim()) currentDay = String(row[0]).trim();
      if (String(row[1] || "").trim()) currentSession = String(row[1]).trim();

      const period = String(row[2] || "").trim().replace(/\.0$/, "");
      if (!period) continue;

      const filteredCells = [];
      for (let c = classStartCol; c < headers.length; c++) {
        const cell = String(row[c] || "").trim();
        filteredCells.push(cell && cellMatchesTeacher(cell, teacherKey) ? cell : "");
      }

      rows.push({
        dayRaw: currentDay,
        day: parseDayLabel(currentDay),
        date: parseDateLabel(currentDay),
        session: currentSession,
        period,
        cells: filteredCells
      });
    }

    const matchCount = rows.reduce((n,row)=>n+row.cells.filter(Boolean).length,0);

    res.setHeader("Cache-Control","s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ teacher: teacherName, classes, rows, matchCount });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Lỗi máy chủ." });
  }
};

function normalize(text) {
  return String(text || "").normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}
function cleanClassHeader(header) {
  return String(header || "").split(/\r?\n/)[0].trim();
}
function parseDayLabel(text) {
  const first = String(text || "").split(/\r?\n/)[0].trim();
  if (/^[2-7]$/.test(first)) return first;
  const m = first.match(/[2-7]/);
  return m ? m[0] : first;
}
function parseDateLabel(text) {
  const lines = String(text || "").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  return lines.length > 1 ? lines.slice(1).join(" ") : "";
}
function cellMatchesTeacher(cell, teacherKey) {
  const text = String(cell || "").trim();
  const idx = text.lastIndexOf(" - ");
  if (idx >= 0) return normalize(text.slice(idx + 3)) === teacherKey;
  return normalize(text).includes(teacherKey);
}
