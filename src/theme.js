// Ferrari-inspired: near-black background, a single sharp rosso corsa accent,
// condensed italic display type, angled card corners borrowed from racing
// livery panels, and deliberate motion — entrance choreography, hover
// response, a "lights out" pulse on log. Plate-color dots stay as a
// functional signature that encodes real load intensity, not decoration.
export const T = {
  bg: "#0E0F10",
  surface: "#17181A",
  surfaceRaised: "#1E2022",
  line: "#2A2C2F",
  lineBright: "#3A3D40",
  text: "#F5F5F0",
  textMuted: "#85888C",
  textFaint: "#4C4F52",
  accent: "#FF2800",
  accentDim: "#8C0000",
  radius: 14,
  radiusSm: 10,
};

export const PLATES = [
  { max: 9, color: "#F5F5F0", label: "5" },
  { max: 14, color: "#4FAE63", label: "10" },
  { max: 19, color: "#E8C547", label: "15" },
  { max: 24, color: "#3E7BE0", label: "20" },
  { max: Infinity, color: "#D9463A", label: "25+" },
];

export function plateColor(weight) {
  const w = Number(weight) || 0;
  return (PLATES.find((p) => w <= p.max) || PLATES[PLATES.length - 1]).color;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
