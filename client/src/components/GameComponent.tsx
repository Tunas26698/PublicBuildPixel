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
                                // Enter Zone: Show confirmation
                                setShowJoinConfirmation(true);
                            } else {
                                // Exit Zone: Reset all
                                setShowJoinConfirmation(false);
                                setIsInCall(false);
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
            const { name, text, id } = e.detail; // Custom event detail
            setChatMessages(prev => [...prev, {
                name,
                text,
                color: name === 'System' ? "text-purple-400" : "text-cyan-400"
            }]);
        };

        window.addEventListener('chatMessage', handleChat);
        return () => window.removeEventListener('chatMessage', handleChat);
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Dispatch event for MainScene to pick up
        window.dispatchEvent(new CustomEvent('sendChat', { detail: inputValue }));
        setInputValue("");
    };

    return (
        <div className="flex w-screen h-screen bg-gray-900 overflow-hidden text-white font-sans">
            {/* Game Canvas - Takes available space */}
            <div className="flex-1 relative h-full">
                <div ref={gameRef} className="w-full h-full" />

                {/* Confirmation Modal */}
                {showJoinConfirmation && !isInCall && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-purple-500 rounded-lg p-6 shadow-2xl z-50 max-w-sm text-center">
                        <h2 className="text-xl font-bold text-purple-400 mb-4">🎤 Enter Presentation Stage?</h2>
                        <p className="text-gray-300 mb-6 text-sm">
                            You are about to join the event area. Your character will automatically find a seat and you will join the video call.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setShowJoinConfirmation(false)}
                                className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800 text-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowJoinConfirmation(false);
                                    setIsInCall(true);
                                    window.dispatchEvent(new CustomEvent('triggerAutoSeat'));
                                }}
                                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
                            >
                                Join Event
                            </button>
                        </div>
                    </div>
                )}

                {/* Video Call Auto-Interface - Only if Confirmed */}
                {isInCall && (
                    <PresentationStage
                        roomName="PixelOffice_General_Stage"
                        displayName="Sandy"
                        onLeave={() => {
                            setIsInCall(false);
                        }}
                    />
                )}
            </div>

            {/* Sidebar - Right side (Gather-style) */}
            <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-10 shadow-xl">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <h1 className="font-bold text-lg text-purple-400">Pixel Office</h1>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Online: 3
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

