const { parse } = require("csv-parse/sync");

module.exports = async function handler(req, res) {
  try {
    const sheetUrl = String(req.query.url || "").trim();
    const teacherInput = String(req.query.teacher || "").trim();

    if (!sheetUrl || !teacherInput) {
      return res.status(400).json({ error: "Thiếu link Google Sheets hoặc tên giáo viên." });
    }

    const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      return res.status(400).json({ error: "Link Google Sheets không hợp lệ." });
    }

    const spreadsheetId = idMatch[1];
    const gidMatch = sheetUrl.match(/[?#&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";

    const exportUrl =
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

    const response = await fetch(exportUrl, { redirect: "follow" });

    if (!response.ok) {
      return res.status(400).json({
        error: "Không đọc được Google Sheet. Hãy bật quyền: Bất kỳ ai có đường liên kết đều có thể xem."
      });
    }

    const csv = await response.text();

    if (/<html|<!doctype/i.test(csv.slice(0, 500))) {
      return res.status(400).json({
        error: "Google đang yêu cầu đăng nhập. Hãy bật quyền xem bằng đường liên kết cho Sheet."
      });
    }

    const values = parse(csv, {
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: false
    });

    if (!values.length) {
      return res.status(400).json({ error: "Sheet không có dữ liệu." });
    }

    // A = Thứ/ngày, B = Buổi, C = Tiết, D:R = 10A1 ... 12A5
    const header = values[0] || [];
    const classStart = 3;
    const maxClassColumns = 15;
    const classes = header
      .slice(classStart, classStart + maxClassColumns)
      .map(cleanClassHeader);

    const teacherKey = normalize(teacherInput);

    let currentDay = "";
    let currentSession = "";
    const rows = [];
    let matchCount = 0;

    for (let r = 1; r < values.length; r++) {
      const row = values[r] || [];

      if (String(row[0] || "").trim()) currentDay = String(row[0]).trim();
      if (String(row[1] || "").trim()) currentSession = String(row[1]).trim();

      const period = String(row[2] || "").trim().replace(/\.0$/, "");
      if (!period) continue;

      const cells = [];

      for (let c = classStart; c < classStart + classes.length; c++) {
        const raw = String(row[c] || "").trim();
        const parsed = splitSubjectTeacher(raw);

        if (parsed && teacherMatches(parsed.teacher, teacherKey)) {
          cells.push(`${parsed.subject}\n- ${parsed.teacher}`);
          matchCount++;
        } else {
          cells.push("");
        }
      }

      rows.push({
        dayRaw: currentDay,
        day: parseDay(currentDay),
        date: parseDate(currentDay),
        session: currentSession,
        period,
        cells
      });
    }

    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");

    return res.status(200).json({
      teacher: teacherInput,
      classes,
      rows,
      matchCount
    });

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

function teacherMatches(actualTeacher, teacherKey) {
  const actual = normalize(actualTeacher);
  if (actual === teacherKey) return true;

  return actual.endsWith(teacherKey) &&
    (actual.length === teacherKey.length ||
     /[\s.\-]/.test(actual.charAt(actual.length - teacherKey.length - 1)));
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


function formatTeacher(text) {
  // Chỉ chỉnh phần HIỂN THỊ: T.Tuấn -> T. Tuấn, N.Ngọc -> N. Ngọc.
  // Không ảnh hưởng logic tìm kiếm.
  return String(text || "")
    .trim()
    .replace(/([A-Za-zÀ-ỹĐđ])\.(?=\S)/g, "$1. ");
}

function cleanClassHeader(text) {
  return String(text || "").split(/\r?\n/)[0].trim();
}

function parseDay(text) {
  const first = String(text || "").split(/\r?\n/)[0].trim();
  const m = first.match(/[2-7]/);
  return m ? m[0] : first;
}

function parseDate(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  return lines.length > 1 ? lines.slice(1).join(" ") : "";
}
