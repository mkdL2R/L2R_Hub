import { supabase } from "@/integrations/supabase/client";

/**
 * Invitation service layer.
 *
 * Centralizes the creation of secure invitation links for both family
 * (parent/student) and instructor invitations. Email delivery is intentionally
 * NOT implemented here — this module returns the shareable URL and status so
 * the caller can render "copy link" UI today, and swap in an email dispatcher
 * later once a verified sender domain is available.
 *
 * Later, wire an `send*Email(...)` function that consumes the same
 * result shape and posts to a server function / email queue.
 */

function origin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export type FamilyInvite = {
  kind: "student" | "parent";
  token: string;
  email: string;
  url: string;
};

export async function createFamilyInvite(
  kind: "student" | "parent",
  email: string,
  studentId?: string,
): Promise<FamilyInvite> {
  const clean = email.trim().toLowerCase();
  const { data, error } = await supabase.rpc(
    "create_family_invitation" as never,
    { _kind: kind, _email: clean, _student_id: studentId ?? null } as never,
  );
  if (error) throw error;
  const token = data as unknown as string;
  return {
    kind,
    token,
    email: clean,
    url: `${origin()}/invite-family?token=${token}`,
  };
}

export type InstructorInvite = {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  token: string;
  /** Tokenized invitation URL. Opening it (signed-in or not) claims the
   *  invitation and promotes the account to instructor. */
  url: string;
};

export async function createInstructorInvite(
  invitedBy: string,
  email: string,
  fullName?: string,
): Promise<InstructorInvite> {
  const clean = email.trim().toLowerCase();
  // Revoke any previous pending invite for the same email to keep a single
  // active invitation and avoid unique-constraint collisions on resend.
  await supabase
    .from("instructor_invitations")
    .update({ status: "revoked" })
    .eq("email", clean)
    .eq("status", "pending");

  const { data, error } = await supabase
    .from("instructor_invitations")
    .insert({ email: clean, full_name: fullName?.trim() || null, invited_by: invitedBy })
    .select("id,email,full_name,status,token")
    .single();
  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    status: data.status,
    token: (data as { token: string }).token,
    url: `${origin()}/invite?token=${(data as { token: string }).token}`,
  };
}

export async function revokeInstructorInvite(id: string): Promise<void> {
  const { error } = await supabase
    .from("instructor_invitations")
    .update({ status: "revoked" })
    .eq("id", id);
  if (error) throw error;
}