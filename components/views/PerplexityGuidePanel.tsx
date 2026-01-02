import React, { useState } from 'react';
import {
    FileText,
    ChevronDown,
    ExternalLink,
    Check
} from 'lucide-react';

interface PerplexityGuidePanelProps {
    brandName: string;
    brandUrl: string;
    perplexityScore?: number;
}

export const PerplexityGuidePanel: React.FC<PerplexityGuidePanelProps> = ({ brandName, brandUrl, perplexityScore }) => {
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [showPageContent, setShowPageContent] = useState(false);

    const toggleStep = (step: number) => {
        const newCompleted = new Set(completedSteps);
        if (newCompleted.has(step)) {
            newCompleted.delete(step);
        } else {
            newCompleted.add(step);
        }
        setCompletedSteps(newCompleted);
    };

    const generatePerplexityPageContent = () => {
        return `# ${brandName}: Complete Guide

## What is ${brandName}?

${brandName} is a solution designed to help users achieve their goals more effectively. Visit ${brandUrl} to learn more.

## Key Features

- **Feature 1**: Description of your first key feature
- **Feature 2**: Description of your second key feature
- **Feature 3**: Description of your third key feature

## Who is it for?

${brandName} is ideal for [describe your target audience here].

## How does ${brandName} compare to alternatives?

| Feature | ${brandName} | Competitor A | Competitor B |
|---------|-------------|--------------|--------------|
| Feature 1 | ✅ | ❌ | ✅ |
| Feature 2 | ✅ | ✅ | ❌ |
| Pricing | Competitive | Higher | Similar |

## Frequently Asked Questions

### What problem does ${brandName} solve?
[Your answer here]

### How do I get started with ${brandName}?
[Your answer here]

### What makes ${brandName} different?
[Your answer here]

---

*Sources: [Official Website](${brandUrl})*`;
    };

    const steps = [
        {
            title: "Optimize Your Website Content",
            description: "Ensure your website has clear, structured content that answers common questions about your product/service.",
            action: "Review your site's FAQ and About pages",
            link: brandUrl
        },
        {
            title: "Create a Perplexity Page",
            description: "Perplexity allows users to create 'Pages' - research summaries that become citable sources.",
            action: "Create a comprehensive page about your brand",
            link: "https://www.perplexity.ai/page"
        },
        {
            title: "Submit to Perplexity Discover",
            description: "If Perplexity has a content submission form, submit your best content for consideration.",
            action: "Check for submission options",
            link: "https://www.perplexity.ai"
        },
        {
            title: "Build Authoritative Backlinks",
            description: "Perplexity values authoritative sources. Get mentioned on reputable sites in your industry.",
            action: "Focus on PR and content marketing"
        },
        {
            title: "Monitor & Iterate",
            description: "Re-run AEO analysis in 1-2 weeks to track improvements in Perplexity visibility.",
            action: "Schedule a follow-up check"
        }
    ];

    const completionPercent = Math.round((completedSteps.size / steps.length) * 100);

    return (
        <div className="space-y-6">
            {/* Status Header */}
            <div className={`rounded-xl p-6 border ${perplexityScore && perplexityScore >= 60 ? 'bg-emerald-50 border-emerald-200' :
                    perplexityScore && perplexityScore >= 30 ? 'bg-amber-50 border-amber-200' :
                        'bg-rose-50 border-rose-200'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={`font-bold mb-1 ${perplexityScore && perplexityScore >= 60 ? 'text-emerald-800' :
                                perplexityScore && perplexityScore >= 30 ? 'text-amber-800' :
                                    'text-rose-800'
                            }`}>
                            Perplexity Visibility: {perplexityScore !== undefined ? `${perplexityScore}%` : 'Not Checked'}
                        </h4>
                        <p className={`text-sm ${perplexityScore && perplexityScore >= 60 ? 'text-emerald-700' :
                                perplexityScore && perplexityScore >= 30 ? 'text-amber-700' :
                                    'text-rose-700'
                            }`}>
                            {perplexityScore && perplexityScore >= 60
                                ? 'Good visibility! Keep optimizing to maintain your position.'
                                : perplexityScore && perplexityScore >= 30
                                    ? 'Moderate visibility. Follow the steps below to improve.'
                                    : 'Low visibility. Significant optimization needed.'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{completionPercent}%</div>
                        <div className="text-xs text-gray-500">guide complete</div>
                    </div>
                </div>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-3">
                {steps.map((step, idx) => (
                    <div
                        key={idx}
                        className={`border rounded-xl p-4 transition ${completedSteps.has(idx)
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-gray-200 hover:border-indigo-200'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => toggleStep(idx)}
                                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${completedSteps.has(idx)
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-gray-300 hover:border-indigo-500'
                                    }`}
                            >
                                {completedSteps.has(idx) && <Check className="w-4 h-4" />}
                            </button>
                            <div className="flex-1">
                                <h5 className={`font-semibold ${completedSteps.has(idx) ? 'text-emerald-800' : 'text-gray-900'}`}>
                                    {idx + 1}. {step.title}
                                </h5>
                                <p className={`text-sm mt-1 ${completedSteps.has(idx) ? 'text-emerald-700' : 'text-gray-600'}`}>
                                    {step.description}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">→ {step.action}</span>
                                    {step.link && (
                                        <a
                                            href={step.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                                        >
                                            Open <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Perplexity Page Content Generator */}
            <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
                <button
                    onClick={() => setShowPageContent(!showPageContent)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold text-indigo-800">Perplexity Page Template</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-indigo-600 transition ${showPageContent ? 'rotate-180' : ''}`} />
                </button>

                {showPageContent && (
                    <div className="mt-4 space-y-3">
                        <p className="text-sm text-indigo-700">
                            Use this template to create a Perplexity Page about your brand. Customize it with your specific details.
                        </p>
                        <div className="relative">
                            <pre className="bg-white border border-indigo-200 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto max-h-60 custom-scrollbar">
                                {generatePerplexityPageContent()}
                            </pre>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatePerplexityPageContent());
                                }}
                                className="absolute top-2 right-2 px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs font-semibold transition"
                            >
                                Copy
                            </button>
                        </div>
                        <a
                            href="https://www.perplexity.ai/page"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
                        >
                            Create Perplexity Page <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                )}
            </div>

            {/* Info Note */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500">
                    <strong>Note:</strong> Perplexity doesn't have a public API for direct content submission.
                    These steps help optimize your content for Perplexity's crawlers and increase the likelihood
                    of being cited in AI-generated answers.
                </p>
            </div>
        </div>
    );
};
