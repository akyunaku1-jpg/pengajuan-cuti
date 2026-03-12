import { readFile } from "node:fs/promises";
import bcrypt from "bcrypt";
import formidable from "formidable";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const jwtSecret = process.env.JWT_SECRET || "<YOUR_API_KEY>";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;
const rawUploadBucketEnv = process.env.SUPABASE_UPLOAD_BUCKET;
const uploadBucket = String(rawUploadBucketEnv || "request-files").trim() || "request-files";
const tryDecodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64 + "=".repeat((4 - (payloadBase64.length % 4 || 4)) % 4);
    const payloadText = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(payloadText);
  } catch {
    return null;
  }
};
const supabaseKeyPayload = tryDecodeJwtPayload(supabaseServiceRoleKey);
const supabaseKeyRole = typeof supabaseKeyPayload?.role === "string" ? supabaseKeyPayload.role : null;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("[api:init] Missing required Supabase env vars", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
    hasServiceRoleKeyEnv: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasServiceKeyEnv: Boolean(process.env.SUPABASE_SERVICE_KEY),
    uploadBucket,
    rawUploadBucketEnv: rawUploadBucketEnv ?? null,
  });
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY environment variables.");
}

if (supabaseKeyRole && supabaseKeyRole !== "service_role") {
  console.error("[api:init] Supabase key role is not service_role", {
    detectedRole: supabaseKeyRole,
    message: "Expected SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY, but got a non-service key.",
  });
  throw new Error("Supabase key role is not service_role. Use SUPABASE_SERVICE_ROLE_KEY.");
}

console.log("[api:init] Environment check", {
  hasSupabaseUrl: Boolean(supabaseUrl),
  hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
  serviceKeySource: process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "SUPABASE_SERVICE_ROLE_KEY"
    : process.env.SUPABASE_SERVICE_KEY
      ? "SUPABASE_SERVICE_KEY"
      : "none",
  hasProjectId: Boolean(supabaseProjectId),
  uploadBucket,
  rawUploadBucketEnv: rawUploadBucketEnv ?? null,
  bucketNameTrimmed: rawUploadBucketEnv ? String(rawUploadBucketEnv) !== uploadBucket : false,
  detectedSupabaseKeyRole: supabaseKeyRole,
  nodeEnv: process.env.NODE_ENV || "unknown",
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const ALLOWED_ROLES = new Set(["employee", "admin"]);
const ALLOWED_LEAVE_TYPES = new Set(["annual", "sick", "special"]);
const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected"]);
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_FILE_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);
const FILE_UPLOAD_FAILED_MARKER = "__UPLOAD_FAILED__";
const FILE_UPLOAD_FAILED_WARNING = "lampiran gagal diunggah";

const serializeError = (error) => {
  if (!error) return null;
  if (typeof error !== "object") {
    return {
      name: null,
      message: String(error),
      code: null,
      status: null,
      error: null,
      details: null,
      hint: null,
    };
  }
  return {
    name: error.name || null,
    message: error.message ? String(error.message) : String(error),
    code: error.code || null,
    status: error.statusCode || error.status || null,
    error: error.error || null,
    details: error.details || null,
    hint: error.hint || null,
  };
};

const getErrorProperties = (error) => {
  if (!error || typeof error !== "object") return null;
  const keys = new Set([...Object.keys(error), ...Object.getOwnPropertyNames(error)]);
  const snapshot = {};
  for (const key of keys) {
    try {
      const value = error[key];
      snapshot[key] =
        value instanceof Error
          ? {
              name: value.name || null,
              message: value.message || null,
              stack: value.stack || null,
            }
          : value;
    } catch {
      snapshot[key] = "[unreadable]";
    }
  }
  return snapshot;
};

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
  file_url: row.file_url === FILE_UPLOAD_FAILED_MARKER ? null : row.file_url,
  warning: row.file_url === FILE_UPLOAD_FAILED_MARKER ? FILE_UPLOAD_FAILED_WARNING : null,
  attachment_upload_failed: row.file_url === FILE_UPLOAD_FAILED_MARKER,
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

const handleResetPassword = async (req, res) => {
  const body = await parseJsonBody(req);
  const email = String(body.email || "").toLowerCase().trim();
  const verifyOnly = Boolean(body.verifyOnly);
  const newPassword = String(body.newPassword || "");

  if (!email) {
    sendJson(res, 400, { message: "Email wajib diisi." });
    return;
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (userError) throw userError;
  if (!user) {
    sendJson(res, 404, { message: "Email tidak terdaftar." });
    return;
  }

  if (verifyOnly) {
    sendJson(res, 200, { message: "Email terdaftar." });
    return;
  }

  if (!newPassword) {
    sendJson(res, 400, { message: "Kata sandi baru wajib diisi." });
    return;
  }
  if (newPassword.length < 8) {
    sendJson(res, 400, { message: "Kata sandi baru minimal 8 karakter." });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password: hashedPassword })
    .eq("id", user.id);
  if (updateError) throw updateError;

  sendJson(res, 200, { message: "Kata sandi berhasil diperbarui." });
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
  console.log("[upload] Start uploadFileToSupabase", {
    hasFile: Boolean(file),
    bucket: uploadBucket,
  });
  if (!file) return null;
  const rawFilename = String(file.originalFilename || "file");
  const extension = rawFilename.includes(".") ? rawFilename.split(".").pop().toLowerCase() : "";
  const mimeType = String(file.mimetype || "");
  const hasAllowedMime = ALLOWED_MIME_TYPES.has(mimeType);
  const hasAllowedExtension = ALLOWED_FILE_EXTENSIONS.has(extension);
  console.log("[upload] File metadata", {
    rawFilename,
    extension,
    mimeType,
    size: Number(file.size || 0),
    hasAllowedMime,
    hasAllowedExtension,
  });

  // Some clients send generic mime types; allow trusted extension fallback.
  if (!hasAllowedMime && !hasAllowedExtension) {
    const validationError = new Error("File hanya boleh PDF, JPG, atau PNG.");
    validationError.code = "INVALID_FILE_TYPE";
    throw validationError;
  }

  const safeName = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `requests/${Date.now()}-${safeName}`;
  console.log("[upload] Generated storage path", { storagePath });
  const fileBuffer = await readFile(file.filepath);
  console.log("[upload] File read into buffer", { bytes: fileBuffer.length });

  try {
    console.log("[upload] Listing buckets");
    const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets();
    if (listBucketsError) throw listBucketsError;
    const hasBucket = Array.isArray(buckets) && buckets.some((bucket) => bucket?.name === uploadBucket);
    console.log("[upload] Bucket check complete", {
      bucket: uploadBucket,
      hasBucket,
      bucketCount: Array.isArray(buckets) ? buckets.length : 0,
    });
    if (!hasBucket) {
      console.log("[upload] Bucket missing, creating bucket", { bucket: uploadBucket });
      const { error: createBucketError } = await supabase.storage.createBucket(uploadBucket, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
      });
      if (createBucketError && !String(createBucketError.message || "").includes("already exists")) {
        throw createBucketError;
      }
      console.log("[upload] Bucket create finished", {
        bucket: uploadBucket,
        hadCreateError: Boolean(createBucketError),
        createErrorMessage: createBucketError ? String(createBucketError.message || "") : null,
      });
    }

    const { data: listObjectsData, error: listObjectsError } = await supabase.storage.from(uploadBucket).list("requests", {
      limit: 1,
      offset: 0,
    });
    if (listObjectsError) {
      console.error("[upload] Storage list permission/rls check failed", {
        bucket: uploadBucket,
        listObjectsError: serializeError(listObjectsError),
        listObjectsErrorProps: getErrorProperties(listObjectsError),
      });
      throw listObjectsError;
    }
    console.log("[upload] Storage list pre-check ok", {
      bucket: uploadBucket,
      listedObjectCount: Array.isArray(listObjectsData) ? listObjectsData.length : 0,
    });

    console.log("[upload] Uploading file to Supabase storage", {
      bucket: uploadBucket,
      storagePath,
      contentType: hasAllowedMime ? mimeType : "auto",
    });
    const { error: uploadError } = await supabase.storage.from(uploadBucket).upload(storagePath, fileBuffer, {
      contentType: hasAllowedMime ? mimeType : undefined,
      upsert: false,
    });
    if (uploadError) {
      console.error("[upload] Supabase storage upload error response", {
        bucket: uploadBucket,
        storagePath,
        uploadError: serializeError(uploadError),
        uploadErrorProps: getErrorProperties(uploadError),
      });
      throw uploadError;
    }
    console.log("[upload] Upload success", { bucket: uploadBucket, storagePath });
  } catch (cause) {
    const serializedCause = serializeError(cause);
    console.error("[upload] Upload failed", {
      bucket: uploadBucket,
      storagePath,
      supabaseError: serializedCause,
      supabaseErrorProps: getErrorProperties(cause),
    });
    const storageError = new Error("Gagal mengunggah dokumen pendukung. Coba lagi atau kirim tanpa dokumen.");
    storageError.code = "FILE_UPLOAD_FAILED";
    storageError.cause = cause;
    throw storageError;
  }

  const { data: publicUrlData } = supabase.storage.from(uploadBucket).getPublicUrl(storagePath);
  console.log("[upload] Public URL generated", {
    hasPublicUrl: Boolean(publicUrlData?.publicUrl),
    storagePath,
  });
  if (publicUrlData?.publicUrl) return publicUrlData.publicUrl;
  if (!supabaseProjectId) return null;
  return `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/${uploadBucket}/${storagePath}`;
};

const handleCreateRequest = async (req, res, authUser) => {
  console.log("[requests:create] Start", {
    userId: authUser?.id || null,
    role: authUser?.role || null,
    contentType: req.headers["content-type"] || "",
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
    hasServiceRoleKeyEnv: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasServiceKeyEnv: Boolean(process.env.SUPABASE_SERVICE_KEY),
    uploadBucket,
    rawUploadBucketEnv: rawUploadBucketEnv ?? null,
    bucketNameTrimmed: rawUploadBucketEnv ? String(rawUploadBucketEnv) !== uploadBucket : false,
    detectedSupabaseKeyRole: supabaseKeyRole,
  });
  const contentType = req.headers["content-type"] || "";
  let payload = {};
  let file = null;

  if (contentType.includes("multipart/form-data")) {
    console.log("[requests:create] Parsing multipart body");
    const parsed = await parseMultipartBody(req);
    payload = parsed.fields;
    file = parsed.file;
    console.log("[requests:create] Multipart parsed", {
      fieldKeys: Object.keys(payload || {}),
      hasFile: Boolean(file),
      fileName: file?.originalFilename || null,
      fileMimeType: file?.mimetype || null,
      fileSize: Number(file?.size || 0),
    });
  } else {
    console.log("[requests:create] Parsing JSON body");
    payload = await parseJsonBody(req);
    console.log("[requests:create] JSON parsed", {
      fieldKeys: Object.keys(payload || {}),
      hasFile: false,
    });
  }

  const leave_type = String(payload.leave_type || "");
  const start_date = String(payload.start_date || "");
  const end_date = String(payload.end_date || "");
  const reason = String(payload.reason || "").trim();

  if (!leave_type || !start_date || !end_date || !reason) {
    console.warn("[requests:create] Validation failed: required fields missing", {
      leave_type,
      start_date,
      end_date,
      reasonLength: reason.length,
    });
    sendJson(res, 400, { message: "Semua kolom wajib diisi." });
    return;
  }
  if (!ALLOWED_LEAVE_TYPES.has(leave_type)) {
    console.warn("[requests:create] Validation failed: invalid leave type", { leave_type });
    sendJson(res, 400, { message: "Jenis cuti tidak valid." });
    return;
  }

  const duration = calculateDuration(start_date, end_date);
  if (duration <= 0) {
    console.warn("[requests:create] Validation failed: invalid duration", {
      start_date,
      end_date,
      duration,
    });
    sendJson(res, 400, { message: "Tanggal selesai harus setelah tanggal mulai" });
    return;
  }

  let file_url = null;
  let warning = null;
  if (file) {
    try {
      console.log("[requests:create] Attempting attachment upload");
      file_url = await uploadFileToSupabase(file);
      console.log("[requests:create] Attachment upload completed", {
        hasFileUrl: Boolean(file_url),
      });
    } catch (error) {
      if (error?.code === "INVALID_FILE_TYPE") throw error;
      if (error?.code === "FILE_UPLOAD_FAILED") {
        console.error("[requests:create] Attachment upload failed details", {
          error: serializeError(error),
          errorProps: getErrorProperties(error),
          cause: serializeError(error?.cause),
          causeProps: getErrorProperties(error?.cause),
        });
        file_url = FILE_UPLOAD_FAILED_MARKER;
        warning = FILE_UPLOAD_FAILED_WARNING;
        console.warn("[requests:create] Attachment upload failed, fallback enabled", {
          warning,
        });
      } else {
        throw error;
      }
    }
  }

  console.log("[requests:create] Inserting request row", {
    userId: authUser.id,
    leave_type,
    start_date,
    end_date,
    duration,
    hasWarning: Boolean(warning),
    hasFileUrl: Boolean(file_url && file_url !== FILE_UPLOAD_FAILED_MARKER),
    fallbackMarkerUsed: file_url === FILE_UPLOAD_FAILED_MARKER,
  });
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
  console.log("[requests:create] Insert success", {
    requestId: inserted?.id || null,
    hasWarning: Boolean(warning),
  });

  sendJson(res, 201, {
    request: toRequestDto(inserted),
    warning,
    message: warning ? "Pengajuan berhasil dikirim tanpa lampiran karena unggah dokumen gagal." : undefined,
  });
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
    if (req.method === "POST" && parts[0] === "auth" && parts[1] === "reset-password" && parts.length === 2) {
      await handleResetPassword(req, res);
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
    const serializedError = serializeError(error);
    const serializedCause = serializeError(error?.cause);
    console.error("[api:error] Unhandled error in handler", {
      method: req.method,
      url: req.url,
      error: serializedError,
      cause: serializedCause,
      stack: error?.stack || null,
    });
    if (error?.code === "INVALID_FILE_TYPE" || error?.message?.includes("File hanya boleh PDF, JPG, atau PNG")) {
      sendJson(res, 400, { message: error.message });
      return;
    }
    if (error?.code === "FILE_UPLOAD_FAILED") {
      sendJson(res, 400, { message: error.message });
      return;
    }
    sendJson(res, 500, {
      message: "Terjadi kesalahan pada server.",
      detail: process.env.NODE_ENV !== "production" ? String(error?.message || "Unknown error") : undefined,
    });
  }
}
