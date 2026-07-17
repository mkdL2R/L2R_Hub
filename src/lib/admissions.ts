import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StepKey = "parent" | "student" | "compass" | "alignment" | "commitment";

export type StepState = "completed" | "current" | "locked";

export type AdmissionsStep = {
  key: StepKey;
  label: string;
  to: string;
  state: StepState;
  description: string;
};

export type AdmissionsProgress = {
  loading: boolean;
  hasFamily: boolean;
  familyId: string | null;
  completed: Record<StepKey, boolean>;
  enrolled: boolean;
  steps: AdmissionsStep[];
  /** First non-completed step, if any. */
  nextStep: AdmissionsStep | null;
};

const STEP_ORDER: {
  key: StepKey;
  label: string;
  to: string;
  description: string;
}[] = [
  { key: "parent", label: "Parent Journey", to: "/parent", description: "Tell us about your family." },
  { key: "student", label: "Student Journey", to: "/student", description: "Share the learner's profile." },
  { key: "compass", label: "Family Compass", to: "/compass", description: "Review your living family guide." },
  { key: "alignment", label: "Alignment Meeting", to: "/alignment-meeting", description: "Book time with an instructor." },
  { key: "commitment", label: "Family Commitment", to: "/family-commitment", description: "Sign the L2R commitment." },
];

function compassSeenKey(familyId: string) {
  return `l2r:compass_seen:${familyId}`;
}

export function markCompassSeen(familyId: string | null | undefined) {
  if (!familyId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(compassSeenKey(familyId), "1");
  } catch {}
}

function readCompassSeen(familyId: string | null): boolean {
  if (!familyId || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(compassSeenKey(familyId)) === "1";
  } catch {
    return false;
  }
}

export function friendlyAdmissionsError(code: string | undefined | null): string {
  switch (code) {
    case "no_family":
      return "It looks like your admissions journey hasn't started yet. Let's begin with the Parent Journey.";
    case "not_authenticated":
      return "Please sign in to continue your admissions journey.";
    case "already_signed":
      return "Your family has already signed this version of the commitment.";
    case "slot_taken":
      return "That time was just booked. Please pick another slot.";
    case "scheduled_in_past":
      return "Please pick a time in the future.";
    default:
      return code || "Something went wrong. Please try again.";
  }
}

export function useAdmissionsProgress(): AdmissionsProgress {
  const [state, setState] = useState<AdmissionsProgress>({
    loading: true,
    hasFamily: false,
    familyId: null,
    completed: { parent: false, student: false, compass: false, alignment: false, commitment: false },
    enrolled: false,
    steps: buildSteps({ parent: false, student: false, compass: false, alignment: false, commitment: false }),
    nextStep: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (mounted) setState((s) => ({ ...s, loading: false }));
        return;
      }
      const { data: fm } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", u.user.id)
        .maybeSingle();
      const familyId = fm?.family_id ?? null;
      if (!familyId) {
        if (mounted) setState((s) => ({ ...s, loading: false, hasFamily: false }));
        return;
      }
      const { data: rows } = await supabase
        .from("onboarding_status")
        .select("journey, status, final_enrolled")
        .eq("family_id", familyId);
      const done = (j: string) =>
        !!rows?.some((r) => r.journey === j && r.status === "completed");
      const enrolled = !!rows?.some((r) => r.final_enrolled === true);
      const completed: Record<StepKey, boolean> = {
        parent: done("parent"),
        student: done("student"),
        compass: false,
        alignment: done("alignment_meeting"),
        commitment: done("family_commitment") || enrolled,
      };
      // Compass is "complete" once parent + student are done AND the user has
      // acknowledged the Compass (clicked continue), or a later step is done.
      completed.compass =
        (completed.parent && completed.student && readCompassSeen(familyId)) ||
        completed.alignment ||
        completed.commitment;

      const steps = buildSteps(completed);
      const nextStep = steps.find((s) => s.state !== "completed") ?? null;

      if (mounted)
        setState({
          loading: false,
          hasFamily: true,
          familyId,
          completed,
          enrolled,
          steps,
          nextStep,
        });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

function buildSteps(completed: Record<StepKey, boolean>): AdmissionsStep[] {
  let currentAssigned = false;
  return STEP_ORDER.map((s) => {
    let state: StepState;
    if (completed[s.key]) state = "completed";
    else if (!currentAssigned && requirementsMet(s.key, completed)) {
      state = "current";
      currentAssigned = true;
    } else state = "locked";
    return { ...s, state };
  });
}

function requirementsMet(step: StepKey, c: Record<StepKey, boolean>): boolean {
  switch (step) {
    case "parent":
      return true;
    case "student":
      return c.parent;
    case "compass":
      return c.parent && c.student;
    case "alignment":
      return c.parent && c.student && c.compass;
    case "commitment":
      return c.alignment;
  }
}