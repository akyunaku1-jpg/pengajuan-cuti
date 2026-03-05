import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { calculateDuration } from "./utils/date.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const uploadDir = path.join(rootDir, "uploads");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const db = new Database(path.join(dataDir, "leave-system.db"));
db.pragma("journal_mode = WAL");

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || "<YOUR_API_KEY>";

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
    if (!allowed.has(file.mimetype)) {
      cb(new Error("File hanya boleh PDF, JPG, atau PNG."));
      return;
    }
    cb(null, true);
  },
});

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee', 'admin')),
      division TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('annual', 'sick', 'special')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      reason TEXT NOT NULL,
      file_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
};

const seedData = () => {
  const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (usersCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, division)
    VALUES (@name, @email, @password, @role, @division)
  `);

  const adminHash = bcrypt.hashSync("admin123", 10);
  const employeeHash = bcrypt.hashSync("employee123", 10);

  insertUser.run({
    name: "HR Admin",
    email: "admin@company.com",
    password: adminHash,
    role: "admin",
    division: "HR",
  });

  insertUser.run({
    name: "John Doe",
    email: "john@company.com",
    password: employeeHash,
    role: "employee",
    division: "Engineering",
  });

  insertUser.run({
    name: "Jane Smith",
    email: "jane@company.com",
    password: employeeHash,
    role: "employee",
    division: "Marketing",
  });

  const users = db
    .prepare("SELECT id, email FROM users WHERE email IN ('john@company.com', 'jane@company.com')")
    .all();
  const john = users.find((item) => item.email === "john@company.com");
  const jane = users.find((item) => item.email === "jane@company.com");

  const sampleRequests = [
    {
      user_id: john.id,
      leave_type: "annual",
      start_date: "2026-03-20",
      end_date: "2026-03-22",
      reason: "Family event",
      status: "pending",
      admin_notes: null,
    },
    {
      user_id: john.id,
      leave_type: "sick",
      start_date: "2026-02-11",
      end_date: "2026-02-12",
      reason: "Medical treatment",
      status: "approved",
      admin_notes: null,
    },
    {
      user_id: jane.id,
      leave_type: "special",
      start_date: "2026-02-08",
      end_date: "2026-02-08",
      reason: "Legal appointment",
      status: "rejected",
      admin_notes: "Please attach supporting documents.",
    },
    {
      user_id: jane.id,
      leave_type: "annual",
      start_date: "2026-01-18",
      end_date: "2026-01-20",
      reason: "Personal travel",
      status: "approved",
      admin_notes: null,
    },
    {
      user_id: john.id,
      leave_type: "special",
      start_date: "2026-03-01",
      end_date: "2026-03-01",
      reason: "Emergency family matters",
      status: "pending",
      admin_notes: null,
    },
  ];

  const insertRequest = db.prepare(`
    INSERT INTO requests (user_id, leave_type, start_date, end_date, duration, reason, file_url, status, admin_notes)
    VALUES (@user_id, @leave_type, @start_date, @end_date, @duration, @reason, @file_url, @status, @admin_notes)
  `);

  sampleRequests.forEach((item) => {
    insertRequest.run({
      ...item,
      duration: calculateDuration(item.start_date, item.end_date),
      file_url: null,
    });
  });
};

createSchema();
seedData();

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  division: user.division,
  created_at: user.created_at,
});

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
      division: user.division,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ message: "Tidak terautentikasi." });
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Akses ditolak." });
  next();
};

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email dan kata sandi wajib diisi." });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Email atau kata sandi tidak valid." });
  }

  return res.json({
    token: signToken(user),
    user: sanitizeUser(user),
  });
});

app.get("/api/auth/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
  return res.json({ user: sanitizeUser(user) });
});

app.patch("/api/auth/me", authenticate, allowRoles("employee", "admin"), (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: "Nama dan email wajib diisi." });

  const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email.toLowerCase(), req.user.id);
  if (existing) return res.status(409).json({ message: "Email sudah digunakan" });

  db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name.trim(), email.toLowerCase(), req.user.id);
  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  return res.json({ user: sanitizeUser(updated) });
});

app.post("/api/admin/users", authenticate, allowRoles("admin"), (req, res) => {
  const { name, email, password, division, role } = req.body;
  if (!name || !email || !password || !division || !role) {
    return res.status(400).json({ message: "Semua kolom wajib diisi." });
  }

  if (!["employee", "admin"].includes(role)) {
    return res.status(400).json({ message: "Role tidak valid." });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password minimal 8 karakter" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) return res.status(409).json({ message: "Email sudah digunakan" });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password, role, division) VALUES (?, ?, ?, ?, ?)")
    .run(name.trim(), normalizedEmail, hashedPassword, role, division.trim());

  const created = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ user: sanitizeUser(created) });
});

app.get("/api/requests", authenticate, allowRoles("employee", "admin"), (req, res) => {
  const filter = req.query.status;
  const params = [];
  let whereClause = "";

  if (req.user.role === "employee") {
    whereClause = "WHERE r.user_id = ?";
    params.push(req.user.id);
  }

  if (filter && ["pending", "approved", "rejected"].includes(filter)) {
    whereClause += whereClause ? " AND r.status = ?" : "WHERE r.status = ?";
    params.push(filter);
  }

  const rows = db
    .prepare(`
      SELECT
        r.*,
        u.name AS employee_name,
        u.division AS employee_division
      FROM requests r
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY datetime(r.created_at) DESC
    `)
    .all(...params);

  return res.json({ requests: rows });
});

app.post("/api/requests", authenticate, allowRoles("employee"), upload.single("file"), (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  if (!leave_type || !start_date || !end_date || !reason?.trim()) {
    return res.status(400).json({ message: "Semua kolom wajib diisi." });
  }
  if (!["annual", "sick", "special"].includes(leave_type)) {
    return res.status(400).json({ message: "Jenis cuti tidak valid." });
  }

  const duration = calculateDuration(start_date, end_date);
  if (duration <= 0) return res.status(400).json({ message: "Tanggal selesai harus setelah tanggal mulai" });

  const result = db
    .prepare(`
      INSERT INTO requests (user_id, leave_type, start_date, end_date, duration, reason, file_url, status, admin_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL)
    `)
    .run(
      req.user.id,
      leave_type,
      start_date,
      end_date,
      duration,
      reason.trim(),
      req.file ? `/uploads/${req.file.filename}` : null,
    );

  const created = db
    .prepare(`
      SELECT r.*, u.name as employee_name, u.division as employee_division
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `)
    .get(result.lastInsertRowid);
  return res.status(201).json({ request: created });
});

app.patch("/api/requests/:id/approve", authenticate, allowRoles("admin"), (req, res) => {
  const requestId = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM requests WHERE id = ?").get(requestId);
  if (!existing) return res.status(404).json({ message: "Pengajuan tidak ditemukan." });

  db.prepare("UPDATE requests SET status = 'approved', admin_notes = NULL WHERE id = ?").run(requestId);
  const updated = db.prepare("SELECT * FROM requests WHERE id = ?").get(requestId);
  return res.json({ request: updated });
});

app.patch("/api/requests/:id/reject", authenticate, allowRoles("admin"), (req, res) => {
  const requestId = Number(req.params.id);
  const { admin_notes } = req.body;
  if (!admin_notes?.trim()) return res.status(400).json({ message: "Catatan admin wajib diisi." });
  const existing = db.prepare("SELECT id FROM requests WHERE id = ?").get(requestId);
  if (!existing) return res.status(404).json({ message: "Pengajuan tidak ditemukan." });

  db.prepare("UPDATE requests SET status = 'rejected', admin_notes = ? WHERE id = ?").run(admin_notes.trim(), requestId);
  const updated = db.prepare("SELECT * FROM requests WHERE id = ?").get(requestId);
  return res.json({ request: updated });
});

app.get("/api/employees", authenticate, allowRoles("admin"), (_req, res) => {
  const employees = db
    .prepare("SELECT id, name, email, role, division, created_at FROM users WHERE role = 'employee' ORDER BY id ASC")
    .all();
  return res.json({ employees });
});

app.get("/api/requests/summary", authenticate, allowRoles("employee", "admin"), (req, res) => {
  if (req.user.role === "admin") {
    const counts = db
      .prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM requests
      `)
      .get();
    return res.json({
      total: counts.total || 0,
      pending: counts.pending || 0,
      approved: counts.approved || 0,
      rejected: counts.rejected || 0,
    });
  }

  const stats = db
    .prepare(`
      SELECT
        SUM(CASE WHEN status = 'approved' THEN duration ELSE 0 END) as used_days,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM requests
      WHERE user_id = ?
    `)
    .get(req.user.id);

  const leaveLimit = 12;
  const used = stats.used_days || 0;
  return res.json({
    remaining_leave_days: Math.max(leaveLimit - used, 0),
    pending_count: stats.pending_count || 0,
    total_days_used: used,
  });
});

app.use((error, _req, res, _next) => {
  if (error?.message?.includes("File hanya boleh PDF, JPG, atau PNG")) {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
