import { stripHtml } from './htmlUtils';

/**
 * Smart content grouping utility for multi-section components
 * Groups headings with their associated content for tabs, carousel, accordion, etc.
 * Returns clean structured data without HTML processing
 */

/**
 * Group content blocks for tabs and accordion components
 * Structure: Optional main heading, then groups of [heading, content...]
 */
export const groupContentForTabsAccordion = (blocks) => {
  const result = {
    mainHeading: null,
    groups: []
  };
  
  // Check if first block is a heading that should be the main title
  let startIndex = 0;
  if (blocks.length > 0 && isBlockHeading(blocks[0])) {
    // Check if there's another heading soon (within next 3 blocks)
    const hasAnotherHeadingSoon = blocks.slice(1, 4).some(b => isBlockHeading(b));
    
    if (hasAnotherHeadingSoon) {
      // First heading is likely a main title
      result.mainHeading = blocks[0].content;
      startIndex = 1;
    }
  }
  
  // Group remaining content by headings
  let currentGroup = null;
  
  for (let i = startIndex; i < blocks.length; i++) {
    const block = blocks[i];
    
    if (isBlockHeading(block)) {
      // Start new group
      if (currentGroup && currentGroup.content.length > 0) {
        result.groups.push(currentGroup);
      }
      currentGroup = {
        title: block.content,
        content: []
      };
    } else {
      // Add to current group
      if (currentGroup) {
        currentGroup.content.push(block);
      } else {
        // No heading yet, create default group
        currentGroup = {
          title: `Section 1`,
          content: [block]
        };
      }
    }
  }
  
  // Add last group
  if (currentGroup) {
    if (currentGroup.content.length > 0) {
      result.groups.push(currentGroup);
    } else if (currentGroup.title) {
      // Edge case: heading at the end with no content
      result.groups.push({
        title: currentGroup.title,
        content: []
      });
    }
  }
  
  // If no groups created, treat all as single group
  if (result.groups.length === 0 && blocks.length > 0) {
    result.groups.push({
      title: 'Content',
      content: blocks.slice(startIndex)
    });
  }
  
  return result;
};

/**
 * Group content for carousel component
 * Each slide = heading + associated content
 */
export const groupForCarousel = (blocks, splitPoints = []) => {
  // If manual split points provided, use them
  if (splitPoints && splitPoints.length > 0) {
    return groupByManualSplits(blocks, splitPoints);
  }
  
  // Otherwise use automatic heading-based grouping
  const grouped = groupContentForTabsAccordion(blocks);
  
  return grouped.groups.map((group, index) => ({
    title: group.title || `Slide ${index + 1}`,
    content: group.content
  }));
};

/**
 * Group content for tabs component
 */
export const groupForTabs = (blocks, splitPoints = []) => {
  // If manual split points provided, use them
  if (splitPoints && splitPoints.length > 0) {
    const manualGroups = groupByManualSplits(blocks, splitPoints);
    return manualGroups.map((g, index) => {
      // Ensure we have a proper title
      let title = g.title;
      let content = g.content || [];
      
      // Check if we need to extract title from content blocks
      if ((!title || title === 'Section') && content.length > 0) {
        const firstBlock = content[0];
        if (isBlockHeading(firstBlock)) {
          title = firstBlock.content;
          // Remove the heading from content since it's now the title
          content = content.slice(1);
        }
      }
      
      if (!title || title === 'Section') {
        title = `Tab ${index + 1}`;
      }
      
      return {
        title: title,
        content: content
      };
    });
  }
  
  // Automatic grouping
  const grouped = groupContentForTabsAccordion(blocks);
  
  return grouped.groups.map((group, index) => {
    let title = group.title;
    
    // Ensure we have a meaningful title
    if (!title || title === 'Content' || title === `Section ${index + 1}`) {
      title = `Tab ${index + 1}`;
    }
    
    return {
      title: title,
      content: group.content
    };
  });
};

/**
 * Group content for accordion component
 */
export const groupForAccordion = (blocks, splitPoints = []) => {
  // If splitPoints is null or undefined, auto-detect
if (splitPoints === null || splitPoints === undefined) {
  const grouped = groupContentForTabsAccordion(blocks);
  return grouped.groups;
}

// If splitPoints is an array (even empty), use manual splits
if (Array.isArray(splitPoints)) {
  return groupByManualSplits(blocks, splitPoints);
}
  
  return grouped.groups.map((group, index) => ({
    title: group.title || `Section ${index + 1}`,
    content: group.content
  }));
};

/**
 * Group content for stylised content box
 * Allows manual splitting for better control
 */
export const groupForStylisedBox = (blocks, splitPoints = []) => {
  // If manual split points provided, use them
  if (splitPoints && splitPoints.length > 0) {
    return groupByManualSplits(blocks, splitPoints);
  }
  
  // Auto-group by headings or create balanced columns
  const headingIndices = [];
  blocks.forEach((block, index) => {
    if (isBlockHeading(block)) {
      headingIndices.push(index);
    }
  });
  
  // If we have clear heading divisions, use them
  if (headingIndices.length > 0 && headingIndices.length <= 4) {
    const groups = [];
    
    headingIndices.forEach((headingIndex, i) => {
      const nextHeadingIndex = headingIndices[i + 1] || blocks.length;
      const title = blocks[headingIndex].content;
      const contentBlocks = blocks.slice(headingIndex + 1, nextHeadingIndex);
      
      groups.push({
        title: title,
        content: contentBlocks
      });
    });
    
    return groups;
  }
  
  // Otherwise create balanced columns (max 3)
  const targetColumns = Math.min(3, Math.ceil(blocks.length / 2));
  const itemsPerColumn = Math.ceil(blocks.length / targetColumns);
  const columns = [];
  
  for (let i = 0; i < blocks.length; i += itemsPerColumn) {
    const columnBlocks = blocks.slice(i, Math.min(i + itemsPerColumn, blocks.length));
    const firstIsHeading = isBlockHeading(columnBlocks[0]);
    
    columns.push({
      title: firstIsHeading ? columnBlocks[0].content : '',
      content: columnBlocks.slice(firstIsHeading ? 1 : 0)
    });
  }
  
  return columns;
};

/**
 * Group blocks by manual split points
 */
const groupByManualSplits = (blocks, splitPoints) => {
  const groups = [];
  let startIndex = 0;
  
  // Sort split points
  const sortedSplits = [...splitPoints].sort((a, b) => a - b);
  
  sortedSplits.forEach(splitIndex => {
    if (splitIndex > startIndex && splitIndex <= blocks.length) {
      const groupBlocks = blocks.slice(startIndex, splitIndex);
      const group = createGroupFromBlocks(groupBlocks);
      if (group) groups.push(group);
      startIndex = splitIndex;
    }
  });
  
  // Add remaining blocks
  if (startIndex < blocks.length) {
    const groupBlocks = blocks.slice(startIndex);
    const group = createGroupFromBlocks(groupBlocks);
    if (group) groups.push(group);
  }
  
  return groups;
};

/**
 * Create a group from a set of blocks
 */
const createGroupFromBlocks = (blocks) => {
  if (blocks.length === 0) return null;
  
  const firstIsHeading = isBlockHeading(blocks[0]);
  
  if (firstIsHeading) {
    return {
      title: blocks[0].content,
      content: blocks.slice(1)
    };
  }
  
  // No clear heading, use generic title
  return {
    title: '',
    content: blocks
  };
};

/**
 * Check if a block should be treated as a heading
 * Note: This function works with raw block data and should not process HTML
 */
const isBlockHeading = (block) => {
  // Direct check for heading type
  if (block.type === 'heading') return true;
  
  // Strip HTML and check text patterns
  const text = stripHtml(block.content || '');
  
  // Skip empty or very long text
  if (!text || text.length > 100) return false;
  
  // Check if it has sentence-ending punctuation (likely not a heading)
  if (text.match(/[.!?]$/)) return false;
  
  // Check various heading patterns
  const headingPatterns = [
    /^(introduction|overview|summary|conclusion|background|objectives?|goals?)/i,
    /^(part|chapter|section|module|unit|lesson|topic|week)\s+/i,
    /^\d+[\.\)]\s+/,
    /^[A-Z][^.!?]*$/,
    /^(what|why|how|when|where|who)\s+/i
  ];
  
  return headingPatterns.some(pattern => pattern.test(text));
};

/**
 * Analyse if blocks should be grouped together
 */
export const shouldGroupBlocks = (blocks) => {
  // Look for multiple headings which indicate natural sections
  const headingCount = blocks.filter(block => isBlockHeading(block)).length;
  
  // If we have 2+ headings, definitely group
  if (headingCount >= 2) return true;
  
  // If blocks are all short, they might work well grouped
  // Note: Length checking assumes block.content is already processed text
  const avgLength = blocks.reduce((sum, block) => {
    const content = block.content || '';
    return sum + (typeof content === 'string' ? content.length : 0);
  }, 0) / blocks.length;
  
  if (avgLength < 200 && blocks.length >= 3) return true;
  
  return false;
};