/**
 * File exporter utilities
 * Generates markdown files with updated SR (Spaced Repetition) data
 */

import matter from 'gray-matter';

/**
 * Generate markdown content with updated spaced repetition data
 * @param {object} card - Card object with title, content, frontMatter
 * @param {object} progress - Progress object with SR data
 * @returns {string} - Complete markdown file content with YAML frontmatter
 */
export function generateMarkdownWithProgress(card, progress) {
  // Merge original frontmatter with SR data
  const updatedFrontMatter = {
    ...card.frontMatter,
    sr_interval: progress.interval,
    sr_ease_factor: progress.easeFactor,
    sr_review_count: progress.reviewCount,
    sr_correct_count: progress.correctCount,
    sr_next_review: progress.nextReviewDate,
    sr_last_reviewed: progress.lastReviewedAt,
    sr_last_updated: new Date().toISOString()
  };
  
  // Use gray-matter to rebuild the markdown file with YAML frontmatter
  const markdown = matter.stringify(card.content, updatedFrontMatter);
  
  return markdown;
}

/**
 * Download a single file
 * @param {string} filename - Name of the file
 * @param {string} content - File content
 */
export function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple files as a ZIP
 * @param {Array} files - Array of { filename, content } objects
 * @param {string} zipFilename - Name of the ZIP file
 */
export async function downloadAsZip(files, zipFilename = 'flashcards-updated.zip') {
  // Dynamic import JSZip only when needed
  const JSZip = (await import('jszip')).default;
  
  const zip = new JSZip();
  
  // Add each file to the zip
  files.forEach(({ filename, content }) => {
    zip.file(filename, content);
  });
  
  // Generate and download the zip
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all modified cards
 * @param {Array} cards - Array of card objects
 * @param {object} progressData - Progress data from storage
 * @param {boolean} asZip - Whether to download as ZIP (true) or individual files (false)
 */
export async function exportModifiedCards(cards, progressData, asZip = true) {
  const files = cards.map(card => {
    const progress = progressData[card.id];
    if (!progress) return null;
    
    const content = generateMarkdownWithProgress(card, progress);
    return {
      filename: card.originalFileName || `${card.title}.md`,
      content
    };
  }).filter(Boolean);
  
  if (files.length === 0) {
    throw new Error('No cards to export');
  }
  
  if (asZip) {
    await downloadAsZip(files);
  } else {
    files.forEach(({ filename, content }) => {
      downloadFile(filename, content);
    });
  }
  
  return files.length;
}

/**
 * Generate a batch text file with all cards
 * @param {Array} cards - Array of card objects
 * @param {object} progressData - Progress data from storage
 * @returns {string} - Batch content
 */
export function generateBatchExport(cards, progressData) {
  const sections = cards.map(card => {
    const progress = progressData[card.id];
    if (!progress) return null;
    
    const content = generateMarkdownWithProgress(card, progress);
    const filename = card.originalFileName || `${card.title}.md`;
    
    return `
${'='.repeat(60)}
FILE: ${filename}
${'='.repeat(60)}

${content}

`;
  }).filter(Boolean);
  
  return sections.join('\n');
}

