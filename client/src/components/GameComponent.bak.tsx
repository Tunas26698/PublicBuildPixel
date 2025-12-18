import { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../game/scenes/MainScene';
import { PresentationStage } from './PresentationStage';

export const GameComponent = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const [inPresentationZone, setInPresentationZone] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
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
                    // Pass callback via registry or scene data. 
                    // Scene data is easier if we can access scene start.
                    // Actually, the scene is started automatically. 
                    // We can use the registry to store the callback.
                    game.registry.set('onZoneChange', (inZone: boolean) => {
                        if (inZoneRef.current !== inZone) {
                            inZoneRef.current = inZone;
                            setInPresentationZone(inZone);
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

                {/* Video Call Overlay */}
                {showVideoCall && (
                    <PresentationStage
                        roomName="PixelOffice_General_Stage"
                        displayName="Sandy" // Hardcoded for now, ideal to get from user input or auth
                        onLeave={() => setShowVideoCall(false)}
                    />
                )}

                {/* Zone Notification Overlay - Only show if NOT in call */}
                {inPresentationZone && !showVideoCall && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-yellow-500 rounded-lg p-4 shadow-xl z-20">
                        <h2 className="text-yellow-400 font-bold text-center mb-2">🎤 Presentation Stage</h2>
                        <button
                            onClick={() => setShowVideoCall(true)}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-1 px-4 rounded w-full"
                        >
                            Join Video Call
                        </button>
                    </div>
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

