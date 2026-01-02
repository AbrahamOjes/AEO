import React, { useState } from 'react';
import {
    Github,
    ChevronDown,
    Download
} from 'lucide-react';
import { isPlatformConnected, PLATFORM_INFO, generateSchemaInjection } from '../../services/platformIntegrationService';

interface PlatformConnectionsPanelProps {
    schemaJson?: object;
    llmTxtContent?: string;
    brandName: string;
}

export const PlatformConnectionsPanel: React.FC<PlatformConnectionsPanelProps> = ({ schemaJson, llmTxtContent, brandName }) => {
    const [selectedPlatform, setSelectedPlatform] = useState<'github' | 'vercel' | 'netlify' | null>(null);
    const [showCode, setShowCode] = useState(false);

    const platforms: ('github' | 'vercel' | 'netlify')[] = ['github', 'vercel', 'netlify'];

    const getStatusBadge = (platform: 'github' | 'vercel' | 'netlify') => {
        const connected = isPlatformConnected(platform);
        return connected ? (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Connected</span>
        ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Not Connected</span>
        );
    };

    const schemaCode = schemaJson ? generateSchemaInjection('html', schemaJson, brandName) : null;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Github className="w-5 h-5 text-gray-700" />
                    Platform Integrations
                </h4>
                <p className="text-gray-600 text-sm">
                    Connect your deployment platforms to automatically deploy schema fixes and llm.txt files.
                </p>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {platforms.map((platform) => {
                    const info = PLATFORM_INFO[platform];

                    return (
                        <div
                            key={platform}
                            className={`border rounded-xl p-4 transition cursor-pointer ${selectedPlatform === platform
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-indigo-200'
                                }`}
                            onClick={() => setSelectedPlatform(selectedPlatform === platform ? null : platform)}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{info.icon}</span>
                                    <span className="font-bold text-gray-900">{info.name}</span>
                                </div>
                                {getStatusBadge(platform)}
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{info.description}</p>
                            <ul className="text-xs text-gray-400 space-y-1">
                                {info.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-1">
                                        <span className="text-indigo-400">•</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Selected Platform Details */}
            {selectedPlatform && (
                <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-6 animate-fade-in">
                    <h5 className="font-bold text-indigo-900 mb-3">
                        {PLATFORM_INFO[selectedPlatform].icon} {PLATFORM_INFO[selectedPlatform].name} Setup
                    </h5>

                    {selectedPlatform === 'github' && (
                        <div className="space-y-4">
                            <p className="text-sm text-indigo-800">
                                GitHub integration allows automatic PR creation with your schema fixes.
                                This requires OAuth setup with a GitHub App.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-indigo-200">
                                <h6 className="font-semibold text-gray-800 mb-2">Manual Alternative:</h6>
                                <ol className="text-sm text-gray-600 space-y-2">
                                    <li>1. Copy the schema code below</li>
                                    <li>2. Create a new file in your repo</li>
                                    <li>3. Commit and push the changes</li>
                                </ol>
                            </div>
                            {schemaCode && (
                                <button
                                    onClick={() => setShowCode(!showCode)}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                                >
                                    {showCode ? 'Hide' : 'Show'} Schema Code <ChevronDown className={`w-4 h-4 transition ${showCode ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                            {showCode && schemaCode && (
                                <div className="relative">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-60 custom-scrollbar">
                                        {schemaCode.content}
                                    </pre>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(schemaCode.content)}
                                        className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
                                    >
                                        Copy
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedPlatform === 'vercel' && (
                        <div className="space-y-4">
                            <p className="text-sm text-indigo-800">
                                Vercel integration enables one-click deployment of llm.txt and schema files.
                                This requires connecting your Vercel account via OAuth.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-indigo-200">
                                <h6 className="font-semibold text-gray-800 mb-2">Manual Alternative:</h6>
                                <ol className="text-sm text-gray-600 space-y-2">
                                    <li>1. Download your llm.txt file from the section above</li>
                                    <li>2. Add it to your project's <code className="bg-gray-100 px-1 rounded">public/</code> folder</li>
                                    <li>3. Deploy via <code className="bg-gray-100 px-1 rounded">vercel deploy</code></li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {selectedPlatform === 'netlify' && (
                        <div className="space-y-4">
                            <p className="text-sm text-indigo-800">
                                Netlify integration allows direct file uploads to your site without rebuilding.
                                This requires connecting your Netlify account via OAuth.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-indigo-200">
                                <h6 className="font-semibold text-gray-800 mb-2">Manual Alternative:</h6>
                                <ol className="text-sm text-gray-600 space-y-2">
                                    <li>1. Download your llm.txt file from the section above</li>
                                    <li>2. Drag and drop to Netlify's deploy UI</li>
                                    <li>3. Or add to your repo and trigger a deploy</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-indigo-200">
                        <p className="text-xs text-indigo-600">
                            <strong>Coming Soon:</strong> Full OAuth integration for automated deployments.
                            For now, use the manual steps above.
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-3">Quick Export Options</h5>
                <div className="flex flex-wrap gap-2">
                    {schemaCode && (
                        <button
                            onClick={() => {
                                const blob = new Blob([schemaCode.content], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = schemaCode.path.split('/').pop() || 'schema.html';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Download className="w-4 h-4" />
                            Download Schema
                        </button>
                    )}
                    {llmTxtContent && (
                        <button
                            onClick={() => {
                                const blob = new Blob([llmTxtContent], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'llm.txt';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                            <Download className="w-4 h-4" />
                            Download llm.txt
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
