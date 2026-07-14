import { Mascot, type MascotShape, type MascotTone, type MascotMood } from "./Mascot";

type Spot = {
  shape: MascotShape;
  tone: MascotTone;
  mood?: MascotMood;
  size?: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate?: number;
  delay?: number;
  animate?: "float" | "wave" | "bounce" | "sway";
};

const SCENES: Record<string, Spot[]> = {
  dashboard: [
    { shape: "blob",     tone: "yellow", mood: "happy", size: 72,  top: "6%",  left: "-2%",  rotate: -8,  animate: "float" },
    { shape: "star",     tone: "red",    mood: "smile", size: 56,  top: "12%", right: "4%",  rotate: 12,  animate: "sway",  delay: 400 },
    { shape: "triangle", tone: "green",  mood: "peek",  size: 48,  bottom: "18%", left: "3%", rotate: -6, animate: "bounce", delay: 700 },
    { shape: "drop",     tone: "blue",   mood: "wink",  size: 60,  bottom: "6%",  right: "6%", rotate: 8, animate: "float", delay: 200 },
    { shape: "circle",   tone: "yellow", mood: "smile", size: 36,  top: "44%", right: "-1%", rotate: 0,   animate: "wave",  delay: 900 },
  ],
  hub: [
    { shape: "cloud",    tone: "blue",   mood: "sleepy", size: 68, top: "8%", right: "4%", animate: "float" },
    { shape: "blob",     tone: "green",  mood: "happy",  size: 52, bottom: "10%", left: "2%", rotate: -6, animate: "sway", delay: 500 },
    { shape: "star",     tone: "yellow", mood: "smile",  size: 40, top: "38%", left: "-1%",  rotate: -10, animate: "bounce", delay: 800 },
    { shape: "drop",     tone: "red",    mood: "peek",   size: 44, bottom: "24%", right: "2%", rotate: 10, animate: "wave", delay: 300 },
  ],
  hero: [
    { shape: "blob",     tone: "yellow", mood: "happy",  size: 84, top: "8%",  left: "4%",  rotate: -10, animate: "float" },
    { shape: "triangle", tone: "red",    mood: "smile",  size: 60, top: "18%", right: "6%", rotate: 12,  animate: "sway",  delay: 300 },
    { shape: "squircle", tone: "green",  mood: "wink",   size: 52, bottom: "12%", left: "8%", rotate: -4, animate: "bounce", delay: 600 },
    { shape: "star",     tone: "blue",   mood: "smile",  size: 48, bottom: "20%", right: "10%", rotate: 8, animate: "float", delay: 900 },
  ],
  empty: [
    { shape: "cloud",    tone: "blue",   mood: "sleepy", size: 96, top: "10%", left: "50%", rotate: -4, animate: "float" },
    { shape: "blob",     tone: "yellow", mood: "peek",   size: 72, top: "38%", left: "50%", rotate: 6,  animate: "sway", delay: 400 },
  ],
};

/**
 * Absolutely-positioned playful mascots scattered around a container.
 * Parent should be `relative overflow-hidden`. Non-interactive.
 */
export function MascotScene({
  variant = "dashboard",
  className,
}: {
  variant?: keyof typeof SCENES;
  className?: string;
}) {
  const spots = SCENES[variant] ?? SCENES.dashboard;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {spots.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: s.top, bottom: s.bottom, left: s.left, right: s.right }}
        >
          <Mascot
            shape={s.shape}
            tone={s.tone}
            mood={s.mood}
            size={s.size}
            rotate={s.rotate}
            delay={s.delay}
            animate={s.animate ?? "float"}
          />
        </div>
      ))}
    </div>
  );
}

export { Mascot };