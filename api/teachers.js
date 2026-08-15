const { parse } = require("csv-parse/sync");

module.exports = async function handler(req, res) {
  try {
    const sheetUrl = String(req.query.url || "").trim();
    if (!sheetUrl) return res.status(400).json({ error: "Thiếu link Google Sheets." });

    const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) return res.status(400).json({ error: "Link Google Sheets không hợp lệ." });

    const spreadsheetId = idMatch[1];
    const gidMatch = sheetUrl.match(/[?#&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";

    const exportUrl =
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

    const response = await fetch(exportUrl, { redirect: "follow" });
    if (!response.ok) {
      return res.status(400).json({
        error: "Không đọc được Google Sheet. Hãy bật quyền xem bằng đường liên kết."
      });
    }

    const csv = await response.text();
    if (/<html|<!doctype/i.test(csv.slice(0, 500))) {
      return res.status(400).json({
        error: "Google đang yêu cầu đăng nhập. Hãy bật quyền xem bằng đường liên kết."
      });
    }

    const values = parse(csv, {
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: false
    });

    // Chỉ quét vùng lớp D:R, giống logic TKB hiện tại.
    const teachers = new Map();
    const classStart = 3;
    const classEndExclusive = 18;

    for (let r = 1; r < values.length; r++) {
      const row = values[r] || [];
      for (let c = classStart; c < Math.min(classEndExclusive, row.length); c++) {
        const raw = String(row[c] || "").trim();
        const parsed = splitSubjectTeacher(raw);
        if (!parsed) continue;

        const key = normalize(parsed.teacher);
        if (!teachers.has(key)) teachers.set(key, parsed.teacher.trim());
      }
    }

    const list = [...teachers.values()].sort((a, b) =>
      a.localeCompare(b, "vi", { sensitivity: "base" })
    );

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ teachers: list });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Lỗi máy chủ." });
  }
};

function normalize(text) {
  return String(text || "")
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function splitSubjectTeacher(text) {
  if (!text) return null;
  const m = String(text).match(/^(.*?)\s*-\s*([^-]+?)\s*$/);
  if (!m) return null;

  const subject = m[1].trim();
  const teacher = m[2].trim();
  if (!subject || !teacher) return null;

  return { subject, teacher };
}
