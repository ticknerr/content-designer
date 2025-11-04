import { htmlTemplates } from '../config/htmlTemplates';
import { 
  groupForCarousel, 
  groupForTabs, 
  groupForAccordion, 
  groupForStylisedBox 
} from './contentGrouper';
import { classifyContent } from './contentClassifier';
import { 
  stripHtml, 
  stripHtmlKeepFormatting, 
  extractListItems, 
  cleanListItemContent,
  joinContentBlocks,
  joinContentBlocksAsHtml,
  joinContentBlocksPreserveHtml
} from './htmlUtils';

/**
 * Generate HTML from content blocks with applied components
 */
export const generateHtml = (blocks, splitPoints = {}) => {
  
  if (!blocks || blocks.length === 0) return '';
  
  const processedBlocks = [];
  let i = 0;
  
  while (i < blocks.length) {
    const block = blocks[i];
    
    if (block.component) {
      // Check if this is a multi-block component
      const multiBlockComponent = isMultiBlockComponent(block.component);
      
      if (multiBlockComponent) {
        // Collect consecutive blocks with the same component
        const groupedBlocks = [block];
        let j = i + 1;
        
        while (j < blocks.length && blocks[j].component === block.component) {
          groupedBlocks.push(blocks[j]);
          j++;
        }
        
        // Get split points for this group if available
        const groupIds = groupedBlocks.map(b => b.id).join('-');
        const groupSplitPoints = splitPoints[`${block.component}-${groupIds}`] || 
                                splitPoints[groupIds] || 
                                null;
        const customisation = splitPoints[`customisation-${block.component}-${groupIds}`] || {};
        
        // Generate HTML for grouped blocks with split points
        const html = generateComponentHtml(block.component, groupedBlocks, groupSplitPoints, splitPoints, customisation);
        processedBlocks.push(html);
        i = j;
      } else {
        // Single block component
        const customisation = splitPoints[`customisation-${block.component}-${block.id}`] || {};
        const html = generateComponentHtml(block.component, [block], [], splitPoints, customisation);
        processedBlocks.push(html);
        i++;
      }
    } else {
      // No component applied
      // Check if it's a list that should have a component
      if (block.type === 'list' && block.listType) {
        // Auto-apply the list component
        const customisation = splitPoints[`customisation-${block.listType}-${block.id}`] || {};
        const html = generateComponentHtml(block.listType, [block], [], splitPoints, customisation);
        processedBlocks.push(html);
      } else {
        // Use raw content
        processedBlocks.push(block.content);
      }
      i++;
    }
  }
  
  return `<article role="article">\n${processedBlocks.join('\n')}\n</article>`;
};

/**
 * Check if a component type supports multiple blocks
 */
const isMultiBlockComponent = (componentType) => {
  const multiBlockTypes = [
    'learningObjectives',
    'accordion',
    'carousel',
    'tabs',
    'stylizedContentBox',
    'iconList',
    'numberedList',
    'bulletList',
    'alphaList',
    'numericList',
    'infoBox',
    'summaryBox',
    'exerciseBox',
    'resourceBox',
    'textColumns'
  ];
  
  return multiBlockTypes.includes(componentType);
};

/**
 * Generate an indented/nested list
 */
const generateIndentedList = (items, blocks, indentLevels, listType, subType = 'alpha') => {
  if (!items || items.length === 0) return '';
  
  const hasIndentation = Object.keys(indentLevels).some(key => indentLevels[key] > 0);
  if (!hasIndentation) {
    if (listType === 'ul') return htmlTemplates.bulletList(items);
    if (subType === 'alpha') return htmlTemplates.alphaList(items);
    return htmlTemplates.numericList(items);
  }
  
  let html = `<${listType}${listType === 'ol' && subType === 'alpha' ? ' type="a"' : ''} style="margin-top: 1rem;">`;
  let currentLevel = 0;
  let openTags = [];
  
  items.forEach((item, index) => {
    const blockId = blocks[index]?.id;
    const targetLevel = indentLevels[blockId] || 0;
    
    while (currentLevel > targetLevel) {
      html += `</li></${openTags.pop()}>`;
      currentLevel--;
    }
    
    while (currentLevel < targetLevel) {
      let nestedType;
      if (listType === 'ul') {
        nestedType = 'ul';
      } else if (listType === 'ol') {
        nestedType = subType === 'numeric' ? 'ol' : 'ol type="a"';
      }
      html += `<${nestedType} style="margin-top: 0.5rem; margin-bottom: 0.5rem;">`;
      openTags.push(listType === 'ol' ? 'ol' : listType);
      currentLevel++;
    }
    
    html += `<li>${item}`;
    
    const nextLevel = index + 1 < items.length ? (indentLevels[blocks[index + 1]?.id] || 0) : 0;
    if (nextLevel <= targetLevel) {
      html += '</li>';
    }
  });
  
  while (currentLevel > 0) {
    html += `</li></${openTags.pop()}>`;
    currentLevel--;
  }
  
  html += `</${listType}>`;
  return html;
};

/**
 * Enhanced Learning Objectives parser using the classifier
 */
const parseLearningObjectives = (blocks) => {
  // Use the classifier to help identify learning objectives content
  const suggestions = classifyContent(blocks);
  
  // Check if any blocks are classified as learning objectives
  const hasLearningObjectives = Object.values(suggestions).includes('learningObjectives');
  
  if (blocks.length === 1 && hasLearningObjectives) {
    // Single block with learning objectives - parse it completely
    return parseCompleteObjectivesBlock(blocks[0].content);
  } else if (blocks.length > 1) {
    // Multiple blocks - use intelligent parsing
    return parseMultiBlockObjectives(blocks);
  }
  
  // Fallback to simple extraction
  return {
    title: 'Learning Objectives',
    subHeading: 'By the end of this section, you will be able to:',
    objectives: extractListItems(blocks[0]?.content || '')
  };
};

/**
 * Parse a complete objectives block from a single content block
 */
const parseCompleteObjectivesBlock = (htmlContent) => {
  const result = {
    title: 'Learning Objectives',
    subHeading: 'By the end of this section, you will be able to:',
    objectives: []
  };
  
  const textContent = stripHtml(htmlContent);
  const lines = textContent.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) return result;
  
  let currentIndex = 0;
  
  // Look for title (first line that looks like a heading)
  if (currentIndex < lines.length && isLikelyObjectivesTitle(lines[currentIndex])) {
    result.title = cleanTitle(lines[currentIndex]);
    currentIndex++;
  }
  
  // Look for subheading (descriptive text about objectives)
  if (currentIndex < lines.length && isLikelySubHeading(lines[currentIndex])) {
    result.subHeading = cleanTitle(lines[currentIndex]);
    currentIndex++;
  }
  
  // Extract numbered objectives from remaining content
  const remainingLines = lines.slice(currentIndex);
  result.objectives = extractCleanObjectives(remainingLines);
  
  return result;
};

/**
 * Parse objectives from multiple blocks
 */
const parseMultiBlockObjectives = (blocks) => {
  const result = {
    title: 'Learning Objectives',
    subHeading: 'By the end of this section, you will be able to:',
    objectives: []
  };
  
  const allContent = blocks.map(b => stripHtml(b.content).trim()).filter(c => c);
  
  if (allContent.length === 0) return result;
  
  let currentIndex = 0;
  
  // Check first block for title
  if (currentIndex < allContent.length && isLikelyObjectivesTitle(allContent[currentIndex])) {
    result.title = cleanTitle(allContent[currentIndex]);
    currentIndex++;
  }
  
  // Check second block for subheading
  if (currentIndex < allContent.length && isLikelySubHeading(allContent[currentIndex])) {
    result.subHeading = cleanTitle(allContent[currentIndex]);
    currentIndex++;
  }
  
  // Extract objectives from remaining blocks
  const remainingContent = allContent.slice(currentIndex);
  result.objectives = extractCleanObjectives(remainingContent);
  
  return result;
};

/**
 * Extract and clean objectives from content array
 */
const extractCleanObjectives = (contentArray) => {
  const objectives = [];
  
  for (const item of contentArray) {
    const cleaned = cleanObjectiveItem(item);
    if (cleaned && cleaned.length > 5) {
      objectives.push(cleaned);
    }
  }
  
  return objectives;
};

/**
 * Clean individual objective items
 */
const cleanObjectiveItem = (text) => {
  if (!text) return '';
  
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^\*\*|\*\*$/g, ''); // Remove markdown bold
  cleaned = cleaned.replace(/^\d+\.\s*/, ''); // Remove "1. ", "2. " etc
  cleaned = cleaned.replace(/^[a-zA-Z]\.\s*/, ''); // Remove "a. ", "b. " etc
  cleaned = cleaned.replace(/^[•·▪▫‣⁃-]\s*/, ''); // Remove bullets
  cleaned = cleaned.replace(/\s+/g, ' ').trim(); // Clean whitespace
  
  return cleaned;
};

/**
 * Clean titles and subheadings
 */
const cleanTitle = (text) => {
  return text.replace(/^\*\*|\*\*$/g, '').trim();
};

/**
 * Check if text looks like an objectives title
 */
const isLikelyObjectivesTitle = (text) => {
  if (!text || text.length > 100) return false;
  
  const cleanText = text.replace(/^\*\*|\*\*$/g, '').toLowerCase();
  
  return (
    cleanText.includes('objective') ||
    cleanText.includes('goal') ||
    cleanText.includes('outcome') ||
    cleanText.includes('learn') ||
    cleanText.includes('will i') ||
    text.toUpperCase() === text ||
    text.endsWith('?')
  );
};

/**
 * Check if text looks like a subheading
 */
const isLikelySubHeading = (text) => {
  if (!text || text.length > 300) return false;
  
  const cleanText = text.replace(/^\*\*|\*\*$/g, '').toLowerCase();
  
  return (
    cleanText.includes('will be able to') ||
    cleanText.includes('you will') ||
    cleanText.includes('skills and knowledge') ||
    cleanText.includes('by the end') ||
    cleanText.includes('after this') ||
    cleanText.includes('provide you') ||
    /^(this|the|by|after)/i.test(cleanText)
  );
};

/**
 * Process box components (infoBox, summaryBox, exerciseBox, resourceBox)
 */
const processBoxComponent = (componentType, blocks, templateFunction) => {
  const firstBlockText = stripHtml(blocks[0].content).trim();
  const isFirstBlockHeading =
    blocks[0].type === 'heading' ||
    (firstBlockText.length < 100 &&
      !firstBlockText.includes('.') &&
      blocks.length > 1);

  // Detect whether this group contains any list markup
  const hasList = blocks.some(b => /<ul|<ol/.test(b.content));

  // Use the appropriate join method depending on whether lists are present
  const joinContent = (blockSubset) =>
    hasList
      ? joinContentBlocksPreserveHtml(blockSubset)
      : blockSubset
          .map(b => stripHtmlKeepFormatting(b.content))
          .join('</p><p style="margin-top:0.618rem;margin-bottom:0px;">');

  if (blocks.length > 1 && isFirstBlockHeading) {
    const title = firstBlockText;
    const content = joinContent(blocks.slice(1));
    return templateFunction(title, content);
  } else {
    const content = hasList
      ? joinContentBlocksPreserveHtml(blocks)
      : blocks
          .map(b => stripHtmlKeepFormatting(b.content))
          .join('<br>');
    return templateFunction(null, content);
  }
};

/**
 * Generate HTML for a specific component type
 */
const generateComponentHtml = (componentType, blocks, splitPointsData = [], allSplitPoints = {}, customisation = {}) => {
  // For single-block heading components
  if ((componentType === 'heading' || componentType === 'moduleTitle') && blocks.length === 1) {
    const text = stripHtml(blocks[0].content);
    if (componentType === 'moduleTitle') {
      return htmlTemplates.moduleTitle(text);
    }
    return htmlTemplates.heading(text, 'h3');
  }
  
  switch (componentType) {
    case 'moduleTitle':
      const moduleText = stripHtml(blocks[0].content);
      return htmlTemplates.moduleTitle(moduleText);
    
    case 'heading':
      const headingText = stripHtml(blocks[0].content);
      return htmlTemplates.heading(headingText, 'h3');
    
    case 'learningObjectives':
      const objectivesData = parseLearningObjectives(blocks);
      return htmlTemplates.learningObjectives(
        objectivesData.title,
        objectivesData.subHeading,
        objectivesData.objectives
      );
    
    case 'infoBox':
      return processBoxComponent(componentType, blocks, htmlTemplates.infoBox);
    
    case 'summaryBox':
      return processBoxComponent(componentType, blocks, htmlTemplates.summaryBox);
    
    case 'exerciseBox':
      return processBoxComponent(componentType, blocks, htmlTemplates.exerciseBox);
    
    case 'resourceBox':
      return processBoxComponent(componentType, blocks, htmlTemplates.resourceBox);
    
    case 'iconList': {
      const checkItems = blocks.length > 1 ? 
        blocks.map(b => stripHtml(b.content)) : 
        extractListItems(blocks[0].content);
      const cleanedCheckItems = checkItems.map(item => cleanListItemContent(item));
      const icon = customisation?.icon || 'circle-check';
      const colour = customisation?.colour || '#198754';
      return htmlTemplates.iconList(cleanedCheckItems, icon, colour);
    }
    
    case 'textColumns': {
      const hasList = blocks.some(b => /<ul|<ol/.test(b.content)); 
      const columnContent = hasList
        ? joinContentBlocksPreserveHtml(blocks)
        : joinContentBlocksAsHtml(blocks, false); 
      return htmlTemplates.textColumns(columnContent);
    }
    
    case 'numberedList': {
      const numberedItems = blocks.length > 1 ? 
        blocks.map(b => stripHtml(b.content)) : 
        extractListItems(blocks[0].content);
      const cleanedNumberedItems = numberedItems.map(item => cleanListItemContent(item));
      return htmlTemplates.numberedList(cleanedNumberedItems);
    }
    
    case 'bulletList': {
      const bulletItems = blocks.length > 1 ? 
        blocks.map(b => stripHtml(b.content)) : 
        extractListItems(blocks[0].content);
      const cleanedBulletItems = bulletItems.map(item => cleanListItemContent(item));
      
      const bulletIndentKey = `indent-bulletList-${blocks.map(b => b.id).join('-')}`;
      const bulletIndents = allSplitPoints[bulletIndentKey] || {};
      
      if (Object.keys(bulletIndents).length > 0 && Object.values(bulletIndents).some(v => v > 0)) {
        return generateIndentedList(cleanedBulletItems, blocks, bulletIndents, 'ul');
      }
      return htmlTemplates.bulletList(cleanedBulletItems);
    }
    
    case 'alphaList': {
      const alphaItems = blocks.length > 1 ? 
        blocks.map(b => stripHtml(b.content)) : 
        extractListItems(blocks[0].content);
      const cleanedAlphaItems = alphaItems.map(item => cleanListItemContent(item));
      
      const alphaIndentKey = `indent-alphaList-${blocks.map(b => b.id).join('-')}`;
      const alphaIndents = allSplitPoints[alphaIndentKey] || {};
      
      if (Object.keys(alphaIndents).length > 0 && Object.values(alphaIndents).some(v => v > 0)) {
        return generateIndentedList(cleanedAlphaItems, blocks, alphaIndents, 'ol', 'alpha');
      }
      return htmlTemplates.alphaList(cleanedAlphaItems);
    }
    
    case 'numericList': {
      const numericItems = blocks.length > 1 ? 
        blocks.map(b => stripHtml(b.content)) : 
        extractListItems(blocks[0].content);
      const cleanedNumericItems = numericItems.map(item => cleanListItemContent(item));
      
      const numericIndentKey = `indent-numericList-${blocks.map(b => b.id).join('-')}`;
      const numericIndents = allSplitPoints[numericIndentKey] || {};
      
      if (Object.keys(numericIndents).length > 0) {
        return generateIndentedList(cleanedNumericItems, blocks, numericIndents, 'ol', 'numeric');
      }
      return htmlTemplates.numericList(cleanedNumericItems);
    }
    
    case 'accordion': {
      const accordionGroups = groupForAccordion(blocks, splitPointsData);
    
      const accordionItems = accordionGroups.map(group => {
        const hasList = group.content.some(b => /<ul|<ol/.test(b.content));
        return {
          title: stripHtml(group.title || 'Section'),
          content: hasList
            ? joinContentBlocksPreserveHtml(group.content)
            : joinContentBlocksAsHtml(group.content, true),
        };
      });
    
      return htmlTemplates.accordion(accordionItems);
    }
    
    case 'carousel': {
      const carouselGroups = groupForCarousel(blocks, splitPointsData);
    
      const carouselItems = carouselGroups.map(group => {
        const hasList = group.content.some(b => /<ul|<ol/.test(b.content));
        return {
          title: group.title ? stripHtml(group.title) : '',
          content: hasList
            ? joinContentBlocksPreserveHtml(group.content)
            : joinContentBlocks(group.content, true),
        };
      });
    
      return htmlTemplates.carousel(carouselItems);
    }
    
    case 'tabs': {
      const tabGroups = groupForTabs(blocks, splitPointsData);
    
      const tabItems = tabGroups.map((group, index) => {
        let title = stripHtml(group.title || `Tab ${index + 1}`);
        if (title.length > 30) {
          title = title.substring(0, 27) + '...';
        }
    
        const hasList = group.content.some(b => /<ul|<ol/.test(b.content));
    
        return {
          title,
          content: hasList
            ? joinContentBlocksPreserveHtml(group.content)
            : joinContentBlocks(group.content, false),
        };
      });
    
      return htmlTemplates.tabs(tabItems);
    }
    
    case 'stylizedContentBox': {
      const boxGroups = groupForStylisedBox(blocks, splitPointsData);
    
      const boxItems = boxGroups.map(group => {
        const hasList = group.content.some(b => /<ul|<ol/.test(b.content));
        return {
          title: group.title ? stripHtml(group.title) : '',
          content: hasList
            ? joinContentBlocksPreserveHtml(group.content)
            : joinContentBlocks(group.content, false),
        };
      });
    
      return htmlTemplates.stylizedContentBox(boxItems);
    }
    
    default:
      return blocks.map(b => b.content).join('\n');
  }
};