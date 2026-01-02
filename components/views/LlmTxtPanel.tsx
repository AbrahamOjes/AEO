import React, { useState } from 'react';
import {
    FileText,
    Loader2,
    Zap,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    Download
} from 'lucide-react';
import { BrandLlmTxt } from '../../types';

interface LlmTxtPanelProps {
    llmTxt: BrandLlmTxt | null;
    brandName: string;
    brandUrl: string;
    queries: string[];
    onGenerate: () => Promise<void>;
    isGenerating: boolean;
}

export const LlmTxtPanel: React.FC<LlmTxtPanelProps> = ({ llmTxt, brandName, brandUrl, queries, onGenerate, isGenerating }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (llmTxt?.generated_content) {
            navigator.clipboard.writeText(llmTxt.generated_content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadLlmTxt = () => {
        if (llmTxt?.generated_content) {
            const blob = new Blob([llmTxt.generated_content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'llm.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    if (!llmTxt) {
        return (
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-8 border border-indigo-100">
                <div className="text-center">
                    <FileText className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Generate llm.txt</h3>
                    <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                        llm.txt is a machine-readable brand identity file that helps AI assistants understand who you are and what you do.
                    </p>
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center gap-2 mx-auto shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                Generate llm.txt
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className={`rounded-xl p-4 border ${llmTxt.llm_readability.status === 'present' ? 'bg-emerald-50 border-emerald-200' :
                    llmTxt.llm_readability.status === 'incomplete' ? 'bg-amber-50 border-amber-200' :
                        'bg-rose-50 border-rose-200'
                }`}>
                <div className="flex items-center gap-3">
                    {llmTxt.llm_readability.status === 'present' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : llmTxt.llm_readability.status === 'incomplete' ? (
                        <AlertCircle className="w-6 h-6 text-amber-600" />
                    ) : (
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                    )}
                    <div>
                        <h4 className={`font-bold ${llmTxt.llm_readability.status === 'present' ? 'text-emerald-800' :
                                llmTxt.llm_readability.status === 'incomplete' ? 'text-amber-800' :
                                    'text-rose-800'
                            }`}>
                            llm.txt Status: {llmTxt.llm_readability.status.toUpperCase()}
                        </h4>
                        <p className={`text-sm ${llmTxt.llm_readability.status === 'present' ? 'text-emerald-700' :
                                llmTxt.llm_readability.status === 'incomplete' ? 'text-amber-700' :
                                    'text-rose-700'
                            }`}>
                            Impact: {llmTxt.llm_readability.impact}
                        </p>
                    </div>
                </div>
            </div>

            {/* Generated Content */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="font-bold text-gray-900">Generated llm.txt</h4>
                    <div className="flex gap-2">
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={downloadLlmTxt}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold transition"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 overflow-x-auto text-sm max-h-96 font-mono">
                    <code>{llmTxt.generated_content}</code>
                </pre>
            </div>

            {/* Instructions */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">📍 Where to Place llm.txt</h4>
                <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• <code className="bg-indigo-100 px-1 rounded">/llm.txt</code> — Primary location (recommended)</li>
                    <li>• <code className="bg-indigo-100 px-1 rounded">/.well-known/llm.txt</code> — Formal location</li>
                    <li>• <code className="bg-indigo-100 px-1 rounded">/ai.txt</code> — Alternative location</li>
                </ul>
            </div>
        </div>
    );
};
