import React, { useState } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { parseMarkdownFiles, filterValidNotes } from '../utils/markdownParser';
import { saveNotesData, getNotesData } from '../utils/storage';
import { readImageFiles, saveImages, getImageStorageStats } from '../utils/imageStorage';
import './FileUpload.css';

const FileUpload = ({ onNotesLoaded, onClose, existingNotes = [] }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [imageStats, setImageStats] = useState(getImageStorageStats());

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
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
        // Merge with existing notes, avoiding duplicates by title
        const existingTitles = new Set(existingNotes.map(note => note.title));
        const newNotes = validNotes.filter(note => !existingTitles.has(note.title));
        const allNotes = [...existingNotes, ...newNotes];
        
        saveNotesData(allNotes);
        onNotesLoaded(allNotes);
        
        if (newNotes.length < validNotes.length) {
          setError(`${validNotes.length - newNotes.length} duplicate(s) skipped. ${newNotes.length} new card(s) added.`);
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
      const images = await readImageFiles(files);
      const success = saveImages(images);
      
      if (success) {
        setImageStats(getImageStorageStats());
        setError(`✅ ${Object.keys(images).length} image(s) uploaded successfully!`);
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
              <h3>Drop your markdown files here</h3>
              <p>Or click to browse and select files</p>
              <input
                type="file"
                multiple
                accept=".md,.markdown"
                onChange={handleFileInput}
                className="file-input"
                id="file-input-upload"
              />
              <label htmlFor="file-input-upload" className="browse-btn">
                Browse Files
              </label>
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
