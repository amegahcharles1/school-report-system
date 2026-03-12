// Calculation utilities for the school report card system

/**
 * Calculate the subtotal from continuous assessment components
 * Test 1 + Assignment 1 + Test 2 + Assignment 2 (each out of 25, total out of 100)
 */
export function calculateCASubtotal(
  test1: number,
  assignment1: number,
  test2: number,
  assignment2: number
): number {
  return test1 + assignment1 + test2 + assignment2;
}

/**
 * Calculate CA contribution (40% of subtotal)
 */
export function calculateCAContribution(subtotal: number): number {
  return Math.round((subtotal * 0.4) * 100) / 100;
}

/**
 * Calculate exam contribution (60% of exam score)
 */
export function calculateExamContribution(examScore: number): number {
  return Math.round((examScore * 0.6) * 100) / 100;
}

/**
 * Calculate final total (CA 40% + Exam 60%)
 */
export function calculateFinalTotal(
  test1: number,
  assignment1: number,
  test2: number,
  assignment2: number,
  examScore: number
): number {
  const subtotal = calculateCASubtotal(test1, assignment1, test2, assignment2);
  const caContribution = calculateCAContribution(subtotal);
  const examContribution = calculateExamContribution(examScore);
  return Math.round((caContribution + examContribution) * 100) / 100;
}

/**
 * Get grade and remark from a final total using grade configuration
 */
export function getGradeAndRemark(
  total: number,
  gradeConfigs: { minScore: number; maxScore: number; grade: string; remark: string }[]
): { grade: string; remark: string } {
  const sorted = [...gradeConfigs].sort((a, b) => b.minScore - a.minScore);
  for (const config of sorted) {
    if (total >= config.minScore && total <= config.maxScore) {
      return { grade: config.grade, remark: config.remark };
    }
  }
  return { grade: 'N/A', remark: 'N/A' };
}

/**
 * Calculate class positions with proper tied-rank handling (dense ranking)
 * Students with the same total get the same rank
 */
export function calculatePositions(
  students: { id: string; total: number }[]
): Map<string, number> {
  const sorted = [...students].sort((a, b) => b.total - a.total);
  const positions = new Map<string, number>();
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].total < sorted[i - 1].total) {
      currentRank = i + 1;
    }
    positions.set(sorted[i].id, currentRank);
  }

  return positions;
}

/**
 * Get position suffix (1st, 2nd, 3rd, 4th, etc.)
 */
export function getPositionSuffix(position: number): string {
  const j = position % 10;
  const k = position % 100;
  if (j === 1 && k !== 11) return `${position}st`;
  if (j === 2 && k !== 12) return `${position}nd`;
  if (j === 3 && k !== 13) return `${position}rd`;
  return `${position}th`;
}

/**
 * Generate automatic remark based on average score
 */
export function generateAutoRemark(average: number): string {
  if (average >= 90) return "An outstanding performance. Keep up the excellent work!";
  if (average >= 80) return "A very good performance. Continue to strive for excellence!";
  if (average >= 70) return "A good performance. There is room for improvement.";
  if (average >= 60) return "A fair performance. More effort is needed.";
  if (average >= 50) return "A below average performance. Significant improvement is required.";
  return "A poor performance. Urgent attention and extra support is needed.";
}
