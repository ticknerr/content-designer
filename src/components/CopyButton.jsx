import React, { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';

const CopyButton = ({ html, label = 'Copy HTML', variant = 'outlined' }) => {
  const [copied, setCopied] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleCopy = async () => {
    if (!html) {
      setShowAlert(true);
      return;
    }

    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setShowAlert(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size="small"
        startIcon={copied ? <Check /> : <ContentCopy />}
        onClick={handleCopy}
        color={copied ? 'success' : 'primary'}
        disabled={!html}
        sx={{ 
          minWidth: '120px',
          transition: 'all 0.2s'
        }}
      >
        {copied ? 'Copied!' : label}
      </Button>
      
      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity="warning"
          variant="filled"
        >
          No content to copy. Please add and format some content first.
        </Alert>
      </Snackbar>
    </>
  );
};

export default CopyButton;