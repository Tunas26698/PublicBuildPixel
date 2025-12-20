import { io, Socket } from 'socket.io-client';

export class SocketManager {
    private socket: Socket;
    private scene: Phaser.Scene;
    private otherPlayers: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.otherPlayers = this.scene.physics.add.group();

        // Connect to backend
        // Connect to backend
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        this.socket = io(apiUrl);

        this.setupListeners();
    }

    private setupListeners() {
        this.socket.on('currentPlayers', (players: any) => {
            this.otherPlayers.clear(true, true); // Destroy all existing to prevent ghosts
            Object.keys(players).forEach((id) => {
                if (players[id].id === this.socket.id) {
                    this.addPlayer(players[id]);
                } else {
                    this.addOtherPlayer(players[id]);
                }
            });
        });

        this.socket.on('newPlayer', (playerInfo: any) => {
            this.addOtherPlayer(playerInfo);
        });

        this.socket.on('playerDisconnected', (playerId: string) => {
            this.scene.events.emit('removeOtherPlayer', playerId);
        });

        this.socket.on('playerMoved', (playerInfo: any) => {
            this.scene.events.emit('moveOtherPlayer', playerInfo);
        });

        this.socket.on('chatMessage', (chatData: any) => {
            // Emit to scene so UI can pick it up
            this.scene.events.emit('chatMessage', chatData);
        });
    }

    public sendChat(message: string) {
        if (this.socket) {
            this.socket.emit('chatMessage', message);
        }
    }

    public emitPlayerMovement(x: number, y: number) {
        if (this.socket) {
            this.socket.emit('playerMovement', { x, y });
        }
    }

    public joinGame(name: string, spriteUrl: string, portraitUrl: string) {
        if (this.socket) {
            this.socket.emit('joinGame', { name, spriteUrl, portraitUrl });
        }
    }

    private addPlayer(_playerInfo: any) {
        // Already handled in MainScene for local player
    }

    private addOtherPlayer(playerInfo: any) {
        // Delegate to MainScene to handle sprite loading
        // We need to cast scene to MainScene to access custom methods
        // Or trigger an event.
        // Let's assume MainScene has addOtherPlayer method exposed if we passed it in constructor or use events.
        // Actually, better to modify MainScene to handle this logic or allow access.
        // For now, let's emit an event on the Scene that MainScene listens to.
        this.scene.events.emit('addOtherPlayer', playerInfo);
    }
}
