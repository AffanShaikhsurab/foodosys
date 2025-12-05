'use client';

import { useState } from 'react';

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        {
            title: 'Feedback Board',
            description: 'Share your feedback, view roadmap & updates',
            url: 'https://foodosys.userjot.com/',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            ),
        },
        {
            title: 'Roadmap',
            description: 'See what we\'re working on',
            url: 'https://foodosys.userjot.com/roadmap',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
            ),
        },
        {
            title: 'Updates',
            description: 'Check out our latest updates',
            url: 'https://foodosys.userjot.com/updates',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            ),
        },
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Popup Menu */}
            <div
                className={`fixed bottom-24 right-4 z-[9999] transition-all duration-300 ease-out ${isOpen
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                    }`}
            >
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[280px]">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-[#DCEB66] to-[#c5d65a]">
                        <h3 className="text-[#2C3E2E] font-bold text-sm">Share Your Feedback</h3>
                        <p className="text-[#2C3E2E]/70 text-xs">Help us improve!</p>
                    </div>

                    {/* Links */}
                    <div className="p-2">
                        {links.map((link, index) => (
                            <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#DCEB66]/20 flex items-center justify-center text-[#2C3E2E] group-hover:bg-[#DCEB66]/40 transition-colors">
                                    {link.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#2C3E2E]">{link.title}</p>
                                    <p className="text-xs text-gray-500 truncate">{link.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-4 right-4 z-[9999] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen
                        ? 'bg-[#2C3E2E] rotate-45'
                        : 'bg-gradient-to-br from-[#DCEB66] to-[#c5d65a] hover:shadow-xl'
                    }`}
                aria-label="Share feedback"
            >
                {isOpen ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2C3E2E"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <line x1="9" y1="10" x2="15" y2="10"></line>
                        <line x1="12" y1="7" x2="12" y2="13"></line>
                    </svg>
                )}
            </button>
        </>
    );
}
