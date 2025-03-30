
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
  
  // Add a style to ensure proper column display
  const processedMarkdown = markdown
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
  
  const html = mdParser.render(processedMarkdown);
  
  return (
    <div 
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
