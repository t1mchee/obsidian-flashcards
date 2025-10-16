import React, { useState, useMemo } from 'react';
import { X, Search, Tag, Calendar, TrendingUp, Eye, ExternalLink, Filter } from 'lucide-react';
import { getCardProgress } from '../utils/storage';
import { isCardDue } from '../utils/spacedRepetition';
import './CardBrowser.css';

const CardBrowser = ({ notes, onClose, onOpenCard, vaultPath }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, new, learning, due
  const [sortBy, setSortBy] = useState('title'); // title, created, interval, nextReview

  const progress = getCardProgress();

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach(note => {
      if (note.frontMatter && note.frontMatter.tags) {
        const tags = Array.isArray(note.frontMatter.tags) 
          ? note.frontMatter.tags 
          : [note.frontMatter.tags];
        tags.forEach(tag => tag && tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Get card status
  const getCardStatus = (note) => {
    const cardProgress = progress[note.id];
    if (!cardProgress || cardProgress.reviewCount === 0) {
      return 'new';
    }
    if (cardProgress.nextReviewDate && isCardDue(new Date(cardProgress.nextReviewDate))) {
      return 'due';
    }
    return 'learning';
  };

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let filtered = notes.filter(note => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.frontMatter?.tags && 
          (Array.isArray(note.frontMatter.tags) 
            ? note.frontMatter.tags.some(tag => tag.toLowerCase().includes(query))
            : note.frontMatter.tags.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesContent && !matchesTags) {
          return false;
        }
      }

      // Tag filter
      if (filterTag) {
        const noteTags = note.frontMatter?.tags;
        if (!noteTags) return false;
        const tags = Array.isArray(noteTags) ? noteTags : [noteTags];
        if (!tags.includes(filterTag)) return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        const status = getCardStatus(note);
        if (status !== filterStatus) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const progressA = progress[a.id];
      const progressB = progress[b.id];

      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        
        case 'interval':
          const intervalA = progressA?.interval || 0;
          const intervalB = progressB?.interval || 0;
          return intervalB - intervalA;
        
        case 'nextReview':
          const dateA = progressA?.nextReviewDate ? new Date(progressA.nextReviewDate) : new Date(0);
          const dateB = progressB?.nextReviewDate ? new Date(progressB.nextReviewDate) : new Date(0);
          return dateA - dateB;
        
        case 'reviews':
          const reviewsA = progressA?.reviewCount || 0;
          const reviewsB = progressB?.reviewCount || 0;
          return reviewsB - reviewsA;
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [notes, searchQuery, filterTag, filterStatus, sortBy, progress]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Due';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${Math.floor(diffDays / 30)}mo`;
  };

  const openInObsidian = (note) => {
    const fileName = note.originalFileName || `${note.title}.md`;
    
    if (vaultPath) {
      const filePath = `${vaultPath}/${fileName}`;
      const url = `obsidian://open?path=${encodeURIComponent(filePath)}`;
      window.open(url, '_blank');
    } else {
      const url = `obsidian://open?file=${encodeURIComponent(fileName)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="modal-overlay browser-overlay" onClick={onClose}>
      <div className="modal-content card-browser" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header browser-header">
          <div className="modal-title">
            <Search size={24} />
            <h2>Browse Cards</h2>
            <span className="card-count">{filteredCards.length} of {notes.length}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="browser-filters">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search cards by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <Filter size={16} />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Cards</option>
                <option value="new">New</option>
                <option value="learning">Learning</option>
                <option value="due">Due</option>
              </select>
            </div>

            {allTags.length > 0 && (
              <div className="filter-group">
                <Tag size={16} />
                <select 
                  value={filterTag} 
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-group">
              <TrendingUp size={16} />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="title">Sort by Title</option>
                <option value="interval">Sort by Interval</option>
                <option value="nextReview">Sort by Next Review</option>
                <option value="reviews">Sort by Review Count</option>
              </select>
            </div>
          </div>
        </div>

        <div className="browser-table-container">
          <table className="browser-table">
            <thead>
              <tr>
                <th className="col-status">Status</th>
                <th className="col-title">Title</th>
                <th className="col-tags">Tags</th>
                <th className="col-interval">Interval</th>
                <th className="col-reviews">Reviews</th>
                <th className="col-next">Next Review</th>
                <th className="col-ease">Ease</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No cards found matching your filters
                  </td>
                </tr>
              ) : (
                filteredCards.map((note) => {
                  const cardProgress = progress[note.id];
                  const status = getCardStatus(note);
                  const tags = note.frontMatter?.tags;
                  const tagArray = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

                  return (
                    <tr key={note.id} className="card-row">
                      <td>
                        <span className={`status-badge ${status}`}>
                          {status === 'new' ? 'NEW' : status === 'due' ? 'DUE' : 'LEARN'}
                        </span>
                      </td>
                      <td className="card-title-cell">
                        {note.title}
                      </td>
                      <td className="tags-cell">
                        {tagArray.map((tag, i) => (
                          <span key={i} className="tag-pill">{tag}</span>
                        ))}
                      </td>
                      <td>
                        {cardProgress?.interval 
                          ? `${cardProgress.interval}d` 
                          : '-'}
                      </td>
                      <td>
                        {cardProgress?.reviewCount || 0}
                      </td>
                      <td>
                        {formatDate(cardProgress?.nextReviewDate)}
                      </td>
                      <td>
                        {cardProgress?.easeFactor 
                          ? `${Math.round(cardProgress.easeFactor * 100)}%` 
                          : '-'}
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn"
                          onClick={() => onOpenCard(note)}
                          title="Preview card"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => openInObsidian(note)}
                          title="Edit in Obsidian"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CardBrowser;

