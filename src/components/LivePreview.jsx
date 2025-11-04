import React, { useRef, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import CopyButton from './CopyButton';

/**
 * LivePreview Component
 * Renders HTML content in a sandboxed iframe with Bootstrap and Font Awesome support
 */
const LivePreview = ({ html }) => {
  const previewRef = useRef(null);
  
  useEffect(() => {
    if (previewRef.current && html) {
      // Create a sandboxed iframe for preview
      const iframe = previewRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Include Font Awesome and Bootstrap for components
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
            <style>
              body {
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #1d2125;
                padding: 20px;
                background: #ffffff;
              }
              @font-face {
                font-family: 'fields';
                src: local('Georgia'), local('Times New Roman');
                font-weight: normal;
              }
              /* Ensure all template styles work properly */
              .carousel-control-prev, .carousel-control-next {
                width: auto;
              }
              details summary {
                outline: none;
              }
              details[open] summary {
                border-bottom: none;
              }
            </style>
          </head>
          <body>
            ${html || '<p style="color: #999; text-align: center;">Your formatted content will appear here...</p>'}
            <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.bundle.min.js"></script>
            <script>
              // Initialise Bootstrap components
              $(document).ready(function() {
                $('.carousel').carousel({ interval: false });
              });
            </script>
          </body>
        </html>
      `;
      
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  }, [html]);
  
  return (
    <Box sx={{ 
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }}>
      {/* Top copy button */}
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        gap: 1
      }}>
        <CopyButton html={html} label="Copy HTML" variant="contained" />
      </Box>
      
      {/* Preview iframe */}
      <Paper 
        component="iframe"
        ref={previewRef}
        sx={{
          flex: 1,
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'white'
        }}
        title="Live Preview"
      />
      
      {/* Bottom copy button */}
      <Box sx={{ 
        position: 'absolute',
        bottom: 0,
        right: 0,
        zIndex: 10
      }}>
        <CopyButton html={html} label="Copy HTML" variant="contained" />
      </Box>
    </Box>
  );
};

export default LivePreview;