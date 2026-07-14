export function SketchDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 12"
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M2 6 Q 20 1, 40 6 T 80 6 T 120 6 T 160 6 T 200 6 T 240 6 T 280 6 T 320 6 T 360 6 T 398 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}