import React from 'react';
import { useNavigate } from 'react-router-dom';
import meetBuildersImg from '../assets/meet_builders.png';
import launchProductsImg from '../assets/launch_products.png';
import buildInPublicImg from '../assets/build_in_public.png';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: "Meet Builders",
            description: "Join a vibrant map to network with other indie devs.",
            image: meetBuildersImg,
            placeholderColor: "bg-blue-500"
        },
        {
            title: "Launch Products",
            description: "Showcase your work to the community in a gamified way.",
            image: launchProductsImg,
            placeholderColor: "bg-green-500"
        },
        {
            title: "Build in Public",
            description: "Share your progress and get feedback in real-time.",
            image: buildInPublicImg,
            placeholderColor: "bg-purple-500"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white font-pixel">
            {/* Hero Section */}
            <div className="relative h-screen flex flex-col items-center justify-center text-center p-4">
                <div className="absolute inset-0 bg-[url('/assets/grid-pattern.png')] opacity-10 pointer-events-none"></div> {/* Placeholder for bg pattern if needed */}
                <h1 className="text-4xl md:text-6xl mb-6 text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                    Indie Pixel Community
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl leading-relaxed">
                    Gamified Discord for Indie Builders. <br />
                    Connect, Launch, and Build in Public.
                </p>
                <button
                    onClick={() => navigate('/game')}
                    className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white text-xl border-4 border-white shadow-[4px_4px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                >
                    JOIN THE WORLD
                </button>
            </div>

            {/* Features Section */}
            <div className="py-20 px-4 bg-gray-800">
                <h2 className="text-3xl text-center mb-16 text-cyan-400">Features</h2>
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col items-center border-4 border-gray-600 bg-gray-900 p-6 shadow-[8px_8px_0_rgba(0,0,0,0.5)] h-full">
                            <div className={`w-full h-48 mb-6 flex items-center justify-center border-2 border-gray-500 relative overflow-hidden group`}>
                                <img src={feature.image} alt={feature.title} className="w-full h-full object-cover pixelated" />
                            </div>
                            <h3 className="text-xl mb-4 text-yellow-300">{feature.title}</h3>
                            <p className="text-center text-gray-400 text-sm leading-6">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 bg-black text-center text-gray-600 text-xs">
                <p>© 2025 Indie Pixel Community. All pixels reserved.</p>
            </footer>
        </div>
    );
};
