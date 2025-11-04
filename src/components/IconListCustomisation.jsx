import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tooltip, 
  Typography,
  Paper,
  Stack,
  Button
} from '@mui/material';

const IconListCustomisation = ({ 
  blocks, 
  componentType,
  onCustomisationChange,
  onApplyCustomisation
}) => {
  const [selectedIcon, setSelectedIcon] = useState('circle-check');
  const [selectedColour, setSelectedColour] = useState('#198754');
  
  // Only show for iconList component
  if (componentType !== 'iconList' || blocks.length === 0) {
    return null;
  }
  
  useEffect(() => {
    // Notify parent of customisation changes
    if (onCustomisationChange) {
      onCustomisationChange({ icon: selectedIcon, colour: selectedColour });
    }
  }, [selectedIcon, selectedColour, onCustomisationChange]);
  
  const handleApply = () => {
    if (onApplyCustomisation) {
      onApplyCustomisation(componentType, { icon: selectedIcon, colour: selectedColour });
    }
  };
  
  // Top 10 Font Awesome icons
  const iconOptions = [
    { value: 'circle-check', label: 'Check Circle' },
    { value: 'circle-xmark', label: 'X Mark' },
    { value: 'arrow-right', label: 'Arrow' },
    { value: 'star', label: 'Star' },
    { value: 'circle-question', label: 'Question' },
    { value: 'link', label: 'Link' },
    { value: 'flag', label: 'Flag' },
    { value: 'map-pin', label: 'Pin' },
    { value: 'info-circle', label: 'Info' }
  ];
  
  // Colour options with accessible values
  const colourOptions = [
    { value: '#198754', label: 'Green' },
    { value: '#dc3545', label: 'Red' },
    { value: '#fd7e14', label: 'Orange' },
    { value: '#6f42c1', label: 'Purple' },
    { value: '#212529', label: 'Black' },
    { value: '#586fb5', label: 'Blue' },
    { value: '#109294', label: 'Teal' },
    { value: '#a85b8b', label: 'Pink' }
  ];
  
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
          <i className="fa fa-circle-check" style={{ fontSize: '1.2rem' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Icon List Customisation
          </Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          onClick={handleApply}
          sx={{ minWidth: 100 }}
        >
          Apply
        </Button>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Customise icon and colour, then click Apply to update the preview
      </Typography>
      
      {/* Icon Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Select Icon
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {iconOptions.map((icon) => (
            <Tooltip key={icon.value} title={icon.label}>
              <Paper
                elevation={0}
                onClick={() => setSelectedIcon(icon.value)}
                sx={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: selectedIcon === icon.value ? 'primary.main' : 'divider',
                  backgroundColor: selectedIcon === icon.value ? 'action.selected' : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <i 
                  className={`fa fa-${icon.value}`}
                  style={{ 
                    fontSize: '1.1rem',
                    color: selectedIcon === icon.value ? '#1976d2' : '#666'
                  }}
                />
              </Paper>
            </Tooltip>
          ))}
        </Stack>
      </Box>
      
      {/* Colour Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Select Colour
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {colourOptions.map((colour) => (
            <Tooltip key={colour.value} title={colour.label}>
              <Paper
                elevation={0}
                onClick={() => setSelectedColour(colour.value)}
                sx={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: selectedColour === colour.value ? 'primary.main' : 'divider',
                  backgroundColor: colour.value,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                {selectedColour === colour.value && (
                  <i 
                    className="fa fa-check"
                    style={{ 
                      color: 'white',
                      fontSize: '1.1rem',
                      textShadow: '0 0 3px rgba(0,0,0,0.5)'
                    }}
                  />
                )}
              </Paper>
            </Tooltip>
          ))}
        </Stack>
      </Box>
      
      {/* Preview */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: 'action.hover',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          Preview
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <i 
            className={`fa fa-${selectedIcon}`}
            style={{ 
              color: selectedColour, 
              fontSize: '20px' 
            }}
          />
          <Typography variant="body2">
            Sample list item with selected icon and colour
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Changes will apply to all items in the list
      </Typography>
    </Box>
  );
};

export default IconListCustomisation;