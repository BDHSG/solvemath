import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-slate max-w-none prose-p:my-2 prose-headings:text-slate-800 prose-strong:text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override paragraph to handle block math spacing better if needed
          p: ({ children }) => <p className="mb-4 leading-relaxed text-slate-700">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MathRenderer;
