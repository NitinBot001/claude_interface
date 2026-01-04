// src/components/chat/MarkdownRenderer.jsx
import React, { memo, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy } from 'lucide-react';
import 'katex/dist/katex.min.css';

// Custom styles to override KaTeX for dark mode
const katexDarkStyles = `
  .katex, .katex-html, .katex-display {
    color: #e4e4e7 !important;
  }
  .katex .mord, .katex .mbin, .katex .mrel, 
  .katex .mopen, .katex .mclose, .katex .minner,
  .katex .mop, .katex .mpunct, .katex .mspace {
    color: #e4e4e7 !important;
  }
  .katex .frac-line {
    background: #e4e4e7 !important;
    border-color: #e4e4e7 !important;
  }
  .katex .sqrt > .sqrt-line {
    border-color: #e4e4e7 !important;
  }
  .katex .katex-error {
    color: #ef4444 !important;
  }
`;

/**
 * Code Block with Copy Button
 */
const CodeBlock = memo(({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="code-block-container">
      {/* Header */}
      <div className="code-block-header">
        <span className="code-language">{language || 'code'}</span>
        <button onClick={handleCopy} className="copy-button">
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '13px',
          lineHeight: '1.5',
          borderRadius: '0 0 10px 10px',
          background: '#1e1e1e'
        }}
        showLineNumbers={value.split('\n').length > 5}
        wrapLines={true}
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
      
      <style jsx>{`
        .code-block-container {
          margin: 16px 0;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #333;
          background: #1e1e1e;
        }
        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #2d2d2d;
          border-bottom: 1px solid #333;
        }
        .code-language {
          font-size: 12px;
          color: #888;
          font-family: monospace;
          text-transform: uppercase;
        }
        .copy-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          font-size: 12px;
          color: #888;
          background: #3d3d3d;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .copy-button:hover {
          color: #fff;
          background: #4d4d4d;
        }
      `}</style>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

/**
 * Get text content from children
 */
const getTextContent = (children) => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (children?.props?.children) return getTextContent(children.props.children);
  return '';
};

/**
 * Main Markdown Renderer
 */
const MarkdownRenderer = memo(({ content, isStreaming = false }) => {
  if (!content) return null;

  return (
    <div className="markdown-body">
      <style>{katexDarkStyles}</style>
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { 
          strict: false, 
          throwOnError: false,
          output: 'htmlAndMathml'
        }]]}
        components={{
          // Code blocks
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = getTextContent(children).replace(/\n$/, '');
            
            // Block code
            if (!inline && (language || codeString.includes('\n'))) {
              return <CodeBlock language={language} value={codeString} />;
            }
            
            // Inline code
            return (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },

          // Pre wrapper - let code handle it
          pre({ children }) {
            return <>{children}</>;
          },

          // Paragraphs
          p({ children }) {
            return <p className="md-paragraph">{children}</p>;
          },

          // Headings
          h1({ children }) {
            return <h1 className="md-h1">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="md-h2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="md-h3">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="md-h4">{children}</h4>;
          },

          // Lists
          ul({ children }) {
            return <ul className="md-ul">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="md-ol">{children}</ol>;
          },
          li({ children }) {
            return <li className="md-li">{children}</li>;
          },

          // Links
          a({ href, children }) {
            const isExternal = href?.startsWith('http');
            return (
              <a 
                href={href} 
                className="md-link"
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            );
          },

          // Blockquote
          blockquote({ children }) {
            return <blockquote className="md-blockquote">{children}</blockquote>;
          },

          // Table
          table({ children }) {
            return (
              <div className="md-table-wrapper">
                <table className="md-table">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="md-thead">{children}</thead>;
          },
          th({ children }) {
            return <th className="md-th">{children}</th>;
          },
          td({ children }) {
            return <td className="md-td">{children}</td>;
          },

          // Horizontal rule
          hr() {
            return <hr className="md-hr" />;
          },

          // Strong
          strong({ children }) {
            return <strong className="md-strong">{children}</strong>;
          },

          // Emphasis
          em({ children }) {
            return <em className="md-em">{children}</em>;
          },

          // Delete/Strikethrough
          del({ children }) {
            return <del className="md-del">{children}</del>;
          },

          // Images
          img({ src, alt }) {
            return <img src={src} alt={alt || ''} className="md-img" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Streaming cursor */}
      {isStreaming && <span className="streaming-cursor" />}
      
      {/* Styles */}
      <style jsx>{`
        .markdown-body {
          color: #f4f4f5;
          font-size: 15px;
          line-height: 1.7;
          word-break: break-word;
        }
        
        /* Paragraphs */
        .markdown-body :global(.md-paragraph) {
          color: #f4f4f5;
          margin-bottom: 16px;
          line-height: 1.7;
        }
        .markdown-body :global(.md-paragraph:last-child) {
          margin-bottom: 0;
        }
        
        /* Headings */
        .markdown-body :global(.md-h1) {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 24px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #3d3d3d;
        }
        .markdown-body :global(.md-h1:first-child) {
          margin-top: 0;
        }
        .markdown-body :global(.md-h2) {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 20px;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #3d3d3d;
        }
        .markdown-body :global(.md-h3) {
          color: #ffffff;
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .markdown-body :global(.md-h4) {
          color: #f4f4f5;
          font-size: 1rem;
          font-weight: 600;
          margin-top: 12px;
          margin-bottom: 8px;
        }
        
        /* Strong & Em */
        .markdown-body :global(.md-strong) {
          color: #ffffff;
          font-weight: 600;
        }
        .markdown-body :global(.md-em) {
          color: #e4e4e7;
          font-style: italic;
        }
        .markdown-body :global(.md-del) {
          color: #71717a;
          text-decoration: line-through;
        }
        
        /* Links */
        .markdown-body :global(.md-link) {
          color: #f97316;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .markdown-body :global(.md-link:hover) {
          color: #fb923c;
        }
        
        /* Lists */
        .markdown-body :global(.md-ul) {
          color: #f4f4f5;
          margin-bottom: 16px;
          padding-left: 24px;
          list-style-type: disc;
        }
        .markdown-body :global(.md-ol) {
          color: #f4f4f5;
          margin-bottom: 16px;
          padding-left: 24px;
          list-style-type: decimal;
        }
        .markdown-body :global(.md-li) {
          color: #f4f4f5;
          margin-bottom: 6px;
          line-height: 1.6;
        }
        
        /* Blockquote */
        .markdown-body :global(.md-blockquote) {
          border-left: 4px solid #f97316;
          padding: 12px 16px;
          margin: 16px 0;
          background: rgba(249, 115, 22, 0.08);
          border-radius: 0 8px 8px 0;
          color: #d4d4d8;
        }
        .markdown-body :global(.md-blockquote p) {
          margin-bottom: 8px;
        }
        .markdown-body :global(.md-blockquote p:last-child) {
          margin-bottom: 0;
        }
        
        /* Inline code */
        .markdown-body :global(.inline-code) {
          background: #2d2d2d;
          color: #f97316;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          border: 1px solid #3d3d3d;
        }
        
        /* Table */
        .markdown-body :global(.md-table-wrapper) {
          overflow-x: auto;
          margin: 16px 0;
        }
        .markdown-body :global(.md-table) {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          border: 1px solid #3d3d3d;
          border-radius: 8px;
          overflow: hidden;
        }
        .markdown-body :global(.md-thead) {
          background: #1a1a1a;
        }
        .markdown-body :global(.md-th) {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #ffffff;
          border-bottom: 1px solid #3d3d3d;
        }
        .markdown-body :global(.md-td) {
          padding: 12px 16px;
          color: #e4e4e7;
          border-bottom: 1px solid #2d2d2d;
        }
        
        /* HR */
        .markdown-body :global(.md-hr) {
          border: none;
          border-top: 1px solid #3d3d3d;
          margin: 24px 0;
        }
        
        /* Images */
        .markdown-body :global(.md-img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        
        /* KaTeX Display Math */
        .markdown-body :global(.katex-display) {
          margin: 20px 0;
          padding: 20px;
          background: #18181b;
          border-radius: 10px;
          border: 1px solid #27272a;
          overflow-x: auto;
        }
        
        /* Streaming cursor */
        .streaming-cursor {
          display: inline-block;
          width: 8px;
          height: 18px;
          background: #f97316;
          margin-left: 2px;
          vertical-align: text-bottom;
          border-radius: 2px;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
export default MarkdownRenderer;
