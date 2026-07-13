/**
 * Calculates user level and progression metrics based on total XP.
 * Formula: Level N requires N * 100 XP to complete.
 * 
 * - Level 1: 0 - 100 XP (100 XP range)
 * - Level 2: 100 - 300 XP (200 XP range)
 * - Level 3: 300 - 600 XP (300 XP range)
 * - Level 4: 600 - 1000 XP (400 XP range)
 * - Level 5: 1000 - 1500 XP (500 XP range)
 */
export function calculateLevel(xpTotal = 0) {
  let level = 1;
  let xpNeeded = 100;
  let remainingXp = xpTotal;

  while (remainingXp >= xpNeeded) {
    remainingXp -= xpNeeded;
    level += 1;
    xpNeeded += 100;
  }

  const percentage = Math.min(100, Math.max(0, Math.floor((remainingXp / xpNeeded) * 100)));

  return {
    level,
    xpInLevel: remainingXp,
    xpNeededForNext: xpNeeded,
    percentage
  };
}
