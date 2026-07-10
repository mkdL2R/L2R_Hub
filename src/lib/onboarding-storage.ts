const KEYS = {
  family: "onboarding_family_id",
  parent: "onboarding_parent_id",
  student: "onboarding_student_id",
  parentStatus: "onboarding_parent_status_id",
  studentStatus: "onboarding_student_status_id",
  parentDraft: "onboarding_parent_draft",
  studentDraft: "onboarding_student_draft",
} as const;

function safe(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export const onboardingStore = {
  get(key: keyof typeof KEYS): string | null {
    return safe()?.getItem(KEYS[key]) ?? null;
  },
  set(key: keyof typeof KEYS, value: string) {
    safe()?.setItem(KEYS[key], value);
  },
  clear(key: keyof typeof KEYS) {
    safe()?.removeItem(KEYS[key]);
  },
  reset() {
    const s = safe();
    if (!s) return;
    Object.values(KEYS).forEach((k) => s.removeItem(k));
  },
};

export function saveDraft<T>(key: "parentDraft" | "studentDraft", value: T) {
  safe()?.setItem(KEYS[key], JSON.stringify(value));
}
export function loadDraft<T>(key: "parentDraft" | "studentDraft"): T | null {
  const raw = safe()?.getItem(KEYS[key]);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
export function clearDraft(key: "parentDraft" | "studentDraft") {
  safe()?.removeItem(KEYS[key]);
}