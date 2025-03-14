'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Enhances HTML content by adding copy buttons to code blocks and handling other
 * markdown-specific interactions.
 */
const MarkdownContent = ({ content }: { content: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Process the rendered content to add copy buttons to code blocks
  useEffect(() => {
    if (!contentRef.current) return;
    
    // Find all pre elements (code blocks)
    const preElements = contentRef.current.querySelectorAll('pre');
    
    preElements.forEach((preElement) => {
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy';
      copyButton.className = 'copy-button';
      
      // Add click event to copy button
      copyButton.addEventListener('click', () => {
        // Find code element within pre
        const codeElement = preElement.querySelector('code');
        if (!codeElement) return;
        
        // Copy code to clipboard
        const textToCopy = codeElement.textContent || '';
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            // Indicate successful copy
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = 'Copy';
            }, 2000);
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
            copyButton.textContent = 'Failed to copy';
            setTimeout(() => {
              copyButton.textContent = 'Copy';
            }, 2000);
          });
      });
      
      // Add button to pre element
      preElement.appendChild(copyButton);
    });
    
    // Process emojis if needed
    // This is a simple replacement, you might want to use a more robust emoji library
    const emojiMap: Record<string, string> = {
      ":smile:": "😊",
      ":heart:": "❤️",
      ":rocket:": "🚀",
      // Add more emoji mappings as needed
    };
    
    // Find all text nodes
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textNodes: Node[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // Replace emoji shortcodes with actual emojis
    textNodes.forEach(textNode => {
      if (!textNode.textContent) return;
      
      let newContent = textNode.textContent;
      Object.entries(emojiMap).forEach(([shortcode, emoji]) => {
        newContent = newContent.replace(new RegExp(shortcode, 'g'), emoji);
      });
      
      if (newContent !== textNode.textContent) {
        textNode.textContent = newContent;
      }
    });
    
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className="prose prose-blue dark:prose-invert prose-lg max-w-none
                 prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg
                 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium
                 prose-p:text-base prose-p:leading-7 
                 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-700 prose-blockquote:pl-4 prose-blockquote:italic
                 prose-ul:list-disc prose-ol:list-decimal
                 prose-li:my-1
                 prose-hr:my-8 prose-hr:border-gray-200 dark:prose-hr:border-gray-800
                 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono
                 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:text-sm prose-pre:font-mono prose-pre:rounded prose-pre:overflow-x-auto
                 prose-img:rounded-md prose-img:mx-auto
                 prose-table:border-collapse prose-table:my-6
                 prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-2
                 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:p-2"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default MarkdownContent; 