import * as React from "react";
import { cn } from "@/lib/utils";

export type MascotShape = "circle" | "triangle" | "star" | "drop";
export type MascotColor = "yellow" | "blue" | "red" | "green";

const FILL: Record<MascotColor, string> = {
  yellow: "var(--sun)",
  blue: "var(--cobalt)",
  red: "var(--stamp)",
  green: "var(--leaf)",
};

function Face({ mood = "smile" }: { mood?: "smile" | "wow" | "wink" }) {
  return (
    <g stroke="#1B1B1B" strokeWidth={2.2} strokeLinecap="round" fill="#1B1B1B">
      <circle cx={36} cy={44} r={2.4} />
      {mood === "wink" ? (
        <path d="M56 44 h6" fill="none" />
      ) : (
        <circle cx={60} cy={44} r={2.4} />
      )}
      {mood === "wow" ? (
        <ellipse cx={48} cy={58} rx={4} ry={5} fill="none" />
      ) : (
        <path d="M38 56 q10 10 20 0" fill="none" />
      )}
    </g>
  );
}

function Body({ shape, color }: { shape: MascotShape; color: MascotColor }) {
  const fill = FILL[color];
  const stroke = "#1B1B1B";
  const sw = 2.4;
  switch (shape) {
    case "circle":
      return <circle cx={48} cy={48} r={34} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "triangle":
      return (
        <path
          d="M48 10 Q54 10 58 18 L82 68 Q86 82 72 84 L24 84 Q10 82 14 68 L38 18 Q42 10 48 10 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case "star":
      return (
        <path
          d="M48 8 L58 34 L86 36 L64 54 L72 82 L48 66 L24 82 L32 54 L10 36 L38 34 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case "drop":
      return (
        <path
          d="M48 8 C64 30 82 46 80 62 C78 78 62 88 48 88 C34 88 18 78 16 62 C14 46 32 30 48 8 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
  }
}

export function Mascot({
  shape = "circle",
  color = "yellow",
  size = 56,
  mood = "smile",
  float = false,
  className,
  title,
}: {
  shape?: MascotShape;
  color?: MascotColor;
  size?: number;
  mood?: "smile" | "wow" | "wink";
  float?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
      className={cn(float && "mascot-float", "select-none", className)}
    >
      <Body shape={shape} color={color} />
      <Face mood={mood} />
    </svg>
  );
}

export function MascotCluster({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Mascot shape="circle" color="yellow" size={72} float className="absolute -left-2 top-6" />
      <Mascot shape="triangle" color="red" size={64} float mood="wow" className="absolute left-16 -top-2" />
      <Mascot shape="star" color="blue" size={68} float mood="wink" className="absolute left-28 top-10" />
      <Mascot shape="drop" color="green" size={60} float className="absolute left-44 -top-1" />
    </div>
  );
}