import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Settings,
  Upload,
  Download,
  RotateCcw,
  ListChecks,
  FilePlus,
  FolderOpen,
  Link as LinkIcon,
  XCircle
} from 'lucide-react';
import CardSelector from './CardSelector';
import { getCardProgress, getReviewHistory, getSettings, saveSettings, clearAllData, exportData, importData } from '../utils/storage';
import { 
  isFileSystemAccessSupported, 
  hasVaultAccess, 
  requestVaultAccess, 
  restoreVaultAccess,
  clearVaultAccess 
} from '../utils/fileSystemAccess';
import { exportModifiedCards } from '../utils/fileExporter';
import './Dashboard.css';

const Dashboard = ({ notes, onStartReview, onLoadNotes }) => {
  const [stats, setStats] = useState({
    totalCards: 0,
    dueCards: 0,
    newCards: 0,
    reviewedToday: 0,
    averageAccuracy: 0
  });
  const [settings, setSettings] = useState({
    newCardsPerDay: 20,
    maxReviewsPerDay: 100,
    showProgress: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [vaultConnected, setVaultConnected] = useState(false);
  const [fsApiSupported, setFsApiSupported] = useState(false);
  const [modifiedCardsCount, setModifiedCardsCount] = useState(0);

  useEffect(() => {
    loadStats();
    loadSettings();
    checkVaultConnection();
    checkFileSystemSupport();
  }, [notes]);

  const checkFileSystemSupport = () => {
    setFsApiSupported(isFileSystemAccessSupported());
  };

  const checkVaultConnection = async () => {
    if (isFileSystemAccessSupported()) {
      try {
        const restored = await restoreVaultAccess();
        setVaultConnected(!!restored);
      } catch (error) {
        setVaultConnected(false);
      }
    }
  };

  const handleConnectVault = async () => {
    try {
      await requestVaultAccess();
      setVaultConnected(true);
      alert('✅ Connected to Obsidian vault! Files will auto-update after reviews.');
    } catch (error) {
      alert('Failed to connect to vault. Make sure you selected a folder.');
    }
  };

  const handleDisconnectVault = () => {
    clearVaultAccess();
    setVaultConnected(false);
  };

  const handleExportCards = async () => {
    try {
      const progress = getCardProgress();
      const cardsToExport = notes.filter(note => progress[note.id]);
      
      if (cardsToExport.length === 0) {
        alert('No cards have been reviewed yet.');
        return;
      }
      
      const count = await exportModifiedCards(cardsToExport, progress, true);
      alert(`✅ Exported ${count} card(s) as ZIP file!`);
    } catch (error) {
      alert('Failed to export cards: ' + error.message);
    }
  };

  const loadStats = () => {
    const progress = getCardProgress();
    const history = getReviewHistory();
    const today = new Date().toDateString();
    
    const totalCards = notes.length;
    let dueCards = 0;
    let newCards = 0;
    let reviewedToday = 0;
    let totalAccuracy = 0;
    let reviewCount = 0;

    notes.forEach(note => {
      const cardProgress = progress[note.id];
      if (!cardProgress || cardProgress.reviewCount === 0) {
        newCards++;
      } else if (cardProgress.nextReviewDate && new Date(cardProgress.nextReviewDate) <= new Date()) {
        dueCards++;
      }
    });

    // Count reviews today
    history.forEach(review => {
      if (new Date(review.timestamp).toDateString() === today) {
        reviewedToday++;
        if (review.quality >= 3) {
          totalAccuracy++;
        }
        reviewCount++;
      }
    });

    const averageAccuracy = reviewCount > 0 ? (totalAccuracy / reviewCount) * 100 : 0;

    setStats({
      totalCards,
      dueCards,
      newCards,
      reviewedToday,
      averageAccuracy: Math.round(averageAccuracy)
    });
  };

  const loadSettings = () => {
    const savedSettings = getSettings();
    setSettings({ ...settings, ...savedSettings });
  };

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleExport = () => {
    const data = exportData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `obsidian-flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          importData(data);
          loadStats();
          loadSettings();
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
      clearAllData();
      loadStats();
      alert('All progress has been reset.');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <span className="app-icon">🃏</span>
          <h1>Obsidian Flashcards</h1>
        </div>
        <div className="header-actions">
          <button 
            className="icon-btn"
            onClick={onLoadNotes}
            title="Add More Cards"
          >
            <FilePlus size={20} />
          </button>
          <button 
            className="icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} className="empty-icon" />
          <h2>No Notes Loaded</h2>
          <p>Upload your Obsidian markdown files to get started with spaced repetition learning.</p>
          <button className="primary-btn" onClick={onLoadNotes}>
            Load Notes
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalCards}</div>
                <div className="stat-label">Total Cards</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.dueCards}</div>
                <div className="stat-label">Due Today</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.newCards}</div>
                <div className="stat-label">New Cards</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.reviewedToday}</div>
                <div className="stat-label">Reviewed Today</div>
              </div>
            </div>
          </div>

          {/* Vault Connection Status */}
          {fsApiSupported && (
            <div className="vault-connection-banner">
              {vaultConnected ? (
                <div className="connection-status connected">
                  <LinkIcon size={20} />
                  <span>Connected to Obsidian vault • Auto-sync enabled</span>
                  <button className="link-btn" onClick={handleDisconnectVault}>
                    <XCircle size={16} />
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="connection-status disconnected">
                  <FolderOpen size={20} />
                  <span>Connect to your Obsidian vault for automatic file updates</span>
                  <button className="connect-btn" onClick={handleConnectVault}>
                    <LinkIcon size={16} />
                    Connect Vault
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Export Button (for non-connected or unsupported browsers) */}
          {!vaultConnected && stats.reviewedToday > 0 && (
            <div className="export-reminder">
              <Upload size={20} />
              <span>{stats.reviewedToday} card(s) reviewed. Export to save progress to files.</span>
              <button className="export-btn" onClick={handleExportCards}>
                <Download size={16} />
                Export as ZIP
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {stats.totalCards > 0 && (
            <div className="progress-section">
              <h3>Today's Progress</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((stats.reviewedToday / Math.max(stats.dueCards + stats.newCards, 1)) * 100, 100)}%` 
                  }}
                />
              </div>
              <p className="progress-text">
                {stats.reviewedToday} of {stats.dueCards + stats.newCards} cards reviewed today
              </p>
              {stats.averageAccuracy > 0 && (
                <p className="accuracy-text">
                  Average accuracy: {stats.averageAccuracy}%
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="primary-btn large"
              onClick={() => onStartReview('due')}
              disabled={stats.dueCards === 0}
            >
              Review Due Cards ({stats.dueCards})
            </button>
            
            <button 
              className="secondary-btn large"
              onClick={() => onStartReview('new')}
              disabled={stats.newCards === 0}
            >
              Learn New Cards ({stats.newCards})
            </button>
            
            <button 
              className="secondary-btn large"
              onClick={() => onStartReview('all')}
            >
              Review All Cards
            </button>

            <button 
              className="secondary-btn large select-cards-btn"
              onClick={() => setShowCardSelector(true)}
            >
              <ListChecks size={20} />
              Select Cards to Study
            </button>
          </div>
        </>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h3>Settings</h3>
          
          <div className="setting-group">
            <label>New Cards Per Day</label>
            <input
              type="number"
              value={settings.newCardsPerDay}
              onChange={(e) => handleSettingsChange('newCardsPerDay', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>

          <div className="setting-group">
            <label>Max Reviews Per Day</label>
            <input
              type="number"
              value={settings.maxReviewsPerDay}
              onChange={(e) => handleSettingsChange('maxReviewsPerDay', parseInt(e.target.value))}
              min="1"
              max="500"
            />
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showProgress}
                onChange={(e) => handleSettingsChange('showProgress', e.target.checked)}
              />
              Show Progress Indicators
            </label>
          </div>

          <div className="settings-actions">
            <button className="secondary-btn" onClick={handleExport}>
              <Download size={16} />
              Export Data
            </button>
            
            <label className="file-input-btn">
              <Upload size={16} />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            
            <button className="danger-btn" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset Progress
            </button>
          </div>
        </div>
      )}

      {/* Card Selector */}
      {showCardSelector && (
        <CardSelector
          notes={notes}
          onStartReview={(selectedNotes) => {
            setShowCardSelector(false);
            onStartReview('custom', selectedNotes);
          }}
          onClose={() => setShowCardSelector(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
