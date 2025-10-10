import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, Square, Play } from 'lucide-react';
import { getCardProgress } from '../utils/storage';
import './CardSelector.css';

const CardSelector = ({ notes, onStartReview, onClose }) => {
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, new, due, reviewed
  const [sortBy, setSortBy] = useState('title'); // title, status, date

  useEffect(() => {
    // Pre-select all cards by default
    setSelectedCards(new Set(notes.map(note => note.id)));
  }, [notes]);

  const toggleCard = (cardId) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const toggleAll = () => {
    const filteredNotes = getFilteredAndSortedNotes();
    if (selectedCards.size === filteredNotes.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredNotes.map(note => note.id)));
    }
  };

  const getCardStatus = (note) => {
    const progress = getCardProgress();
    const cardProgress = progress[note.id];
    
    if (!cardProgress || cardProgress.reviewCount === 0) {
      return 'new';
    } else if (cardProgress.nextReviewDate && new Date(cardProgress.nextReviewDate) <= new Date()) {
      return 'due';
    } else {
      return 'reviewed';
    }
  };

  const getFilteredAndSortedNotes = () => {
    let filtered = notes;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(note => getCardStatus(note) === filter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          const statusOrder = { new: 0, due: 1, reviewed: 2 };
          return statusOrder[getCardStatus(a)] - statusOrder[getCardStatus(b)];
        case 'date':
          const progressA = getCardProgress()[a.id];
          const progressB = getCardProgress()[b.id];
          const dateA = progressA?.nextReviewDate ? new Date(progressA.nextReviewDate) : new Date(0);
          const dateB = progressB?.nextReviewDate ? new Date(progressB.nextReviewDate) : new Date(0);
          return dateA - dateB;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleStartReview = () => {
    if (selectedCards.size === 0) {
      alert('Please select at least one card to review.');
      return;
    }
    
    const selectedNotes = notes.filter(note => selectedCards.has(note.id));
    onStartReview(selectedNotes);
  };

  const filteredNotes = getFilteredAndSortedNotes();
  const statusCounts = {
    all: notes.length,
    new: notes.filter(n => getCardStatus(n) === 'new').length,
    due: notes.filter(n => getCardStatus(n) === 'due').length,
    reviewed: notes.filter(n => getCardStatus(n) === 'reviewed').length,
  };

  return (
    <div className="card-selector-overlay">
      <div className="card-selector">
        <div className="selector-header">
          <h2>Select Cards to Study</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="selector-controls">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-bar">
            <div className="filter-group">
              <label>Filter:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All ({statusCounts.all})</option>
                <option value="new">New ({statusCounts.new})</option>
                <option value="due">Due ({statusCounts.due})</option>
                <option value="reviewed">Reviewed ({statusCounts.reviewed})</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="date">Next Review</option>
              </select>
            </div>
          </div>

          <div className="selection-info">
            <button className="text-btn" onClick={toggleAll}>
              {selectedCards.size === filteredNotes.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="selection-count">
              {selectedCards.size} of {notes.length} cards selected
            </span>
          </div>
        </div>

        <div className="card-list">
          {filteredNotes.map(note => {
            const isSelected = selectedCards.has(note.id);
            const status = getCardStatus(note);
            
            return (
              <div
                key={note.id}
                className={`card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleCard(note.id)}
              >
                <div className="card-checkbox">
                  {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                
                <div className="card-info">
                  <div className="card-title-row">
                    <h3 className="card-name">{note.title}</h3>
                    <span className={`status-badge ${status}`}>
                      {status === 'new' ? 'New' : status === 'due' ? 'Due' : 'Reviewed'}
                    </span>
                  </div>
                  <p className="card-preview">
                    {note.content.substring(0, 100).replace(/\$\$[\s\S]*?\$\$/g, '[Math]').replace(/\$[^$]+\$/g, '[Math]')}
                    {note.content.length > 100 ? '...' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="selector-footer">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="primary-btn"
            onClick={handleStartReview}
            disabled={selectedCards.size === 0}
          >
            <Play size={20} />
            Start Review ({selectedCards.size} cards)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardSelector;
