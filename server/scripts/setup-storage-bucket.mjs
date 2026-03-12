import { readFile } from "node:fs/promises";

const parseEnvLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const idx = trimmed.indexOf("=");
  if (idx <= 0) return null;
  const key = trimmed.slice(0, idx).trim();
  const rawValue = trimmed.slice(idx + 1).trim();
  const value = rawValue.replace(/^['"]|['"]$/g, "");
  return [key, value];
};

const readEnvFile = async (envFilePath) => {
  const text = await readFile(envFilePath, "utf8");
  return Object.fromEntries(text.split(/\r?\n/).map(parseEnvLine).filter(Boolean));
};

const getArgValue = (flagName) => {
  const arg = process.argv.find((item) => item.startsWith(`${flagName}=`));
  return arg ? arg.slice(flagName.length + 1) : null;
};

const run = async () => {
  const envFilePath = getArgValue("--env-path") || getArgValue("--envfile") || ".env.local";
  let envFromFile = {};
  try {
    envFromFile = await readEnvFile(envFilePath);
  } catch {
    console.warn(`[setup:storage] Env file not found or unreadable: ${envFilePath}. Falling back to process.env only.`);
    envFromFile = {};
  }

  const supabaseUrl = process.env.SUPABASE_URL || envFromFile.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    envFromFile.SUPABASE_SERVICE_ROLE_KEY ||
    envFromFile.SUPABASE_SERVICE_KEY;
  const rawBucket =
    process.env.SUPABASE_UPLOAD_BUCKET || envFromFile.SUPABASE_UPLOAD_BUCKET || "request-files";
  const bucketName = String(rawBucket).trim() || "request-files";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY.");
  }

  const getHeaders = () => ({
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  });

  console.log("[setup:storage] Starting storage setup");
  console.log("[setup:storage] Config", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    bucketName,
    bucketNameTrimmed: String(rawBucket) !== bucketName,
  });

  const listResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!listResponse.ok) {
    throw new Error(`Failed to list buckets (${listResponse.status}): ${await listResponse.text()}`);
  }
  const buckets = await listResponse.json();

  const exists = Array.isArray(buckets) && buckets.some((bucket) => bucket?.name === bucketName);
  if (exists) {
    console.log(`[setup:storage] Bucket "${bucketName}" already exists.`);
    return;
  }

  const createResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: true,
      file_size_limit: 5 * 1024 * 1024,
      allowed_mime_types: ["application/pdf", "image/jpeg", "image/png"],
    }),
  });
  if (!createResponse.ok) {
    throw new Error(`Failed to create bucket "${bucketName}" (${createResponse.status}): ${await createResponse.text()}`);
  }

  console.log(`[setup:storage] Bucket "${bucketName}" created successfully.`);
};

run().catch((error) => {
  console.error("[setup:storage] Setup failed.");
  console.error(error?.message || error);
  process.exitCode = 1;
});
