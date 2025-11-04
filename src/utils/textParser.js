import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';
import nlp from 'compromise';
import { stripHtml, stripHtmlForComparison } from './htmlUtils';


/**
 * Detect if text content represents a list item
 * Returns: { isList: boolean, listType: 'bulletList'|'alphaList'|'numericList'|null, cleanText: string }
 */
const analyzeTextForListPattern = (text) => {
  if (!text || typeof text !== 'string') return { isList: false, listType: null, cleanText: text };
  
  const trimmed = text.trim();
  
  // Don't treat very long text as a list item (likely a paragraph)
  // Word list items are typically under 500 characters per item
  if (trimmed.length > 500) {
    return { isList: false, listType: null, cleanText: trimmed };
  }
  
  // Bullet patterns - Word uses various bullet characters and symbols
  // These are unambiguous - they're clearly list markers
  const unambiguousBulletPatterns = [
    /^[•·○●◦‣⁃▪▫■□✓✔➢➣➤➔→⇒]\s+/,  // Common bullet characters
    /^[\u2022\u2023\u2043\u204C\u204D\u2219\u25CB\u25CF\u25E6]\s+/,  // Unicode bullets
  ];
  
  for (const pattern of unambiguousBulletPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isList: true,
        listType: 'bulletList',
        cleanText: trimmed.replace(pattern, '').trim()
      };
    }
  }
  
  // Ambiguous patterns - only treat as list if followed by content that looks like a list item
  // (not a complete sentence with multiple clauses)
  const ambiguousBulletPatterns = [
    /^[-−–—]\s+/,  // Dashes and hyphens
    /^[*]\s+/,  // Asterisk
  ];
  
  for (const pattern of ambiguousBulletPatterns) {
    if (pattern.test(trimmed)) {
      const textAfterMarker = trimmed.replace(pattern, '').trim();
      
      // Don't treat as list if:
      // - Text after marker is very long (>300 chars) - likely a paragraph
      // - Text contains multiple sentences (more than 2 periods)
      // - Text starts with lowercase (suggests it's mid-sentence)
      const sentenceCount = (textAfterMarker.match(/[.!?]/g) || []).length;
      const startsWithCapital = /^[A-Z]/.test(textAfterMarker);
      
      if (textAfterMarker.length < 300 && sentenceCount <= 2 && startsWithCapital) {
        return {
          isList: true,
          listType: 'bulletList',
          cleanText: textAfterMarker
        };
      }
      
      // If it doesn't look like a list item, don't treat it as one
      return { isList: false, listType: null, cleanText: trimmed };
    }
  }
  
  // Numeric patterns - 1. 2. 3. or 1) 2) 3)
  // Only match if followed by space (not "1.5" or "2.0")
  const numericPatterns = [
    /^\d+[\.\)]\s+/,  // 1. or 1) followed by space
    /^\(\d+\)\s+/,  // (1) followed by space
  ];
  
  for (const pattern of numericPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isList: true,
        listType: 'numericList',
        cleanText: trimmed.replace(pattern, '').trim()
      };
    }
  }
  
  // Alphabetic patterns - a. b. c. or a) b) c)
  // Only single letters followed by punctuation and space
  const alphaPatterns = [
    /^[a-z][\.\)]\s+/i,  // a. or a) followed by space
    /^\([a-z]\)\s+/i,  // (a) followed by space
  ];
  
  for (const pattern of alphaPatterns) {
    if (pattern.test(trimmed)) {
      const textAfterMarker = trimmed.replace(pattern, '').trim();
      
      // Additional check: text should start with capital letter for list items
      // This prevents "a. m." or "a. k. a." from being treated as lists
      if (/^[A-Z]/.test(textAfterMarker) || textAfterMarker.length > 20) {
        return {
          isList: true,
          listType: 'alphaList',
          cleanText: textAfterMarker
        };
      }
      
      return { isList: false, listType: null, cleanText: trimmed };
    }
  }
  
  // Roman numeral patterns
  // Only at start, followed by period/paren and space
  const romanPatterns = [
    /^(?:i{1,3}|iv|v|vi{0,3}|ix|x|xi{0,3})[\.\)]\s+/i,  // i. ii. iii. etc
  ];
  
  for (const pattern of romanPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isList: true,
        listType: 'numericList',
        cleanText: trimmed.replace(pattern, '').trim()
      };
    }
  }
  
  return { isList: false, listType: null, cleanText: trimmed };
};

/**
 * Detect the type of list from HTML element
 * Returns: 'bulletList', 'alphaList', 'numericList', or null
 */
const detectListType = (listElement) => {
  if (!listElement) return null;
  
  const tagName = listElement.tagName.toLowerCase();
  
  // Check for unordered list (bullet list)
  if (tagName === 'ul') {
    return 'bulletList';
  }
  
  // Check for ordered list
  if (tagName === 'ol') {
    // Check the type attribute
    const typeAttr = listElement.getAttribute('type');
    
    if (typeAttr === 'a' || typeAttr === 'A') {
      return 'alphaList';
    }
    
    // Check the style attribute for list-style-type
    const style = listElement.getAttribute('style') || '';
    if (style.includes('list-style-type') && 
        (style.includes('lower-alpha') || style.includes('upper-alpha') || 
         style.includes('lower-latin') || style.includes('upper-latin'))) {
      return 'alphaList';
    }
    
    // Check computed style if available (for pasted content)
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const computed = window.getComputedStyle(listElement);
      const listStyleType = computed.getListStyleType;
      if (listStyleType === 'lower-alpha' || listStyleType === 'upper-alpha' ||
          listStyleType === 'lower-latin' || listStyleType === 'upper-latin') {
        return 'alphaList';
      }
    }
    
    // Check first few items for alphabetic pattern
    const items = listElement.querySelectorAll('li');
    if (items.length >= 2) {
      // Look at the first item's ::marker or text content
      const firstItemText = items[0].textContent.trim();
      const secondItemText = items[1].textContent.trim();
      
      // Check if items start with letters
      if (/^[a-z][\.\)]\s/i.test(firstItemText) && /^[a-z][\.\)]\s/i.test(secondItemText)) {
        return 'alphaList';
      }
    }
    
    // Default ordered list is numeric
    return 'numericList';
  }
  
  return null;
};

/**
 * Check if consecutive list blocks should be merged
 */
const shouldMergeLists = (block1, block2) => {
  if (!block1 || !block2) return false;
  if (block1.type !== 'list' || block2.type !== 'list') return false;
  if (!block1.listType || !block2.listType) return false;
  
  // Only merge if they're the same list type
  return block1.listType === block2.listType;
};

/**
 * Merge consecutive list blocks of the same type
 */
const mergeConsecutiveLists = (blocks) => {
  const merged = [];
  let i = 0;
  
  while (i < blocks.length) {
    const currentBlock = blocks[i];
    
    if (currentBlock.type === 'list' && currentBlock.listType) {
      // Start collecting consecutive lists of the same type
      const listGroup = [currentBlock];
      let j = i + 1;
      
      while (j < blocks.length && shouldMergeLists(currentBlock, blocks[j])) {
        listGroup.push(blocks[j]);
        j++;
      }
      
      if (listGroup.length > 1) {
        // Merge the lists
        const tmp = document.createElement('div');
        listGroup.forEach(block => {
          tmp.innerHTML += block.content;
        });
        
        // Extract all list items
        const allItems = tmp.querySelectorAll('li');
        const listTag = currentBlock.listType === 'bulletList' ? 'ul' : 'ol';
        const typeAttr = currentBlock.listType === 'alphaList' ? ' type="a"' : '';
        
        let mergedContent = `<${listTag}${typeAttr}>`;
        allItems.forEach(item => {
          mergedContent += item.outerHTML;
        });
        mergedContent += `</${listTag}>`;
        
        merged.push({
          ...currentBlock,
          content: mergedContent
        });
        
        i = j;
      } else {
        merged.push(currentBlock);
        i++;
      }
    } else {
      merged.push(currentBlock);
      i++;
    }
  }
  
  return merged;
};


/**
 * Parse HTML or text content into structured blocks
 */
export const parseContent = (content) => {
  
  if (!content) return [];

  const blocks = [];
  let alreadyProcessed = false;

  // If content is plain text, convert to HTML
  if (!content.includes('<')) {
    content = content
      .split('\n\n')
      .map(para => `<p>${para}</p>`)
      .join('');
    alreadyProcessed = true;
  }

  // Clean HTML - allow formatting tags
  const cleanHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'br', 'div', 'span', 'a'],
    ALLOWED_ATTR: ['data-block-id', 'data-block-type', 'class', 'href', 'target', 'rel'],
    KEEP_CONTENT: true,
    FORBID_TAGS: ['b', 'i'],
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false
  });

  // Parse HTML into DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');

  // Process each top-level element
  const elements = doc.body.children;

  for (let element of elements) {
    if (
      element.classList?.contains('component-indicator') ||
      element.classList?.contains('suggestion-indicator') ||
      !element.textContent.trim()
    ) {
      continue;
    }

    // Determine block type
    let type = 'paragraph';
    let content = element.outerHTML;
    let detectedListType = null; // Track list type

    if (element.tagName.match(/^H[1-6]$/)) {
      type = 'heading';
    } else if (element.tagName === 'UL' || element.tagName === 'OL') {
      type = 'list';
      // Detect the specific list type
      detectedListType = detectListType(element);      
    } else if (element.tagName === 'DIV' && element.classList?.contains('content-block')) {
      const blockContent = Array.from(element.childNodes)
        .filter(node =>
          !node.classList?.contains('component-indicator') &&
          !node.classList?.contains('suggestion-indicator')
        )
        .map(node => node.nodeType === 3 ? node.textContent : node.outerHTML)
        .join('');
      content = blockContent;
      type = element.dataset.blockType || 'paragraph';
    } else if (element.tagName === 'P') {
      const text = element.textContent.trim();
      if (shouldBeHeading(text)) {
        type = 'heading';
      }
    }

    // Create block object
    const block = {
      id: element.dataset?.blockId || uuidv4(),
      type: type,
      content: content,
      component: null
    };

    console.log("block",block);
    // Add listType if detected
    if (detectedListType) {
      block.listType = detectedListType;
    }

    blocks.push(block);
  }

  // If no blocks found but there's content, create a single paragraph block
  if (blocks.length === 0 && content.trim()) {
    blocks.push({
      id: uuidv4(),
      type: 'paragraph',
      content: `<p>${content}</p>`,
      component: null
    });
  }
  
  // Post-process blocks to detect Word-style lists in paragraphs
  const processedForLists = detectAndConvertParagraphLists(blocks);
  
  // Don't merge lists - keep them as separate blocks so indentation control works
  // Each list item is now its own block with the listType and component already set
  
  return processedForLists;
};


/**
 * Detect paragraph blocks that are actually list items and convert them
 */
function detectAndConvertParagraphLists(blocks) {
  const result = [];
  let currentListGroup = null;
  let currentListType = null;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Skip if already identified as a list
    if (block.type === 'list') {
      // If we were building a list group, push it
      if (currentListGroup && currentListGroup.length > 0) {
        const convertedBlocks = convertParagraphsToList(currentListGroup, currentListType);
        result.push(...convertedBlocks);
        currentListGroup = null;
        currentListType = null;
      }
      result.push(block);
      continue;
    }
    
    // Check if paragraph content looks like a list item
    if (block.type === 'paragraph') {
      const text = stripHtml(block.content);
      const analysis = analyzeTextForListPattern(text);
      
      if (analysis.isList) {
        // Start or continue a list group
        if (!currentListGroup) {
          currentListGroup = [];
          currentListType = analysis.listType;
        }
        
        // If list type changed, push previous group and start new one
        if (currentListType !== analysis.listType) {
          if (currentListGroup.length > 0) {
            const convertedBlocks = convertParagraphsToList(currentListGroup, currentListType);
            result.push(...convertedBlocks);
          }
          currentListGroup = [];
          currentListType = analysis.listType;
        }
        
        currentListGroup.push({
          ...block,
          cleanText: analysis.cleanText,
          originalContent: block.content
        });
      } else {
        // Not a list item - push any accumulated list group
        if (currentListGroup && currentListGroup.length > 0) {
          const convertedBlocks = convertParagraphsToList(currentListGroup, currentListType);
          result.push(...convertedBlocks);
          currentListGroup = null;
          currentListType = null;
        }
        result.push(block);
      }
    } else {
      // Not a paragraph - push any accumulated list group
      if (currentListGroup && currentListGroup.length > 0) {
        const convertedBlocks = convertParagraphsToList(currentListGroup, currentListType);
        result.push(...convertedBlocks);
        currentListGroup = null;
        currentListType = null;
      }
      result.push(block);
    }
  }
  
  // Push any remaining list group
  if (currentListGroup && currentListGroup.length > 0) {
    const convertedBlocks = convertParagraphsToList(currentListGroup, currentListType);
    result.push(...convertedBlocks);
  }
  
  return result;
}

/**
 * Convert a group of paragraph blocks into separate list item blocks
 * This matches the structure created when manually applying list components
 */
function convertParagraphsToList(paragraphBlocks, listType) {
  if (!paragraphBlocks || paragraphBlocks.length === 0) return [];
  
  // Create separate blocks for each list item (matching manual application)
  return paragraphBlocks.map(block => {
    // Extract the text, preserving any formatting
    const contentWithFormatting = stripHtmlKeepFormatting(block.originalContent);
    
    // Remove the list marker from the content
    const text = stripHtml(block.originalContent);
    const analysis = analyzeTextForListPattern(text);
    
    // Rebuild with formatting but without list marker
    let itemContent;
    if (contentWithFormatting.includes('<')) {
      // Has formatting - need to remove marker carefully
      const tmp = document.createElement('div');
      tmp.innerHTML = contentWithFormatting;
      const textContent = tmp.textContent || tmp.innerText;
      const cleanTextContent = analyzeTextForListPattern(textContent).cleanText;
      
      // Replace the text content while preserving formatting
      itemContent = contentWithFormatting.replace(textContent.trim(), cleanTextContent);
    } else {
      itemContent = analysis.cleanText;
    }
    
    // Create a paragraph block (not a full list structure)
    // The component will be applied and will handle rendering as a list
    return {
      id: block.id,
      type: 'paragraph',
      content: `<p>${itemContent}</p>`,
      component: listType,
      listType: listType
    };
  });
}

// Helper function to strip HTML but keep formatting (needed for the converter)
function stripHtmlKeepFormatting(html) {
  if (!html || typeof html !== 'string') return '';
  
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  const processNode = (node) => {
    if (node.nodeType === 3) return node.textContent;
    
    if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      const formattingTags = ['strong', 'em', 'u', 'a', 'b', 'i'];
      
      let content = '';
      for (let child of node.childNodes) {
        content += processNode(child);
      }
      
      if (formattingTags.includes(tag)) {
        if (tag === 'a') {
          const href = node.getAttribute('href') || '';
          return `<a href="${href}">${content}</a>`;
        }
        if (tag === 'b') return `<strong>${content}</strong>`;
        if (tag === 'i') return `<em>${content}</em>`;
        return `<${tag}>${content}</${tag}>`;
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
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
const calculateSimilarity = (str1, str2) => {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Check if text should be treated as a heading
 */
const shouldBeHeading = (text) => {
  if (text.length > 100 || (text.match(/[.!?]/g) || []).length > 1) {
    return false;
  }

  const headingPatterns = [
    /^(introduction|overview|summary|conclusion|background|objectives?|goals?)/i,
    /^(part|chapter|section|module|unit|lesson|topic|week)\s+/i,
    /^\d+[\.\)]\s+/,
    /^[A-Z][^.!?]*$/,
    /^(what|why|how|when|where|who)\s+/i
  ];

  if (headingPatterns.some(pattern => pattern.test(text))) {
    return true;
  }

  const doc = nlp(text);
  const isCapitalised = text[0] === text[0].toUpperCase();
  const wordCount = text.split(' ').length;
  const hasNouns = doc.nouns().length > 0;
  const hasNoPunctuation = !text.match(/[.!?]$/);

  if (isCapitalised && wordCount < 8 && hasNouns && hasNoPunctuation) {
    return true;
  }

  return false;
};

