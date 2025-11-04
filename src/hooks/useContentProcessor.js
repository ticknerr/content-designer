import { useMemo } from 'react';
import { generateHtml } from '../utils/htmlGenerator';
import { classifyContent } from '../utils/contentClassifier';

/**
 * Custom hook to process content blocks and generate HTML
 */
const useContentProcessor = (contentBlocks, splitPoints = {}) => {
  // Generate suggestions for content blocks
  const suggestions = useMemo(() => {
    return classifyContent(contentBlocks);
  }, [contentBlocks]);
  
  // Generate processed HTML with split points
  const processedHtml = useMemo(() => {
    return generateHtml(contentBlocks, splitPoints);
  }, [contentBlocks, splitPoints]);
  
  return {
    processedHtml,
    suggestions
  };
};

export default useContentProcessor;