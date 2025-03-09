import React, { useEffect, useRef, useCallback } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Link from '@editorjs/link';
import Marker from '@editorjs/marker';
import { RefreshCw } from 'lucide-react';

interface RichTextEditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DEFAULT_INITIAL_DATA = {
  blocks: [
    {
      type: 'paragraph',
      data: {
        text: ''
      }
    },
  ]
};

const markdownToEditorJS = (markdown: string): any => {
  if (!markdown) return DEFAULT_INITIAL_DATA;
  
  const blocks = [];
  
  const paragraphs = markdown.split('\n\n');
  
  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;
    
    if (p.startsWith('# ')) {
      blocks.push({
        type: 'header',
        data: { text: p.substring(2), level: 1 }
      });
    } else if (p.startsWith('## ')) {
      blocks.push({
        type: 'header',
        data: { text: p.substring(3), level: 2 }
      });
    } else if (p.startsWith('### ')) {
      blocks.push({
        type: 'header',
        data: { text: p.substring(4), level: 3 }
      });
    } else if (p.match(/^[*-] /m)) {
      const items = p.split('\n').map(item => item.replace(/^[*-] /, ''));
      blocks.push({
        type: 'list',
        data: { style: 'unordered', items }
      });
    } else if (p.match(/^\d+\. /m)) {
      const items = p.split('\n').map(item => item.replace(/^\d+\. /, ''));
      blocks.push({
        type: 'list',
        data: { style: 'ordered', items }
      });
    } else if (p.startsWith('> ')) {
      blocks.push({
        type: 'quote',
        data: { text: p.substring(2), caption: '' }
      });
    } else if (p.startsWith('```') && p.endsWith('```')) {
      blocks.push({
        type: 'code',
        data: { code: p.substring(3, p.length - 3) }
      });
    } else {
      blocks.push({
        type: 'paragraph',
        data: { text: p }
      });
    }
  }
  
  if (blocks.length === 0) {
    blocks.push({
      type: 'paragraph',
      data: { text: '' }
    });
  }
  
  return { blocks };
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'התחל לכתוב כאן...',
  className = '',
}) => {
  const editorInstance = useRef<EditorJS | null>(null);
  const isEditorReady = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoading = useRef(false);
  const initialValueRef = useRef(initialValue);
  const markdownRef = useRef(initialValue);
  const onChangeRef = useRef(onChange);
  const contentChangedRef = useRef(false);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const convertToMarkdown = (data: any): string => {
    if (!data || !data.blocks || data.blocks.length === 0) return '';
    
    let markdown = '';
    
    for (const block of data.blocks) {
      switch (block.type) {
        case 'header':
          markdown += `${'#'.repeat(block.data.level)} ${block.data.text}\n\n`;
          break;
        case 'paragraph':
          markdown += `${block.data.text}\n\n`;
          break;
        case 'list':
          for (let i = 0; i < block.data.items.length; i++) {
            const item = block.data.items[i];
            markdown += block.data.style === 'ordered' 
              ? `${i + 1}. ${item}\n` 
              : `- ${item}\n`;
          }
          markdown += '\n';
          break;
        case 'quote':
          markdown += `> ${block.data.text}\n\n`;
          break;
        case 'code':
          markdown += `\`\`\`\n${block.data.code}\n\`\`\`\n\n`;
          break;
        default:
          if (block.data.text) {
            markdown += `${block.data.text}\n\n`;
          }
      }
    }
    
    return markdown.trim();
  };

  const markContentAsChanged = useCallback(() => {
    contentChangedRef.current = true;
  }, []);

  const saveContent = useCallback(async () => {
    if (!isEditorReady.current || !editorInstance.current) return;
    if (!contentChangedRef.current) return; // Skip saving if nothing changed
    
    try {
      console.log('Saving editor content');
      const data = await editorInstance.current.save();
      
      if (data) {
        const newMarkdown = convertToMarkdown(data);
        
        if (newMarkdown.trim() !== markdownRef.current.trim()) {
          console.log('Content has changed, updating markdown and parent');
          markdownRef.current = newMarkdown.trim();
          onChangeRef.current(newMarkdown.trim());
          contentChangedRef.current = false;
        }
      }
    } catch (error) {
      console.error('Error saving editor data:', error);
    }
  }, []);

  useEffect(() => {
    if (initialValue) {
      console.log('Setting initial value on first mount only');
      initialValueRef.current = initialValue;
      markdownRef.current = initialValue;
    }
  }, []);

  const initializeEditor = useCallback(() => {
    if (!containerRef.current || isEditorReady.current || editorInstance.current) return;

    isLoading.current = true;
    try {
      console.log('Initializing editor...');
      editorInstance.current = new EditorJS({
        holder: containerRef.current,
        tools: {
          header: {
            class: Header,
            config: {
              placeholder: 'כותרת',
              levels: [1, 2, 3],
              defaultLevel: 2
            }
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: false, // Turn off inline toolbar to avoid focus issues
            config: {
              preserveBlank: true,
              preserveLineBreaks: true
            }
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
          },
          code: Code,
          link: {
            class: Link,
            config: {
              endpoint: 'https://codex.so/upload',
            }
          },
          marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+M',
          }
        },
        data: markdownToEditorJS(initialValueRef.current),
        placeholder: placeholder,
        logLevel: 'ERROR', // Now we can use this since we've updated the type definitions
        onReady: () => {
          console.log('Editor is ready');
          isLoading.current = false;
          isEditorReady.current = true;
          
          // Use MutationObserver to detect actual content changes
          if (containerRef.current && !mutationObserverRef.current) {
            mutationObserverRef.current = new MutationObserver(() => {
              markContentAsChanged();
            });
            
            mutationObserverRef.current.observe(containerRef.current, {
              childList: true,
              subtree: true,
              characterData: true,
              attributes: false
            });
          }
        }
      });
    } catch (error) {
      console.error('EditorJS initialization error:', error);
      isLoading.current = false;
    }
  }, [placeholder, markContentAsChanged]);

  useEffect(() => {
    initializeEditor();

    return () => {
      saveContent();
      
      // Disconnect MutationObserver if it exists
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
        mutationObserverRef.current = null;
      }
      
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        try {
          editorInstance.current.destroy();
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
        editorInstance.current = null;
        isEditorReady.current = false;
      }
    };
  }, [initializeEditor, saveContent]);

  useEffect(() => {
    const handleBeforeSubmit = () => {
      if (contentChangedRef.current) {
        saveContent();
      }
    };

    const handleBeforeUnload = () => {
      if (contentChangedRef.current) {
        saveContent();
      }
    };
    
    const handleBlur = (event: FocusEvent) => {
      // Only trigger save when focus moves completely outside the editor
      if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node)) {
        if (contentChangedRef.current) {
          saveContent();
        }
      }
    };
    
    window.addEventListener('beforesubmit', handleBeforeSubmit);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    if (containerRef.current) {
      containerRef.current.addEventListener('blur', handleBlur as EventListener, true);
    }

    return () => {
      window.removeEventListener('beforesubmit', handleBeforeSubmit);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (containerRef.current) {
        containerRef.current.removeEventListener('blur', handleBlur as EventListener, true);
      }
    };
  }, [saveContent]);

  return (
    <div className={`border rounded-md overflow-hidden bg-white ${className}`}>
      {isLoading.current && (
        <div className="flex justify-center items-center p-4">
          <RefreshCw className="animate-spin h-6 w-6 text-primary" />
        </div>
      )}
      <div 
        ref={containerRef} 
        className="min-h-[400px] p-4"
        style={{ display: isLoading.current ? 'none' : 'block' }}
      />
    </div>
  );
};

export default RichTextEditor;
