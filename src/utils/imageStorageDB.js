/**
 * Image Storage using IndexedDB (for larger storage capacity)
 * IndexedDB has much higher quota than localStorage (~50MB+ vs ~5-10MB)
 */

const DB_NAME = 'obsidian_flashcards_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let dbInstance = null;

/**
 * Initialize IndexedDB
 */
async function initDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save an image to IndexedDB
 */
export async function saveImage(fileName, dataUrl) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(dataUrl, fileName);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error saving image to IndexedDB:', error);
    return false;
  }
}

/**
 * Save multiple images at once
 */
export async function saveImages(images) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    Object.entries(images).forEach(([fileName, dataUrl]) => {
      store.put(dataUrl, fileName);
    });
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error saving images to IndexedDB:', error);
    return false;
  }
}

/**
 * Get a specific image by filename
 */
export async function getImage(fileName) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      // Try exact match first
      const request = store.get(fileName);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
          return;
        }
        
        // Try without path (just filename)
        const baseName = fileName.split('/').pop();
        const baseRequest = store.get(baseName);
        
        baseRequest.onsuccess = () => {
          if (baseRequest.result) {
            resolve(baseRequest.result);
            return;
          }
          
          // Try to find case-insensitive match
          const getAllRequest = store.getAllKeys();
          getAllRequest.onsuccess = () => {
            const keys = getAllRequest.result;
            const lowerFileName = fileName.toLowerCase();
            const matchingKey = keys.find(key => 
              key.toLowerCase() === lowerFileName || 
              key.toLowerCase().split('/').pop() === baseName.toLowerCase()
            );
            
            if (matchingKey) {
              const matchRequest = store.get(matchingKey);
              matchRequest.onsuccess = () => resolve(matchRequest.result);
              matchRequest.onerror = () => resolve(null);
            } else {
              resolve(null);
            }
          };
          getAllRequest.onerror = () => resolve(null);
        };
        baseRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Error getting image from IndexedDB:', error);
    return null;
  }
}

/**
 * Get all stored images
 */
export async function getStoredImages() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      const keysRequest = store.getAllKeys();
      
      Promise.all([
        new Promise((res) => { request.onsuccess = () => res(request.result); }),
        new Promise((res) => { keysRequest.onsuccess = () => res(keysRequest.result); })
      ]).then(([values, keys]) => {
        const images = {};
        keys.forEach((key, index) => {
          images[key] = values[index];
        });
        resolve(images);
      });
    });
  } catch (error) {
    console.error('Error getting all images from IndexedDB:', error);
    return {};
  }
}

/**
 * Delete an image from storage
 */
export async function deleteImage(fileName) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(fileName);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error deleting image from IndexedDB:', error);
    return false;
  }
}

/**
 * Clear all images from storage
 */
export async function clearAllImages() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error clearing images from IndexedDB:', error);
    return false;
  }
}

/**
 * Get storage statistics
 */
export async function getImageStorageStats() {
  try {
    const images = await getStoredImages();
    const count = Object.keys(images).length;
    const estimatedSize = new Blob([JSON.stringify(images)]).size;
    
    return {
      count,
      estimatedSizeKB: Math.round(estimatedSize / 1024),
      estimatedSizeMB: (estimatedSize / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { count: 0, estimatedSizeKB: 0, estimatedSizeMB: '0.00' };
  }
}

/**
 * Read image files and convert to base64
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

