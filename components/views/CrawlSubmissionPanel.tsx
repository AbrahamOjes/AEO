import React, { useState } from 'react';
import {
    CheckCircle2,
    Check,
    AlertCircle,
    Globe,
    Loader2,
    Rocket,
    Info,
    ChevronDown,
    ExternalLink
} from 'lucide-react';
import { triggerRecrawl, saveSubmission, generateSubmissionId, estimateRecrawlTime, type CrawlSubmission, type CrawlSubmissionResult } from '../../services/crawlSubmissionService';

interface CrawlSubmissionPanelProps {
    brandName: string;
    brandUrl: string;
    suggestedUrls: string[];
    onSubmissionComplete: (submission: CrawlSubmission) => void;
}

export const CrawlSubmissionPanel: React.FC<CrawlSubmissionPanelProps> = ({ brandName, brandUrl, suggestedUrls, onSubmissionComplete }) => {
    const [urls, setUrls] = useState<string[]>(suggestedUrls.length > 0 ? suggestedUrls : [brandUrl]);
    const [sitemapUrl, setSitemapUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<CrawlSubmissionResult | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    const addUrl = () => {
        if (customUrl && !urls.includes(customUrl)) {
            setUrls([...urls, customUrl]);
            setCustomUrl('');
        }
    };

    const removeUrl = (urlToRemove: string) => {
        setUrls(urls.filter(u => u !== urlToRemove));
    };

    const handleSubmit = async () => {
        if (urls.length === 0) return;

        setIsSubmitting(true);
        try {
            const submissionResult = await triggerRecrawl(
                brandUrl,
                urls,
                sitemapUrl || undefined
            );

            setResult(submissionResult);

            // Save submission for tracking
            const submission: CrawlSubmission = {
                id: generateSubmissionId(),
                brandName,
                brandUrl,
                urls,
                sitemapUrl: sitemapUrl || undefined,
                result: submissionResult,
                createdAt: new Date().toISOString(),
                recheckScheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            saveSubmission(submission);
            onSubmissionComplete(submission);
        } catch (error) {
            console.error('Crawl submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const estimate = estimateRecrawlTime();

    if (result) {
        return (
            <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-emerald-800 mb-2">Crawl Request Submitted!</h4>
                            <p className="text-emerald-700 text-sm mb-4">
                                Your URLs have been submitted to search engines for re-crawling.
                            </p>

                            <div className="space-y-3">
                                <div className={`flex items-center gap-2 text-sm ${result.indexNow.success ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {result.indexNow.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <span><strong>IndexNow:</strong> {result.indexNow.message}</span>
                                </div>
                                <div className={`flex items-center gap-2 text-sm ${result.googlePing.success ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {result.googlePing.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <span><strong>Google:</strong> {result.googlePing.message}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <h4 className="font-semibold text-indigo-800 mb-2">📅 What's Next?</h4>
                    <p className="text-sm text-indigo-700">
                        {estimate.message}
                    </p>
                    <p className="text-sm text-indigo-600 mt-2">
                        We recommend re-running your AEO analysis in <strong>{estimate.minDays}-{estimate.maxDays} days</strong> to check for improvements.
                    </p>
                </div>

                <button
                    onClick={() => setResult(null)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                    ← Submit more URLs
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    Request Search Engine Re-Crawl
                </h4>
                <p className="text-gray-600 text-sm">
                    After implementing fixes, submit your URLs to search engines to speed up re-indexing.
                    This uses IndexNow (Bing, Yandex) and Google Sitemap ping.
                </p>
            </div>

            {/* URL List */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URLs to Submit for Re-Crawling
                </label>
                <div className="space-y-2 mb-3">
                    {urls.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="flex-1 text-sm text-gray-700 truncate">{url}</span>
                            <button
                                onClick={() => removeUrl(url)}
                                className="text-gray-400 hover:text-rose-500 transition"
                            >
                                <AlertCircle className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="Add another URL..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                    />
                    <button
                        onClick={addUrl}
                        disabled={!customUrl}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg text-sm font-semibold transition"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Sitemap URL (Optional) */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sitemap URL <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                    type="url"
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                    placeholder="https://yoursite.com/sitemap.xml"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                    If provided, we'll ping Google with your sitemap. Otherwise, we'll try common locations.
                </p>
            </div>

            {/* IndexNow Setup Info */}
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-amber-800">IndexNow Setup (for best results)</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-amber-600 transition ${showInstructions ? 'rotate-180' : ''}`} />
                </button>

                {showInstructions && (
                    <div className="mt-4 text-sm text-amber-800 space-y-2">
                        <p>
                            For IndexNow to work optimally, you should host a verification key file on your domain.
                            Without it, submissions may still work but with lower priority.
                        </p>
                        <p>
                            <strong>Quick setup:</strong> Create a text file with a random 32-character key and host it at your domain root.
                        </p>
                        <a
                            href="https://www.indexnow.org/documentation"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold"
                        >
                            Learn more about IndexNow <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || urls.length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting to Search Engines...
                    </>
                ) : (
                    <>
                        <Rocket className="w-5 h-5" />
                        Submit {urls.length} URL{urls.length !== 1 ? 's' : ''} for Re-Crawling
                    </>
                )}
            </button>

            <p className="text-xs text-gray-500 text-center">
                Submissions are sent to IndexNow (Bing, Yandex, Seznam, Naver) and Google.
            </p>
        </div>
    );
};
