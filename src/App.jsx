import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box, 
  Paper, 
  Typography,
  AppBar,
  useMediaQuery,
  Toolbar,
  Link,
  Breadcrumbs,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { createTheme } from './config/theme';
import TextInput from './components/TextInput';
import DesignComponentsList from './components/DesignComponentsList';
import LivePreview from './components/LivePreview';
import NLPAnalysis from './components/NLPAnalysis';
import useContentProcessor from './hooks/useContentProcessor';

function App() {
  const [contentBlocks, setContentBlocks] = useState([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [cursorBlockId, setCursorBlockId] = useState(null);
  const [splitPoints, setSplitPoints] = useState({});
  
  // Track if we're doing a complete replacement vs incremental update
  const isCompleteReplacementRef = useRef(false);
  
  // Theme based on system preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => createTheme(prefersDarkMode), [prefersDarkMode]);
  
  // Process content and generate HTML
  const { processedHtml, suggestions } = useContentProcessor(contentBlocks, splitPoints);

  // Handle text input changes
  const handleTextChange = useCallback((blocks) => {
    // Check if this is a complete replacement (significant change in block count or IDs)
    const existingIds = new Set(contentBlocks.map(b => b.id));
    const newIds = new Set(blocks.map(b => b.id));
    
    // Calculate how many IDs are preserved
    const preservedIds = blocks.filter(b => existingIds.has(b.id)).length;
    const preservationRatio = contentBlocks.length > 0 ? preservedIds / contentBlocks.length : 0;
    
    // If less than 50% of IDs are preserved, treat as complete replacement
    isCompleteReplacementRef.current = preservationRatio < 0.5;
    
    if (isCompleteReplacementRef.current) {
      // Complete replacement - clear split points and selections
      setSplitPoints({});
      setSelectedBlockIds([]);
      setCursorBlockId(null);
    } else {
      // Incremental update - preserve split points for existing blocks
      // Clean up split points for removed blocks
      const newBlockIds = new Set(blocks.map(b => b.id));
      const updatedSplitPoints = {};
      
      Object.entries(splitPoints).forEach(([key, value]) => {
        // Check if the blocks referenced in the key still exist
        const blockIdsInKey = key.split('-').filter(part => 
          part !== 'indent' && 
          !['bulletList', 'alphaList', 'numericList', 'carousel', 'tabs', 'accordion', 'stylizedContentBox'].includes(part)
        );
        
        const allBlocksExist = blockIdsInKey.every(id => newBlockIds.has(id));
        
        if (allBlocksExist) {
          updatedSplitPoints[key] = value;
        }
      });
      
      setSplitPoints(updatedSplitPoints);
      
      // Update selections to only include blocks that still exist
      setSelectedBlockIds(prev => prev.filter(id => newBlockIds.has(id)));
      
      // Update cursor if the block no longer exists
      if (cursorBlockId && !newBlockIds.has(cursorBlockId)) {
        setCursorBlockId(null);
      }
    }
    
    setContentBlocks(blocks);
  }, [contentBlocks, splitPoints, cursorBlockId]);

  // Handle component application
  const handleApplyComponent = useCallback((componentType, customSplitPoints = null, indentLevels = null, passedBlocks = null, customisation = null) => {
    const targetIds = selectedBlockIds.length > 0 ? selectedBlockIds : 
                     cursorBlockId ? [cursorBlockId] : [];
    
    if (targetIds.length === 0) return;

    setContentBlocks(prevBlocks => 
      prevBlocks.map(block => 
        targetIds.includes(block.id) 
          ? { ...block, component: componentType }
          : block
      )
    );
    
    // Store split points if provided - use component type as part of the key
    if (customSplitPoints !== null) {
      setSplitPoints(prev => ({
        ...prev,
        [`${componentType}-${targetIds.join('-')}`]: customSplitPoints
      }));
    }
    
    // Store indent levels if provided
    if (indentLevels !== null) {
      setSplitPoints(prev => ({
        ...prev,
        [`indent-${componentType}-${targetIds.join('-')}`]: indentLevels
      }));
    }
    
    // Store customisation if provided (for icon lists)
    if (customisation !== null) {
      setSplitPoints(prev => ({
        ...prev,
        [`customisation-${componentType}-${targetIds.join('-')}`]: customisation
      }));
    }
  }, [selectedBlockIds, cursorBlockId]);

  // Handle removing component
  const handleRemoveComponent = useCallback((blockId) => {
    setContentBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId 
          ? { ...block, component: null }
          : block
      )
    );
    
    // Also remove associated split points
    setSplitPoints(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.includes(blockId)) {
          delete updated[key];
        }
      });
      return updated;
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.gradient
      }}>
      
        <Box sx={{
          padding: '.618rem 1rem 0 1rem',
        }}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">              
              <Link underline="hover" color="inherit" href="../index.html" sx={{ display: 'flex', alignItems: 'center' }}>
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> LD Tools            
              </Link>
              <Typography sx={{ color: 'text.primary' }}>Content Designer</Typography>
          </Breadcrumbs>
        </Box>
        
        {/* Main Content */}
        <Box sx={{ 
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '38.2% 1fr 38.2%',
          gap: 2,
          p: 2,          
          width: '100%',
          mx: 'auto'
        }}>
          {/* Text Input Area */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            height: 'calc(100vh - 70px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <Box sx={{display:'flex', gap: '1rem', alignItems: 'center', justifyContent:'space-between',marginBottom: '1rem' }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontFamily: 'fields, Georgia, serif',
                color: theme.palette.primary.main 
              }}>
                Input Content
              </Typography>
              <Box>
                <NLPAnalysis 
                  contentBlocks={contentBlocks}
                  isAnalysisEnabled={true}
                />
              </Box>
            </Box>
            
            <TextInput
              contentBlocks={contentBlocks}
              onChange={handleTextChange}
              onSelectionChange={setSelectedBlockIds}
              onCursorChange={setCursorBlockId}
              onRemoveComponent={handleRemoveComponent}
              suggestions={suggestions}
            />
          </Paper>

          {/* Design Components List */}
          <Box sx={{ 
            height: 'calc(100vh - 70px)',
            overflow: 'auto',
            px: 2
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontFamily: 'fields, Georgia, serif',
              color: theme.palette.primary.main,
              mb: 2
            }}>
              Design Components
            </Typography>
            <DesignComponentsList 
              onApplyComponent={handleApplyComponent}
              selectedBlocks={selectedBlockIds.length || (cursorBlockId ? 1 : 0)}
              suggestions={suggestions}
              currentBlockId={cursorBlockId}
              contentBlocks={contentBlocks.filter(b => 
                selectedBlockIds.includes(b.id) || b.id === cursorBlockId
              )}
            />
          </Box>

          {/* Live Preview */}
          <Paper elevation={0} sx={{ 
            p: 2,
            height: 'calc(100vh - 70px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontFamily: 'fields, Georgia, serif',
              color: theme.palette.primary.main 
            }}>
              Live Preview
            </Typography>
            <LivePreview html={processedHtml} />
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;