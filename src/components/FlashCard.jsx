import React, { useState, useEffect } from 'react';
import MarkdownWithLatex from './MarkdownWithLatex';
import { Eye, EyeOff } from 'lucide-react';
import './FlashCard.css';

const FlashCard = ({ card, onRating, isFlipped, onFlip }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const handleFlip = () => {
    if (!showAnswer) {
      // Showing the answer for the first time
      setShowAnswer(true);
      // Show rating buttons after a delay to let user read the answer
      setTimeout(() => {
        setShowRating(true);
      }, 1500); // 1.5 second delay
    } else {
      // Going back to question
      setShowAnswer(false);
      setShowRating(false);
    }
    
    if (onFlip) {
      onFlip(!showAnswer);
    }
  };

  const handleRating = (quality) => {
    setShowAnswer(false);
    setShowRating(false);
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
      
      // Rating hotkeys (only when rating is visible)
      if (showRating) {
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
  }, [showAnswer, showRating]);

  return (
    <div className="flashcard">
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <div className="card-header">
            <h2 className="card-title">{card.title}</h2>
            <button 
              className="flip-button"
              onClick={handleFlip}
              title={showAnswer ? "Show question" : "Show answer"}
            >
              {showAnswer ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <div className={`card-content ${showRating ? 'with-rating-overlay' : ''}`}>
            {!showAnswer && (
              <div className="question-content centered">
                <h1 className="question-title">{card.title}</h1>
                <p className="question-hint">Press <kbd>Space</kbd> or click the eye icon to reveal the answer</p>
              </div>
            )}
            
            {showAnswer && (
              <div className="answer-content">
                <MarkdownWithLatex content={card.content} frontMatter={card.frontMatter || {}} />
              </div>
            )}
          </div>
        </div>

        {/* Answer section with rating buttons - only show after delay */}
        {showRating && (
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
