import { T } from "../theme";

// Original shield mark — same visual language as the PWA icon (dark
// ground, red accent, angled notch). Used in place of a car-brand logo.
export default function Badge({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 2 L36 8 V20 C36 30 29 36 20 38 C11 36 4 30 4 20 V8 Z"
        fill={T.bg}
        stroke={T.accent}
        strokeWidth="2"
      />
      <path d="M20 2 L36 8 V16 L20 20 Z" fill={T.accent} />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="13"
        fill={T.text}
      >
        FC
      </text>
    </svg>
  );
}
