import React, { useState } from 'react';
import {
    FileText,
    Loader2,
    Check,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Download
} from 'lucide-react';
import { createProfileFromReport, saveProfile, publishProfile, downloadProfileHTML, generateBrandProfileHTML, type BrandProfile } from '../../services/brandProfileService';

interface BrandProfilePanelProps {
    brandName: string;
    brandUrl: string;
    description: string;
    queries: string[];
    onProfileCreated: (profile: BrandProfile) => void;
}

export const BrandProfilePanel: React.FC<BrandProfilePanelProps> = ({ brandName, brandUrl, description, queries, onProfileCreated }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [profile, setProfile] = useState<BrandProfile | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Form state
    const [tagline, setTagline] = useState('');
    const [categories, setCategories] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [useCases, setUseCases] = useState('');
    const [foundingYear, setFoundingYear] = useState('');
    const [headquarters, setHeadquarters] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');

    // FAQ answers for queries
    const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});

    const handleCreateProfile = () => {
        setIsCreating(true);

        // Build target queries with answers
        const targetQueries = queries
            .filter(q => faqAnswers[q]?.trim())
            .map(q => ({
                question: q,
                answer: faqAnswers[q].trim()
            }));

        const newProfile = createProfileFromReport(
            brandName,
            brandUrl,
            description,
            targetQueries,
            {
                tagline: tagline.trim() || undefined,
                categories: categories.split(',').map(c => c.trim()).filter(Boolean),
                targetAudience: targetAudience.trim() || undefined,
                useCases: useCases.split('\n').map(u => u.trim()).filter(Boolean),
                foundingYear: foundingYear.trim() || undefined,
                headquarters: headquarters.trim() || undefined,
                twitterUrl: twitterUrl.trim() || undefined,
                linkedinUrl: linkedinUrl.trim() || undefined,
            }
        );

        saveProfile(newProfile);
        setProfile(newProfile);
        onProfileCreated(newProfile);
        setIsCreating(false);
    };

    const handlePublish = () => {
        if (profile) {
            const published = publishProfile(profile.id);
            if (published) {
                setProfile(published);
            }
        }
    };

    const handleDownload = () => {
        if (profile) {
            downloadProfileHTML(profile);
        }
    };

    if (profile) {
        return (
            <div className="space-y-6">
                <div className={`rounded-xl p-6 border ${profile.isPublished ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} shadow-sm`}>
                    <div className="flex items-start gap-3">
                        {profile.isPublished ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <h4 className={`font-bold mb-2 ${profile.isPublished ? 'text-emerald-800' : 'text-amber-800'}`}>
                                {profile.isPublished ? 'Brand Profile Published!' : 'Brand Profile Created (Draft)'}
                            </h4>
                            <p className={`text-sm mb-3 ${profile.isPublished ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {profile.isPublished
                                    ? 'Your brand profile page is ready. Download and host it on your domain for maximum AI visibility.'
                                    : 'Review your profile and publish when ready.'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {showPreview ? 'Hide Preview' : 'Preview Page'}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition"
                                >
                                    <Download className="w-4 h-4" />
                                    Download HTML
                                </button>
                                {!profile.isPublished && (
                                    <button
                                        onClick={handlePublish}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                                    >
                                        <Check className="w-4 h-4" />
                                        Mark as Published
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showPreview && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">Page Preview</span>
                            <span className="text-xs text-gray-400">brands/{profile.slug}</span>
                        </div>
                        <iframe
                            srcDoc={generateBrandProfileHTML(profile)}
                            className="w-full h-[600px] bg-white"
                            title="Brand Profile Preview"
                        />
                    </div>
                )}

                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2">📍 How to Use This Page</h4>
                    <ul className="text-sm text-indigo-800 space-y-1">
                        <li>• <strong>Self-host:</strong> Download the HTML and host at <code className="bg-indigo-100 px-1 rounded">/about</code> or <code className="bg-indigo-100 px-1 rounded">/brand</code></li>
                        <li>• <strong>Schema extraction:</strong> The JSON-LD schemas are embedded and ready for AI crawlers</li>
                        <li>• <strong>Link building:</strong> Link to this page from your main site to boost authority</li>
                    </ul>
                </div>

                <button
                    onClick={() => setProfile(null)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                    ← Create a new profile
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Create Brand Facts Page
                </h4>
                <p className="text-gray-600 text-sm">
                    Generate a structured brand profile page with embedded JSON-LD schemas.
                    This page is optimized for AI crawlers and can be hosted on your domain.
                </p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline</label>
                    <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g., Banking on stablecoins"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Categories</label>
                    <input
                        type="text"
                        value={categories}
                        onChange={(e) => setCategories(e.target.value)}
                        placeholder="e.g., Fintech, Payments, Crypto"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Audience</label>
                <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Freelancers in emerging markets looking for stable payment solutions"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Use Cases</label>
                <textarea
                    value={useCases}
                    onChange={(e) => setUseCases(e.target.value)}
                    placeholder="One use case per line, e.g.:&#10;Receive freelance payments in USDC&#10;Send money internationally&#10;Earn yield on holdings"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Founded</label>
                    <input
                        type="text"
                        value={foundingYear}
                        onChange={(e) => setFoundingYear(e.target.value)}
                        placeholder="e.g., 2024"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Headquarters</label>
                    <input
                        type="text"
                        value={headquarters}
                        onChange={(e) => setHeadquarters(e.target.value)}
                        placeholder="e.g., San Francisco, CA"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Twitter URL</label>
                    <input
                        type="url"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        placeholder="https://twitter.com/..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* FAQ Answers */}
            {queries.length > 0 && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        FAQ Answers <span className="font-normal text-gray-400">(for target queries)</span>
                    </label>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {queries.slice(0, 5).map((query, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Q: {query}</p>
                                <textarea
                                    value={faqAnswers[query] || ''}
                                    onChange={(e) => setFaqAnswers(prev => ({ ...prev, [query]: e.target.value }))}
                                    placeholder="Write a concise answer that positions your brand..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        ))}
                    </div>
                    {queries.length > 5 && (
                        <p className="text-xs text-gray-400 mt-2">Showing first 5 queries. More can be added after creation.</p>
                    )}
                </div>
            )}

            {/* Create Button */}
            <button
                onClick={handleCreateProfile}
                disabled={isCreating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
                {isCreating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Profile...
                    </>
                ) : (
                    <>
                        <FileText className="w-5 h-5" />
                        Create Brand Profile Page
                    </>
                )}
            </button>

            <p className="text-xs text-gray-500 text-center">
                The generated page includes Organization and FAQPage schemas for optimal AI visibility.
            </p>
        </div>
    );
};
