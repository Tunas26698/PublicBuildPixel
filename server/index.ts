import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
    }
});

interface Player {
    id: string;
    x: number;
    y: number;
    name?: string;
    spriteUrl?: string;
    portraitUrl?: string;
}

const players: Record<string, Player> = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Initial state (waiting for join)
    players[socket.id] = {
        id: socket.id,
        x: 400,
        y: 300,
        name: 'Guest',
        spriteUrl: '', // Default
        portraitUrl: ''
    };

    // Send current players map to the new connection
    socket.emit('currentPlayers', players);

    // Handle Join Event (Client sends profile)
    socket.on('joinGame', (data: { name: string, spriteUrl: string, portraitUrl: string }) => {
        console.log(`User ${socket.id} joined as ${data.name}`);

        if (players[socket.id]) {
            players[socket.id].name = data.name;
            players[socket.id].spriteUrl = data.spriteUrl;
            players[socket.id].portraitUrl = data.portraitUrl;

            // Broadcast fully initialized player to others
            socket.broadcast.emit('newPlayer', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    socket.on('playerMovement', (movementData) => {
        // console.log(`[Server] Move ${socket.id} -> ${movementData.x}, ${movementData.y}`); // Uncomment for spam debug
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // Only broadcast movement if fully joined? Or always. Always is fine.
            socket.broadcast.emit('playerMoved', players[socket.id]);
        } else {
            console.warn(`[Server] Received move from unknown player: ${socket.id}`);
        }
    });

    // Chat Handling
    socket.on('chatMessage', (message: string) => {
        if (players[socket.id]) {
            const chatObj = {
                id: socket.id,
                name: players[socket.id].name,
                text: message,
                timestamp: Date.now()
            };
            // Broadcast to EVERYONE (including sender) to simplify UI state
            io.emit('chatMessage', chatObj);
        }
    });
});

const PORT = process.env.PORT || 3000;

// Multer Setup
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AvatarService } from './services/avatarService';
import dotenv from 'dotenv';
dotenv.config();

const upload = multer({
    dest: 'uploads/', // Temp storage
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const avatarService = new AvatarService();

// Serve the generated avatars statically from the client public folder for immediate access
app.use('/assets/user_avatars', express.static(path.join(__dirname, '../client/public/assets/user_avatars')));

// API Routes
app.post('/api/create-avatar', upload.single('avatar'), async (req, res) => {
    try {
        const description = req.body.description || undefined;

        // Validation: Need EITHER file OR description
        if (!req.file && !description) {
            res.status(400).json({ error: 'Upload image OR provide description' });
            return;
        }

        const filePath = req.file ? req.file.path : undefined;
        if (filePath) console.log("Received upload:", filePath);
        if (description) console.log("Received description:", description);

        // Process
        const { spriteUrl, frontUrl, backUrl, portraitUrl } = await avatarService.generateAvatarFromPhoto(filePath, description);

        // Cleanup temp file? Maybe keep for debug.
        // fs.unlinkSync(req.file.path);

        res.json({ success: true, spriteUrl, frontUrl, backUrl, portraitUrl });

    } catch (error: any) {
        console.error("Avatar Creation Error:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
