import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AvatarService } from './services/avatarService';
import dotenv from 'dotenv';

dotenv.config();

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

interface StageEvent {
    title: string;
    hostName: string;
    roomId: string; // Secure UUID
    timestamp: number;
    startTime?: number; // Scheduled start time (if different from timestamp)
    duration: number; // Duration in minutes
}

let currentStageEvent: StageEvent | null = null;
// Updated Admin Credentials
const ADMIN_USER = "admin123";
const ADMIN_PASS = "duytuan123";

const players: Record<string, Player> = {};

const chatHistory: { id: string; name: string; text: string; timestamp: number }[] = [];

// Persistence Setup
const CHAT_FILE = path.join(__dirname, 'chat_history.jsonl');

// Load history on startup
if (fs.existsSync(CHAT_FILE)) {
    try {
        const fileContent = fs.readFileSync(CHAT_FILE, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            try {
                chatHistory.push(JSON.parse(line));
            } catch (e) {
                console.error("Error parsing chat line:", e);
            }
        });
        console.log(`Loaded ${chatHistory.length} messages from history.`);
    } catch (e) {
        console.error("Failed to load chat history:", e);
    }
}

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

    // Send chat history
    socket.emit('chatHistory', chatHistory);

    // Send current stage state
    if (currentStageEvent) {
        socket.emit('stageUpdate', currentStageEvent);
    }

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
                name: players[socket.id].name || 'Guest',
                text: message,
                timestamp: Date.now()
            };

            // Store in history
            chatHistory.push(chatObj);

            // Persist to file
            try {
                fs.appendFileSync(CHAT_FILE, JSON.stringify(chatObj) + '\n');
            } catch (e) {
                console.error("Failed to save chat message:", e);
            }

            // Broadcast to EVERYONE (including sender) to simplify UI state
            io.emit('chatMessage', chatObj);
        }
    });

    // Stage Events Handlers
    socket.on('startStageEvent', (data: { title: string, password: string }) => {
        if (data.password !== ADMIN_PASS) {
            console.warn(`User ${socket.id} failed admin auth for stage event.`);
            socket.emit('adminError', 'Invalid Admin Password');
            return;
        }

        const hostName = players[socket.id]?.name || 'Admin';
        // Generate random room ID
        const secureRoomId = `PixelOffice_Event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        currentStageEvent = {
            title: data.title,
            hostName: hostName,
            roomId: secureRoomId,
            timestamp: Date.now(),
            startTime: Date.now(),
            duration: 30
        };

        console.log(`[Stage] Event Started: ${data.title} by ${hostName} (Room: ${secureRoomId})`);
        io.emit('stageUpdate', currentStageEvent);
    });

    socket.on('endStageEvent', (data: { password: string }) => {
        if (data.password !== ADMIN_PASS) {
            return;
        }
        console.log(`[Stage] Event Ended`);
        currentStageEvent = null;
        io.emit('stageUpdate', null);
    });
});

const PORT = process.env.PORT || 3000;

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

// Admin API Routes
app.use(express.json()); // Ensure JSON body parsing

app.post('/api/admin/Login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ success: true, token: "mock_token_123" });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

app.post('/api/admin/start-event', (req, res) => {
    const { username, password, title, startTime, duration } = req.body;
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const secureRoomId = `PixelOffice_Event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Parse times
    const startTimestamp = startTime ? new Date(startTime).getTime() : Date.now();
    const eventDuration = duration ? parseInt(duration) : 30; // Default 30 mins

    currentStageEvent = {
        title: title || "Special Event",
        hostName: "Admin",
        roomId: secureRoomId,
        timestamp: Date.now(),
        startTime: startTimestamp,
        duration: eventDuration
    };

    console.log(`[Admin API] Event Scheduled: ${currentStageEvent.title} (Room: ${secureRoomId}, Start: ${new Date(currentStageEvent.startTime!).toISOString()}, Duration: ${eventDuration}m)`);
    io.emit('stageUpdate', currentStageEvent);
    res.json({ success: true, event: currentStageEvent });
});

app.post('/api/admin/end-event', (req, res) => {
    const { username, password } = req.body;
    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    console.log(`[Admin API] Event Ended`);
    currentStageEvent = null;
    io.emit('stageUpdate', null);
    res.json({ success: true });
});

app.get('/api/admin/status', (req, res) => {
    res.json({ event: currentStageEvent });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
