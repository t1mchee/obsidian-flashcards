import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import FlashCard from './components/FlashCard';
import FileUpload from './components/FileUpload';
import { 
  calculateNextInterval, 
  getNextReviewDate, 
  isCardDue,
  QUALITY_RATINGS 
} from './utils/spacedRepetition';
import { 
  saveCardProgress, 
  getCardProgress, 
  saveReviewHistory, 
  getNotesData 
} from './utils/storage';
import { ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import './App.css';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(null); // 'due', 'new', 'all', 'custom'
  const [customCards, setCustomCards] = useState([]); // For custom card selection
  const [isReviewing, setIsReviewing] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    completed: 0,
    total: 0,
    correct: 0
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const savedNotes = getNotesData();
    if (savedNotes.length > 0) {
      // Check if notes need frontMatter migration
      const needsMigration = savedNotes.some(note => !note.hasOwnProperty('frontMatter'));
      if (needsMigration) {
        console.log('Notes need frontMatter migration');
        // For now, just add empty frontMatter to old notes
        const migratedNotes = savedNotes.map(note => ({
          ...note,
          frontMatter: note.frontMatter || {}
        }));
        setNotes(migratedNotes);
      } else {
        setNotes(savedNotes);
      }
    } else {
      setShowFileUpload(true);
    }
  };

  const handleNotesLoaded = (loadedNotes) => {
    setNotes(loadedNotes);
    setShowFileUpload(false);
  };

  const getCardsToReview = (mode) => {
    // If custom mode, use pre-selected cards
    if (mode === 'custom') {
      return customCards;
    }

    const progress = getCardProgress();
    let cardsToReview = [];

    notes.forEach(note => {
      const cardProgress = progress[note.id];
      const isNew = !cardProgress || cardProgress.reviewCount === 0;
      const isDue = cardProgress && cardProgress.nextReviewDate && 
                   isCardDue(new Date(cardProgress.nextReviewDate));

      switch (mode) {
        case 'due':
          if (isDue) cardsToReview.push(note);
          break;
        case 'new':
          if (isNew) cardsToReview.push(note);
          break;
        case 'all':
          cardsToReview.push(note);
          break;
        default:
          break;
      }
    });

    // Shuffle cards for variety (except for custom mode)
    return cardsToReview.sort(() => Math.random() - 0.5);
  };

  const startReview = (mode, selectedCards = null) => {
    // If custom cards are provided, use them
    if (mode === 'custom' && selectedCards) {
      setCustomCards(selectedCards);
    }

    const cardsToReview = mode === 'custom' && selectedCards ? selectedCards : getCardsToReview(mode);
    
    if (cardsToReview.length === 0) {
      alert(`No ${mode} cards available for review.`);
      return;
    }

    setReviewMode(mode);
    setCurrentCardIndex(0);
    setIsReviewing(true);
    setReviewStats({
      completed: 0,
      total: cardsToReview.length,
      correct: 0
    });
  };

  const handleCardRating = (quality) => {
    const cardsToReview = getCardsToReview(reviewMode);
    const currentCard = cardsToReview[currentCardIndex];
    
    if (!currentCard) return;

    // Get current progress
    const progress = getCardProgress(currentCard.id);
    const currentInterval = progress.interval || 0;
    const currentEaseFactor = progress.easeFactor || 2.5;

    // Calculate next interval and ease factor
    const { newInterval, easeFactor } = calculateNextInterval(
      currentInterval, 
      currentEaseFactor, 
      quality
    );

    // Update progress
    const updatedProgress = {
      id: currentCard.id,
      interval: newInterval,
      easeFactor: easeFactor,
      reviewCount: (progress.reviewCount || 0) + 1,
      correctCount: (progress.correctCount || 0) + (quality >= 3 ? 1 : 0),
      nextReviewDate: getNextReviewDate(newInterval).toISOString(),
      createdAt: progress.createdAt || new Date().toISOString(),
      lastReviewedAt: new Date().toISOString()
    };

    saveCardProgress(updatedProgress);

    // Save review history
    saveReviewHistory({
      cardId: currentCard.id,
      cardTitle: currentCard.title,
      quality: quality,
      interval: newInterval,
      easeFactor: easeFactor
    });

    // Update review stats
    setReviewStats(prev => ({
      ...prev,
      completed: prev.completed + 1,
      correct: prev.correct + (quality >= 3 ? 1 : 0)
    }));

    // Move to next card or finish review
    if (currentCardIndex < cardsToReview.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      finishReview();
    }
  };

  const finishReview = () => {
    setIsReviewing(false);
    setReviewMode(null);
    setCurrentCardIndex(0);
  };

  const exitReview = () => {
    if (window.confirm('Are you sure you want to exit the review? Your progress will be saved.')) {
      finishReview();
    }
  };

  const getCurrentCard = () => {
    const cardsToReview = getCardsToReview(reviewMode);
    return cardsToReview[currentCardIndex] || null;
  };

  if (showFileUpload) {
    return (
      <FileUpload 
        onNotesLoaded={handleNotesLoaded}
        onClose={notes.length > 0 ? () => setShowFileUpload(false) : null}
        existingNotes={notes}
      />
    );
  }

  const getCardStatus = (card) => {
    const progress = getCardProgress(card.id);
    
    if (!progress || progress.reviewCount === 0) {
      return 'NEW';
    }
    
    if (progress.interval < 21) { // Less than 3 weeks
      return 'LEARNING';
    }
    
    const nextReview = new Date(progress.nextReviewDate);
    if (isCardDue(nextReview)) {
      return 'DUE';
    }
    
    return 'LEARNING';
  };

  const getQueueCounts = () => {
    const progress = getCardProgress();
    let newCount = 0;
    let learningCount = 0;
    let dueCount = 0;

    notes.forEach(note => {
      const cardProgress = progress[note.id];
      const status = getCardStatus(note);
      
      if (status === 'NEW') {
        newCount++;
      } else if (status === 'LEARNING') {
        learningCount++;
      } else if (status === 'DUE') {
        dueCount++;
      }
    });

    return { newCount, learningCount, dueCount };
  };

  if (isReviewing) {
    const currentCard = getCurrentCard();
    const progress = ((reviewStats.completed) / reviewStats.total) * 100;
    const cardStatus = currentCard ? getCardStatus(currentCard) : null;
    const queueCounts = getQueueCounts();

    return (
      <div className="review-container">
        <div className="review-sidebar">
          <button className="exit-btn" onClick={exitReview} title="Exit Review">
            <ArrowLeft size={20} />
          </button>
          
          <div className="queue-counters">
            <div className="queue-item new">
              <span className="queue-number">{queueCounts.newCount}</span>
              <span className="queue-label">New</span>
            </div>
            <div className="queue-item learning">
              <span className="queue-number">{queueCounts.learningCount}</span>
              <span className="queue-label">Learn</span>
            </div>
            <div className="queue-item due">
              <span className="queue-number">{queueCounts.dueCount}</span>
              <span className="queue-label">Due</span>
            </div>
          </div>
          
          <div className="progress-info-vertical">
            <span className="progress-text">
              {reviewStats.completed + 1} of {reviewStats.total}
            </span>
            <div className="progress-bar-vertical">
              <div 
                className="progress-fill-vertical"
                style={{ height: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {currentCard && (
          <div className="card-container">
            <FlashCard 
              card={currentCard}
              onRating={handleCardRating}
              cardStatus={cardStatus}
            />
          </div>
        )}

        {reviewStats.completed >= reviewStats.total && (
          <div className="review-complete">
            <div className="complete-content">
              <CheckCircle size={64} className="complete-icon" />
              <h2>Review Complete!</h2>
              <p>
                You reviewed {reviewStats.total} cards with {reviewStats.correct} correct answers 
                ({Math.round((reviewStats.correct / reviewStats.total) * 100)}% accuracy)
              </p>
              <button className="primary-btn" onClick={finishReview}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <Dashboard 
        notes={notes}
        onStartReview={startReview}
        onLoadNotes={() => setShowFileUpload(true)}
      />
    </div>
  );
};

export default App;
