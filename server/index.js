require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve frontend files
app.use(express.static(path.join(__dirname, '../client')));

// State Management
let activeStreamer = null;
let activeListener = null;
const inviteTokens = new Set(); // Stores our One-Time Links

// Helper to securely pass TURN configs to authenticated users
const getTurnConfig = () => ({
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: process.env.TURN_URL,
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_PASSWORD
        }
    ]
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- STREAMER AUTHENTICATION ---
    socket.on('authenticate-streamer', (plainTextPassword) => {
        const hash = crypto.createHash('sha256').update(plainTextPassword).digest('hex');

        console.log("1. Environment Hash:", process.env.STREAMER_HASH);
        console.log("2. Generated Hash:  ", hash);
        
        if (hash === process.env.STREAMER_HASH) {
            if (activeStreamer) {
                return socket.emit('auth-error', 'A streamer is already active.');
            }
            activeStreamer = socket.id;
            
            // Generate One-Time Link
            const token = crypto.randomBytes(4).toString('hex'); // e.g., 'a7f3b9c2'
            inviteTokens.add(token);
            
            socket.emit('streamer-authenticated', { token, turnConfig: getTurnConfig() });
            console.log('Streamer Authenticated. Token generated:', token);
        } else {
            socket.emit('auth-error', 'Invalid password.');
        }
    });

    // --- LISTENER AUTHENTICATION ---
    socket.on('authenticate-listener', (token) => {
        if (!inviteTokens.has(token)) {
            return socket.emit('auth-error', 'Invalid or expired invite link.');
        }
        if (activeListener) {
            return socket.emit('auth-error', 'The private room is full.');
        }

        // Grant access, burn the ticket, lock the room
        activeListener = socket.id;
        inviteTokens.delete(token); 
        
        socket.emit('listener-authenticated', { turnConfig: getTurnConfig() });
        
        // Notify Streamer to start WebRTC handshake
        if (activeStreamer) {
            io.to(activeStreamer).emit('listener-joined');
        }
    });

    // --- WEBRTC SIGNALING (The Handshake) ---
    socket.on('webrtc-signal', (data) => {
        // Only allow active members to signal
        if (socket.id === activeStreamer && activeListener) {
            io.to(activeListener).emit('webrtc-signal', data);
        } else if (socket.id === activeListener && activeStreamer) {
            io.to(activeStreamer).emit('webrtc-signal', data);
        }
    });

    // --- DISCONNECT LOGIC ---
    socket.on('disconnect', () => {
        if (socket.id === activeStreamer) {
            activeStreamer = null;
            if (activeListener) io.to(activeListener).emit('peer-disconnected');
            console.log('Streamer left.');
        }
        if (socket.id === activeListener) {
            activeListener = null;
            if (activeStreamer) io.to(activeStreamer).emit('peer-disconnected');
            console.log('Listener left.');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server locked and listening on port ${PORT}`));