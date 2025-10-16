import React, { useState, useEffect } from 'react';
import MarkdownWithLatex from './MarkdownWithLatex';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import './FlashCard.css';

const FlashCard = ({ card, onRating, isFlipped, onFlip, cardStatus, vaultPath }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleFlip = () => {
    if (!showAnswer) {
      // Showing the answer for the first time
      setShowAnswer(true);
    } else {
      // Going back to question
      setShowAnswer(false);
    }
    
    if (onFlip) {
      onFlip(!showAnswer);
    }
  };

  const handleRating = (quality) => {
    setShowAnswer(false);
    if (onRating) {
      onRating(quality);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Spacebar - reveal answer
      if (event.code === 'Space' && !showAnswer) {
        event.preventDefault();
        handleFlip();
      }
      
      // Rating hotkeys (only when answer is visible)
      if (showAnswer) {
        switch(event.key) {
          case '1':
            event.preventDefault();
            handleRating(0); // Fucked
            break;
          case '2':
            event.preventDefault();
            handleRating(1); // Hard
            break;
          case '3':
            event.preventDefault();
            handleRating(3); // Good
            break;
          case '4':
            event.preventDefault();
            handleRating(4); // Piss
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showAnswer]);

  const getStatusBadge = () => {
    if (!cardStatus) return null;
    
    return (
      <span className={`card-status-badge ${cardStatus.toLowerCase()}`}>
        {cardStatus}
      </span>
    );
  };

  const openInObsidian = () => {
    // Obsidian URL scheme: obsidian://open?vault=VaultName&file=path/to/file.md
    // Or simpler: obsidian://open?path=/absolute/path/to/file.md
    
    const fileName = card.originalFileName || `${card.title}.md`;
    
    if (vaultPath) {
      // If we have the vault path from File System API
      const filePath = `${vaultPath}/${fileName}`;
      const url = `obsidian://open?path=${encodeURIComponent(filePath)}`;
      window.open(url, '_blank');
    } else {
      // Fallback: try to open by filename only
      // User needs to have the vault open in Obsidian
      const url = `obsidian://open?file=${encodeURIComponent(fileName)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flashcard">
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <div className="card-header">
            <div className="card-header-left">
              {getStatusBadge()}
              <h2 className="card-title">{card.title}</h2>
            </div>
            <div className="card-header-actions">
              <button 
                className="icon-button"
                onClick={openInObsidian}
                title="Edit in Obsidian"
              >
                <ExternalLink size={18} />
              </button>
              <button 
                className="flip-button"
                onClick={handleFlip}
                title={showAnswer ? "Show question" : "Show answer"}
              >
                {showAnswer ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className={`card-content ${showAnswer ? 'with-rating-overlay' : ''}`}>
            {!showAnswer && (
              <>
                <MarkdownWithLatex content="" frontMatter={card.frontMatter || {}} />
                <div className="question-content centered">
                  <h1 className="question-title">{card.title}</h1>
                  <p className="question-hint">Press <kbd>Space</kbd> or click the eye icon to reveal the answer</p>
                </div>
              </>
            )}
            
            {showAnswer && (
              <div className="answer-content">
                <MarkdownWithLatex content={card.content} frontMatter={card.frontMatter || {}} />
              </div>
            )}
          </div>
        </div>

        {/* Answer section with rating buttons - show immediately when answer is visible */}
        {showAnswer && (
          <div className="rating-overlay">
          <div className="rating-section">
            <div className="rating-buttons">
              <button 
                className="rating-btn again"
                onClick={() => handleRating(0)}
              >
                Fucked
                <span className="rating-desc">Press 1</span>
              </button>
              
              <button 
                className="rating-btn hard"
                onClick={() => handleRating(1)}
              >
                Hard
                <span className="rating-desc">Press 2</span>
              </button>
              
              <button 
                className="rating-btn good"
                onClick={() => handleRating(3)}
              >
                Good
                <span className="rating-desc">Press 3</span>
              </button>
              
              <button 
                className="rating-btn easy"
                onClick={() => handleRating(4)}
              >
                Piss
                <span className="rating-desc">Press 4</span>
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default FlashCard;
