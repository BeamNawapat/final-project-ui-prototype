// Generate outcome labels based on market type
export function getOutcomeLabels(market: { marketType: string; brackets: number[] }): string[] {
  if (market.marketType === "BINARY") {
    return ["YES", "NO"];
  }

  const brackets = market.brackets;
  if (!brackets || brackets.length === 0) return ["Outcome 1"];

  const labels: string[] = [];
  labels.push(`< ${brackets[0].toLocaleString()} THB`);
  for (let i = 0; i < brackets.length - 1; i++) {
    labels.push(`${brackets[i].toLocaleString()}-${brackets[i + 1].toLocaleString()} THB`);
  }
  labels.push(`≥ ${brackets[brackets.length - 1].toLocaleString()} THB`);
  return labels;
}

// CSS class names for outcome colors
export const OUTCOME_COLORS = [
  "bg-green-600 hover:bg-green-700 text-white",
  "bg-red-600 hover:bg-red-700 text-white",
  "bg-blue-600 hover:bg-blue-700 text-white",
  "bg-orange-600 hover:bg-orange-700 text-white",
  "bg-purple-600 hover:bg-purple-700 text-white",
  "bg-teal-600 hover:bg-teal-700 text-white",
];

// Hex colors for charts
export const OUTCOME_COLORS_HEX = [
  "#22c55e", // green
  "#ef4444", // red
  "#3b82f6", // blue
  "#f97316", // orange
  "#a855f7", // purple
  "#14b8a6", // teal
];

// Badge-style colors (lighter)
export const OUTCOME_BADGE_COLORS = [
  "bg-green-100 text-green-800",
  "bg-red-100 text-red-800",
  "bg-blue-100 text-blue-800",
  "bg-orange-100 text-orange-800",
  "bg-purple-100 text-purple-800",
  "bg-teal-100 text-teal-800",
];

// Get color for an outcome by index
export function getOutcomeColor(index: number): string {
  return OUTCOME_COLORS[index % OUTCOME_COLORS.length];
}

export function getOutcomeColorHex(index: number): string {
  return OUTCOME_COLORS_HEX[index % OUTCOME_COLORS_HEX.length];
}

export function getOutcomeBadgeColor(index: number): string {
  return OUTCOME_BADGE_COLORS[index % OUTCOME_BADGE_COLORS.length];
}
