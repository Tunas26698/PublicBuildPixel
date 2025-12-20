import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePlayerProfile } from '../services/firebaseService';

export const CreateAvatar: React.FC = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultSpriteUrl, setResultSpriteUrl] = useState<string | null>(null);
    const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
    const [extraUrls, setExtraUrls] = useState<{ front?: string, back?: string }>({});
    const [error, setError] = useState<string | null>(null);
    const [scanLine, setScanLine] = useState(false);
    const [progress, setProgress] = useState(0);
    const [characterName, setCharacterName] = useState('');
    const [userPrompt, setUserPrompt] = useState('');

    const handleJoin = async () => {
        if (!characterName.trim()) {
            setError('NAME REQUIRED');
            return;
        }

        // Mock DB Check
        const mockDb = ['admin', 'god', 'system']; // Forbidden names
        if (mockDb.includes(characterName.toLowerCase())) {
            setError('NAME TAKEN');
            return;
        }

        // Save and Join
        localStorage.setItem('playerName', characterName);
        if (resultSpriteUrl) localStorage.setItem('playerSprite', resultSpriteUrl);
        if (portraitUrl) localStorage.setItem('playerPortrait', portraitUrl);

        // Firebase Save (Non-blocking / Short Timeout)
        const playerId = `${characterName}_${Date.now()}`;
        localStorage.setItem('playerId', playerId);

        if (resultSpriteUrl) {
            console.log("Saving to Firebase...", playerId);
            // Save in background so we don't block entry if keys are bad
            savePlayerProfile({
                id: playerId,
                name: characterName,
                spriteUrl: resultSpriteUrl,
                portraitUrl: portraitUrl || '',
                createdAt: Date.now()
            }).then(() => console.log("Firebase Save Success"))
                .catch(e => console.error("Firebase Save Failed:", e));
        }

        // Navigate immediately - don't wait for network
        navigate('/');
    };

    // Simulated Progress Effect
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isProcessing) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev; // Stall at 90% until done
                    // Fast at start, slow at end
                    const increment = prev < 30 ? 5 : prev < 70 ? 2 : 1;
                    return prev + increment;
                });
            }, 500);
        } else {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [isProcessing]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResultSpriteUrl(null);
            setPortraitUrl(null);
            setError(null);
        }
    };

    const handleCreate = async () => {
        if (!selectedFile && !userPrompt) return;

        setIsProcessing(true);
        setScanLine(true);
        setError(null);

        const formData = new FormData();
        if (selectedFile) formData.append('avatar', selectedFile);
        if (userPrompt) formData.append('description', userPrompt);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/create-avatar`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success && data.spriteUrl) {
                setResultSpriteUrl(data.spriteUrl);
                setExtraUrls({ front: data.frontUrl, back: data.backUrl });
                if (data.portraitUrl) setPortraitUrl(data.portraitUrl);
            } else {
                setError(data.error || 'Identity Chip Corrupted');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Network Downlink Failed');
        } finally {
            setIsProcessing(false);
            setScanLine(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 font-pixel text-xs text-white p-4 relative overflow-hidden">

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <h1 className="text-2xl md:text-3xl text-cyan-400 mb-8 tracking-widest text-center shadow-black drop-shadow-md pb-2 border-b-4 border-cyan-600">
                HOW AI SEES YOU
            </h1>

            <div className="bg-gray-800 border-4 border-white p-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] w-full max-w-2xl relative">

                {/* Decoration Corners */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-white"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white"></div>

                <div className="bg-gray-900 border-2 border-gray-600 p-6 flex flex-col items-center gap-6">

                    {/* Input Section */}
                    <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center">

                        {/* Upload & Prompt Column */}
                        <div className="flex flex-col gap-4 items-center w-full max-w-sm">

                            {/* Upload Box */}
                            <div className="relative group cursor-pointer w-48 h-48 border-4 border-dashed border-gray-500 hover:border-cyan-400 hover:bg-gray-800 transition-all flex items-center justify-center bg-gray-900 overflow-hidden shadow-lg">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        {scanLine && (
                                            <div className="absolute inset-0 bg-green-500/20 w-full h-1 animate-[scan_2s_infinite_linear] border-b-2 border-green-400"></div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center text-gray-400 group-hover:text-cyan-400 transition-colors">
                                        <p className="mb-2 text-2xl animate-pulse">+</p>
                                        <p className="font-pixel text-[10px]">INSERT PHOTO</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-gray-500 text-[10px] font-pixel tracking-widest">- OR -</div>

                            {/* Text Area */}
                            <textarea
                                placeholder="Describe: Hair, Skin, Clothes..."
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                className="w-full h-24 bg-gray-800 border-2 border-gray-500 p-3 text-cyan-100 text-xs outline-none focus:border-cyan-400 focus:bg-gray-900 focus:shadow-[0_0_10px_rgba(34,211,238,0.3)] placeholder-gray-500 resize-none font-pixel transition-all"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4 w-full md:w-auto">
                            {!resultSpriteUrl ? (
                                <>
                                    <button
                                        onClick={handleCreate}
                                        disabled={(!selectedFile && !userPrompt) || isProcessing}
                                        className={`px-8 py-6 border-4 border-b-8 active:border-b-4 active:translate-y-1 transition-all w-full md:w-72 font-pixel text-sm tracking-wide
                                            ${(!selectedFile && !userPrompt) || isProcessing
                                                ? 'border-gray-600 bg-fuchsia-900 text-gray-400 cursor-not-allowed opacity-70' // Dark Purple instead of Grey
                                                : 'border-fuchsia-400 bg-fuchsia-600 hover:bg-fuchsia-500 hover:border-fuchsia-300 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)] animate-pulse-slow'
                                            }`}
                                    >
                                        {isProcessing ? 'SCANNING DNA...' : 'CREATE CHARACTER'}
                                    </button>

                                    {/* Process Bar */}
                                    {isProcessing && (
                                        <div className="w-full border-2 border-gray-500 bg-black p-1">
                                            <div
                                                className="h-4 bg-green-500 transition-all duration-500 ease-out"
                                                style={{ width: `${progress}% ` }}
                                            ></div>
                                            <div className="text-center mt-1 text-[10px] text-green-400">
                                                PROCESSING: {progress}%
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 animate-fade-in">
                                    <input
                                        type="text"
                                        placeholder="ENTER HERO NAME"
                                        value={characterName}
                                        onChange={(e) => setCharacterName(e.target.value)}
                                        className="px-4 py-3 bg-gray-800 border-4 border-gray-500 text-white font-pixel text-center focus:border-yellow-400 outline-none placeholder-gray-600"
                                        maxLength={12}
                                    />
                                    <button
                                        onClick={handleJoin}
                                        className="px-6 py-4 border-4 border-b-8 border-green-700 bg-green-600 hover:bg-green-500 active:border-b-4 active:translate-y-1 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] transition-all w-full md:w-64"
                                    >
                                        JOIN NOW
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="text-red-500 text-center max-w-[200px] leading-tight">
                                    ERROR: {error}
                                </div>
                            )}

                            {/* Guest Option */}
                            {!resultSpriteUrl && !isProcessing && (
                                <div className="w-full flex flex-col items-center gap-2 pt-4 border-t border-gray-700">
                                    <div className="text-gray-500 text-[10px] tracking-widest">- OR -</div>
                                    <button
                                        onClick={() => {
                                            const guestId = Math.floor(Math.random() * 50) + 1;
                                            const guestName = `Guest ${Math.floor(Math.random() * 1000)}`;
                                            const spriteUrl = `/assets/guest_avatars/guest_${guestId}.png`;

                                            localStorage.setItem('playerName', guestName);
                                            localStorage.setItem('playerSprite', spriteUrl);
                                            localStorage.setItem('playerId', `guest_${Date.now()}`);
                                            localStorage.removeItem('playerPortrait'); // Reset portrait

                                            navigate('/');
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 text-xs border-b border-cyan-900 hover:border-cyan-400 pb-1 transition-all"
                                    >
                                        [ TRY AS GUEST ]
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Section */}
                    {(resultSpriteUrl || portraitUrl) && (
                        <div className="w-full mt-4 border-t-4 border-gray-700 pt-6 animate-fade-in">
                            <h2 className="text-green-400 text-center mb-6 text-lg blink">PLAYER FOUND!</h2>

                            <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">

                                {/* Portrait Card */}
                                {portraitUrl && (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-blue-300 mb-1">YOUR AVATAR</div>
                                        <div className="p-1 bg-white border-4 border-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                                            <img
                                                src={portraitUrl}
                                                className="w-48 h-48 object-cover image-pixelated"
                                                alt="Portrait"
                                            />
                                        </div>
                                        <a
                                            href={portraitUrl}
                                            download="my-avatar.png"
                                            className="mt-2 text-[10px] text-gray-400 hover:text-white border-b border-gray-600 hover:border-white transition-colors"
                                        >
                                            [ DOWNLOAD ]
                                        </a>
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="hidden md:block w-1 bg-gray-700 mx-2"></div>

                                {/* Sprite Card */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-purple-300 mb-1">YOUR CHARACTER</div>
                                    <div className="p-1 bg-white border-4 border-gray-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                                        {/* Animation Container */}
                                        <div className="w-32 h-32 flex items-center justify-center bg-white overflow-hidden relative">
                                            {/* Fix animation display: Width must be ONE FRAME (96px) */}
                                            <div
                                                style={{
                                                    width: '96px',
                                                    height: '128px',
                                                    backgroundImage: `url(${resultSpriteUrl})`,
                                                    backgroundSize: '288px 128px', // Important: Force sheet size
                                                    imageRendering: 'pixelated',
                                                    animation: 'walk 0.8s steps(3) infinite',
                                                    transform: 'scale(1.2)', // Slight zoom to fill box
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {extraUrls.front && <img src={extraUrls.front} className="w-12 h-12 border-2 border-gray-300 bg-white" />}
                                        {extraUrls.back && <img src={extraUrls.back} className="w-12 h-12 border-2 border-gray-300 bg-white" />}
                                    </div>
                                </div>

                            </div>

                            <style>{`
@keyframes walk {
                                    from { background - position: 0px 0; }
                                    to { background - position: -288px 0; }
}
@keyframes scan {
    0 % { top: 0 %; opacity: 0; }
    10 % { opacity: 1; }
    90 % { opacity: 1; }
    100 % { top: 100 %; opacity: 0; }
}
                                .image - pixelated {
    image - rendering: pixelated;
}
                                .blink {
    animation: blink 1s step - end infinite;
}
@keyframes blink {
    50 % { opacity: 0; }
}
`}</style>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
};
