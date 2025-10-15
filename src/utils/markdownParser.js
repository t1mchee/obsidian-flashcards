/**
 * Markdown file parser for Obsidian notes
 * Extracts title and content from markdown files
 */

import matter from 'gray-matter';

/**
 * Parse a markdown file and extract title and content
 * @param {string} fileContent - Raw markdown content
 * @param {string} fileName - Name of the file (used as fallback title)
 * @returns {object} - { title, content, frontMatter }
 */
export function parseMarkdownFile(fileContent, fileName) {
  try {
    // Parse front matter if present - gray-matter removes the YAML frontmatter from content
    const { data: frontMatter, content } = matter(fileContent);
    
    // Extract title from front matter, first heading, or filename
    let title = frontMatter.title || frontMatter.Title;
    
    // Look for the first heading in the content (check before using it later)
    const headingMatch = content.match(/^#\s+(.+)$/m);
    
    if (!title) {
      if (headingMatch) {
        title = headingMatch[1].trim();
      } else {
        // Use filename as fallback (remove .md extension)
        title = fileName.replace(/\.md$/, '').replace(/[-_]/g, ' ');
        // Capitalize first letter of each word
        title = title.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      }
    }
    
    // Clean up content by removing the title heading if it exists
    let cleanContent = content;
    if (headingMatch) {
      cleanContent = content.replace(/^#\s+.+$/m, '').trim();
    }
    
    // Apply Obsidian-specific cleaning (including LaTeX fixes)
    cleanContent = cleanObsidianMarkdown(cleanContent);
    
    // Additional cleanup to prevent duplication
    cleanContent = cleanContent
      // Remove duplicate LaTeX blocks
      .replace(/(\$\$[\s\S]*?\$\$)\s*\1/g, '$1')
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // Remove excessive whitespace and normalize line breaks
    cleanContent = cleanContent
      .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2
      .trim();
    
    // Extract spaced repetition data from frontmatter if present
    const srProgress = extractSRProgress(frontMatter);
    
    return {
      title: title.trim(),
      content: cleanContent,
      frontMatter,
      originalFileName: fileName,
      srProgress // Embedded SR data from file
    };
  } catch (error) {
    console.error('Error parsing markdown file:', error);
    return {
      title: fileName.replace(/\.md$/, ''),
      content: fileContent,
      frontMatter: {},
      originalFileName: fileName
    };
  }
}

/**
 * Process multiple markdown files
 * @param {Array} files - Array of file objects with name and content
 * @returns {Array} - Array of parsed note objects
 */
export function parseMarkdownFiles(files) {
  return files.map(file => {
    const parsed = parseMarkdownFile(file.content, file.name);
    return {
      ...parsed,
      id: generateNoteId(file.name, parsed.title)
    };
  });
}

/**
 * Generate a unique ID for a note
 * @param {string} fileName - Original file name
 * @param {string} title - Note title
 * @returns {string} - Unique identifier
 */
export function generateNoteId(fileName, title) {
  const base = fileName.replace(/\.md$/, '') + '_' + title;
  // Simple hash function for ID generation
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Filter out notes that are too short or don't have meaningful content
 * @param {Array} notes - Array of parsed notes
 * @param {object} options - Filtering options
 * @returns {Array} - Filtered notes
 */
export function filterValidNotes(notes, options = {}) {
  const {
    minTitleLength = 3,
    minContentLength = 10,
    excludeEmpty = true
  } = options;
  
  return notes.filter(note => {
    if (excludeEmpty && (!note.title || !note.content)) {
      return false;
    }
    
    if (note.title.length < minTitleLength) {
      return false;
    }
    
    if (note.content.length < minContentLength) {
      return false;
    }
    
    return true;
  });
}

/**
 * Extract spaced repetition progress from frontmatter
 * @param {object} frontMatter - Parsed YAML frontmatter
 * @returns {object|null} - SR progress data or null if not present
 */
function extractSRProgress(frontMatter) {
  // Check if SR fields are present
  if (!frontMatter.sr_interval && !frontMatter.sr_review_count) {
    return null;
  }
  
  return {
    interval: frontMatter.sr_interval || 0,
    easeFactor: frontMatter.sr_ease_factor || 2.5,
    reviewCount: frontMatter.sr_review_count || 0,
    correctCount: frontMatter.sr_correct_count || 0,
    nextReviewDate: frontMatter.sr_next_review || null,
    lastReviewedAt: frontMatter.sr_last_reviewed || null,
    lastUpdated: frontMatter.sr_last_updated || null
  };
}

/**
 * Clean up Obsidian-specific markdown syntax and fix LaTeX
 * @param {string} content - Raw markdown content
 * @returns {string} - Cleaned content
 */
export function cleanObsidianMarkdown(content) {
  return content
    // Remove Obsidian wiki links [[text]] and keep just the text
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    // Remove Obsidian tags #tag
    .replace(/#[a-zA-Z][a-zA-Z0-9/]*/g, '')
    // Fix LaTeX environments - wrap in display math
    .replace(/\\begin\{align\*\}/g, '$$\\begin{align*}')
    .replace(/\\end\{align\*\}/g, '\\end{align*}$$')
    .replace(/\\begin\{align\}/g, '$$\\begin{align}')
    .replace(/\\end\{align\}/g, '\\end{align}$$')
    .replace(/\\begin\{alignat\*\}/g, '$$\\begin{alignat*}')
    .replace(/\\end\{alignat\*\}/g, '\\end{alignat*}$$')
    .replace(/\\begin\{eqnarray\*\}/g, '$$\\begin{eqnarray*}')
    .replace(/\\end\{eqnarray\*\}/g, '\\end{eqnarray*}$$')
    .replace(/\\begin\{gather\}/g, '$$\\begin{gather}')
    .replace(/\\end\{gather\}/g, '\\end{gather}$$')
    .replace(/\\begin\{multline\}/g, '$$\\begin{multline}')
    .replace(/\\end\{multline\}/g, '\\end{multline}$$')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}
