/**
 * File System Access API utilities
 * For direct read/write access to Obsidian vault
 * Requires Chrome/Edge 86+ or user permission
 */

let vaultDirectoryHandle = null;
let vaultPath = null;
const fileHandleCache = new Map();

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported() {
  return 'showDirectoryPicker' in window;
}

/**
 * Request access to Obsidian vault directory
 * User grants permission once, then app can read/write files
 */
export async function requestVaultAccess() {
  try {
    // Ask user to select their Obsidian vault folder
    vaultDirectoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });
    
    // Verify we have write permission
    const permission = await vaultDirectoryHandle.requestPermission({
      mode: 'readwrite'
    });
    
    if (permission !== 'granted') {
      throw new Error('Permission denied');
    }
    
    // Store handle for later use (persists across page reloads)
    await saveDirectoryHandle(vaultDirectoryHandle);
    
    return vaultDirectoryHandle;
  } catch (error) {
    console.error('Failed to get vault access:', error);
    throw error;
  }
}

/**
 * Check if we have vault access
 */
export function hasVaultAccess() {
  return vaultDirectoryHandle !== null;
}

/**
 * Get current vault directory handle
 */
export function getVaultHandle() {
  return vaultDirectoryHandle;
}

/**
 * Get the vault path (if available from File System API)
 */
export async function getVaultPath() {
  if (!vaultDirectoryHandle) return null;
  
  // Try to get the path if the browser supports it
  try {
    // Note: Not all browsers expose the full path for security reasons
    // This is a best-effort approach
    if (vaultPath) return vaultPath;
    
    // Some browsers may expose the path through other means
    // For now, return null and rely on filename-only Obsidian URLs
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Save directory handle to IndexedDB (persists across sessions)
 */
async function saveDirectoryHandle(dirHandle) {
  try {
    // Use IndexedDB to persist the handle
    const db = await openDatabase();
    const tx = db.transaction('handles', 'readwrite');
    await tx.objectStore('handles').put(dirHandle, 'vaultDirectory');
    await tx.complete;
  } catch (error) {
    console.warn('Could not persist directory handle:', error);
  }
}

/**
 * Restore directory handle from IndexedDB
 */
export async function restoreVaultAccess() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('handles', 'readonly');
    const handle = await tx.objectStore('handles').get('vaultDirectory');
    
    if (handle) {
      // Verify we still have permission
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      
      if (permission === 'granted') {
        vaultDirectoryHandle = handle;
        return handle;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Could not restore vault access:', error);
    return null;
  }
}

/**
 * Read a file from the vault
 */
export async function readFileFromVault(fileName) {
  if (!vaultDirectoryHandle) {
    throw new Error('No vault access. Call requestVaultAccess() first.');
  }
  
  try {
    const fileHandle = await vaultDirectoryHandle.getFileHandle(fileName);
    fileHandleCache.set(fileName, fileHandle);
    
    const file = await fileHandle.getFile();
    const content = await file.text();
    
    return {
      name: fileName,
      content,
      lastModified: file.lastModified
    };
  } catch (error) {
    throw new Error(`Failed to read file ${fileName}: ${error.message}`);
  }
}

/**
 * Write/update a file in the vault
 * This is what updates card progress automatically!
 */
export async function writeFileToVault(fileName, content) {
  if (!vaultDirectoryHandle) {
    throw new Error('No vault access. Call requestVaultAccess() first.');
  }
  
  try {
    // Get or create file handle
    let fileHandle = fileHandleCache.get(fileName);
    
    if (!fileHandle) {
      // Create new file or get existing
      fileHandle = await vaultDirectoryHandle.getFileHandle(fileName, {
        create: true
      });
      fileHandleCache.set(fileName, fileHandle);
    }
    
    // Write content
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
    console.log(`✅ Updated ${fileName} in vault`);
    return true;
  } catch (error) {
    console.error(`Failed to write file ${fileName}:`, error);
    throw error;
  }
}

/**
 * Read all .md files from vault
 */
export async function readAllMarkdownFiles() {
  if (!vaultDirectoryHandle) {
    throw new Error('No vault access');
  }
  
  const files = [];
  
  for await (const entry of vaultDirectoryHandle.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.md')) {
      try {
        const file = await entry.getFile();
        const content = await file.text();
        
        files.push({
          name: entry.name,
          content,
          lastModified: file.lastModified
        });
        
        fileHandleCache.set(entry.name, entry);
      } catch (error) {
        console.warn(`Could not read ${entry.name}:`, error);
      }
    }
  }
  
  return files;
}

/**
 * Check if a file exists in the vault
 */
export async function fileExistsInVault(fileName) {
  if (!vaultDirectoryHandle) return false;
  
  try {
    await vaultDirectoryHandle.getFileHandle(fileName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear vault access (user logout)
 */
export function clearVaultAccess() {
  vaultDirectoryHandle = null;
  fileHandleCache.clear();
}

/**
 * Open IndexedDB for storing file handles
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ObsidianFlashcards', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
  });
}

