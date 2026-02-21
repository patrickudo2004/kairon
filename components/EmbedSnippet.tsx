import React, { useState } from 'react';
import { Copy, Check, Code, ExternalLink, Info } from 'lucide-react';

interface EmbedSnippetProps {
    slug: string;
}

export const EmbedSnippet: React.FC<EmbedSnippetProps> = ({ slug }) => {
    const [copied, setCopied] = useState(false);

    // In a real app, this would be the actual domain
    const embedUrl = `${window.location.origin}/#/p/${slug}?embed=true`;
    const iframeCode = `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="600px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"
  title="Kairon Event Schedule"
></iframe>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(iframeCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Code size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Embed on Your Website</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Display your live schedule directly on your organization's website. Copy the code below and paste it into any HTML or CMS block (WordPress, Squarespace, etc).
            </p>

            <div className="relative">
                <pre className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                    {iframeCode}
                </pre>
                <button
                    onClick={handleCopy}
                    className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${copied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        }`}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                </button>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <Info className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-bold mb-1 uppercase tracking-wider">Pro-Tip</p>
                    Ensure your program is set to <strong>Public</strong> for the embed to work correctly for your visitors.
                </div>
            </div>
        </div>
    );
};
