import { supabase } from "./supabaseClient";

const PENDING_KEY = "vango_pending_driver_application";

/**
 * Submit a driver application for an already-authenticated user.
 * `file` is optional (license photo/pdf). Returns { error }.
 */
export async function submitApplication(userId, { licenseNumber, licenseExpiry, yearsExperience }, file) {
  let docPath = null;

  if (file) {
    if (file.size > 5 * 1024 * 1024) return { error: new Error("License file must be under 5 MB.") };
    const okType = ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type);
    if (!okType) return { error: new Error("License file must be a JPG, PNG, WEBP or PDF.") };

    const ext = file.name.split(".").pop().replace(/[^a-z0-9]/gi, "") || "jpg";
    docPath = `${userId}/license-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("driver-docs").upload(docPath, file);
    if (up.error) return { error: up.error };
  }

  const ins = await supabase.from("driver_applications").insert({
    applicant: userId,
    license_number: licenseNumber,
    license_expiry: licenseExpiry,
    years_experience: Number(yearsExperience) || 0,
    license_doc_path: docPath,
    status: "pending",
  });

  // Orphan cleanup — don't leave the uploaded doc behind if insert fails
  if (ins.error && docPath) {
    supabase.storage.from("driver-docs").remove([docPath]);
  }

  return ins;
}

/** Signed URL so admins can view a submitted document for 10 minutes. */
export async function licenseDocUrl(path) {
  if (!path) return null;
  const { data } = await supabase.storage.from("driver-docs").createSignedUrl(path, 600);
  return data?.signedUrl || null;
}

/**
 * If a driver applied while their email was still unconfirmed (no session,
 * so the row couldn't be inserted), the details were stashed in
 * localStorage. Call this right after any successful login; it finishes
 * the submission silently. Returns true if a pending application was completed.
 */
export async function completePendingApplication(session) {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw || !session?.user?.id) return false;

    const payload = JSON.parse(raw);
    localStorage.removeItem(PENDING_KEY);

    const { error } = await submitApplication(
      session.user.id,
      {
        licenseNumber: payload.licenseNumber,
        licenseExpiry: payload.licenseExpiry,
        yearsExperience: payload.yearsExperience,
      },
      null
    );
    return !error;
  } catch {
    return false;
  }
}

export function stashPendingApplication(payload) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
}
