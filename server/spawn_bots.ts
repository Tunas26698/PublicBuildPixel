
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3000";
const BOT_COUNT = 30;

const NAMES = [
    "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    "Kevin", "Liam", "Mallory", "Niaj", "Olivia", "Peggy", "Quentin", "Rupert", "Sybil", "Ted",
    "Ursula", "Victor", "Walter", "Xavier", "Yvonne", "Zelda", "Arthur", "Beatrix", "Colin", "Diana"
];

// Valid sprite URLs based on client assets
const SPRITE_URLS = Array.from({ length: 10 }, (_, i) => `/assets/ai_chars_animated/ai_char_${i + 1}.png`);

const CHAT_MESSAGES = [
    "Hello everyone!", "Nice office!", "Anyone for coffee?", "Working hard or hardly working?",
    "Check out this pixel art!", "Where is the meeting?", "LOL", "AFK for a bit",
    "Can you hear me?", "I love this game!", "Ping?", "Pong!", "Looking for a co-founder...",
    "Nice to meet you all.", "Is it lunch time yet?", "Coding is fun!", "Bug fixed!",
    "Deploying to production...", "Who wants to pair program?", "Review my PR please!"
];

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomItem(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

console.log(`Spawning ${BOT_COUNT} bots to ${SERVER_URL}...`);

for (let i = 0; i < BOT_COUNT; i++) {
    const socket = io(SERVER_URL);
    const name = NAMES[i] || `Bot_${i}`;

    socket.on("connect", () => {
        console.log(`Bot ${name} connected (ID: ${socket.id})`);

        // Join Game with random position logic handled by server init (400,300), 
        // but server expects 'joinGame' to fully register name.
        socket.emit("joinGame", {
            name: name,
            spriteUrl: getRandomItem(SPRITE_URLS),
            portraitUrl: ""
        });

        // Move to random position
        // Map is roughly large, let's say 0-1200 x 0-800 based on common tilemaps
        const targetX = getRandomInt(200, 1000);
        const targetY = getRandomInt(200, 800);

        // Initial move
        socket.emit("playerMovement", { x: targetX, y: targetY });

        // Initial Chat
        setTimeout(() => {
            socket.emit("chatMessage", getRandomItem(CHAT_MESSAGES));
        }, getRandomInt(1000, 5000));

        // Periodic random movement and chat
        setInterval(() => {
            // Move
            if (Math.random() > 0.7) {
                const moveX = getRandomInt(200, 1000);
                const moveY = getRandomInt(200, 800);
                socket.emit("playerMovement", { x: moveX, y: moveY });
            }

            // Chat (less frequent than movement)
            if (Math.random() > 0.8) {
                socket.emit("chatMessage", getRandomItem(CHAT_MESSAGES));
            }
        }, getRandomInt(3000, 10000));
    });

    socket.on("disconnect", () => {
        console.log(`Bot ${name} disconnected`);
    });
}
