import { io, Socket } from 'socket.io-client';

export class SocketManager {
    private socket: Socket;
    private scene: Phaser.Scene;
    private otherPlayers: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.otherPlayers = this.scene.physics.add.group();

        // Connect to backend
        this.socket = io('http://localhost:3000'); // Adjust URL as needed

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
            this.otherPlayers.getChildren().forEach((otherPlayer: any) => {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });

        this.socket.on('playerMoved', (playerInfo: any) => {
            this.otherPlayers.getChildren().forEach((otherPlayer: any) => {
                if (playerInfo.id === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                }
            });
        });
    }

    public emitPlayerMovement(x: number, y: number) {
        if (this.socket) {
            this.socket.emit('playerMovement', { x, y });
        }
    }

    private addPlayer(_playerInfo: any) {
        // Already handled in MainScene for local player, but maybe we sync ID/Color here
        console.log("My ID:", this.socket.id);
    }

    private addOtherPlayer(playerInfo: any) {
        const otherPlayer = this.scene.physics.add.sprite(playerInfo.x, playerInfo.y, 'character_anim');
        otherPlayer.setTint(0xff0000); // Tint red to distinguish? Or just use same sprite
        otherPlayer.setScale(0.1); // Match new Chibi scale
        // Note: Hitbox adjustment for remote players might be needed if we showed their debug bodies, 
        // but setScale handles the visual size. 
        // If we wanted to fix their anchor/origin, we might need to adjust offsets, 
        // but `sprite` usually centers the frame. 
        // Since there is whitespace, the "center" of the sprite might be empty air above the head.
        // We might need to change origin to Bottom Center?
        // this.player.setOrigin(0.5, 1); 
        // Let's stick to default for now and see.
        // Play idle animation by default
        otherPlayer.anims.play('idle');

        this.otherPlayers.add(otherPlayer);
    }
}
