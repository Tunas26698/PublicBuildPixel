import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface PresentationStageProps {
    roomName: string;
    displayName: string;
    isHost?: boolean;
    onLeave: () => void;
}

export const PresentationStage: React.FC<PresentationStageProps> = ({ roomName, displayName, isHost = false, onLeave }) => {
    // Host: Can mute/unmute, share screen (desktop), cam
    const hostToolbar = ['microphone', 'camera', 'desktop', 'hangup', 'tileview', 'fullscreen', 'chat', 'raisehand', 'participants-pane'];
    // Audience: Can ONLY raise hand, chat, fullscreen, hangup. NO Mic/Cam/Desktop.
    const audienceToolbar = ['hangup', 'fullscreen', 'chat', 'raisehand'];

    return (
        <div className="absolute bottom-4 right-4 w-[800px] h-[600px] max-w-[90vw] max-h-[80vh] z-50 bg-gray-900 flex flex-col shadow-2xl rounded-lg overflow-hidden border border-gray-700">
            <div className="relative flex-1">
                <JitsiMeeting
                    domain="meet.framatalk.org"
                    roomName={roomName}
                    configOverwrite={{
                        startWithAudioMuted: !isHost, // Audience starts muted
                        startWithVideoMuted: !isHost, // Audience starts no video
                        prejoinPageEnabled: false,
                        prejoinConfig: {
                            enabled: false
                        },
                        toolbarButtons: isHost ? hostToolbar : audienceToolbar,
                    }}
                    interfaceConfigOverwrite={{
                        TOOLBAR_BUTTONS: isHost ? hostToolbar : audienceToolbar,
                        // FILM_STRIP_MAX_HEIGHT: 0, // Removed to allow seeing thumbnails
                        AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255,255,255,0.4)',
                        AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255,255,255,0.2)',
                    }}
                    userInfo={{
                        displayName: displayName,
                        email: ''
                    }}
                    onApiReady={(externalApi) => {
                        externalApi.on('videoConferenceLeft', () => {
                            onLeave();
                        });

                        // Force mute audience if they somehow joined unmuted
                        if (!isHost) {
                            // externalApi.executeCommand('muteEveryone'); // Requires mod rights, usually fails for guest
                        }
                    }}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                    }}
                />
            </div>
        </div>
    );
};
