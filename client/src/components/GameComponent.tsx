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
                    debug: true,
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
                                    // Trigger Phaser auto-seat
                                    if (gameRef.current) {
                                        // We need to access the game instance to emit event.
                                        // Since we don't have direct ref to game instance here easily without prop drilling or external store,
                                        // we can use a custom event on the window or just assume MainScene is listening.
                                        // Ideally we captured 'game' in a ref, but we didn't.
                                        // Workaround: Dispatch a custom window event or usage of a global if needed, 
                                        // BUT Phaser game instance is right there in useEffect scope.
                                        // We can't access it from here. 
                                        // Let's use a dirty global for this prototype or refactor.
                                        // Proper way: Store game instance in a Ref.
                                        // Refactoring to store game instance:
                                    }
                                    // Dispatch event via window for simplicity in this constrained edit context, 
                                    // MainScene can listen to window or we fix the Ref. 
                                    // MainScene listens to its own events. 
                                    // Use a global helper or window dispatch.
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
                            // Optional: Move player out of zone?
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
                        <div className="text-sm">
                            <span className="text-purple-400 font-bold">System:</span>
                            <span className="text-gray-300 ml-2">Welcome to the space!</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-blue-400 font-bold">Sandy:</span>
                            <span className="text-gray-300 ml-2">Anyone at the stage?</span>
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-gray-700 bg-gray-800">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

