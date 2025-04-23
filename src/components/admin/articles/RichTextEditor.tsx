import React, { useEffect, useRef, useState, useCallback } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Link from '@editorjs/link';
import Marker from '@editorjs/marker';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

// הזמן המקסימלי (במילישניות) שהעורך יכול להיות פעיל ללא חידוש
// Extending session timeout to 30 minutes
const EDITOR_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// התדירות (במילישניות) בה נבדוק אם העורך פעיל
// Check connection every minute
const CONNECTION_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Autosave interval (5 minutes)
const AUTOSAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Warning threshold before timeout (5 minutes before)
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes

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
  const [editorStatus, setEditorStatus] = useState<'ready' | 'initializing' | 'refreshing' | 'timeout'>('initializing');
  
  const contentRef = useRef(defaultValue || '');
  const lastActivityTimestamp = useRef(Date.now());
  const connectionCheckInterval = useRef<number | null>(null);
  const localBackupKey = useRef(`article_editor_backup_${Date.now()}`);
  const initializationAttempts = useRef(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const autosaveInterval = useRef<number | null>(null);
  const { toast } = useToast();
  
  // שמירת טיוטה מקומית למקרי חירום
  const saveLocalBackup = useCallback(() => {
    if (!contentRef.current) return;
    
    try {
      localStorage.setItem(localBackupKey.current, contentRef.current);
      console.log('Editor: Local backup saved, length:', contentRef.current.length);
    } catch (err) {
      console.error('Editor: Failed to save local backup', err);
    }
  }, []);
  
  // טעינת טיוטה מקומית במקרה שיש
  const loadLocalBackup = useCallback((): string | null => {
    try {
      const backup = localStorage.getItem(localBackupKey.current);
      
      if (backup) {
        console.log('Editor: Found local backup, length:', backup.length);
      }
      
      return backup;
    } catch (err) {
      console.error('Editor: Failed to load local backup', err);
      return null;
    }
  }, []);

  // בדיקת מצב החיבור והחידוש במידת הצורך
  // Enhanced connection check with warning
  const checkConnection = useCallback(() => {
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivityTimestamp.current;
    
    // Show warning 5 minutes before timeout
    if (timeSinceLastActivity > (EDITOR_SESSION_TIMEOUT - WARNING_THRESHOLD)) {
      setShowTimeoutWarning(true);
    }
    
    // If timeout reached, update status
    if (timeSinceLastActivity > EDITOR_SESSION_TIMEOUT) {
      console.log('Editor: Session timeout detected, editor needs refresh');
      setEditorStatus('timeout');
      return;
    }
    
    // Reset warning if we're back in safe territory
    setShowTimeoutWarning(false);
    
    // Update last activity timestamp
    lastActivityTimestamp.current = currentTime;
  }, []);

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

  // Enhanced save content function
  const saveContent = async () => {
    if (!isEditorReady.current || !editorInstance.current) return false;
    
    try {
      setIsSaving(true);
      
      // Check connection status before saving
      if (editorStatus === 'timeout') {
        // Try to refresh editor first
        await refreshEditor();
        
        // If still in timeout, can't save
        if (editorStatus === 'timeout') {
          toast({
            title: "לא ניתן לשמור",
            description: "נדרש לרענן את העורך לפני השמירה",
            variant: "destructive"
          });
          return false;
        }
      }
      
      console.log('Editor: Saving editor content');
      const data = await editorInstance.current.save();
      
      if (data) {
        const newHTML = convertToHTML(data);
        contentRef.current = newHTML;
        onChange(newHTML);
        console.log('Editor: Content saved successfully');
        
        // Save local backup
        saveLocalBackup();
        
        // Reset activity timestamp after successful save
        lastActivityTimestamp.current = Date.now();
        
        hasUnsavedChangesRef.current = false;
        setShowUnsavedIndicator(false);
        setIsSaving(false);
        return true;
      }
      
      setIsSaving(false);
      return false;
    } catch (error) {
      console.error('Editor: Error saving editor data:', error);
      setIsSaving(false);
      
      // ניסיון נוסף לשמור את התוכן הגולמי
      try {
        const backup = await editorInstance.current?.save();
        if (backup) {
          console.log('Editor: Created emergency backup of content');
          localStorage.setItem(`article_emergency_backup_${Date.now()}`, JSON.stringify(backup));
        }
      } catch (e) {
        console.error('Editor: Failed to create emergency backup', e);
      }
      
      return false;
    }
  };

  const markAsDirty = () => {
    if (!showUnsavedIndicator) {
      setShowUnsavedIndicator(true);
    }
    
    // עדכון זמן הפעילות האחרונה
    lastActivityTimestamp.current = Date.now();
    
    hasUnsavedChangesRef.current = true;
  };

  const refreshEditor = useCallback(() => {
    console.log('Editor: Refreshing editor connection');
    setEditorStatus('refreshing');
    
    // שמירת התוכן הנוכחי אם יש
    const currentContent = contentRef.current;
    
    // השמדת מופע קודם אם קיים
    if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
      try {
        editorInstance.current.destroy();
      } catch (e) {
        console.error('Editor: Error destroying editor instance during refresh:', e);
      }
    }
    
    editorInstance.current = null;
    isEditorReady.current = false;
    
    // איתחול מחדש
    setTimeout(() => {
      initializeEditor(currentContent);
    }, 100);
  }, []);

  const initializeEditor = useCallback((contentToLoad: string = '') => {
    if (!containerRef.current || isEditorReady.current || editorInstance.current) return;
    
    initializationAttempts.current++;
    console.log(`Editor: Initializing editor (attempt ${initializationAttempts.current})...`);
    
    isLoading.current = true;
    setEditorStatus('initializing');
    
    // בדיקה אם יש גיבוי מקומי
    const localBackup = loadLocalBackup();
    
    // תעדיפות: תוכן שהועבר > גיבוי מקומי > ערך ברירת מחדל
    const contentToUse = contentToLoad || localBackup || defaultValue || '';
    
    try {
      console.log('Editor: Creating EditorJS instance with content length:', contentToUse.length);
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
        data: htmlToEditorJS(contentToUse),
        placeholder: placeholder,
        logLevel: 'ERROR',
        autofocus: true,
        autosave: false,
        onReady: () => {
          console.log('Editor: Instance is ready');
          isLoading.current = false;
          isEditorReady.current = true;
          setEditorStatus('ready');
          
          // עדכון זמן הפעילות האחרונה
          lastActivityTimestamp.current = Date.now();
          
          if (containerRef.current) {
            containerRef.current.addEventListener('input', () => {
              hasUnsavedChangesRef.current = true;
              
              // עדכון זמן הפעילות האחרונה
              lastActivityTimestamp.current = Date.now();
              
              if (!showUnsavedIndicator) {
                setTimeout(() => {
                  setShowUnsavedIndicator(true);
                }, 100);
              }
            }, false);
            
            // האזנה לאירועי עכבר ומקלדת לעדכון זמן הפעילות
            const updateActivity = () => {
              lastActivityTimestamp.current = Date.now();
            };
            
            containerRef.current.addEventListener('click', updateActivity);
            containerRef.current.addEventListener('keydown', updateActivity);
          }
        }
      });
    } catch (error) {
      console.error('Editor: EditorJS initialization error:', error);
      isLoading.current = false;
      setEditorStatus('timeout');
    }
  }, [defaultValue, loadLocalBackup, placeholder]);

  // התחלת הבדיקה התקופתית של מצב החיבור
  useEffect(() => {
    if (connectionCheckInterval.current === null) {
      connectionCheckInterval.current = window.setInterval(() => {
        checkConnection();
      }, CONNECTION_CHECK_INTERVAL) as unknown as number;
    }
    
    return () => {
      if (connectionCheckInterval.current !== null) {
        window.clearInterval(connectionCheckInterval.current);
        connectionCheckInterval.current = null;
      }
    };
  }, [checkConnection]);

  // Setup autosave
  useEffect(() => {
    if (autosaveInterval.current === null) {
      autosaveInterval.current = window.setInterval(async () => {
        if (hasUnsavedChangesRef.current) {
          console.log('Editor: Attempting autosave');
          await saveContent();
        }
      }, AUTOSAVE_INTERVAL) as unknown as number;
    }
    
    return () => {
      if (autosaveInterval.current !== null) {
        window.clearInterval(autosaveInterval.current);
        autosaveInterval.current = null;
      }
    };
  }, [saveContent]);

  // איתחול העורך כשהרכיב נטען לראשונה
  useEffect(() => {
    initializeEditor();
    
    // ניקוי כשהרכיב מוסר
    return () => {
      console.log('Editor: Cleaning up editor instance');
      
      // שחרור משאבים
      if (connectionCheckInterval.current !== null) {
        window.clearInterval(connectionCheckInterval.current);
      }
      
      // ניסיון לשמור את התוכן לפני הסגירה
      if (editorInstance.current && isEditorReady.current) {
        try {
          editorInstance.current.save().then(data => {
            if (data) {
              const finalHTML = convertToHTML(data);
              contentRef.current = finalHTML;
              saveLocalBackup();
              onChange(finalHTML);
            }
            
            // השמדת המופע
            if (editorInstance.current) {
              editorInstance.current.destroy();
            }
          }).catch(e => {
            console.error('Editor: Error saving content during cleanup:', e);
            
            // השמדת המופע גם במקרה של שגיאה
            if (editorInstance.current) {
              editorInstance.current.destroy();
            }
          });
        } catch (error) {
          console.error('Editor: Error destroying editor:', error);
          
          // ניסיון אחרון להשמדה
          if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
            try {
              editorInstance.current.destroy();
            } catch {}
          }
        }
      } else if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        try {
          editorInstance.current.destroy();
        } catch (error) {
          console.error('Editor: Error destroying editor during cleanup:', error);
        }
      }
      
      editorInstance.current = null;
      isEditorReady.current = false;
    };
  }, []);

  // חשיפת הפונקציות לרכיב ההורה
  React.useImperativeHandle(ref, () => ({
    saveContent,
    hasUnsavedChanges: () => hasUnsavedChangesRef.current
  }));

  // טיפול בשמירה ידנית
  const handleManualSave = async () => {
    const saved = await saveContent();
    if (saved) {
      console.log('Editor: Manual save completed successfully');
    } else {
      console.warn('Editor: Manual save failed');
    }
  };

  // טיפול בחידוש ידני
  const handleManualRefresh = () => {
    // שמירה לפני חידוש
    if (editorInstance.current && isEditorReady.current) {
      editorInstance.current.save().then(data => {
        if (data) {
          const currentHTML = convertToHTML(data);
          contentRef.current = currentHTML;
          onChange(currentHTML);
          saveLocalBackup();
        }
        refreshEditor();
      }).catch(() => {
        refreshEditor();
      });
    } else {
      refreshEditor();
    }
  };

  return (
    <div className={`border rounded-md overflow-hidden bg-white ${className}`}>
      {(isLoading.current || editorStatus === 'initializing' || editorStatus === 'refreshing') && (
        <div className="flex justify-center items-center p-4">
          <RefreshCw className="animate-spin h-6 w-6 text-primary" />
          <span className="mr-2">{editorStatus === 'initializing' ? 'מאתחל עורך...' : 'מחדש חיבור...'}</span>
        </div>
      )}
      
      {showTimeoutWarning && editorStatus !== 'timeout' && (
        <div className="bg-yellow-50 p-2 text-sm text-yellow-800 flex items-center justify-between">
          <span>העורך יתנתק בקרוב, מומלץ לשמור את השינויים</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              lastActivityTimestamp.current = Date.now();
              setShowTimeoutWarning(false);
            }}
          >
            המשך עריכה
          </Button>
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
          {editorStatus === 'timeout' && (
            <button
              onClick={handleManualRefresh}
              className="text-blue-600 flex items-center gap-1 text-sm hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              חדש חיבור
            </button>
          )}
        </div>
        <button
          onClick={handleManualSave}
          disabled={!hasUnsavedChangesRef.current || isSaving || editorStatus === 'timeout'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
            hasUnsavedChangesRef.current && editorStatus !== 'timeout'
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
