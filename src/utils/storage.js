/**
 * Local storage utilities for progress tracking
 * Handles saving and loading card progress, review history, and settings
 */

const STORAGE_KEYS = {
  CARDS_PROGRESS: 'obsidian_flashcards_progress',
  REVIEW_HISTORY: 'obsidian_flashcards_history',
  SETTINGS: 'obsidian_flashcards_settings',
  NOTES_DATA: 'obsidian_flashcards_notes'
};

/**
 * Default card progress structure
 */
const DEFAULT_CARD_PROGRESS = {
  id: '',
  interval: 0,
  easeFactor: 2.5,
  reviewCount: 0,
  correctCount: 0,
  nextReviewDate: null,
  createdAt: null,
  lastReviewedAt: null
};

/**
 * Save card progress to local storage
 * @param {object} progress - Card progress object
 */
export function saveCardProgress(progress) {
  try {
    const existingProgress = getCardProgress();
    existingProgress[progress.id] = {
      ...DEFAULT_CARD_PROGRESS,
      ...existingProgress[progress.id],
      ...progress,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.CARDS_PROGRESS, JSON.stringify(existingProgress));
  } catch (error) {
    console.error('Error saving card progress:', error);
  }
}

/**
 * Get card progress from local storage
 * @param {string} cardId - Optional card ID to get specific progress
 * @returns {object|object} - Card progress object or all progress
 */
export function getCardProgress(cardId = null) {
  try {
    const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS_PROGRESS) || '{}');
    
    if (cardId) {
      return progress[cardId] || { ...DEFAULT_CARD_PROGRESS, id: cardId };
    }
    
    return progress;
  } catch (error) {
    console.error('Error loading card progress:', error);
    return cardId ? { ...DEFAULT_CARD_PROGRESS, id: cardId } : {};
  }
}

/**
 * Save review history entry
 * @param {object} review - Review entry
 */
export function saveReviewHistory(review) {
  try {
    const history = getReviewHistory();
    const newEntry = {
      ...review,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    history.unshift(newEntry);
    
    // Keep only last 1000 reviews to prevent storage bloat
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    localStorage.setItem(STORAGE_KEYS.REVIEW_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving review history:', error);
  }
}

/**
 * Get review history from local storage
 * @param {number} limit - Optional limit on number of entries
 * @returns {Array} - Array of review entries
 */
export function getReviewHistory(limit = null) {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEW_HISTORY) || '[]');
    return limit ? history.slice(0, limit) : history;
  } catch (error) {
    console.error('Error loading review history:', error);
    return [];
  }
}

/**
 * Save notes data
 * @param {Array} notes - Array of note objects
 */
export function saveNotesData(notes) {
  try {
    const notesData = {
      notes,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem(STORAGE_KEYS.NOTES_DATA, JSON.stringify(notesData));
  } catch (error) {
    console.error('Error saving notes data:', error);
  }
}

/**
 * Get notes data from local storage
 * @returns {Array} - Array of note objects
 */
export function getNotesData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES_DATA) || '{}');
    return data.notes || [];
  } catch (error) {
    console.error('Error loading notes data:', error);
    return [];
  }
}

/**
 * Save app settings
 * @param {object} settings - Settings object
 */
export function saveSettings(settings) {
  try {
    const existingSettings = getSettings();
    const updatedSettings = { ...existingSettings, ...settings };
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Get app settings from local storage
 * @returns {object} - Settings object
 */
export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
}

/**
 * Clear all stored data (for reset functionality)
 */
export function clearAllData() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

/**
 * Export all data for backup
 * @returns {object} - All stored data
 */
export function exportData() {
  try {
    return {
      cardsProgress: getCardProgress(),
      reviewHistory: getReviewHistory(),
      settings: getSettings(),
      notesData: getNotesData(),
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
}

/**
 * Import data from backup
 * @param {object} data - Data to import
 */
export function importData(data) {
  try {
    if (data.cardsProgress) {
      localStorage.setItem(STORAGE_KEYS.CARDS_PROGRESS, JSON.stringify(data.cardsProgress));
    }
    if (data.reviewHistory) {
      localStorage.setItem(STORAGE_KEYS.REVIEW_HISTORY, JSON.stringify(data.reviewHistory));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    if (data.notesData) {
      localStorage.setItem(STORAGE_KEYS.NOTES_DATA, JSON.stringify(data.notesData));
    }
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

/**
 * Get storage usage statistics
 * @returns {object} - Storage statistics
 */
export function getStorageStats() {
  try {
    let totalSize = 0;
    let itemCount = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
        itemCount++;
      }
    });
    
    return {
      totalSize,
      itemCount,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalSize: 0, itemCount: 0, totalSizeKB: 0 };
  }
}
