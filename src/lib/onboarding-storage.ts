const KEYS = {
  family: "onboarding_family_id",
  parent: "onboarding_parent_id",
  student: "onboarding_student_id",
  parentStatus: "onboarding_parent_status_id",
  studentStatus: "onboarding_student_status_id",
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