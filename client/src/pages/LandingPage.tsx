import React from 'react';
import { useNavigate } from 'react-router-dom';
import publicBuildHero from '../assets/public_pixel_hero_8bit_chibi_color_16_9.png';

import meetBuildersImg from '../assets/meet_builders_chibi.png';
import launchProductsImg from '../assets/launch_products_chibi.png';
import buildInPublicImg from '../assets/build_in_public_chibi.png';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: "Meet Builders",
            description: "Join a vibrant map to network with other indie devs.",
            image: meetBuildersImg,
        },
        {
            title: "Launch Products",
            description: "Showcase your work to the community in a gamified way.",
            image: launchProductsImg,
        },
        {
            title: "Build in Public",
            description: "Share your progress with your early Fans.",
            image: buildInPublicImg,
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center">
                    <span className="text-2xl font-bold tracking-tight">PublicBuild</span>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <a href="#" className="hover:text-gray-900 transition-colors">Our Vision</a>
                    <a href="#" className="hover:text-gray-900 transition-colors">Ask for Features</a>
                    {/* <a href="#" className="hover:text-gray-900 transition-colors">Resources</a> */}
                    {/* <a href="#" className="hover:text-gray-900 transition-colors">Pricing</a> */}
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</button>
                    <button
                        onClick={() => navigate('/create-avatar')}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Get started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="flex flex-col items-center text-center px-4 pt-16 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-6 border border-indigo-100">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Openned for Beta
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 drop-shadow-sm">
                    The Open World for <span className="text-indigo-600">Indie Builders & Startups</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Join a vibrant 2D community to network, showcase your product, and build in public with fellow founders.
                </p>

                <div className="mb-12">
                    <button
                        onClick={() => navigate('/create-avatar')}
                        className="px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        Join our Beta
                    </button>
                </div>

                {/* Hero Visual */}
                <div className="w-full max-w-6xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent z-10 pointer-events-none h-40 bottom-0 top-auto"></div>
                    <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white relative aspect-video">
                        <img
                            src={publicBuildHero}
                            alt="PublicBuild Virtual Hub"
                            className="w-full h-full object-cover object-center pixelated transform transition-transform duration-700 hover:scale-[1.01]"
                        />

                        {/* Fake UI Elements for "Gather" feel - HIDDEN as per request */}
                        {/* <div className="hidden md:flex absolute bottom-8 left-8 flex-col gap-3 z-20">
                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 flex items-center gap-3 w-48 animate-bounce-slow">
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Find a co-founder</span>
                            </div>
                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 flex items-center gap-3 w-48 animate-pulse-slow">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3"></path><path d="m11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Play their demo</span>
                            </div>
                        </div> */}
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-12 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why PublicBuild?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {features.map((feature, index) => (
                            <div key={index} className="flex flex-col items-center text-center group">
                                <div className="w-full aspect-[4/3] mb-8 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover pixelated" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed max-w-xs">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-md"></div>
                        <span className="font-semibold text-gray-900">PublicBuild</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        © 2025 PublicBuild Community.
                    </div>
                </div>
            </footer>
        </div>
    );
};
