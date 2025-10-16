import React, { useState } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { parseMarkdownFiles, filterValidNotes } from '../utils/markdownParser';
import { saveNotesData, getNotesData } from '../utils/storage';
import { readImageFiles, saveImages, getImageStorageStats } from '../utils/imageStorageDB';
import './FileUpload.css';

const FileUpload = ({ onNotesLoaded, onClose, existingNotes = [] }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [imageStats, setImageStats] = useState({ count: 0, estimatedSizeKB: 0 });

  // Load image stats on mount
  React.useEffect(() => {
    getImageStorageStats().then(stats => setImageStats(stats));
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const allFiles = Array.from(e.dataTransfer.files);
      
      // Separate markdown files and image files
      const markdownFiles = allFiles.filter(file => 
        file.type === 'text/markdown' || file.name.endsWith('.md')
      );
      
      const imageFiles = allFiles.filter(file => 
        file.type.startsWith('image/') || 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      );
      
      // Process images first if any are found
      if (imageFiles.length > 0) {
        console.log(`Found ${imageFiles.length} image(s), loading...`);
        await handleImageUpload({ target: { files: imageFiles } });
      }
      
      // Then process markdown files
      if (markdownFiles.length > 0) {
        await handleFiles(markdownFiles);
      } else if (imageFiles.length === 0) {
        // No valid files found
        setError('Please drop markdown files (.md) or a folder containing markdown files');
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFolderInput = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const allFiles = Array.from(e.target.files);
      
      // Separate markdown files and image files
      const markdownFiles = allFiles.filter(file => 
        file.type === 'text/markdown' || file.name.endsWith('.md')
      );
      
      const imageFiles = allFiles.filter(file => 
        file.type.startsWith('image/') || 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      );
      
      // Process images first if any are found
      if (imageFiles.length > 0) {
        console.log(`Found ${imageFiles.length} image(s) in folder, loading...`);
        await handleImageUpload({ target: { files: imageFiles } });
      }
      
      // Then process markdown files
      if (markdownFiles.length > 0) {
        await handleFiles(markdownFiles);
      }
    }
  };

  const handleFiles = async (files) => {
    const markdownFiles = Array.from(files).filter(file => 
      file.type === 'text/markdown' || file.name.endsWith('.md')
    );

    if (markdownFiles.length === 0) {
      setError('Please select valid markdown files (.md)');
      return;
    }

    setError(null);
    setParsing(true);

    try {
      const filePromises = markdownFiles.map(file => 
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              content: e.target.result
            });
          };
          reader.onerror = reject;
          reader.readAsText(file);
        })
      );

      const filesData = await Promise.all(filePromises);
      const parsedNotes = parseMarkdownFiles(filesData);
      const validNotes = filterValidNotes(parsedNotes, {
        minTitleLength: 3,
        minContentLength: 10,
        excludeEmpty: true
      });

      setUploadedFiles(filesData.map(file => ({
        ...file,
        status: 'parsed',
        valid: validNotes.some(note => note.originalFileName === file.name)
      })));

      if (validNotes.length > 0) {
        // Merge with existing notes, updating frontMatter for existing cards
        const existingMap = new Map(existingNotes.map(note => [note.title, note]));
        const newNotes = [];
        const updatedNotes = [];
        
        validNotes.forEach(note => {
          const existing = existingMap.get(note.title);
          if (existing) {
            // Update existing note with new frontMatter and content, but keep progress
            existingMap.set(note.title, {
              ...existing,
              content: note.content,
              frontMatter: note.frontMatter,
              srProgress: note.srProgress || existing.srProgress
            });
            updatedNotes.push(note.title);
          } else {
            newNotes.push(note);
          }
        });
        
        const allNotes = [...Array.from(existingMap.values()), ...newNotes];
        
        saveNotesData(allNotes);
        onNotesLoaded(allNotes);
        
        if (updatedNotes.length > 0) {
          setError(`${updatedNotes.length} card(s) updated, ${newNotes.length} new card(s) added.`);
        }
      } else {
        setError('No valid notes found. Please check that your files contain titles and content.');
      }
    } catch (err) {
      setError('Error parsing files: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  const removeFile = (fileName) => {
    setUploadedFiles(files => files.filter(file => file.name !== fileName));
  };

  const clearFiles = () => {
    setUploadedFiles([]);
    setError(null);
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setParsing(true);
    setError(null);

    try {
      console.log(`Processing ${files.length} file(s) for image upload...`);
      const images = await readImageFiles(files);
      console.log('Images read:', Object.keys(images));
      const success = await saveImages(images);
      
      if (success) {
        const stats = await getImageStorageStats();
        setImageStats(stats);
        console.log(`Images saved successfully. Total in storage: ${stats.count}, Size: ${stats.estimatedSizeKB}KB`);
        setError(`✅ ${Object.keys(images).length} image(s) uploaded successfully! Total: ${stats.count} images (${stats.estimatedSizeKB}KB)`);
      } else {
        setError('Failed to save images. Storage quota may be exceeded.');
      }
    } catch (err) {
      setError('Error uploading images: ' + err.message);
    } finally {
      setParsing(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="file-upload-overlay">
      <div className="file-upload-modal">
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">🃏</span>
            <h2>{existingNotes.length > 0 ? 'Add More Cards' : 'Upload Obsidian Notes'}</h2>
          </div>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          )}
        </div>

        <div className="modal-content">
          {uploadedFiles.length === 0 ? (
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={48} className="upload-icon" />
              <h3>Drop your markdown files or folder here</h3>
              <p>Or click to browse and select files/folder</p>
              <div className="upload-buttons">
                <div>
                  <input
                    type="file"
                    multiple
                    accept=".md,.markdown"
                    onChange={handleFileInput}
                    className="file-input"
                    id="file-input-upload"
                  />
                  <label htmlFor="file-input-upload" className="browse-btn">
                    📄 Browse Files
                  </label>
                </div>
                <div>
                  <input
                    type="file"
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={handleFolderInput}
                    className="file-input"
                    id="folder-input-upload"
                  />
                  <label htmlFor="folder-input-upload" className="browse-btn folder-btn">
                    📁 Browse Folder
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="files-list">
              <div className="files-header">
                <h3>Uploaded Files ({uploadedFiles.length})</h3>
                <button className="clear-btn" onClick={clearFiles}>
                  Clear All
                </button>
              </div>
              
              <div className="files-grid">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <FileText size={20} />
                      <span className="file-name">{file.name}</span>
                    </div>
                    <div className="file-actions">
                      {file.status === 'parsed' && (
                        <div className="status-icon">
                          {file.valid ? (
                            <CheckCircle size={16} className="valid" />
                          ) : (
                            <AlertCircle size={16} className="invalid" />
                          )}
                        </div>
                      )}
                      <button 
                        className="remove-btn"
                        onClick={() => removeFile(file.name)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {parsing && (
            <div className="parsing-indicator">
              <div className="spinner"></div>
              <span>Parsing files...</span>
            </div>
          )}

          <div className="image-upload-section">
            <div className="image-upload-header">
              <div className="image-info">
                <ImageIcon size={20} />
                <span>Images: {imageStats.count} ({imageStats.estimatedSizeKB} KB)</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
                id="image-input-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="image-input-upload" className="image-upload-btn">
                <ImageIcon size={16} />
                Update Images
              </label>
            </div>
            <p className="image-hint">
              Upload images from your Obsidian vault's image folder. Supports JPG, PNG, GIF, WebP.
            </p>
          </div>

          {uploadedFiles.length > 0 && !parsing && (
            <div className="upload-actions">
              <button 
                className="primary-btn"
                onClick={onClose}
              >
                Continue to Flashcards
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
