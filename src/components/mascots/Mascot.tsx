import { type CSSProperties } from "react";

/**
 * Playful L2R mascots — cute abstract shapes with tiny faces.
 * All shapes use the four L2R marker tokens (sketch/forest/crayon/mustard)
 * so they never clash with the ivory paper palette.
 */

export type MascotShape = "blob" | "circle" | "triangle" | "star" | "drop" | "squircle" | "cloud";
export type MascotTone = "blue" | "green" | "red" | "yellow";
export type MascotMood = "happy" | "smile" | "peek" | "wink" | "sleepy";

const TONE_VAR: Record<MascotTone, string> = {
  blue: "var(--sketch)",
  green: "var(--forest)",
  red: "var(--crayon)",
  yellow: "var(--mustard)",
};

export function Mascot({
  shape = "blob",
  tone = "blue",
  mood = "happy",
  size = 56,
  animate,
  delay = 0,
  rotate = 0,
  className,
  style,
  title,
}: {
  shape?: MascotShape;
  tone?: MascotTone;
  mood?: MascotMood;
  size?: number;
  animate?: "float" | "wave" | "bounce" | "sway" | null;
  delay?: number;
  rotate?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const fill = TONE_VAR[tone];
  const face = <Face mood={mood} />;
  const anim =
    animate === "float"
      ? "animate-[mascot-float_5.5s_ease-in-out_infinite]"
      : animate === "wave"
        ? "animate-[mascot-wave_3.2s_ease-in-out_infinite]"
        : animate === "bounce"
          ? "animate-[mascot-bounce_2.4s_ease-in-out_infinite]"
          : animate === "sway"
            ? "animate-[mascot-sway_6s_ease-in-out_infinite]"
            : "";

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`${anim} ${className ?? ""}`}
      style={{
        transformOrigin: "50% 60%",
        transform: `rotate(${rotate}deg)`,
        animationDelay: `${delay}ms`,
        filter: "drop-shadow(0 6px 10px color-mix(in oklab, currentColor 18%, transparent))",
        color: fill,
        ...style,
      }}
    >
      <Shape shape={shape} fill={fill} />
      <g transform="translate(0, 4)">{face}</g>
    </svg>
  );
}

function Shape({ shape, fill }: { shape: MascotShape; fill: string }) {
  switch (shape) {
    case "circle":
      return <circle cx="50" cy="52" r="38" fill={fill} />;
    case "squircle":
      return <rect x="12" y="14" width="76" height="76" rx="26" ry="26" fill={fill} />;
    case "triangle":
      return <path d="M50 10 L92 84 Q90 90 84 90 L16 90 Q10 90 8 84 Z" fill={fill} />;
    case "star":
      return (
        <path
          d="M50 8 L60 38 L92 40 L66 60 L76 92 L50 74 L24 92 L34 60 L8 40 L40 38 Z"
          fill={fill}
        />
      );
    case "drop":
      return <path d="M50 8 C72 36 84 54 84 66 A34 34 0 1 1 16 66 C16 54 28 36 50 8 Z" fill={fill} />;
    case "cloud":
      return (
        <path
          d="M28 68 A20 20 0 0 1 34 30 A22 22 0 0 1 76 34 A18 18 0 0 1 78 70 Z"
          fill={fill}
        />
      );
    case "blob":
    default:
      return (
        <path
          d="M52 8 C74 8 92 24 90 48 C88 70 74 90 50 90 C26 90 8 74 10 50 C12 26 30 8 52 8 Z"
          fill={fill}
        />
      );
  }
}

function Face({ mood }: { mood: MascotMood }) {
  // Eyes
  const eyeY = 50;
  const eyeR = 3.2;
  const leftX = 38;
  const rightX = 62;

  const eyes =
    mood === "sleepy" || mood === "wink" ? (
      <>
        <path
          d={`M${leftX - 5} ${eyeY} q5 -4 10 0`}
          stroke="#1e1e1e"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        {mood === "wink" ? (
          <circle cx={rightX} cy={eyeY} r={eyeR} fill="#1e1e1e" />
        ) : (
          <path
            d={`M${rightX - 5} ${eyeY} q5 -4 10 0`}
            stroke="#1e1e1e"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </>
    ) : (
      <>
        <circle cx={leftX} cy={eyeY} r={eyeR} fill="#1e1e1e" />
        <circle cx={rightX} cy={eyeY} r={eyeR} fill="#1e1e1e" />
      </>
    );

  const mouth =
    mood === "peek" ? (
      <circle cx="50" cy="62" r="3" fill="#1e1e1e" />
    ) : mood === "smile" ? (
      <path
        d="M42 60 q8 6 16 0"
        stroke="#1e1e1e"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    ) : (
      // happy / wink / sleepy — open U smile
      <path
        d="M40 58 q10 12 20 0"
        stroke="#1e1e1e"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    );

  // Rosy cheeks
  const cheeks = (
    <>
      <ellipse cx="30" cy="62" rx="4" ry="2.4" fill="#ffffff" opacity="0.35" />
      <ellipse cx="70" cy="62" rx="4" ry="2.4" fill="#ffffff" opacity="0.35" />
    </>
  );

  return (
    <>
      {cheeks}
      {eyes}
      {mouth}
    </>
  );
}