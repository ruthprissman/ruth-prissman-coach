
import React from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

// Configure markdown-it to preserve empty paragraphs
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // Enable line breaks
});

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  markdown, 
  className = '' 
}) => {
  if (!markdown) return <div className={`prose max-w-none ${className}`}></div>;
  
  // Process the markdown while preserving paragraphs for column layout.
  // Sanitize the result: markdown-it runs with html:true, so raw HTML can pass through.
  const html = DOMPurify.sanitize(mdParser.render(markdown));
  
  return (
    <div 
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
