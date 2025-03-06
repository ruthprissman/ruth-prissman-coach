
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
});

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  markdown, 
  className = '' 
}) => {
  if (!markdown) return <div className={`prose max-w-none ${className}`}></div>;
  
  const html = mdParser.render(markdown);
  
  return (
    <div 
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
