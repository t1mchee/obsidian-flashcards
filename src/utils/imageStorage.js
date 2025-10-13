/**
 * Image Storage Utility
 * Handles storing and retrieving images in localStorage as base64
 */

const IMAGE_STORAGE_KEY = 'obsidian_flashcards_images';

/**
 * Get all stored images
 * @returns {Object} - Object with image names as keys and base64 data URLs as values
 */
export function getStoredImages() {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error retrieving images from storage:', error);
    return {};
  }
}

/**
 * Save an image to storage
 * @param {string} fileName - Name of the image file
 * @param {string} dataUrl - Base64 data URL of the image
 */
export function saveImage(fileName, dataUrl) {
  try {
    const images = getStoredImages();
    images[fileName] = dataUrl;
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    return true;
  } catch (error) {
    console.error('Error saving image:', error);
    // Check if quota exceeded
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded. Consider clearing old images.');
    }
    return false;
  }
}

/**
 * Save multiple images at once
 * @param {Object} images - Object with filenames as keys and data URLs as values
 */
export function saveImages(images) {
  try {
    const existingImages = getStoredImages();
    const updatedImages = { ...existingImages, ...images };
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(updatedImages));
    return true;
  } catch (error) {
    console.error('Error saving images:', error);
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded. Consider clearing old images.');
    }
    return false;
  }
}

/**
 * Get a specific image by filename
 * @param {string} fileName - Name of the image file (with or without path)
 * @returns {string|null} - Base64 data URL or null if not found
 */
export function getImage(fileName) {
  const images = getStoredImages();
  
  // Try exact match first
  if (images[fileName]) {
    return images[fileName];
  }
  
  // Try without path (just filename)
  const baseName = fileName.split('/').pop();
  if (images[baseName]) {
    return images[baseName];
  }
  
  // Try case-insensitive match
  const lowerFileName = fileName.toLowerCase();
  const matchingKey = Object.keys(images).find(key => 
    key.toLowerCase() === lowerFileName || 
    key.toLowerCase().split('/').pop() === baseName.toLowerCase()
  );
  
  return matchingKey ? images[matchingKey] : null;
}

/**
 * Delete an image from storage
 * @param {string} fileName - Name of the image file
 */
export function deleteImage(fileName) {
  try {
    const images = getStoredImages();
    delete images[fileName];
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

/**
 * Clear all images from storage
 */
export function clearAllImages() {
  try {
    localStorage.removeItem(IMAGE_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing images:', error);
    return false;
  }
}

/**
 * Get storage statistics
 * @returns {Object} - { count, estimatedSize }
 */
export function getImageStorageStats() {
  const images = getStoredImages();
  const count = Object.keys(images).length;
  const estimatedSize = new Blob([JSON.stringify(images)]).size;
  
  return {
    count,
    estimatedSizeKB: Math.round(estimatedSize / 1024),
    estimatedSizeMB: (estimatedSize / (1024 * 1024)).toFixed(2)
  };
}

/**
 * Read image files and convert to base64
 * @param {FileList} files - List of image files
 * @returns {Promise<Object>} - Object with filenames as keys and data URLs as values
 */
export async function readImageFiles(files) {
  const imageFiles = Array.from(files).filter(file => 
    file.type.startsWith('image/')
  );

  if (imageFiles.length === 0) {
    throw new Error('No valid image files found');
  }

  const imagePromises = imageFiles.map(file => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          dataUrl: e.target.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })
  );

  const results = await Promise.all(imagePromises);
  
  // Convert array to object
  const imagesObject = {};
  results.forEach(({ name, dataUrl }) => {
    imagesObject[name] = dataUrl;
  });
  
  return imagesObject;
}

