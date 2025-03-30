
import React from 'react';
import MarkdownIt from 'markdown-it';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

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
  
  // Process the markdown while preserving paragraphs for column layout
  const processedMarkdown = markdown;
  const html = mdParser.render(processedMarkdown);
  
  return (
    <div 
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
