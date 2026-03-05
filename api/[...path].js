import { readFile } from "node:fs/promises";
import bcrypt from "bcrypt";
import formidable from "formidable";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const jwtSecret = process.env.JWT_SECRET || "<YOUR_API_KEY>";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;
const uploadBucket = process.env.SUPABASE_UPLOAD_BUCKET || "request-files";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const ALLOWED_ROLES = new Set(["employee", "admin"]);
const ALLOWED_LEAVE_TYPES = new Set(["annual", "sick", "special"]);
const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected"]);
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

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

const parseUrl = (req) => {
  const url = new URL(req.url || "/api", "http://localhost");
  const path = url.pathname.replace(/^\/api\/?/, "");
  return { url, parts: path ? path.split("/") : [] };
};

const parseJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const parseMultipartBody = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024, keepExtensions: true });
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      const normalizedFields = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
      );
      const normalizedFile = Array.isArray(files.file) ? files.file[0] : files.file;
      resolve({ fields: normalizedFields, file: normalizedFile || null });
    });
  });

const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const getAuthUser = (req) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), jwtSecret);
  } catch {
    return null;
  }
};

const requireAuth = (req, res, roles = []) => {
  const user = getAuthUser(req);
  if (!user) {
    sendJson(res, 401, { message: "Tidak terautentikasi." });
    return null;
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    sendJson(res, 403, { message: "Akses ditolak." });
    return null;
  }
  return user;
};

const toRequestDto = (row) => ({
  id: row.id,
  user_id: row.user_id,
  leave_type: row.leave_type,
  start_date: row.start_date,
  end_date: row.end_date,
  duration: row.duration,
  reason: row.reason,
  file_url: row.file_url,
  status: row.status,
  admin_notes: row.admin_notes,
  created_at: row.created_at,
  employee_name: row.users?.name || null,
  employee_division: row.users?.division || null,
});

const findUserById = async (id) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
};

const findRequestById = async (id) => {
  const { data, error } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
};

const handleLogin = async (req, res) => {
  const body = await parseJsonBody(req);
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  if (!email || !password) {
    sendJson(res, 400, { message: "Email dan kata sandi wajib diisi." });
    return;
  }

  const { data: user, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
  if (error) throw error;

  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) {
    sendJson(res, 401, { message: "Email atau kata sandi tidak valid." });
    return;
  }

  sendJson(res, 200, { token: signToken(user), user: sanitizeUser(user) });
};

const handleMe = async (req, res, authUser) => {
  const user = await findUserById(authUser.id);
  if (!user) {
    sendJson(res, 404, { message: "Pengguna tidak ditemukan." });
    return;
  }
  sendJson(res, 200, { user: sanitizeUser(user) });
};

const handlePatchMe = async (req, res, authUser) => {
  const body = await parseJsonBody(req);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  if (!name || !email) {
    sendJson(res, 400, { message: "Nama dan email wajib diisi." });
    return;
  }

  const { data: sameEmailUser, error: emailCheckError } =
    await supabase.from("users").select("id").eq("email", email).neq("id", authUser.id).maybeSingle();
  if (emailCheckError) throw emailCheckError;
  if (sameEmailUser) {
    sendJson(res, 409, { message: "Email sudah digunakan" });
    return;
  }

  const { data: updated, error } = await supabase
    .from("users")
    .update({ name, email })
    .eq("id", authUser.id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!updated) {
    sendJson(res, 404, { message: "Pengguna tidak ditemukan." });
    return;
  }

  sendJson(res, 200, { user: sanitizeUser(updated) });
};

const handleCreateUser = async (req, res) => {
  const body = await parseJsonBody(req);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const division = String(body.division || "").trim();
  const role = String(body.role || "");

  if (!name || !email || !password || !division || !role) {
    sendJson(res, 400, { message: "Semua kolom wajib diisi." });
    return;
  }
  if (!ALLOWED_ROLES.has(role)) {
    sendJson(res, 400, { message: "Role tidak valid." });
    return;
  }
  if (password.length < 8) {
    sendJson(res, 400, { message: "Password minimal 8 karakter" });
    return;
  }

  const { data: existing, error: existingError } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    sendJson(res, 409, { message: "Email sudah digunakan" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const { data: created, error } = await supabase
    .from("users")
    .insert({ name, email, password: hashedPassword, role, division })
    .select("*")
    .single();
  if (error) throw error;

  sendJson(res, 201, { user: sanitizeUser(created) });
};

const handleGetRequests = async (req, res, authUser, url) => {
  let query = supabase
    .from("requests")
    .select("*, users!requests_user_id_fkey(name, division)")
    .order("created_at", { ascending: false });

  if (authUser.role === "employee") {
    query = query.eq("user_id", authUser.id);
  }

  const statusFilter = url.searchParams.get("status");
  if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;

  sendJson(res, 200, { requests: (data || []).map(toRequestDto) });
};

const uploadFileToSupabase = async (file) => {
  if (!file) return null;
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error("File hanya boleh PDF, JPG, atau PNG.");
  }

  const safeName = String(file.originalFilename || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `requests/${Date.now()}-${safeName}`;
  const fileBuffer = await readFile(file.filepath);

  const { error: uploadError } = await supabase.storage.from(uploadBucket).upload(storagePath, fileBuffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(uploadBucket).getPublicUrl(storagePath);
  if (publicUrlData?.publicUrl) return publicUrlData.publicUrl;
  if (!supabaseProjectId) return null;
  return `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/${uploadBucket}/${storagePath}`;
};

const handleCreateRequest = async (req, res, authUser) => {
  const contentType = req.headers["content-type"] || "";
  let payload = {};
  let file = null;

  if (contentType.includes("multipart/form-data")) {
    const parsed = await parseMultipartBody(req);
    payload = parsed.fields;
    file = parsed.file;
  } else {
    payload = await parseJsonBody(req);
  }

  const leave_type = String(payload.leave_type || "");
  const start_date = String(payload.start_date || "");
  const end_date = String(payload.end_date || "");
  const reason = String(payload.reason || "").trim();

  if (!leave_type || !start_date || !end_date || !reason) {
    sendJson(res, 400, { message: "Semua kolom wajib diisi." });
    return;
  }
  if (!ALLOWED_LEAVE_TYPES.has(leave_type)) {
    sendJson(res, 400, { message: "Jenis cuti tidak valid." });
    return;
  }

  const duration = calculateDuration(start_date, end_date);
  if (duration <= 0) {
    sendJson(res, 400, { message: "Tanggal selesai harus setelah tanggal mulai" });
    return;
  }

  const file_url = await uploadFileToSupabase(file);

  const { data: inserted, error: insertError } = await supabase
    .from("requests")
    .insert({
      user_id: authUser.id,
      leave_type,
      start_date,
      end_date,
      duration,
      reason,
      file_url,
      status: "pending",
      admin_notes: null,
    })
    .select("*, users!requests_user_id_fkey(name, division)")
    .single();
  if (insertError) throw insertError;

  sendJson(res, 201, { request: toRequestDto(inserted) });
};

const handleApproveRequest = async (res, requestId) => {
  const existing = await findRequestById(requestId);
  if (!existing) {
    sendJson(res, 404, { message: "Pengajuan tidak ditemukan." });
    return;
  }

  const { data: updated, error } = await supabase
    .from("requests")
    .update({ status: "approved", admin_notes: null })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error) throw error;

  sendJson(res, 200, { request: updated });
};

const handleRejectRequest = async (req, res, requestId) => {
  const body = await parseJsonBody(req);
  const admin_notes = String(body.admin_notes || "").trim();
  if (!admin_notes) {
    sendJson(res, 400, { message: "Catatan admin wajib diisi." });
    return;
  }

  const existing = await findRequestById(requestId);
  if (!existing) {
    sendJson(res, 404, { message: "Pengajuan tidak ditemukan." });
    return;
  }

  const { data: updated, error } = await supabase
    .from("requests")
    .update({ status: "rejected", admin_notes })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error) throw error;

  sendJson(res, 200, { request: updated });
};

const handleEmployees = async (res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, division, created_at")
    .eq("role", "employee")
    .order("id", { ascending: true });
  if (error) throw error;
  sendJson(res, 200, { employees: data || [] });
};

const handleSummary = async (res, authUser) => {
  if (authUser.role === "admin") {
    const { data, error } = await supabase.from("requests").select("status");
    if (error) throw error;
    const counts = (data || []).reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === "pending") acc.pending += 1;
        if (row.status === "approved") acc.approved += 1;
        if (row.status === "rejected") acc.rejected += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 },
    );
    sendJson(res, 200, counts);
    return;
  }

  const { data, error } = await supabase.from("requests").select("status, duration").eq("user_id", authUser.id);
  if (error) throw error;

  const usedDays = (data || []).reduce((sum, row) => (row.status === "approved" ? sum + Number(row.duration || 0) : sum), 0);
  const pendingCount = (data || []).reduce((sum, row) => (row.status === "pending" ? sum + 1 : sum), 0);
  const leaveLimit = 12;

  sendJson(res, 200, {
    remaining_leave_days: Math.max(leaveLimit - usedDays, 0),
    pending_count: pendingCount,
    total_days_used: usedDays,
  });
};

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const { url, parts } = parseUrl(req);

    if (req.method === "POST" && parts[0] === "auth" && parts[1] === "login" && parts.length === 2) {
      await handleLogin(req, res);
      return;
    }

    if (parts[0] === "auth" && parts[1] === "me" && parts.length === 2) {
      const user = requireAuth(req, res, ["employee", "admin"]);
      if (!user) return;
      if (req.method === "GET") {
        await handleMe(req, res, user);
        return;
      }
      if (req.method === "PATCH") {
        await handlePatchMe(req, res, user);
        return;
      }
    }

    if (req.method === "POST" && parts[0] === "admin" && parts[1] === "users" && parts.length === 2) {
      const user = requireAuth(req, res, ["admin"]);
      if (!user) return;
      await handleCreateUser(req, res);
      return;
    }

    if (parts[0] === "requests" && parts.length === 1) {
      const user = requireAuth(req, res, ["employee", "admin"]);
      if (!user) return;
      if (req.method === "GET") {
        await handleGetRequests(req, res, user, url);
        return;
      }
      if (req.method === "POST") {
        if (user.role !== "employee") {
          sendJson(res, 403, { message: "Akses ditolak." });
          return;
        }
        await handleCreateRequest(req, res, user);
        return;
      }
    }

    if (req.method === "PATCH" && parts[0] === "requests" && parts[2] === "approve" && parts.length === 3) {
      const user = requireAuth(req, res, ["admin"]);
      if (!user) return;
      const requestId = Number(parts[1]);
      if (!Number.isFinite(requestId)) {
        sendJson(res, 400, { message: "ID pengajuan tidak valid." });
        return;
      }
      await handleApproveRequest(res, requestId);
      return;
    }

    if (req.method === "PATCH" && parts[0] === "requests" && parts[2] === "reject" && parts.length === 3) {
      const user = requireAuth(req, res, ["admin"]);
      if (!user) return;
      const requestId = Number(parts[1]);
      if (!Number.isFinite(requestId)) {
        sendJson(res, 400, { message: "ID pengajuan tidak valid." });
        return;
      }
      await handleRejectRequest(req, res, requestId);
      return;
    }

    if (req.method === "GET" && parts[0] === "employees" && parts.length === 1) {
      const user = requireAuth(req, res, ["admin"]);
      if (!user) return;
      await handleEmployees(res);
      return;
    }

    if (req.method === "GET" && parts[0] === "requests" && parts[1] === "summary" && parts.length === 2) {
      const user = requireAuth(req, res, ["employee", "admin"]);
      if (!user) return;
      await handleSummary(res, user);
      return;
    }

    sendJson(res, 404, { message: "Endpoint tidak ditemukan." });
  } catch (error) {
    if (error?.message?.includes("File hanya boleh PDF, JPG, atau PNG")) {
      sendJson(res, 400, { message: error.message });
      return;
    }
    sendJson(res, 500, { message: "Terjadi kesalahan pada server." });
  }
}
