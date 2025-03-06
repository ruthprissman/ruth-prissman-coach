
import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Link from '@editorjs/link';
import Marker from '@editorjs/marker';
import EditorJSParser from 'editorjs-parser';
import { Button } from '@/components/ui/button';
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

// Function to convert Markdown to EditorJS format
const markdownToEditorJS = (markdown: string): any => {
  if (!markdown) return DEFAULT_INITIAL_DATA;
  
  // This is a simplified conversion, production code would use a more robust parser
  const blocks = [];
  
  // Split markdown by double newlines (paragraphs)
  const paragraphs = markdown.split('\n\n');
  
  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;
    
    // Check for header
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
    }
    // Check for unordered list
    else if (p.match(/^[*-] /m)) {
      const items = p.split('\n').map(item => item.replace(/^[*-] /, ''));
      blocks.push({
        type: 'list',
        data: { style: 'unordered', items }
      });
    }
    // Check for ordered list
    else if (p.match(/^\d+\. /m)) {
      const items = p.split('\n').map(item => item.replace(/^\d+\. /, ''));
      blocks.push({
        type: 'list',
        data: { style: 'ordered', items }
      });
    }
    // Check for blockquote
    else if (p.startsWith('> ')) {
      blocks.push({
        type: 'quote',
        data: { text: p.substring(2), caption: '' }
      });
    }
    // Check for code block
    else if (p.startsWith('```') && p.endsWith('```')) {
      blocks.push({
        type: 'code',
        data: { code: p.substring(3, p.length - 3) }
      });
    }
    // Regular paragraph
    else {
      blocks.push({
        type: 'paragraph',
        data: { text: p }
      });
    }
  }
  
  return { blocks };
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'התחל לכתוב כאן...',
  className = '',
}) => {
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize EditorJS
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const initEditor = async () => {
      setIsLoading(true);
      try {
        const editor = new EditorJS({
          holder: containerRef.current!,
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
            },
            quote: {
              class: Quote,
              inlineToolbar: true,
            },
            code: Code,
            link: {
              class: Link,
              config: {
                endpoint: 'https://codex.so/upload', // This is optional
              }
            },
            marker: {
              class: Marker,
              shortcut: 'CMD+SHIFT+M',
            }
          },
          data: markdownToEditorJS(initialValue),
          placeholder: placeholder,
          onChange: async () => {
            const data = await editorRef.current?.save();
            
            // Convert the EditorJS data to Markdown
            if (data) {
              const parser = new EditorJSParser();
              
              // Register custom parse rules
              parser.registerBlockParser('header', (block: any) => {
                const level = block.data.level;
                const text = block.data.text;
                return `${'#'.repeat(level)} ${text}`;
              });
              
              parser.registerBlockParser('paragraph', (block: any) => {
                return block.data.text;
              });
              
              parser.registerBlockParser('list', (block: any) => {
                const { style, items } = block.data;
                return items.map((item: string, index: number) => 
                  style === 'ordered' ? `${index + 1}. ${item}` : `- ${item}`
                ).join('\n');
              });
              
              parser.registerBlockParser('quote', (block: any) => {
                return `> ${block.data.text}`;
              });
              
              parser.registerBlockParser('code', (block: any) => {
                return `\`\`\`\n${block.data.code}\n\`\`\``;
              });
              
              // Parse EditorJS data to Markdown
              let markdown = '';
              data.blocks.forEach((block: any) => {
                const parsedBlock = parser.parseBlock(block);
                markdown += parsedBlock + '\n\n';
              });
              
              onChange(markdown.trim());
            }
          },
          onReady: () => {
            setIsLoading(false);
            setIsInitialized(true);
          }
        });
        
        editorRef.current = editor;
      } catch (error) {
        console.error('EditorJS initialization error:', error);
        setIsLoading(false);
      }
    };

    initEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [containerRef, initialValue, placeholder, onChange]);

  // Update editor content when initialValue changes
  useEffect(() => {
    if (editorRef.current && isInitialized && initialValue) {
      // Only update if the editor is already initialized
      editorRef.current.render(markdownToEditorJS(initialValue));
    }
  }, [initialValue, isInitialized]);

  return (
    <div className={`border rounded-md overflow-hidden bg-white ${className}`}>
      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <RefreshCw className="animate-spin h-6 w-6 text-primary" />
        </div>
      )}
      <div 
        ref={containerRef} 
        className="min-h-[400px] p-4"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default RichTextEditor;
