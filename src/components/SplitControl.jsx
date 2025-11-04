import React, { useState, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Chip,
  Typography,
  Paper,
  Button
} from '@mui/material';
import { 
  Merge,
  Add,
  Remove,
  AutoAwesome,
  CheckCircle
} from '@mui/icons-material';
import { stripHtml } from '../utils/htmlUtils';

const SplitControl = ({ 
  blocks, 
  componentType,
  onApplySplits
}) => {
  const [splitPoints, setSplitPoints] = useState([]);
  const [previewGroups, setPreviewGroups] = useState([]);

  const supportsSplitting = ['carousel', 'tabs', 'accordion', 'stylizedContentBox', 'list'].includes(componentType);

  // Pure helper to calculate groups
  const calculatePreviewGroups = (splits, blocks) => {
    const groups = [];
    let startIndex = 0;
    const sortedSplits = [...splits].sort((a, b) => a - b);

    sortedSplits.forEach(splitIndex => {
      if (splitIndex > startIndex && splitIndex <= blocks.length) {
        groups.push({
          start: startIndex,
          end: splitIndex - 1,
          blocks: blocks.slice(startIndex, splitIndex),
        });
        startIndex = splitIndex;
      }
    });

    if (startIndex < blocks.length) {
      groups.push({
        start: startIndex,
        end: blocks.length - 1,
        blocks: blocks.slice(startIndex),
      });
    }

    if (groups.length === 0 && blocks.length > 0) {
      groups.push({
        start: 0,
        end: blocks.length - 1,
        blocks,
      });
    }

    return groups;
  };

  // Initialize split points when blocks change
  useEffect(() => {
    if (blocks.length === 0) return;

    // Only auto-detect if we don't have split points yet
    if (splitPoints.length === 0) {
      const headingIndices = blocks
        .map((block, i) => (i > 0 && isBlockHeading(block) ? i : null))
        .filter(i => i !== null);
  
      if (headingIndices.length > 0) {
        setSplitPoints(headingIndices);
      } else {
        const defaultSplits = blocks.map((_, i) => (i > 0 ? i : null)).filter(i => i !== null);
        if (defaultSplits.length > 0) {
          setSplitPoints(defaultSplits);
        }
      }
    }
  }, [blocks.length]); // Only depend on blocks.length, not the full blocks array

  // Recalculate preview groups whenever splitPoints change
  useEffect(() => {
    if (blocks.length === 0) return;
    const groups = calculatePreviewGroups(splitPoints, blocks);
    setPreviewGroups(groups);
  }, [splitPoints, blocks]);

  // Helpers
  const isBlockHeading = (block) => {
    if (!block) return false;
    if (block.type === 'heading') return true;
    try {
      return /<h[1-6]\b/i.test(block.content || '');
    } catch {
      return false;
    }
  };

  const toggleSplit = (index) => {
    setSplitPoints(prev =>
      prev.includes(index)
        ? prev.filter(p => p !== index)
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  const autoSplit = () => {
    const headingIndices = blocks
      .map((block, i) => (i > 0 && isBlockHeading(block) ? i : null))
      .filter(i => i !== null);
    setSplitPoints(headingIndices);
  };

  const clearSplits = () => setSplitPoints([]);

  const handleApply = () => {
    if (onApplySplits) {
      onApplySplits(componentType, splitPoints);
    }
  };

  const getComponentLabel = () => {
    switch (componentType) {
      case 'carousel': return 'slide';
      case 'tabs': return 'tab';
      case 'accordion': return 'section';
      case 'stylizedContentBox': return 'column';
      default: return 'group';
    }
  };

  const getGroupDisplayText = (group) => {
    let displayText = '';
    const firstBlock = group.blocks[0];
    if (isBlockHeading(firstBlock)) {
      displayText = stripHtml(firstBlock.content);
      if (group.blocks.length > 1) {
        const contentPreview = stripHtml(group.blocks[1].content).substring(0, 30);
        if (contentPreview) {
          displayText += ` — ${contentPreview}...`;
        }
      }
    } else {
      displayText = group.blocks
        .map(b => stripHtml(b.content))
        .join(' ')
        .substring(0, 60) + '...';
    }
    return displayText;
  };

  // Early return AFTER hooks
  if (!supportsSplitting || blocks.length < 2) {
    return null;
  }

  return (
    <Box sx={{ 
      mt: 2, 
      p: 1.5, 
      backgroundColor: 'background.paper',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 1 
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Content Grouping
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Auto-detect groups based on headings">
            <IconButton size="small" onClick={autoSplit}>
              <AutoAwesome fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear all splits">
            <IconButton size="small" onClick={clearSplits} disabled={splitPoints.length === 0}>
              <Merge fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleApply}
            sx={{ minWidth: 100 }}
          >
            Apply
          </Button>
        </Box>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Click between blocks to split into separate {getComponentLabel()}s, then click Apply to update the preview
      </Typography>
      
      <Box sx={{ 
        maxHeight: 300,
        overflowY: 'auto',
        backgroundColor: 'background.default',
        borderRadius: 1,
        p: 1
      }}>
        {previewGroups.map((group, groupIndex) => (
          <Box key={`group-${groupIndex}`} sx={{ mb: 2 }}>
            <Chip 
              label={`${getComponentLabel()} ${groupIndex + 1}`}
              size="small"
              color="primary"
              sx={{ fontSize: '0.7rem', height: 20, mb: 1 }}
            />
            
            <Paper 
              elevation={0}
              sx={{ 
                p: 1,
                backgroundColor: 'primary.lighter',
                border: '1px solid',
                borderColor: 'primary.main',
                mb: 1
              }}
            >
              <Typography variant="caption" sx={{ 
                display: 'block',
                fontWeight: isBlockHeading(group.blocks[0]) ? 600 : 400,
                color: 'text.primary'
              }}>
                {getGroupDisplayText(group)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {group.blocks.length} block{group.blocks.length !== 1 ? 's' : ''}
              </Typography>
            </Paper>
            
            {groupIndex < previewGroups.length - 1 && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  my: 1,
                  cursor: 'pointer',
                  '&:hover .split-line': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                }}
                onClick={() => toggleSplit(group.end + 1)}
              >
                <Box 
                  className="split-line"
                  sx={{ 
                    flex: 1, 
                    borderTop: splitPoints.includes(group.end + 1) ? '2px solid' : '1px dashed',
                    borderColor: splitPoints.includes(group.end + 1) ? 'primary.main' : 'divider',
                    transition: 'all 0.2s'
                  }} 
                />
                <IconButton 
                  size="small" 
                  sx={{ 
                    mx: 1,
                    backgroundColor: splitPoints.includes(group.end + 1) ? 'primary.main' : 'background.paper',
                    color: splitPoints.includes(group.end + 1) ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: splitPoints.includes(group.end + 1) ? 'primary.dark' : 'action.hover',
                    }
                  }}
                >
                  {splitPoints.includes(group.end + 1) ? <Remove fontSize="small" /> : <Add fontSize="small" />}
                </IconButton>
                <Box 
                  className="split-line"
                  sx={{ 
                    flex: 1, 
                    borderTop: splitPoints.includes(group.end + 1) ? '2px solid' : '1px dashed',
                    borderColor: splitPoints.includes(group.end + 1) ? 'primary.main' : 'divider',
                    transition: 'all 0.2s'
                  }} 
                />
              </Box>
            )}
          </Box>
        ))}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {previewGroups.length} {getComponentLabel()}{previewGroups.length !== 1 ? 's' : ''} will be created
      </Typography>
    </Box>
  );
};

export default SplitControl;