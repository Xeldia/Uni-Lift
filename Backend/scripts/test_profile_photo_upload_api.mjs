import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
dotenv.config({ path: path.join(root, "Frontend", ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const stamp = Date.now();
const email = `photo.api.test.${stamp}@cit.edu`;
const password = "PhotoTest123!";

const signup = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: "Photo API Tester",
      student_id: `PHOTO-${stamp}`,
      university: "CIT-U",
    },
  },
});

if (signup.error || !signup.data.user) {
  console.error(JSON.stringify({ signupError: signup.error?.message ?? "Unknown signup error" }, null, 2));
  process.exit(1);
}

const session = signup.data.session ?? (await supabase.auth.signInWithPassword({ email, password })).data.session;

if (!session?.access_token) {
  console.error(JSON.stringify({ error: "No access token available for test user" }, null, 2));
  process.exit(1);
}

const tinyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2Z8sQAAAAASUVORK5CYII=";

const uploadResponse = await fetch(`http://localhost:3001/api/users/${signup.data.user.id}/photo`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    fileName: "avatar.png",
    mimeType: "image/png",
    fileDataBase64: tinyPngBase64,
  }),
});

const uploadPayload = await uploadResponse.json();

const getResponse = await fetch(`http://localhost:3001/api/users/${signup.data.user.id}/photo`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});

const getPayload = await getResponse.json();

const deleteResponse = await fetch(`http://localhost:3001/api/users/${signup.data.user.id}/photo`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});

const deletePayload = await deleteResponse.json();

const getAfterDeleteResponse = await fetch(`http://localhost:3001/api/users/${signup.data.user.id}/photo`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});

const getAfterDeletePayload = await getAfterDeleteResponse.json();

console.log(JSON.stringify({
  email,
  uploadStatus: uploadResponse.status,
  uploadPayload,
  getStatus: getResponse.status,
  getPayload,
  deleteStatus: deleteResponse.status,
  deletePayload,
  getAfterDeleteStatus: getAfterDeleteResponse.status,
  getAfterDeletePayload,
  getPayloadSummary: {
    success: getPayload.success ?? null,
    fileReference: getPayload.fileReference ?? null,
    mimeType: getPayload.mimeType ?? null,
    hasFileDataBase64: Boolean(getPayload.fileDataBase64),
  },
}, null, 2));
