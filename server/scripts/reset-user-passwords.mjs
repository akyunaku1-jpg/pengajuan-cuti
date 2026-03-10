import { readFile } from "node:fs/promises";
import bcrypt from "bcrypt";

const TARGET_EMAILS = ["admin@company.com", "john@company.com", "jane@company.com"];
const NEW_PASSWORD = "admin12345";
const BCRYPT_ROUNDS = 10;

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

const getHeaders = (serviceRoleKey) => ({
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
});

const run = async () => {
  const envFilePath = getArgValue("--env-file") || ".env.local";
  const envFromFile = await readEnvFile(envFilePath);

  const supabaseUrl = process.env.SUPABASE_URL || envFromFile.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || envFromFile.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const passwordHash = await bcrypt.hash(NEW_PASSWORD, BCRYPT_ROUNDS);
  const params = new URLSearchParams();
  params.set("email", `in.(${TARGET_EMAILS.map((email) => `"${email}"`).join(",")})`);
  const usersUrl = `${supabaseUrl}/rest/v1/users?${params.toString()}`;

  const updateResponse = await fetch(usersUrl, {
    method: "PATCH",
    headers: {
      ...getHeaders(serviceRoleKey),
      Prefer: "return=representation",
    },
    body: JSON.stringify({ password: passwordHash }),
  });

  if (!updateResponse.ok) {
    throw new Error(`Supabase update failed (${updateResponse.status}): ${await updateResponse.text()}`);
  }

  const verifyResponse = await fetch(`${usersUrl}&select=email,password`, {
    method: "GET",
    headers: getHeaders(serviceRoleKey),
  });
  if (!verifyResponse.ok) {
    throw new Error(`Supabase verification failed (${verifyResponse.status}): ${await verifyResponse.text()}`);
  }
  const users = await verifyResponse.json();

  if (!users || users.length !== TARGET_EMAILS.length) {
    throw new Error(
      `Expected ${TARGET_EMAILS.length} users, found ${users?.length ?? 0}. Check email values in users table.`,
    );
  }

  const byEmail = new Map(users.map((user) => [String(user.email).toLowerCase(), user.password]));
  for (const email of TARGET_EMAILS) {
    const hash = byEmail.get(email);
    if (!hash) throw new Error(`User not found after update: ${email}`);
    const isValid = await bcrypt.compare(NEW_PASSWORD, hash);
    if (!isValid) throw new Error(`Hash verification failed for: ${email}`);
  }

  console.log(`Password reset successful for ${TARGET_EMAILS.length} users.`);
  for (const email of TARGET_EMAILS) console.log(`- ${email}: updated and verified`);
};

run().catch((error) => {
  console.error("Password reset failed.");
  console.error(error?.message || error);
  process.exitCode = 1;
});
