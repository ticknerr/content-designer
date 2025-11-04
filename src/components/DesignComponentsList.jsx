import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Divider,
  Stack,
  Alert
} from '@mui/material';
import {
  FormatListBulleted,
  FormatListNumbered,
  CheckCircle,
  Info,
  Summarize,
  Quiz,
  ViewCarousel,
  Tab,
  ExpandMore,  
  Title,
  School,
  GridView,
  ViewColumn,
  Link,
  AbcOutlined
} from '@mui/icons-material';
import SplitControl from './SplitControl';
import ListIndentControl from './ListIndentControl';
import IconListCustomisation from './IconListCustomisation';
const designComponents = [
  {
    id: 'moduleTitle',
    name: 'Module Title',
    icon: <Title />,
    description: 'Large centred title for modules',
    singleBlock: true,
    multiBlock: false,
    supportedTypes: ['heading', 'paragraph']
  },
  {
    id: 'heading',
    name: 'Styled Heading',
    icon: <Title />,
    description: 'Formatted heading with proper styling',
    singleBlock: true,
    multiBlock: false,
    supportedTypes: ['heading', 'paragraph']
  },
  {
    id: 'learningObjectives',
    name: 'Learning Outcomes',
    icon: <School />,
    description: 'Numbered list of learning outcomes',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['list', 'paragraph']
  },
  {
    id: 'infoBox',
    name: 'Info Box',
    icon: <Info />,
    description: 'Blue information callout box',
    singleBlock: true,
    multiBlock: true,
    supportedTypes: ['paragraph', 'list']
  },
  {
    id: 'summaryBox',
    name: 'Summary Box',
    icon: <Summarize />,
    description: 'Grey summary callout box',
    singleBlock: true,
    multiBlock: true,
    supportedTypes: ['paragraph', 'list']
  },
  {
    id: 'exerciseBox',
    name: 'Exercise Box',
    icon: <Quiz />,
    description: 'Purple exercise/question box',
    singleBlock: true,
    multiBlock: true,
    supportedTypes: ['paragraph', 'list']
  },
  {
    id: 'resourceBox',
    name: 'Resource Box',
    icon: <Link />,
    description: 'Teal resource/link callout box',
    singleBlock: true,
    multiBlock: true,
    supportedTypes: ['paragraph', 'list']
  },
  {
    id: 'iconList',
    name: 'Icon List',
    icon: <CheckCircle />,
    description: 'List with font-awesome icon',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['list', 'paragraph']
  },
  {
    id: 'numberedList',
    name: 'Numbered List',
    icon: <FormatListNumbered />,
    description: 'Styled numbered list with circles',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['list', 'paragraph']
  },
  {
    id: 'bulletList',
    name: 'Bullet List',
    icon: <FormatListBulleted />,
    description: 'Standard bullet list',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['list', 'paragraph']
  },
  {
    id: 'alphaList',
    name: 'Alpha List',
    icon: <AbcOutlined />,
    description: 'Alphabetical list (a, b, c...)',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['list', 'paragraph']
  },
  {
    id: 'numericList',
    name: 'Numeric List',
    icon: <FormatListNumbered />,
    description: 'Standard numbered list (1, 2, 3...)',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['list', 'paragraph']
  },
  {
    id: 'accordion',
    name: 'Accordion',
    icon: <ExpandMore />,
    description: 'Expandable sections (groups by headings)',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['paragraph', 'heading', 'list'],
    smartGrouping: true
  },
  {
    id: 'carousel',
    name: 'Carousel',
    icon: <ViewCarousel />,
    description: 'Slideshow (supports headings)',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['paragraph', 'heading', 'list'],
    smartGrouping: true
  },
  {
    id: 'tabs',
    name: 'Tabs',
    icon: <Tab />,
    description: 'Tabbed sections (groups by headings)',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['paragraph', 'heading', 'list'],
    smartGrouping: true
  },
  {
    id: 'stylizedContentBox',
    name: 'Stylised Content Box',
    icon: <GridView />,
    description: 'Shaded flexible box layout (optional headings)',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['paragraph', 'heading', 'list'],
    smartGrouping: true
  },
  {
    id: 'textColumns',
    name: 'Text Columns',
    icon: <ViewColumn />,
    description: 'Magazine-like accessible word-wrapping text columns',
    singleBlock: false,
    multiBlock: true,
    supportedTypes: ['paragraph', 'list']
  }
];

// Helper function to check if a block is a heading
const isBlockHeading = (block) => {
  if (!block) return false;
  if (block.type === 'heading') return true;
  try {
    return /<h[1-6]\b/i.test(block.content || '');
  } catch (e) {
    return false;
  }
};

// Auto-detect natural split points for smart grouping
const autoDetectSplitPoints = (blocks) => {
  // First, check for headings to create split points
  const headingIndices = blocks
    .map((block, index) => (index > 0 && isBlockHeading(block) ? index : null))
    .filter(index => index !== null);
  
  // If headings are found, use them as the split points
  if (headingIndices.length > 0) {
    return headingIndices;
  }
  
  // If no headings are found, split every block
  return blocks.slice(1).map((_, i) => i + 1);
};

const DesignComponentsList = ({ 
  onApplyComponent, 
  selectedBlocks, 
  suggestions,
  currentBlockId,
  contentBlocks = []
}) => {
  const [splitPoints, setSplitPoints] = useState([]);
  const [indentLevels, setIndentLevels] = useState({});
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [iconCustomisation, setIconCustomisation] = useState({});
  
  // Determine which list component (if any) the current blocks have
   const activeListComponent = contentBlocks.length > 0 && 
    (contentBlocks[0].component || contentBlocks[0].listType) && 
    ['bulletList', 'alphaList', 'numericList','iconList'].includes(
      contentBlocks[0].component || contentBlocks[0].listType
    ) 
    ? (contentBlocks[0].component || contentBlocks[0].listType)
    : null;
  
  // Determine which smart grouping component (if any) the current blocks have
  const activeSmartComponent = contentBlocks.length > 0 && contentBlocks[0].component && 
    ['carousel', 'tabs', 'accordion', 'stylizedContentBox'].includes(contentBlocks[0].component)
    ? contentBlocks[0].component
    : null;
  
  const handleApplySplits = (componentType, newSplitPoints) => {
    // Apply the component with the new split points
    onApplyComponent(componentType, newSplitPoints);
  };
  
  const suggestedComponent = currentBlockId && suggestions[currentBlockId];
  
  // Filter components based on selection
  const availableComponents = designComponents.filter(comp => {
    if (selectedBlocks === 0) return false;
    if (selectedBlocks === 1) return comp.singleBlock;
    return comp.multiBlock;
  });

  // Group components by category
  const basicComponents = availableComponents.filter(c => 
    ['moduleTitle', 'heading', 'bulletList', 'alphaList', 'numericList', 'numberedList', 'iconList'].includes(c.id)
  );
  
  const calloutComponents = availableComponents.filter(c => 
    ['infoBox', 'summaryBox', 'exerciseBox', 'resourceBox', 'learningObjectives'].includes(c.id)
  );
  
  const advancedComponents = availableComponents.filter(c => 
    ['accordion', 'carousel', 'tabs', 'stylizedContentBox', 'textColumns'].includes(c.id)
  );

  const handleComponentClick = (component) => {
    setSelectedComponent(component.id);
    
    // For smart grouping components (advanced layouts), auto-detect split points
    if (component.smartGrouping) {
      
      const detectedSplitPoints = autoDetectSplitPoints(contentBlocks);

      onApplyComponent(component.id, detectedSplitPoints);
    } else if (component.id === 'bulletList' || component.id === 'alphaList' || component.id === 'numericList') {
      // For lists, pass the indent levels (even if empty)
      onApplyComponent(component.id, null, indentLevels);
    } else if (component.id === 'iconList') {
      // For icon lists, pass the customisation options
      onApplyComponent(component.id, null, indentLevels, contentBlocks, iconCustomisation);
    } else if (component.id === 'infoBox') {
      // Pass all selected blocks so htmlGenerator can decide
      onApplyComponent(component.id, null, null, contentBlocks);
    } else {
      onApplyComponent(component.id);
    }
  };

  const ComponentGroup = ({ title, components }) => (
    <>
      <Typography variant="subtitle2" sx={{ 
        mt: 2, 
        mb: 1, 
        fontWeight: 600,
        color: 'text.secondary'
      }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {components.map(component => (
          <Card 
            key={component.id}
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: suggestedComponent === component.id ? '2px solid' : '1px solid',
              borderColor: suggestedComponent === component.id ? 'primary.main' : 'divider',
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: 2,
                borderColor: 'primary.main'
              }
            }}
            onClick={() => handleComponentClick(component)}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: 'primary.main' }}>
                  {component.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {component.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {component.description}
                  </Typography>
                </Box>
                {suggestedComponent === component.id && (
                  <Chip 
                    label="Suggested" 
                    size="small" 
                    color="primary"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                {component.smartGrouping && (
                  <Chip 
                    label="Smart" 
                    size="small" 
                    color="info"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', ml: 0.5 }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  );

  return (
    <Box>
      {selectedBlocks === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Place your cursor in a text block or select multiple blocks to apply design components
        </Alert>
      ) : (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            {selectedBlocks === 1 ? '1 block selected' : `${selectedBlocks} blocks selected`}
            {suggestedComponent && ` • Suggested: ${designComponents.find(c => c.id === suggestedComponent)?.name}`}
          </Alert>
          
          {basicComponents.length > 0 && (
            <ComponentGroup title="Basic Formatting" components={basicComponents} />
          )}
          
          {calloutComponents.length > 0 && (
            <ComponentGroup title="Callouts & Highlights" components={calloutComponents} />
          )}
          
          {advancedComponents.length > 0 && (
            <ComponentGroup title="Advanced Layouts" components={advancedComponents} />
          )}
          
          {activeSmartComponent && contentBlocks.length > 1 && (
            <SplitControl
              blocks={contentBlocks}
              componentType={activeSmartComponent}
              onSplitPointsChange={setSplitPoints}
              onApplySplits={handleApplySplits}
            />
          )}
          
          {activeListComponent === 'iconList' && (
            <IconListCustomisation
              blocks={contentBlocks}
              componentType={activeListComponent}
              onCustomisationChange={(customisation) => {
                setIconCustomisation(customisation);
              }}
              onApplyCustomisation={(listType, customisation) => {
                onApplyComponent(listType, null, null, contentBlocks, customisation);
              }}
            />
          )}
          
          {activeListComponent && (
            <ListIndentControl
              blocks={contentBlocks}
              componentType={activeListComponent}
              onIndentationChange={(newIndentLevels) => {
                setIndentLevels(newIndentLevels);
              }}
              onApplyIndentation={(listType, levels) => {
                onApplyComponent(listType, null, levels);
              }}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default DesignComponentsList;