import { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../game/scenes/MainScene';
import { PresentationStage } from './PresentationStage';

export const GameComponent = () => {
    const gameRef = useRef<HTMLDivElement>(null);

    const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);
    // Track if currently in a call to avoid re-triggering confirmation
    const [isInCall, setIsInCall] = useState(false);

    // Ref to track if we already notified to avoid react loop if called per frame
    const inZoneRef = useRef(false);

    // Stage Event State
    const [currentEvent, setCurrentEvent] = useState<{ title: string; roomId: string; hostName: string } | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [showHostModal, setShowHostModal] = useState(false);
    const [hostTitle, setHostTitle] = useState("");
    const [hostPassword, setHostPassword] = useState("");

    useEffect(() => {
        if (!gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: '100%',
            height: '100%',
            // Enable pixel art rendering (no smoothing)
            pixelArt: true,
            roundPixels: true,
            scale: {
                mode: Phaser.Scale.RESIZE,
                parent: gameRef.current,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            parent: gameRef.current,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0, x: 0 },
                    debug: false,
                },
            },
            scene: [MainScene],
            callbacks: {
                preBoot: (game) => {
                    game.registry.set('onZoneChange', (inZone: boolean) => {
                        // Only update if changed
                        if (inZoneRef.current !== inZone) {
                            inZoneRef.current = inZone;

                            if (inZone) {
                                // Enter Zone
                                setShowJoinConfirmation(true);
                            } else {
                                // Exit Zone: Reset all
                                setShowJoinConfirmation(false);
                                setIsInCall(false);
                                // Don't reset isHost here, maybe they want to re-enter
                            }
                        }
                    });
                }
            }
        };

        const game = new Phaser.Game(config);
        // Move the registry logic to MainScene.init or just use scene.start data if we managed it manually.
        // But since it's auto-started, we need a way to pass data.
        // The MainScene can read from registry in init() or create().

        return () => {
            game.destroy(true);
        };
    }, []);


    const [chatMessages, setChatMessages] = useState<{ name: string; text: string; color: string }[]>([
        { name: "System", text: "Welcome to the space! Press ENTER to chat.", color: "text-purple-400" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    useEffect(() => {
        const handleChat = (e: any) => {
            const { name, text } = e.detail; // Custom event detail
            setChatMessages(prev => [...prev, {
                name,
                text,
                color: name === 'System' ? "text-purple-400" : "text-cyan-400"
            }]);
        };

        const handleHistory = (e: any) => {
            const history = e.detail; // Array of messages
            const formatted = history.map((msg: any) => ({
                name: msg.name,
                text: msg.text,
                color: "text-gray-400" // History messages slightly deeper color
            }));
            // Prepend history after system welcome
            setChatMessages(prev => [prev[0], ...formatted]);
        };

        window.addEventListener('chatMessage', handleChat);
        window.addEventListener('chatHistory', handleHistory); // Needs MainScene to dispatch this
        return () => {
            window.removeEventListener('chatMessage', handleChat);
            window.removeEventListener('chatHistory', handleHistory);
        };
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Command: /host <password>
        if (inputValue.startsWith('/host ')) {
            const pass = inputValue.split(' ')[1];
            if (pass === 'duytuan123') { // Hardcoded for prototype
                setIsHost(true);
                setChatMessages(prev => [...prev, { name: "System", text: "You are now HOST. Please Start Broadcasting.", color: "text-green-400" }]);
                setInputValue("");

                // Force reload of Jitsi component logic
                setIsInCall(false);
                setShowJoinConfirmation(true);
                return;
            }
        }

        // Dispatch event for MainScene to pick up
        window.dispatchEvent(new CustomEvent('sendChat', { detail: inputValue }));
        setInputValue("");
    };

    useEffect(() => {
        const handleSeated = () => {
            setIsInCall(true);
        };
        window.addEventListener('playerSeated', handleSeated);
        return () => window.removeEventListener('playerSeated', handleSeated);
    }, []);

    // Listen for Stage Updates
    useEffect(() => {
        const handleStageUpdate = (e: any) => {
            const eventData = e.detail;
            setCurrentEvent(eventData);

            // If event ended and we are in call, maybe leave?
            // For now, let's keep it simple. User manually leaves.
            // But if we are audience, and event ends, maybe kick?
            if (!eventData && isInCall && !isHost) {
                setIsInCall(false);
                setShowJoinConfirmation(false); // Reset
            }
        };
        window.addEventListener('stageUpdate', handleStageUpdate);
        return () => window.removeEventListener('stageUpdate', handleStageUpdate);
    }, [isInCall, isHost]);

    const [onlineCount, setOnlineCount] = useState(1);

    useEffect(() => {
        const handlePlayerCount = (e: any) => {
            setOnlineCount(e.detail);
        };
        window.addEventListener('playerCountUpdate', handlePlayerCount);
        return () => window.removeEventListener('playerCountUpdate', handlePlayerCount);
    }, []);

    // Check for Admin Command
    useEffect(() => {
        if (inputValue.startsWith('/host')) {
            // Pre-fill host modal? Or just show it?
            // Let's make a dedicated button appear if they type /admin
        }
    }, [inputValue]);

    const handleHostSubmit = () => {
        if (!hostTitle || !hostPassword) return;
        // Emit start event
        // We need access to socket manager. It's inside MainScene. 
        // We can dispatch event to window, and MainScene listens.
        // OR: MainScene listens to a custom event
        window.dispatchEvent(new CustomEvent('reqStartStage', { detail: { title: hostTitle, password: hostPassword } }));
        setIsHost(true);
        setShowHostModal(false);
        // Note: We don't join immediately here. We wait for 'stageUpdate' to confirm room creation.
        // But for UX, we can just wait.
    };

    const handleStopEvent = () => {
        window.dispatchEvent(new CustomEvent('reqEndStage', { detail: { password: hostPassword } }));
        setIsHost(false);
        setIsInCall(false);
    };

    const playerName = localStorage.getItem('playerName') || 'Guest';

    // Mobile Check
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
                setIsMobile(true);
            }
        };
        checkMobile();
    }, []);

    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center w-screen h-screen bg-gray-900 text-white p-8 text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 text-yellow-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">Desktop Only</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    PublicBuild Beta is currently optimized for desktop computers to ensure the best multiplayer experience.
                    <br /><br />
                    Please visit us on a laptop or desktop!
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="flex w-screen h-screen bg-gray-900 overflow-hidden text-white font-sans">
            {/* Game Canvas - Takes available space */}
            <div className="flex-1 relative h-full">
                <div ref={gameRef} className="w-full h-full" />

                {/* Confirmation Modal */}
                {showJoinConfirmation && !isInCall && currentEvent && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-purple-500 rounded-lg p-6 shadow-2xl z-50 max-w-sm text-center">
                        <div className="text-red-500 font-bold mb-2 animate-pulse">● LIVE NOW</div>
                        <h2 className="text-xl font-bold text-white mb-2">{currentEvent.title}</h2>
                        <p className="text-gray-400 text-xs mb-4">Hosted by {currentEvent.hostName}</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setShowJoinConfirmation(false)}
                                className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800 text-gray-300 transition-colors"
                            >
                                Ignore
                            </button>
                            <button
                                onClick={() => {
                                    setShowJoinConfirmation(false);
                                    window.dispatchEvent(new CustomEvent('triggerAutoSeat'));
                                    // setIsInCall(true); // Triggered by playerSeated
                                }}
                                className={`px-4 py-2 rounded font-bold transition-colors text-white ${isHost
                                    ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/50'
                                    : 'bg-purple-600 hover:bg-purple-500'
                                    }`}
                            >
                                {isHost ? 'Start Broadcasting' : 'Join Event'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Host Modal */}
                {showHostModal && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-purple-500 rounded-lg p-6 shadow-2xl z-50 w-80">
                        <h2 className="text-xl font-bold text-white mb-4">Host an Event</h2>
                        <input
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 mb-3 text-white"
                            placeholder="Event Title"
                            value={hostTitle}
                            onChange={(e) => setHostTitle(e.target.value)}
                        />
                        <input
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 mb-4 text-white"
                            placeholder="Admin Password"
                            type="password"
                            value={hostPassword}
                            onChange={(e) => setHostPassword(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowHostModal(false)}
                                className="px-3 py-1 rounded text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleHostSubmit}
                                className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold"
                            >
                                Go Live
                            </button>
                        </div>
                    </div>
                )}

                {/* Video Call Auto-Interface - Only if Confirmed */}
                {isInCall && (
                    <PresentationStage
                        roomName={currentEvent ? currentEvent.roomId : "PixelOffice_Lobby"}
                        displayName={playerName}
                        isHost={isHost}
                        onLeave={() => {
                            setIsInCall(false);
                            if (isHost) handleStopEvent(); // Ideally ask "End Event?"
                        }}
                    />
                )}
            </div>

            {/* Sidebar - Right side (Gather-style) */}
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-10 shadow-xl">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <h1 className="font-bold text-lg text-purple-400">Build In Public Group</h1>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Online: {onlineCount}
                    </div>
                </div>

                {/* Chat Area - Flexible height */}
                <div className="flex-1 flex flex-col min-h-0 bg-gray-900/50">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className="text-sm break-words">
                                <span className={`${msg.color} font-bold`}>{msg.name}:</span>
                                <span className="text-gray-300 ml-2">{msg.text}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 bg-gray-800">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

