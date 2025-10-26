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
  getNotesData,
  saveNotesData
} from './utils/storage';
import yaml from 'js-yaml';
import { hasVaultAccess, writeFileToVault, readFileFromVault, restoreVaultAccess } from './utils/fileSystemAccess';
import { generateMarkdownWithProgress } from './utils/fileExporter';
import { parseMarkdownFile } from './utils/markdownParser';
import { ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import './App.css';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(null); // 'due', 'new', 'all', 'custom'
  const [customCards, setCustomCards] = useState([]); // For custom card selection
  const [isReviewing, setIsReviewing] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [vaultPath, setVaultPath] = useState('');
  const [reviewStats, setReviewStats] = useState({
    completed: 0,
    total: 0,
    correct: 0
  });

  useEffect(() => {
    loadNotes();
    checkVaultAccess();
  }, []);

  const checkVaultAccess = async () => {
    try {
      await restoreVaultAccess();
      if (hasVaultAccess()) {
        // Try to get vault path
        const { getVaultPath } = await import('./utils/fileSystemAccess');
        const path = await getVaultPath();
        setVaultPath(path || '');
      }
    } catch (error) {
      console.log('No vault access available');
    }
  };

  const parseFrontmatter = (content) => {
    if (!content || !content.trim().startsWith('---')) {
      return { data: {}, content };
    }

    try {
      const lines = content.split('\n');
      let inFrontmatter = false;
      let frontmatterLines = [];
      let contentStart = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          if (!inFrontmatter) {
            inFrontmatter = true;
          } else {
            // Found closing ---
            contentStart = i + 1;
            break;
          }
        } else if (inFrontmatter) {
          frontmatterLines.push(lines[i]);
        }
      }

      const yamlContent = frontmatterLines.join('\n');
      const parsedData = yaml.load(yamlContent) || {};
      const remainingContent = lines.slice(contentStart).join('\n').trim();

      return { data: parsedData, content: remainingContent };
    } catch (e) {
      console.warn('Failed to parse frontmatter:', e);
      return { data: {}, content };
    }
  };

  const loadNotes = () => {
    const savedNotes = getNotesData();
    if (savedNotes.length > 0) {
      // Check if notes need frontMatter migration - parse from content if empty
      const needsMigration = savedNotes.some(note => 
        !note.frontMatter || Object.keys(note.frontMatter).length === 0
      );
      
      if (needsMigration) {
        console.log('Migrating frontMatter from content...');
        const migratedNotes = savedNotes.map(note => {
          // If frontMatter is empty but content has YAML, extract it
          if ((!note.frontMatter || Object.keys(note.frontMatter).length === 0) && 
              note.content && note.content.trim().startsWith('---')) {
            try {
              const parsed = parseFrontmatter(note.content);
              console.log(`Migrated frontMatter for: ${note.title}`, parsed.data);
              return {
                ...note,
                frontMatter: parsed.data,
                content: parsed.content // Update content to remove frontmatter
              };
            } catch (e) {
              console.warn(`Failed to parse frontmatter for ${note.title}:`, e);
              return {
                ...note,
                frontMatter: note.frontMatter || {}
              };
            }
          }
          return {
            ...note,
            frontMatter: note.frontMatter || {}
          };
        });
        
        // Save the migrated notes
        saveNotesData(migratedNotes);
        setNotes(migratedNotes);
        console.log('Migration complete!');
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

  const handleCardRating = async (quality) => {
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

    // Save to localStorage
    saveCardProgress(updatedProgress);

    // Save review history
    saveReviewHistory({
      cardId: currentCard.id,
      cardTitle: currentCard.title,
      quality: quality,
      interval: newInterval,
      easeFactor: easeFactor
    });

    // Auto-save to vault if connected
    if (hasVaultAccess()) {
      try {
        const markdown = generateMarkdownWithProgress(currentCard, updatedProgress);
        const fileName = currentCard.originalFileName || `${currentCard.title}.md`;
        await writeFileToVault(fileName, markdown);
        console.log(`✅ Auto-saved ${fileName} to vault`);
      } catch (error) {
        console.warn('Failed to auto-save to vault:', error);
        // Don't block the review flow if file save fails
      }
    }

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

  const handleReloadCard = async (card) => {
    console.log('Reloading card:', card.title);
    
    try {
      const fileName = card.originalFileName || `${card.title}.md`;
      
      // Try to read from vault if connected
      if (hasVaultAccess()) {
        const fileData = await readFileFromVault(fileName);
        
        if (fileData && fileData.content) {
          // Parse the updated content
          const parsedNote = parseMarkdownFile(fileData.content, fileName);
          
          // Update the note in state, preserving the ID and progress
          const updatedNotes = notes.map(note => 
            note.id === card.id 
              ? {
                  ...note,
                  title: parsedNote.title,
                  content: parsedNote.content,
                  frontMatter: parsedNote.frontMatter,
                  srProgress: parsedNote.srProgress || note.srProgress
                }
              : note
          );
          
          setNotes(updatedNotes);
          saveNotesData(updatedNotes);
          
          console.log('✅ Card reloaded successfully from vault');
          return;
        }
      }
      
      // Fallback: Prompt user to upload the specific file
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown';
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) {
            resolve();
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (event) => {
            const fileContent = event.target.result;
            const parsedNote = parseMarkdownFile(fileContent, file.name);
            
            // Update the note in state
            const updatedNotes = notes.map(note => 
              note.id === card.id 
                ? {
                    ...note,
                    title: parsedNote.title,
                    content: parsedNote.content,
                    frontMatter: parsedNote.frontMatter,
                    originalFileName: file.name,
                    srProgress: parsedNote.srProgress || note.srProgress
                  }
                : note
            );
            
            setNotes(updatedNotes);
            saveNotesData(updatedNotes);
            
            console.log('✅ Card reloaded successfully from uploaded file');
            resolve();
          };
          
          reader.readAsText(file);
        };
        
        // If user cancels the file picker
        input.oncancel = () => resolve();
        
        input.click();
      });
    } catch (error) {
      console.error('Error reloading card:', error);
      throw error;
    }
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
              vaultPath={vaultPath}
              onReloadCard={handleReloadCard}
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
