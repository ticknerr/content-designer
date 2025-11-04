import nlp from 'compromise';
import { stripHtml } from './htmlUtils';

/**
 * Classify content blocks and suggest appropriate design components
 */
export const classifyContent = (blocks) => {
  const suggestions = {};
  
  blocks.forEach(block => {
    const suggestion = getSuggestionForBlock(block);
    if (suggestion) {
      suggestions[block.id] = suggestion;
    }
  });
  
  return suggestions;
};

/**
 * Get suggestion for a single block based on content analysis
 */
const getSuggestionForBlock = (block) => {
  const text = stripHtml(block.content).toLowerCase();
  const doc = nlp(text);
  
  // Check for headings first
  if (block.type === 'heading' || shouldBeHeading(text, block)) {
    const headingText = stripHtml(block.content);
    // Check if it's a module or chapter title
    if (headingText.match(/^(module|chapter|unit|section|lesson)\s+\d+/i)) {
      return 'moduleTitle';
    }
    return 'heading';
  }
  
  // Check for learning objectives patterns
  if (containsLearningObjectives(text)) {
    return 'learningObjectives';
  }
  
  // Check for summary indicators
  if (containsSummary(text)) {
    return 'summaryBox';
  }
  
  // Check for exercise/question patterns
  if (containsExercise(text)) {
    return 'exerciseBox';
  }
  
  // Check for resource/link patterns
  if (containsResourceLinks(text)) {
    return 'resourceBox';
  }
  
  // Check for important/note patterns
  if (containsImportantNote(text)) {
    return 'infoBox';
  }
  
  // Check for lists
  if (block.type === 'list') {
    // Check for action items or requirements
    if (containsActionItems(text)) {
      return 'iconList';
    }
    // Check for steps or procedures
    if (containsSteps(text)) {
      return 'numberedList';
    }
    return 'bulletList';
  }
  
  // For multiple related paragraphs, might suggest tabs or accordion
  // This would need context from surrounding blocks
  
  return null;
};

/**
 * Check if a block should be treated as a heading
 */
const shouldBeHeading = (text, block) => {
  // Short text that looks like a title
  if (text.length < 100 && !text.includes('.') && block.type === 'paragraph') {
    const doc = nlp(text);
    
    // Check if it starts with a capital and has title-like characteristics
    const isCapitalised = text[0] === text[0].toUpperCase();
    const wordCount = text.split(' ').length;
    const hasNouns = doc.nouns().length > 0;
    
    // Patterns that indicate headings
    const headingPatterns = [
      /^(introduction|overview|summary|conclusion|background|objectives?|goals?)/i,
      /^(part|chapter|section|module|unit|lesson|topic|week)\s+/i,
      /^\d+[\.\)]\s+/,  // Numbered headings like "1. Introduction"
      /^[A-Z][^.!?]*$/  // Capitalised text with no sentence punctuation
    ];
    
    const matchesPattern = headingPatterns.some(pattern => pattern.test(text));
    
    // If it's short, capitalised, has nouns, and either matches a pattern or is under 8 words
    if (isCapitalised && hasNouns && (matchesPattern || wordCount < 8)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if content contains learning objectives
 */
const containsLearningObjectives = (text) => {
  const patterns = [
    /learning objectives?/i,
    /by the end of/i,
    /you will be able to/i,
    /students will/i,
    /learners will/i,
    /objectives?:/i,
    /goals?:/i,
    /outcomes?:/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

/**
 * Check if content contains summary indicators
 */
const containsSummary = (text) => {
  const patterns = [
    /summary/i,
    /in summary/i,
    /to summarise/i,
    /to summarize/i,
    /key points/i,
    /key takeaways/i,
    /main points/i,
    /recap/i,
    /conclusion/i,
    /in conclusion/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

/**
 * Check if content contains exercise or question patterns
 */
const containsExercise = (text) => {
  const patterns = [
    /exercise/i,
    /question/i,
    /activity/i,
    /practice/i,
    /try it/i,
    /your turn/i,
    /task/i,
    /assignment/i,
    /homework/i,
    /\?$/ // Ends with question mark
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

/**
 * Check if content contains resource or link patterns
 */
const containsResourceLinks = (text) => {
  const patterns = [
    /resource/i,
    /additional reading/i,
    /further reading/i,
    /reference/i,
    /link/i,
    /website/i,
    /url/i,
    /download/i,
    /materials/i,
    /documentation/i,
    /guide/i,
    /manual/i,
    /http/i,
    /www\./i,
    /\.com/i,
    /\.org/i,
    /\.edu/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

/**
 * Check if content contains important note patterns
 */
const containsImportantNote = (text) => {
  const patterns = [
    /important/i,
    /note:/i,
    /remember/i,
    /don't forget/i,
    /keep in mind/i,
    /attention/i,
    /warning/i,
    /caution/i,
    /tip:/i,
    /pro tip/i,
    /hint:/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

/**
 * Check if list contains action items
 */
const containsActionItems = (text) => {
  const actionVerbs = [
    'complete', 'finish', 'submit', 'review', 'read', 'write',
    'create', 'design', 'implement', 'analyze', 'evaluate',
    'understand', 'learn', 'master', 'practice', 'apply'
  ];
  
  const doc = nlp(text);
  const verbs = doc.verbs().out('array');
  
  return verbs.some(verb => 
    actionVerbs.includes(verb.toLowerCase())
  );
};

/**
 * Check if content contains steps or procedures
 */
const containsSteps = (text) => {
  const patterns = [
    /step \d+/i,
    /first/i,
    /second/i,
    /third/i,
    /next/i,
    /then/i,
    /finally/i,
    /procedure/i,
    /process/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
};