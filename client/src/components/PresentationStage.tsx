import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface PresentationStageProps {
    roomName: string;
    displayName: string;
    onLeave: () => void;
}

export const PresentationStage: React.FC<PresentationStageProps> = ({ roomName, displayName, onLeave }) => {
    return (
        <div className="absolute bottom-4 right-4 w-96 h-64 z-50 bg-black flex flex-col shadow-2xl rounded-lg overflow-hidden border border-gray-700">
            <div className="relative flex-1">
                <JitsiMeeting
                    roomName={roomName}
                    configOverwrite={{
                        startWithAudioMuted: true,
                        disableThirdPartyRequests: true,
                        prejoinPageEnabled: false,
                    }}
                    interfaceConfigOverwrite={{
                        // Minimal toolbar for small window
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'hangup', 'tileview', 'fullscreen'
                        ],
                        // Hide filmstrip to save space
                        FILM_STRIP_MAX_HEIGHT: 0,
                    }}
                    userInfo={{
                        displayName: displayName,
                        email: ''
                    }}
                    onApiReady={(externalApi) => {
                        // handle any API interactions here
                        externalApi.on('videoConferenceLeft', () => {
                            onLeave();
                        });
                    }}
                    getIFrameRef={(iframeRef) => {
                        iframeRef.style.height = '100%';
                    }}
                />
            </div>
        </div>
    );
};
