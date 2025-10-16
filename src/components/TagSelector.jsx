import React, { useState, useMemo } from 'react';
import { X, Tag, CheckSquare, Square } from 'lucide-react';
import './TagSelector.css';

const TagSelector = ({ notes, onStartReview, onClose }) => {
  const [selectedTags, setSelectedTags] = useState(new Set());

  // Extract all unique tags from notes
  const availableTags = useMemo(() => {
    const tagCounts = {};
    
    notes.forEach(note => {
      if (note.frontMatter && note.frontMatter.tags) {
        const tags = Array.isArray(note.frontMatter.tags) 
          ? note.frontMatter.tags 
          : [note.frontMatter.tags];
        
        tags.forEach(tag => {
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by count (most used first)
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  const toggleTag = (tag) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const selectAll = () => {
    setSelectedTags(new Set(availableTags.map(t => t.tag)));
  };

  const clearAll = () => {
    setSelectedTags(new Set());
  };

  const getFilteredNotes = () => {
    if (selectedTags.size === 0) return [];
    
    return notes.filter(note => {
      if (!note.frontMatter || !note.frontMatter.tags) return false;
      
      const noteTags = Array.isArray(note.frontMatter.tags) 
        ? note.frontMatter.tags 
        : [note.frontMatter.tags];
      
      // Check if note has ANY of the selected tags
      return noteTags.some(tag => selectedTags.has(tag));
    });
  };

  const handleStartReview = () => {
    const filteredNotes = getFilteredNotes();
    if (filteredNotes.length > 0) {
      onStartReview(filteredNotes);
    }
  };

  const filteredCount = getFilteredNotes().length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tag-selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Tag size={24} />
            <h2>Study by Tag</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {availableTags.length === 0 ? (
            <div className="empty-state">
              <Tag size={48} className="empty-icon" />
              <p>No tags found in your notes. Add tags to your markdown frontmatter to use this feature.</p>
              <pre className="tag-example">{`---
tags:
  - Statistics
  - Mathematics
---`}</pre>
            </div>
          ) : (
            <>
              <div className="tag-selector-header">
                <p className="tag-count-info">
                  {selectedTags.size > 0 
                    ? `${selectedTags.size} tag(s) selected • ${filteredCount} card(s) matched`
                    : 'Select tags to filter cards'}
                </p>
                <div className="tag-actions">
                  <button className="link-btn" onClick={selectAll}>Select All</button>
                  <button className="link-btn" onClick={clearAll}>Clear All</button>
                </div>
              </div>

              <div className="tags-grid">
                {availableTags.map(({ tag, count }) => {
                  const isSelected = selectedTags.has(tag);
                  return (
                    <div
                      key={tag}
                      className={`tag-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      <div className="tag-checkbox">
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div className="tag-info">
                        <span className="tag-name">{tag}</span>
                        <span className="tag-card-count">{count} card{count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {availableTags.length > 0 && (
          <div className="modal-footer">
            <button className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="primary-btn" 
              onClick={handleStartReview}
              disabled={filteredCount === 0}
            >
              Start Review ({filteredCount} card{filteredCount !== 1 ? 's' : ''})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector;

