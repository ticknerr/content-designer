import React, { useState, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Typography,
  Paper,
  Stack,
  Button
} from '@mui/material';
import { 
  FormatIndentIncrease,
  FormatIndentDecrease,
  FormatListBulleted,
  FormatListNumbered,
  AbcOutlined,
  CheckCircle
} from '@mui/icons-material';
import { cleanListItemContent } from '../utils/htmlUtils';

const ListIndentControl = ({ 
  blocks, 
  componentType,
  onIndentationChange,
  onApplyIndentation
}) => {
  // Track indentation levels for each block (0 = no indent, 1 = first level, etc.)
  const [indentLevels, setIndentLevels] = useState({});
  
  // Only show for list components
  const supportsIndentation = ['bulletList', 'alphaList', 'numericList', 'list'].includes(componentType);
  
  console.log(blocks, indentLevels)
  
  useEffect(() => {
    // Initialize indent levels if not set
    const initialLevels = {};
    blocks.forEach(block => {
      if (!indentLevels[block.id]) {
        initialLevels[block.id] = 0;
      }
    });
    
    if (Object.keys(initialLevels).length > 0) {
      setIndentLevels(prev => ({ ...prev, ...initialLevels }));
    }
  }, [blocks]);
  
  useEffect(() => {
    // Notify parent of indentation changes
    if (onIndentationChange) {
      onIndentationChange(indentLevels);
    }
  }, [indentLevels]);
  
  if (!supportsIndentation || blocks.length === 0) {
    return null;
  }
  
  const handleIndent = (blockId, delta) => {
    setIndentLevels(prev => {
      const currentLevel = prev[blockId] || 0;
      const newLevel = Math.max(0, Math.min(3, currentLevel + delta)); // Max 3 levels deep
      return {
        ...prev,
        [blockId]: newLevel
      };
    });
  };
  
  const handleApply = () => {
    if (onApplyIndentation) {
      onApplyIndentation(componentType, indentLevels);
    }
  };
  
  const getListIcon = () => {
    switch (componentType) {
      case 'bulletList': return <FormatListBulleted />;
      case 'alphaList': return <AbcOutlined />;
      case 'numericList': return <FormatListNumbered />;
      default: return <FormatListBulleted />;
    }
  };
  
  const getIndentPreview = (level) => {
    let indentChar;
    switch (componentType) {
      case 'bulletList': indentChar = '•'; break;
      case 'alphaList': indentChar = 'a.'; break;
      case 'numericList': indentChar = '1.'; break;
      default: indentChar = '•';
    }
    const indent = '  '.repeat(level);
    return `${indent}${indentChar}`;
  };
  
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getListIcon()}
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            List Indentation
          </Typography>
        </Box>
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
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Set indentation levels, then click Apply to update the preview
      </Typography>
      
      <Stack spacing={1} sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {blocks.map((block, index) => {
          const level = indentLevels[block.id] || 0;
          // Use cleanListItemContent which handles both HTML stripping and list formatting
          const text = cleanListItemContent(block.content);
          
          return (
            <Paper
              key={block.id}
              elevation={0}
              sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: level > 0 ? 'action.hover' : 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                minWidth: 70
              }}>
                <Tooltip title="Decrease indent">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleIndent(block.id, -1)}
                      disabled={level === 0}
                      sx={{ 
                        width: 30,
                        height: 30,
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <FormatIndentDecrease fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title="Increase indent">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleIndent(block.id, 1)}
                      disabled={level === 3 || (index > 0 && level >= (indentLevels[blocks[index - 1].id] || 0) + 1)}
                      sx={{ 
                        width: 30,
                        height: 30,
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <FormatIndentIncrease fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                overflow: 'hidden'
              }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontFamily: 'monospace',
                    color: 'primary.main',
                    minWidth: 40,
                    pl: level * 2
                  }}
                >
                  {getIndentPreview(level)}
                </Typography>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {text.length > 60 ? text.substring(0, 60) + '...' : text}
                </Typography>
              </Box>
              
              {level > 0 && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    minWidth: 50
                  }}
                >
                  Level {level}
                </Typography>
              )}
            </Paper>
          );
        })}
      </Stack>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Nested items will be indented in the preview
      </Typography>
    </Box>
  );
};

export default ListIndentControl;