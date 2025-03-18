
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
  articleTitle?: string;
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

// Convert HTML to EditorJS blocks
const htmlToEditorJS = (html: string): any => {
  if (!html) return DEFAULT_INITIAL_DATA;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks = [];
  
  // Process each element
  const elements = Array.from(doc.body.childNodes);
  
  for (const element of elements) {
    if (element.nodeType === Node.TEXT_NODE) {
      if (element.textContent?.trim()) {
        blocks.push({
          type: 'paragraph',
          data: { text: element.textContent }
        });
      }
      continue;
    }
    
    if (element.nodeType !== Node.ELEMENT_NODE) continue;
    
    const el = element as HTMLElement;
    
    // Process based on tag name
    switch (el.tagName.toLowerCase()) {
      case 'h1':
      case 'h2':
      case 'h3':
        blocks.push({
          type: 'header',
          data: { 
            text: el.innerHTML,
            level: parseInt(el.tagName.charAt(1))
          }
        });
        break;
        
      case 'p':
        blocks.push({
          type: 'paragraph',
          data: { text: el.innerHTML }
        });
        break;
        
      case 'ul':
        const ulItems = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML);
        blocks.push({
          type: 'list',
          data: { style: 'unordered', items: ulItems }
        });
        break;
        
      case 'ol':
        const olItems = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML);
        blocks.push({
          type: 'list',
          data: { style: 'ordered', items: olItems }
        });
        break;
        
      case 'blockquote':
        blocks.push({
          type: 'quote',
          data: { text: el.innerHTML, caption: '' }
        });
        break;
        
      case 'pre':
        blocks.push({
          type: 'code',
          data: { code: el.textContent || '' }
        });
        break;
        
      default:
        // Handle divs and other elements as paragraphs
        blocks.push({
          type: 'paragraph',
          data: { text: el.innerHTML }
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
  articleTitle = '',
}, ref) => {
  const editorInstance = useRef<EditorJS | null>(null);
  const isEditorReady = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoading = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const [showUnsavedIndicator, setShowUnsavedIndicator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const contentRef = useRef(defaultValue || '');

  // Process email links to convert "כתבי לי" into clickable mailto links
  const processEmailLinks = (content: string, title: string): string => {
    const encodedTitle = encodeURIComponent(`שאלה על ${title}`);
    const emailAddress = "RuthPrissman@gmail.com";
    const emailLink = `<a href="mailto:${emailAddress}?subject=${encodedTitle}">כתבי לי</a>`;

    // Replace all occurrences of "כתבי לי" with the email link
    return content.replace(/כתבי לי/g, emailLink);
  };

  // Convert EditorJS blocks to HTML
  const convertToHTML = (data: any): string => {
    if (!data || !data.blocks || data.blocks.length === 0) return '';
    
    let html = '';
    
    for (const block of data.blocks) {
      switch (block.type) {
        case 'header': {
          const level = block.data.level || 2;
          html += `<h${level}>${block.data.text}</h${level}>`;
          break;
        }
        case 'paragraph':
          html += `<p>${block.data.text}</p>`;
          break;
        case 'list': {
          const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
          html += `<${tag}>`;
          for (const item of block.data.items) {
            html += `<li>${item}</li>`;
          }
          html += `</${tag}>`;
          break;
        }
        case 'quote':
          html += `<blockquote>${block.data.text}</blockquote>`;
          break;
        case 'code':
          html += `<pre>${block.data.code}</pre>`;
          break;
        default:
          if (block.data.text) {
            html += `<p>${block.data.text}</p>`;
          }
      }
    }
    
    // Process email links before returning the HTML
    const processedHTML = articleTitle ? processEmailLinks(html, articleTitle) : html;
    return processedHTML;
  };

  const saveContent = async () => {
    if (!isEditorReady.current || !editorInstance.current) return false;
    
    try {
      setIsSaving(true);
      console.log('Explicitly saving editor content');
      const data = await editorInstance.current.save();
      
      if (data) {
        const newHTML = convertToHTML(data);
        contentRef.current = newHTML;
        
        onChange(newHTML);
        
        console.log('Content saved as HTML and passed to parent form:', newHTML.substring(0, 100) + '...');
        
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
            inlineToolbar: true,
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
        data: htmlToEditorJS(defaultValue),
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
    const saved = await saveContent();
    if (saved) {
      console.log('Manual save completed successfully');
    } else {
      console.warn('Manual save failed');
    }
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
