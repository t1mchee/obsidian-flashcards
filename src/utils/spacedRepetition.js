/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on the SuperMemo 2 algorithm used by Anki
 */

/**
 * Calculate the next review interval and ease factor based on user performance
 * @param {number} previousInterval - Previous interval in days
 * @param {number} easeFactor - Current ease factor (default: 2.5)
 * @param {number} quality - User's rating of recall (0-5, where 3+ is correct)
 * @returns {object} - { newInterval, easeFactor }
 */
export function calculateNextInterval(previousInterval = 0, easeFactor = 2.5, quality) {
  let newInterval;
  let newEaseFactor = easeFactor;

  if (quality >= 3) {
    // Correct response
    if (previousInterval === 0) {
      newInterval = 1;
    } else if (previousInterval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(previousInterval * newEaseFactor);
    }

    // Update ease factor based on quality
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Minimum ease factor is 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }
  } else {
    // Incorrect response - reset to beginning
    newInterval = 1;
    newEaseFactor = 2.5;
  }

  return {
    newInterval: Math.max(1, newInterval),
    easeFactor: newEaseFactor
  };
}

/**
 * Get the next review date based on interval
 * @param {number} interval - Interval in days
 * @returns {Date} - Next review date
 */
export function getNextReviewDate(interval) {
  const now = new Date();
  return new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
}

/**
 * Check if a card is due for review
 * @param {Date} nextReviewDate - Next review date
 * @returns {boolean} - True if card is due
 */
export function isCardDue(nextReviewDate) {
  const now = new Date();
  return now >= nextReviewDate;
}

/**
 * Get the number of days until next review
 * @param {Date} nextReviewDate - Next review date
 * @returns {number} - Days until next review
 */
export function getDaysUntilReview(nextReviewDate) {
  const now = new Date();
  const diffTime = nextReviewDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Quality ratings for user feedback
 */
export const QUALITY_RATINGS = {
  AGAIN: 0,    // Complete blackout
  HARD: 1,     // Incorrect response; correct one remembered
  GOOD: 3,     // Correct response after a hesitation
  EASY: 4      // Perfect response
};

/**
 * Get quality rating description
 * @param {number} quality - Quality rating
 * @returns {string} - Description of the rating
 */
export function getQualityDescription(quality) {
  switch (quality) {
    case QUALITY_RATINGS.AGAIN:
      return "Again - Complete blackout";
    case QUALITY_RATINGS.HARD:
      return "Hard - Incorrect response";
    case QUALITY_RATINGS.GOOD:
      return "Good - Correct response";
    case QUALITY_RATINGS.EASY:
      return "Easy - Perfect response";
    default:
      return "Unknown rating";
  }
}
