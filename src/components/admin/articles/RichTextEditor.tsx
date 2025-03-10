import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Link from '@editorjs/link';
import Marker from '@editorjs/marker';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';

export interface RichTextEditorRef {
  saveContent: () => Promise<boolean>;
  hasUnsavedChanges: () => boolean;
}

interface RichTextEditorProps {
  value?: string;
  defaultValue?: string;
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

const RichTextEditor = React.forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  defaultValue = '',
  onChange,
  placeholder = 'התחל לכתוב כאן...',
  className = '',
}, ref) => {
  const editorInstance = useRef<EditorJS | null>(null);
  const isEditorReady = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoading = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const [showUnsavedIndicator, setShowUnsavedIndicator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const contentRef = useRef(defaultValue || '');

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

  const saveContent = async () => {
    if (!isEditorReady.current || !editorInstance.current) return false;
    
    try {
      setIsSaving(true);
      console.log('Explicitly saving editor content');
      const data = await editorInstance.current.save();
      
      if (data) {
        const newMarkdown = convertToMarkdown(data);
        contentRef.current = newMarkdown.trim();
        onChange(newMarkdown.trim());
        hasUnsavedChangesRef.current = false;
        setShowUnsavedIndicator(false);
        setIsSaving(false);
        return true;
      }
      setIsSaving(false);
      return false;
    } catch (error) {
      console.error('Error saving editor data:', error);
      setIsSaving(false);
      return false;
    }
  };

  const markAsDirty = () => {
    if (!showUnsavedIndicator) {
      setShowUnsavedIndicator(true);
    }
    
    hasUnsavedChangesRef.current = true;
  };

  const initializeEditor = () => {
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
            inlineToolbar: false,
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
        data: markdownToEditorJS(defaultValue),
        placeholder: placeholder,
        logLevel: 'ERROR',
        autofocus: true,
        autosave: false,
        onReady: () => {
          console.log('Editor is ready');
          isLoading.current = false;
          isEditorReady.current = true;
          
          if (containerRef.current) {
            containerRef.current.addEventListener('input', () => {
              hasUnsavedChangesRef.current = true;
              
              if (!showUnsavedIndicator) {
                setTimeout(() => {
                  setShowUnsavedIndicator(true);
                }, 100);
              }
            }, false);
          }
        }
      });
    } catch (error) {
      console.error('EditorJS initialization error:', error);
      isLoading.current = false;
    }
  };

  useEffect(() => {
    initializeEditor();

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        try {
          console.log('Destroying editor...');
          editorInstance.current.destroy();
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
        editorInstance.current = null;
        isEditorReady.current = false;
      }
    };
  }, []);

  React.useImperativeHandle(ref, () => ({
    saveContent,
    hasUnsavedChanges: () => hasUnsavedChangesRef.current
  }));

  const handleManualSave = async () => {
    await saveContent();
  };

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
      <div className="border-t p-2 flex justify-between items-center bg-gray-50">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {showUnsavedIndicator && (
            <>
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-amber-800">יש שינויים שלא נשמרו</span>
            </>
          )}
        </div>
        <button
          onClick={handleManualSave}
          disabled={!hasUnsavedChangesRef.current || isSaving}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
            hasUnsavedChangesRef.current 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="animate-spin h-4 w-4" />
              שומר...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              שמור
            </>
          )}
        </button>
      </div>
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
