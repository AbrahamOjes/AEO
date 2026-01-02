import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => (
    <footer className="bg-gray-50/50 backdrop-blur-sm border-t border-gray-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 group">
                    <ShieldCheck className="text-indigo-600 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-bold text-xl text-gray-900">AEO Vision</span>
                </div>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                    Empowering brands to understand and optimize their visibility in the era of AI-first search.
                </p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                <ul className="space-y-3 text-gray-600 text-sm">
                    <li><a href="#" className="hover:text-indigo-600 transition-colors hover:translate-x-1 inline-block">Features</a></li>
                    <li><a href="#" className="hover:text-indigo-600 transition-colors hover:translate-x-1 inline-block">API Access</a></li>
                    <li><a href="https://github.com/AbrahamOjes/AEO.git" className="hover:text-indigo-600 transition-colors hover:translate-x-1 inline-block">Source Code</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                <ul className="space-y-3 text-gray-600 text-sm">
                    <li><a href="#" className="hover:text-indigo-600 transition-colors hover:translate-x-1 inline-block">Help Center</a></li>
                    <li><a href="#" className="hover:text-indigo-600 transition-colors hover:translate-x-1 inline-block">Contact Us</a></li>
                    <li><a href="#" className="hover:text-indigo-600 transition-colors hover:translate-x-1 inline-block">Status</a></li>
                </ul>
            </div>
        </div>
    </footer>
);
