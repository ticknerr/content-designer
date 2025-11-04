import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';
import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';
import { parseContent } from '../utils/textParser';
import { stripHtmlKeepFormatting } from '../utils/htmlUtils';

const detectListTypeFromElement = (listElement) => {
  if (!listElement) return null;
  
  const tagName = listElement.tagName.toLowerCase();
  
  if (tagName === 'ul') {
    return 'bulletList';
  }
  
  if (tagName === 'ol') {
    const typeAttr = listElement.getAttribute('type');
    if (typeAttr === 'a' || typeAttr === 'A') {
      return 'alphaList';
    }
    return 'numericList';
  }
  
  return null;
};

const TextInput = ({ 
  contentBlocks, 
  onChange, 
  onSelectionChange, 
  onCursorChange,
  onRemoveComponent,
  suggestions 
}) => {
	
  const editorRef = useRef(null);
  const [localContent, setLocalContent] = useState('');
  const isUserEditingRef = useRef(false);
  const cursorStateRef = useRef({ blockId: null, offset: 0, nodeIndex: 0 });

  // Parse paste/drop content for proper initial formatting
  const cleanContentForStorage = (html) => {
    // Remove any block-content wrapper divs that shouldn't be in storage
    let cleaned = html;
    cleaned = cleaned.replace(/<div class="block-content"[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/div>(\s*<\/div>)?$/i, (match, p1) => p1 ? '</div>' : '');
    return cleaned.trim();
  };

  // Save cursor position before any DOM updates
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || !editorRef.current) return;
    
    const range = selection.getRangeAt(0);
    let container = range.startContainer;
    let blockElement = container;
    
    // Find the content block element
    while (blockElement && blockElement !== editorRef.current) {
      if (blockElement.classList?.contains('content-block')) {
        break;
      }
      blockElement = blockElement.parentElement;
    }
    
    if (!blockElement || blockElement === editorRef.current) return;
    
    const blockId = blockElement.dataset.blockId;
    const contentEl = blockElement.querySelector('.block-content');
    
    if (contentEl && blockId) {
      // Calculate the offset within the content element
      const clonedRange = range.cloneRange();
      clonedRange.selectNodeContents(contentEl);
      clonedRange.setEnd(range.startContainer, range.startOffset);
      
      // Get the text offset (more reliable than DOM offset)
      const textOffset = clonedRange.toString().length;
      
      cursorStateRef.current = {
        blockId: blockId,
        offset: textOffset,
        nodeIndex: 0
      };
    }
  };

  // Restore cursor position after DOM updates
  const restoreCursorPosition = () => {
    const { blockId, offset } = cursorStateRef.current;
    if (!blockId || !editorRef.current) return;
    
    const blockEl = editorRef.current.querySelector(`[data-block-id="${blockId}"]`);
    if (!blockEl) return;
    
    const contentEl = blockEl.querySelector('.block-content');
    if (!contentEl) return;
    
    try {
      // Use a text-based approach to restore position
      const walker = document.createTreeWalker(
        contentEl,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let currentOffset = 0;
      let targetNode = null;
      let targetOffset = offset;
      
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.textContent.length;
        
        if (currentOffset + nodeLength >= offset) {
          targetNode = node;
          targetOffset = offset - currentOffset;
          break;
        }
        currentOffset += nodeLength;
      }
      
      if (!targetNode && contentEl.firstChild) {
        // Fallback: place at the end of content
        targetNode = contentEl.lastChild || contentEl;
        if (targetNode.nodeType === Node.TEXT_NODE) {
          targetOffset = targetNode.textContent.length;
        } else {
          targetOffset = 0;
        }
      }
      
      if (targetNode) {
        const range = document.createRange();
        const sel = window.getSelection();
        
        range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch (e) {
      console.log('Cursor restoration failed:', e);
    }
  };

  // Handle paste event - complete replacement
  const handlePaste = (e) => {
    e.preventDefault();
    
    let pastedContent = '';
    if (e.clipboardData && e.clipboardData.getData) {
      const html = e.clipboardData.getData('text/html');
      const plain = e.clipboardData.getData('text/plain');
      
      if (html) {
        // Process HTML content
        let processedHtml = html.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
        
        // Convert Word/Office styling to semantic tags
        processedHtml = processedHtml.replace(/<b\b/gi, '<strong');
        processedHtml = processedHtml.replace(/<\/b>/gi, '</strong>');
        processedHtml = processedHtml.replace(/<i\b/gi, '<em');
        processedHtml = processedHtml.replace(/<\/i>/gi, '</em>');
        
        // Convert font-weight styles to strong
        processedHtml = processedHtml.replace(
          /<span[^>]*style="[^"]*font-weight:\s*(bold|700|800|900)[^"]*"[^>]*>(.*?)<\/span>/gi,
          '<strong>$2</strong>'
        );
        
        // Convert font-style italic to em
        processedHtml = processedHtml.replace(
          /<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/span>/gi,
          '<em>$1</em>'
        );
        
        // Convert text-decoration underline to u
        processedHtml = processedHtml.replace(
          /<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi,
          '<u>$1</u>'
        );
        
        // Sanitise with DOMPurify
        const cleanHtml = DOMPurify.sanitize(processedHtml, {
          ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'br', 'a'],
          ALLOWED_ATTR: ['href', 'target', 'rel'],
          KEEP_CONTENT: true,
          FORBID_TAGS: ['style', 'script', 'link', 'meta', 'b', 'i'],
          FORBID_ATTR: ['style', 'class', 'id', 'lang', 'dir', 'data-*']
        });
        
        pastedContent = cleanHtml.replace(/\s+/g, ' ').trim();
      } else {
        // Plain text fallback
        let formatted = plain;
        
        // Convert markdown-style formatting
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Convert line breaks to paragraphs
        formatted = formatted.split('\n\n').map(para => 
          para.trim() ? `<p>${para.replace(/\n/g, ' ')}</p>` : ''
        ).join('');
        
        pastedContent = formatted || plain;
      }
    }

    // Parse content into blocks
    const blocks = parseContent(pastedContent);
    onChange(blocks);
    
    // Let the useEffect handle the display update
    // This ensures suggestions are included when they're ready
    isUserEditingRef.current = false;
  };

  // Handle Enter key to split blocks
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      
      console.log("Enter detected");
      
      e.preventDefault();
      
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Find the current block element
      let currentBlockElement = range.startContainer;
      while (currentBlockElement && currentBlockElement !== editorRef.current) {
        if (currentBlockElement.classList?.contains('content-block')) {
          break;
        }
        currentBlockElement = currentBlockElement.parentElement;
      }
      
      if (!currentBlockElement || currentBlockElement === editorRef.current) return;
      
      const blockId = currentBlockElement.dataset.blockId;
      const currentBlock = contentBlocks.find(b => b.id === blockId);
      
      if (!currentBlock) return;
      
      // Get the content before and after the cursor
      const contentElement = currentBlockElement.querySelector('.block-content') || currentBlockElement;
      
      // Create a range up to the cursor
      const beforeRange = document.createRange();
      const contentToSplit = contentElement.querySelector('.block-content') || contentElement;
      beforeRange.setStart(contentToSplit, 0);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const beforeText = beforeRange.toString();
      
      // Create a range from cursor to end
      const afterRange = document.createRange();
      afterRange.setStart(range.startContainer, range.startOffset);
      const lastNode = contentToSplit.lastChild || contentToSplit;
      afterRange.setEndAfter(lastNode);
      const afterText = afterRange.toString();
     
      if (beforeText.length === 0 || afterText.length === 0) {
        return;
      }
      // Extract HTML content and clean it
      const beforeContainer = document.createElement('div');
      beforeContainer.appendChild(beforeRange.cloneContents());
      let beforeHtml = beforeContainer.innerHTML.trim();
      
      const afterContainer = document.createElement('div');
      afterContainer.appendChild(afterRange.extractContents());
      let afterHtml = afterContainer.innerHTML.trim();
      
      // Clean any wrapper divs that might have been included
      beforeHtml = cleanContentForStorage(beforeHtml);
      afterHtml = cleanContentForStorage(afterHtml);
      
      // Wrap in appropriate tags if needed
      if (!beforeHtml.startsWith('<')) {
        beforeHtml = `<p>${beforeHtml || '&nbsp;'}</p>`;
      }
      if (!afterHtml.startsWith('<')) {
        afterHtml = `<p>${afterHtml || '&nbsp;'}</p>`;
      }
      
      // Create the new blocks
      const blockIndex = contentBlocks.findIndex(b => b.id === blockId);
      const newBlocks = [...contentBlocks];
      
      // Update the current block with content before cursor
      newBlocks[blockIndex] = {
        ...currentBlock,
        content: beforeHtml
      };
      
      // Insert new block after with content after cursor
      const newBlock = {
        id: uuidv4(),
        type: currentBlock.type,
        content: afterHtml,
        component: null // New block has no component
      };
      
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      
      // Update the blocks
      onChange(newBlocks);
      
      // Set cursor position in the new block after React updates
      setTimeout(() => {
        const newBlockElement = editorRef.current.querySelector(`[data-block-id="${newBlock.id}"]`);
        if (newBlockElement) {
          const contentEl = newBlockElement.querySelector('.block-content') || newBlockElement;
          if (contentEl && contentEl.firstChild) {
            try {
              const range = document.createRange();
              const sel = window.getSelection();
              range.setStart(contentEl.firstChild, 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            } catch (e) {
              // If no text node, create one
              if (!contentEl.firstChild) {
                contentEl.appendChild(document.createTextNode(''));
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(contentEl.firstChild, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }
        }
      }, 50);
    }
  };

  // Handle input changes (typing, deleting, etc.)
  const handleInput = useCallback(() => {
    if (!editorRef.current) {
      return;
    }
    
    // Save cursor position BEFORE processing
    saveCursorPosition();
    
    // Mark that we're editing
    isUserEditingRef.current = true;
    
    // Get all content blocks from the editor
    const blockElements = editorRef.current.querySelectorAll('.content-block');
    
    if (blockElements.length === 0) {
      const content = editorRef.current.innerHTML;
      const blocks = parseContent(content);
      onChange(blocks);
      return;
    }
    
    const updatedBlocks = [];
    
    blockElements.forEach(blockElement => {
      const blockId = blockElement.dataset.blockId;
      const blockType = blockElement.dataset.blockType;
      
      // Find the content element
      const contentEl = blockElement.querySelector('.block-content');
      let content = '';
      
      if (contentEl) {
        // Get inner HTML but strip the wrapper div if it exists
        let innerContent = contentEl.innerHTML.trim();
        
        // If the content starts with our block-content div, unwrap it
        if (innerContent.startsWith('<div class="block-content">')) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = innerContent;
          const innerDiv = tempDiv.querySelector('.block-content');
          if (innerDiv) {
            innerContent = innerDiv.innerHTML.trim();
          }
        }
        
        content = innerContent;
      } else {
        // Fallback to getting content from the block element itself
        const contentNodes = Array.from(blockElement.childNodes).filter(node => {
          if (node.nodeType === 1) {
            return !node.classList?.contains('component-indicator') && 
                   !node.classList?.contains('suggestion-indicator');
          }
          return true;
        });
        
        content = contentNodes
          .map(node => node.nodeType === 3 ? node.textContent : node.outerHTML)
          .join('')
          .trim();
      }
      
      // Find the original block
      const originalBlock = contentBlocks.find(b => b.id === blockId);
      
      if (originalBlock) {
        // Update existing block, preserving component and listType
        updatedBlocks.push({
          ...originalBlock,
          content: cleanContentForStorage(content) || originalBlock.content,
          type: blockType || originalBlock.type,
          listType: originalBlock.listType // Preserve list type
        });
      } else {
        // New block
        const newBlock = {
          id: blockId || uuidv4(),
          type: blockType || 'paragraph',
          content: cleanContentForStorage(content),
          component: null
        };
        
        // Detect list type if it's a list block
        if (blockType === 'list') {
          const tmp = document.createElement('div');
          tmp.innerHTML = content;
          const listEl = tmp.querySelector('ul, ol');
          if (listEl) {
            const detectedType = detectListTypeFromElement(listEl);
            if (detectedType) {
              newBlock.listType = detectedType;
              newBlock.component = detectedType;
            }
          }
        }
        
        updatedBlocks.push(newBlock);
      }
    });
    
    // Mark that we're done editing
    isUserEditingRef.current = false;
    
    onChange(updatedBlocks);
    
    // Restore cursor position after a brief delay to let React update
    setTimeout(() => {
      if (document.activeElement === editorRef.current) {
        restoreCursorPosition();
      }
    }, 0);
  }, [contentBlocks, onChange]);

  // Handle cursor position - improved for nested structure
  const handleCursorChange = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      onCursorChange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    let node = range.startContainer;
    
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1) {
        // Check if this is a content block
        if (node.classList?.contains('content-block') && node.dataset?.blockId) {
          onCursorChange(node.dataset.blockId);
          return;
        }
        // Check parent for content-block class
        const parent = node.closest('.content-block[data-block-id]');
        if (parent && editorRef.current?.contains(parent)) {
          onCursorChange(parent.dataset.blockId);
          return;
        }
      }
      node = node.parentNode;
    }
    
    onCursorChange(null);
  };

  // Handle selection changes
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    handleCursorChange();
    
    const selectedIds = [];
    
    const blockElements = editorRef.current?.querySelectorAll('.content-block[data-block-id]');
    blockElements?.forEach(el => {
      // Check if any part of this block is selected
      if (selection.containsNode(el, true) || range.intersectsNode(el)) {
        selectedIds.push(el.dataset.blockId);
      }
    });
    
    onSelectionChange(selectedIds);
  };

  // Update display with blocks
  const updateDisplay = (blocks) => {
    if (!editorRef.current) {
      return;
    }
    
    // Don't update if user is actively typing
    if (isUserEditingRef.current && document.activeElement === editorRef.current) {
      return;
    }
    
    const html = blocks.map(block => {
      const componentIndicator = block.component ? 
        `<span class="component-indicator" contenteditable="false">
          <span class="component-chip">${block.component}</span>
          <button class="remove-btn" data-block-id="${block.id}">×</button>
        </span>` : '';
      
      const suggestionIndicator = suggestions[block.id] && !block.component ?
        `<span class="suggestion-indicator" contenteditable="false">
          <span class="suggestion-chip">💡 ${suggestions[block.id]}</span>
        </span>` : '';
      
      return `
        <div class="content-block ${block.component ? 'has-component' : ''}" 
             data-block-id="${block.id}"
             data-block-type="${block.type}">
          ${componentIndicator}
          ${suggestionIndicator}
          <div class="block-content">${block.content}</div>
        </div>
      `;
    }).join('');
    
    editorRef.current.innerHTML = html;
    setLocalContent(html);
    
    editorRef.current.setAttribute('contenteditable', 'true');
  };

  // Update display when blocks change
  useEffect(() => {
    updateDisplay(contentBlocks);
  }, [contentBlocks, suggestions]);

  // Track selection changes globally
  useEffect(() => {
    const handleGlobalSelectionChange = () => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current?.contains(range.commonAncestorContainer)) {
          handleCursorChange();
        }
      }
    };

    document.addEventListener('selectionchange', handleGlobalSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleGlobalSelectionChange);
    };
  }, [contentBlocks]);

  // Handle remove component clicks
  useEffect(() => {
    const handleRemoveClick = (e) => {
      if (e.target.classList.contains('remove-btn')) {
        const blockId = e.target.dataset.blockId;
        onRemoveComponent(blockId);
      }
    };

    editorRef.current?.addEventListener('click', handleRemoveClick);
    return () => {
      editorRef.current?.removeEventListener('click', handleRemoveClick);
    };
  }, [onRemoveComponent]);

  return (
    <Box sx={{ 
      flex: 1,
      overflow: 'auto',
      position: 'relative'
    }}>
      <Paper
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePaste}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelectionChange}
        onKeyUp={(e) => {
          if (e.key !== 'Enter') {
            handleCursorChange();
            handleSelectionChange();
          }
        }}
        onClick={(e) => {
          handleCursorChange();
          handleSelectionChange();
        }}
        onFocus={handleCursorChange}
        sx={{
          minHeight: '100%',
          p: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '1rem',
          lineHeight: 1.7,
          '& .content-block': {
            position: 'relative',
            padding: '8px',
            marginBottom: '8px',
            borderRadius: '4px',
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: 'action.hover'
            },
            '&.has-component': {
              backgroundColor: 'primary.lighter',
              borderLeft: '4px solid',
              borderLeftColor: 'primary.main'
            }
          },
          '& .block-content': {
            outline: 'none',
            minHeight: '1.5em'
          },
          '& .component-indicator': {
            position: 'absolute',
            top: '-8px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10
          },
          '& .component-chip': {
            display: 'inline-block',
            padding: '2px 8px',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600
          },
          '& .suggestion-indicator': {
            position: 'absolute',
            top: '-8px',
            left: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10
          },
          '& .suggestion-chip': {
            display: 'inline-block',
            padding: '2px 8px',
            backgroundColor: 'info.light',
            color: 'info.contrastText',
            borderRadius: '12px',
            fontSize: '0.75rem',
            opacity: 0.8
          },
          '& .remove-btn': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'error.main',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
            '&:hover': {
              backgroundColor: 'error.dark'
            }
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            fontFamily: 'fields, Georgia, serif',
            color: 'primary.main',
            marginTop: '0.5em',
            marginBottom: '0.5em'
          },
          '& ul, & ol': {
            paddingLeft: '2em'
          },
          '& li': {
            marginBottom: '0.5em'
          },
          '& p': {
            marginTop: '0.5em',
            marginBottom: '0.5em'
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'underline',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'none',
              opacity: 0.8
            }
          },
          '& strong, & b': {
            fontWeight: 'bold'
          },
          '& em, & i': {
            fontStyle: 'italic'
          },
          '& ol': {
            listStyle: 'none',
          },
          '& ol li': {
            marginBottom: '0.5em',
            position: 'relative',
          },
          '& ol li::before': {
            content: 'attr(data-aria-posinset) ". "',
            position: 'absolute',
            left: '-2em',
            fontWeight: 'bold',
            color: 'text.primary',
          },
        }}
        placeholder="Paste your content here... (supports Word formatting)"
      />
      
      {contentBlocks.length === 0 && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: 0.5,
          pointerEvents: 'none'
        }}>
          <AutoAwesome sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="body1">
            Paste your content from Word or type directly
          </Typography>
          <Typography variant="body2">
            Formatting will be preserved and cleaned
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TextInput;