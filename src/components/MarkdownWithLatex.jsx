import React, { useEffect, useRef, useState } from 'react';
import yaml from 'js-yaml';

// Configure MathJax before it loads
if (!window.MathJax) {
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$']],
      displayMath: [['$$', '$$']],
      processEscapes: true,
      processEnvironments: true,
      tags: 'ams'
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
    },
    startup: {
      pageReady: () => {
        return window.MathJax.startup.defaultPageReady();
      }
    }
  };
}

// Browser-compatible frontmatter parser
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

const MarkdownWithLatex = ({ content, frontMatter = {} }) => {
  const containerRef = useRef(null);
  const mathJaxLoadedRef = useRef(false);
  const [parsedFrontMatter, setParsedFrontMatter] = useState(frontMatter);

  // Parse frontmatter from content if it exists (for old notes)
  useEffect(() => {
    if (content && content.trim().startsWith('---')) {
      try {
        const parsed = parseFrontmatter(content);
        if (Object.keys(parsed.data).length > 0) {
          setParsedFrontMatter({ ...frontMatter, ...parsed.data });
        } else {
          setParsedFrontMatter(frontMatter);
        }
      } catch (e) {
        console.warn('Failed to parse frontmatter from content:', e);
        setParsedFrontMatter(frontMatter);
      }
    } else {
      setParsedFrontMatter(frontMatter);
    }
  }, [content, frontMatter]);

  useEffect(() => {
    // Load MathJax if not already loaded
    if (!mathJaxLoadedRef.current && !document.getElementById('mathjax-script')) {
      const script = document.createElement('script');
      script.id = 'mathjax-script';
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
      script.async = true;
      
      script.onload = () => {
        mathJaxLoadedRef.current = true;
        renderContent();
      };
      
      document.head.appendChild(script);
    } else if (window.MathJax && window.MathJax.typesetPromise) {
      renderContent();
    } else {
      // Wait for MathJax to load
      const checkInterval = setInterval(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          clearInterval(checkInterval);
          renderContent();
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }
  }, [content]);

  const renderContent = () => {
    if (!containerRef.current) return;
    
    // Strip any remaining frontmatter from content (for backwards compatibility with old notes)
    let cleanedContent = content;
    if (content && content.trim().startsWith('---')) {
      const parsed = parseFrontmatter(content);
      cleanedContent = parsed.content;
    }
    
    // Process and render the content
    const processedContent = processContent(cleanedContent);
    containerRef.current.innerHTML = processedContent;
    
    // Typeset the math
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([containerRef.current]).catch((err) => {
        console.warn('MathJax typesetting error:', err);
      });
    }
  };

  const processContent = (text) => {
    // Convert markdown to HTML first
    let processed = convertMarkdownToHtml(text);
    
    return processed;
  };

  // Render metadata tags if present
  const renderMetadata = () => {
    if (!parsedFrontMatter || Object.keys(parsedFrontMatter).length === 0) {
      return null;
    }
    
    return (
      <div className="metadata-banner">
        {parsedFrontMatter.tags && (
          <div className="metadata-row">
            <span className="metadata-label">Tags:</span>
            <div className="metadata-tags">
              {Array.isArray(parsedFrontMatter.tags) 
                ? parsedFrontMatter.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))
                : <span className="tag">{parsedFrontMatter.tags}</span>
              }
            </div>
          </div>
        )}
        {(parsedFrontMatter.Paper || parsedFrontMatter.paper) && (
          <div className="metadata-row">
            <span className="metadata-label">Paper:</span>
            <span className="metadata-value">{parsedFrontMatter.Paper || parsedFrontMatter.paper}</span>
          </div>
        )}
        {(parsedFrontMatter.Supervision || parsedFrontMatter.supervision) && (
          <div className="metadata-row">
            <span className="metadata-label">Supervision:</span>
            <span className="metadata-value">{parsedFrontMatter.Supervision || parsedFrontMatter.supervision}</span>
          </div>
        )}
        {(parsedFrontMatter.Lecture || parsedFrontMatter.lecture) && (
          <div className="metadata-row">
            <span className="metadata-label">Lecture:</span>
            <span className="metadata-value">{parsedFrontMatter.Lecture || parsedFrontMatter.lecture}</span>
          </div>
        )}
        {(parsedFrontMatter.Status || parsedFrontMatter.status) && (
          <div className="metadata-row">
            <span className="metadata-label">Status:</span>
            <span className={`metadata-badge status-${(parsedFrontMatter.Status || parsedFrontMatter.status).toLowerCase()}`}>
              {parsedFrontMatter.Status || parsedFrontMatter.status}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="markdown-content">
      {renderMetadata()}
      <div ref={containerRef}></div>
    </div>
  );
};


// Process Fast Color Text plugin syntax: ==(color)text== and ~={color} for whole line
const processFastColorText = (text) => {
  // Color map for named colors
  const colorMap = {
    'red': '#f14c4c',
    'blue': '#007acc',
    'green': '#27ae60',
    'yellow': '#cca700',
    'orange': '#ff8c42',
    'purple': '#9b59b6',
    'pink': '#d16d9e',
    'cyan': '#17a2b8',
    'gray': '#7f8c8d',
    'grey': '#7f8c8d',
    'black': '#000000',
    'white': '#ffffff',
  };
  
  // First, handle line-based color syntax: ~={color} at the start of a line
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    // Match ~={color} or ~=(color) at the start of a line
    const lineColorMatch = line.match(/^~=\{([^}]+)\}\s*(.*)$/);
    if (lineColorMatch) {
      const color = lineColorMatch[1].toLowerCase();
      const content = lineColorMatch[2];
      const finalColor = color.startsWith('#') ? color : (colorMap[color] || color);
      return `<span class="fast-color-text" style="color: ${finalColor}; font-weight: 500;">${content}</span>`;
    }
    return line;
  });
  
  let processed = processedLines.join('\n');
  
  // Then, handle inline color syntax: ==(color)text==
  const colorTextRegex = /==\(([^)]+)\)([^=]+)==/g;
  processed = processed.replace(colorTextRegex, (match, color, content) => {
    // Use the color directly if it's a hex code, otherwise look it up in the map
    const finalColor = color.startsWith('#') ? color : (colorMap[color.toLowerCase()] || color);
    
    return `<span class="fast-color-text" style="color: ${finalColor}; font-weight: 500;">${content.trim()}</span>`;
  });
  
  return processed;
};

// Process Obsidian callouts (>[!type] syntax)
const processCallouts = (text) => {
  const calloutTypes = {
    note: { icon: 'ℹ️', class: 'callout-note' },
    info: { icon: 'ℹ️', class: 'callout-info' },
    tip: { icon: '💡', class: 'callout-tip' },
    warning: { icon: '⚠️', class: 'callout-warning' },
    caution: { icon: '⚠️', class: 'callout-caution' },
    danger: { icon: '🚫', class: 'callout-danger' },
    error: { icon: '❌', class: 'callout-error' },
    example: { icon: '📝', class: 'callout-example' },
    quote: { icon: '💬', class: 'callout-quote' },
    question: { icon: '❓', class: 'callout-question' },
    success: { icon: '✅', class: 'callout-success' },
    abstract: { icon: '📄', class: 'callout-abstract' },
    todo: { icon: '☑️', class: 'callout-todo' },
  };

  const lines = text.split('\n');
  const result = [];
  let inCallout = false;
  let calloutLines = [];
  let calloutType = '';
  let calloutTitle = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line starts a callout: >[!type] or >[!type] Title
    const calloutStart = line.match(/^>\s*\[!(\w+)\]\s*(.*)?$/);
    
    if (calloutStart && !inCallout) {
      inCallout = true;
      calloutType = calloutStart[1].toLowerCase();
      calloutTitle = calloutStart[2] || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
      calloutLines = [];
    } else if (inCallout && line.startsWith('>')) {
      // Continue callout - remove the > prefix
      calloutLines.push(line.substring(1).trim());
    } else if (inCallout && !line.trim()) {
      // Empty line might still be part of callout
      calloutLines.push('');
    } else if (inCallout) {
      // End of callout
      const typeInfo = calloutTypes[calloutType] || { icon: 'ℹ️', class: 'callout-note' };
      const calloutContent = calloutLines.join('<br>');
      result.push(
        `<div class="obsidian-callout ${typeInfo.class}">` +
        `<div class="callout-title"><span class="callout-icon">${typeInfo.icon}</span>${calloutTitle}</div>` +
        `<div class="callout-content">${calloutContent}</div>` +
        `</div>`
      );
      inCallout = false;
      calloutLines = [];
      result.push(line);
    } else {
      result.push(line);
    }
  }

  // Handle unclosed callout
  if (inCallout) {
    const typeInfo = calloutTypes[calloutType] || { icon: 'ℹ️', class: 'callout-note' };
    const calloutContent = calloutLines.join('<br>');
    result.push(
      `<div class="obsidian-callout ${typeInfo.class}">` +
      `<div class="callout-title"><span class="callout-icon">${typeInfo.icon}</span>${calloutTitle}</div>` +
      `<div class="callout-content">${calloutContent}</div>` +
      `</div>`
    );
  }

  return result.join('\n');
};

// Simple markdown to HTML converter for basic formatting
const convertMarkdownToHtml = (text) => {
  // Split by math delimiters to preserve them
  const parts = [];
  let currentIndex = 0;
  
  // Find all math blocks ($$...$$)
  const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let match;
  
  while ((match = displayMathRegex.exec(text)) !== null) {
    // Add text before math
    if (match.index > currentIndex) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex, match.index)
      });
    }
    
    // Add math block
    parts.push({
      type: 'math-display',
      content: '$$' + match[1] + '$$'
    });
    
    currentIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(currentIndex)
    });
  }
  
  // Process each part
  return parts.map(part => {
    if (part.type === 'math-display') {
      return `<div class="math-display">${part.content}</div>`;
    } else {
      // Process inline math in text
      let processed = part.content;
      
      // Protect inline math
      const inlineMathParts = [];
      processed = processed.replace(/\$([^$]+)\$/g, (match) => {
        const index = inlineMathParts.length;
        inlineMathParts.push(match);
        return `###INLINEMATH${index}###`;
      });
      
      // Handle Obsidian callouts first
      processed = processCallouts(processed);
      
      // Handle Fast Color Text plugin syntax: ==(color)text==
      processed = processFastColorText(processed);
      
      // Apply markdown formatting
      processed = processed
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold (but not in math)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic (but not in math - protect from list markers)
        .replace(/(?<![\*\-])\*([^\*\n]+)\*/g, '<em>$1</em>');
      
      // Handle lists separately - process before line break conversion
      const textLines = processed.split('\n');
      let inList = false;
      let listHtml = '';
      const processedLines = [];
      
      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        // Check if line is a list item (starts with - or * followed by space)
        const listMatch = line.match(/^[\s]*[-\*]\s+(.+)$/);
        
        if (listMatch) {
          if (!inList) {
            inList = true;
            listHtml = '<ul>';
          }
          listHtml += `<li>${listMatch[1]}</li>`;
        } else {
          if (inList) {
            // Close the list
            inList = false;
            processedLines.push(listHtml + '</ul>');
            listHtml = '';
          }
          if (line.trim()) {
            processedLines.push(line);
          } else {
            processedLines.push('<br>');
          }
        }
      }
      
      // Close any unclosed list
      if (inList) {
        processedLines.push(listHtml + '</ul>');
      }
      
      processed = processedLines.join('<br>');
      
      // Restore inline math
      inlineMathParts.forEach((math, index) => {
        processed = processed.replace(`###INLINEMATH${index}###`, math);
      });
      
      return processed;
    }
  }).join('');
};

export default MarkdownWithLatex;
