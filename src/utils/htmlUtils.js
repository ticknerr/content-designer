/**
 * HTML processing utilities
 * Handles stripping, formatting, and text extraction from HTML content
 */

/**
 * Strip all HTML tags from content, returning plain text
 */
export const stripHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Strip HTML but preserve formatting tags (strong, em, u)
 */
export const stripHtmlKeepFormatting = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  // Create a temporary div
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // Walk through and preserve only formatting tags and links
  const processNode = (node) => {
    if (node.nodeType === 3) { // Text node
      return node.textContent;
    }
    
    if (node.nodeType === 1) { // Element node
      const tag = node.tagName.toLowerCase();
      // Preserve semantic formatting tags and links
      const formattingTags = ['strong', 'em', 'u', 'a'];
      
      let content = '';
      for (let child of node.childNodes) {
        content += processNode(child);
      }
      
      if (formattingTags.includes(tag)) {
        // Special handling for links to preserve href
        if (tag === 'a') {
          const href = node.getAttribute('href') || '';
          const target = node.getAttribute('target') || '';
          const rel = node.getAttribute('rel') || '';
          let attrs = ` href="${href}"`;
          if (target) attrs += ` target="${target}"`;
          if (rel) attrs += ` rel="${rel}"`;
          // Ensure external links open in new tab and have security
          if (href && !target) {
            attrs += ` target="_blank" rel="noopener noreferrer"`;
          }
          return `<${tag}${attrs}>${content}</${tag}>`;
        }
        return `<${tag}>${content}</${tag}>`;
      }
      
      // Convert b to strong and i to em if they slipped through
      if (tag === 'b') {
        return `<strong>${content}</strong>`;
      }
      if (tag === 'i') {
        return `<em>${content}</em>`;
      }
      
      return content;
    }
    
    return '';
  };
  
  let result = '';
  for (let child of tmp.childNodes) {
    result += processNode(child);
  }
  
  return result;
};

/**
 * Truncate title to specified length, preferring word boundaries
 */
export const truncateTitle = (title, maxLength = 30) => {
  if (!title) return 'Tab';
  if (title.length <= maxLength) return title;
  
  // Try to break at a word boundary
  const truncated = title.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength - 10) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

/**
 * Clean and trim text content
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.trim();
};

/**
 * Wrap content in paragraph tags if not already wrapped
 */
export const wrapInParagraph = (content) => {
  if (!content) return '';
  
  // If already has block-level HTML, return as is
  if (content.includes('<p>') || content.includes('<div>')) {
    return content;
  }
  
  return `<p>${content}</p>`;
};

/**
 * Join multiple content blocks with proper HTML structure
 */
export const joinContentBlocks = (blocks, preserveFormatting = false) => {
  if (!blocks || blocks.length === 0) return '';
  
  const processor = preserveFormatting ? stripHtmlKeepFormatting : stripHtml;
  
  return blocks
    .map(block => {
      if (typeof block === 'string') return processor(block);
      if (block.content) return processor(block.content);
      return '';
    })
    .filter(text => text.length > 0)
    .join(' ');
};

/**
 * Join content blocks as HTML paragraphs
 */
export const joinContentBlocksAsHtml = (blocks, preserveFormatting = true) => {
  if (!blocks || blocks.length === 0) return '';
  
  const processor = preserveFormatting ? stripHtmlKeepFormatting : stripHtml;
  
  return blocks
    .map(block => {
      if (typeof block === 'string') {
        const content = processor(block);
        return content ? `<p>${content}</p>` : '';
      }
      if (block.content) {
        const content = processor(block.content);
        return content ? `<p>${content}</p>` : '';
      }
      return '';
    })
    .filter(html => html.length > 0)
    .join('');
};

/**
 * Extract first sentence from text
 */
export const extractFirstSentence = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return '';
  
  const cleaned = cleanText(text);
  const match = cleaned.match(/^[^.!?]+/);
  const sentence = match ? match[0] : cleaned;
  
  return sentence.substring(0, maxLength);
};

/**
 * Extract list items from HTML content preserving formatting
 */
export const extractListItems = (html) => {
  if (!html || typeof html !== 'string') return [];
  
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  const items = [];
  const listItems = tmp.querySelectorAll('li');
  
  if (listItems.length > 0) {
    listItems.forEach(item => {
      let content = item.innerHTML.trim();
      content = cleanListItemContent(content);
      if (content) {
        items.push(content);
      }
    });
  } else {
    const paragraphs = tmp.querySelectorAll('p');
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => {
        let content = p.innerHTML.trim();
        content = cleanListItemContent(content);
        if (content) {
          items.push(content);
        }
      });
    } else {
      let text = tmp.innerHTML;
      const lines = text.split(/\n|<br\s*\/?>/i);
      lines.forEach(line => {
        let content = line.trim();
        content = cleanListItemContent(content);
        if (content && content.length > 2) {
          items.push(content);
        }
      });
    }
  }
  
  return items.filter(item => item && item.trim().length > 0);
};

/**
 * Join content blocks preserving all raw HTML (including lists)
 */
export const joinContentBlocksPreserveHtml = (blocks) => {
  if (!blocks || blocks.length === 0) return '';
  return blocks
    .map(b => typeof b === 'string' ? b : (b.content || ''))
    .join('\n');
};

/**
 * Clean list item content by removing numbering and excess whitespace
 */
export const cleanListItemContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  let cleaned = content;
  
  // First, preserve any links by temporarily replacing them
  const linkPlaceholders = [];
  cleaned = cleaned.replace(/<a\b[^>]*>.*?<\/a>/gi, (match) => {
    linkPlaceholders.push(match);
    return `__LINK_${linkPlaceholders.length - 1}__`;
  });
  
  // Remove paragraph tags
  cleaned = cleaned.replace(/^<p[^>]*>|<\/p>$/gi, '');
  // Remove various numbering formats
  cleaned = cleaned.replace(/^\s*\d+\.\s+/, ''); // "1. "
  cleaned = cleaned.replace(/^\s*[a-zA-Z]\.\s+/, ''); // "a. "
  cleaned = cleaned.replace(/^\s*(?:i{1,3}|iv|v|vi{0,3}|ix|x)\.\s+/i, ''); // Roman numerals
  cleaned = cleaned.replace(/^\s*\([a-zA-Z0-9]+\)\s+/, ''); // "(a) "
  cleaned = cleaned.replace(/^\s*[•·▪▫‣⁃-]\s+/, ''); // Bullets
  cleaned = cleaned.replace(/^\s+/, ''); // Leading whitespace
  cleaned = cleaned.replace(/&nbsp;/g, ' '); // Non-breaking spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim(); // Normalize whitespace
  
  // Additional check for list indicators at start
  const listIndicators = /^(\d+[\.\)]\s*|[a-zA-Z][\.\)]\s*|[•·▪▫‣⁃-]\s*)/;
  if (listIndicators.test(cleaned)) {
    cleaned = cleaned.replace(listIndicators, '').trim();
  }
  
  // Restore links
  linkPlaceholders.forEach((link, index) => {
    cleaned = cleaned.replace(`__LINK_${index}__`, link);
  });
  
  return cleaned;
};


/**
 * Strip HTML and normalize for content comparison
 */
export const stripHtmlForComparison = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = (tmp.textContent || tmp.innerText || '').trim();
  return text.replace(/\s+/g, ' ').toLowerCase();
};