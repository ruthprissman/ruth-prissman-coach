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

const hasValidContent = (markdown: string): boolean => {
  if (!markdown) return false;
  
  const strippedContent = markdown.replace(/\s+/g, '').trim();
  return strippedContent.length > 0;
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
  const initialValueRef = useRef(initialValue);
  const [currentMarkdown, setCurrentMarkdown] = useState(initialValue);

  useEffect(() => {
    if (initialValue && hasValidContent(initialValue)) {
      console.log('Initial value has valid content, calling onChange');
      onChange(initialValue);
    }
  }, []);

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
          onChange: async () => {
            try {
              console.log('Editor content changed, saving...');
              const data = await editorRef.current?.save();
              
              if (data) {
                console.log('Editor data available:', data);
                const parser = new EditorJSParser();
                
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
                
                let markdown = '';
                data.blocks.forEach((block: any) => {
                  const parsedBlock = parser.parseBlock(block);
                  markdown += parsedBlock + '\n\n';
                });
                
                const trimmedMarkdown = markdown.trim();
                console.log('Generated markdown:', trimmedMarkdown);
                console.log('Has valid content:', hasValidContent(trimmedMarkdown));
                
                setCurrentMarkdown(trimmedMarkdown);
                
                onChange(trimmedMarkdown);
              }
            } catch (error) {
              console.error('Error saving editor data:', error);
            }
          },
          onReady: () => {
            console.log('Editor is ready');
            setIsLoading(false);
            setIsInitialized(true);
            
            if (initialValueRef.current && hasValidContent(initialValueRef.current)) {
              console.log('Calling onChange with initial value on ready');
              onChange(initialValueRef.current);
            }
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
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        try {
          editorRef.current.destroy();
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
        editorRef.current = null;
      }
    };
  }, [containerRef, placeholder]);

  useEffect(() => {
    if (editorRef.current && isInitialized && initialValue !== initialValueRef.current) {
      console.log('Initial value changed, updating editor');
      initialValueRef.current = initialValue;
      setCurrentMarkdown(initialValue);
      try {
        editorRef.current.render(markdownToEditorJS(initialValue));
      } catch (error) {
        console.error('Error rendering editor with new value:', error);
      }
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
