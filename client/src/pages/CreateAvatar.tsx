import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const CreateAvatar: React.FC = () => {
    const navigate = useNavigate();
    const [characterName, setCharacterName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        if (!characterName.trim()) {
            setError('Please enter your name');
            return;
        }

        // Mock DB Check
        const mockDb = ['admin', 'god', 'system']; // Forbidden names
        if (mockDb.includes(characterName.toLowerCase())) {
            setError('This name is already taken');
            return;
        }

        // Generate Random Guest Identity
        const guestId = Math.floor(Math.random() * 50) + 1;
        // Use the entered name instead of "Guest XXX"
        const spriteUrl = `/assets/guest_avatars/guest_${guestId}.png`;
        const playerId = `${characterName}_${Date.now()}`;

        // Save and Join
        localStorage.setItem('playerName', characterName);
        localStorage.setItem('playerSprite', spriteUrl);
        localStorage.setItem('playerId', playerId);
        localStorage.removeItem('playerPortrait'); // Reset any old portrait

        // Navigate immediately
        navigate('/game');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 font-sans text-gray-900 p-4 relative overflow-hidden">

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 w-full max-w-md relative z-10 border border-gray-100 flex flex-col items-center">

                {/* Logo / Icon Area */}
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8" /><path d="M12 5a3 3 0 1 0-3 3" /><path d="M22 21v-8a2 2 0 0 0-2-2h-3.5" /><path d="M19 11a3 3 0 1 0-3-3" /><path d="M11 21v-4" /><path d="M7 21v-4" /></svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    Join PublicBuild
                </h1>
                <p className="text-gray-500 text-center mb-8">
                    Enter your name to start meeting fellow builders.
                </p>

                {/* Input Section */}
                <div className="w-full flex flex-col gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="e.g. Elon Musk"
                            value={characterName}
                            onChange={(e) => {
                                setCharacterName(e.target.value);
                                setError(null);
                            }}
                            className={`w-full px-4 py-3 bg-white border ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'} rounded-xl text-gray-900 text-lg outline-none transition-all focus:ring-4`}
                            maxLength={16}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleJoin}
                        className="mt-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2"
                    >
                        Enter World
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        By joining, you agree to our rules of conduct.
                        <br />
                        Guest account will be created automatically.
                    </p>
                </div>
            </div>

            <div className="absolute bottom-6 text-gray-400 text-xs font-medium">
                © 2025 PublicBuild Community
            </div>
        </div>
    );
};
