
import React from 'react';

interface MarkdownPreviewProps {
  markdown: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown }) => {
  // Very basic markdown to HTML conversion for preview purposes
  const renderMarkdown = () => {
    if (!markdown) return '';
    
    // Process paragraphs
    let html = markdown.split('\n\n').map(paragraph => {
      if (!paragraph.trim()) return '';
      
      // Process headings
      if (paragraph.startsWith('# ')) {
        return `<h1>${paragraph.substring(2)}</h1>`;
      } else if (paragraph.startsWith('## ')) {
        return `<h2>${paragraph.substring(3)}</h2>`;
      } else if (paragraph.startsWith('### ')) {
        return `<h3>${paragraph.substring(4)}</h3>`;
      }
      
      // Process lists
      if (paragraph.includes('\n- ')) {
        const listItems = paragraph.split('\n- ');
        const items = listItems.slice(1).map(item => `<li>${item}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      
      // Process bold and italic text
      let processed = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      
      return `<p>${processed}</p>`;
    }).join('');
    
    return html;
  };
  
  return (
    <div 
      className="markdown-preview prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
    />
  );
};

export default MarkdownPreview;
