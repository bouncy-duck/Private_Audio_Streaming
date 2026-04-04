const socket = io();

// UI Elements
const loginUI = document.getElementById('login-ui');
const streamerUI = document.getElementById('streamer-ui');
const listenerUI = document.getElementById('listener-ui');
const errorMsg = document.getElementById('error-msg');

// Routing Logic
const urlParams = new URLSearchParams(window.location.search);
const inviteToken = urlParams.get('invite');

if (inviteToken) {
    // Role: LISTENER
    loginUI.classList.add('hidden');
    listenerUI.classList.remove('hidden');

    document.getElementById('join-btn').addEventListener('click', () => {
        socket.emit('authenticate-listener', inviteToken);
    });

    socket.on('listener-authenticated', (data) => {
        document.getElementById('listener-status').innerText = "Authenticating... Waiting for Streamer.";
        document.getElementById('join-btn').classList.add('hidden');
        window.initListener(socket, data.turnConfig);
    });

} else {
    // Role: STREAMER
    document.getElementById('login-btn').addEventListener('click', () => {
        const pass = document.getElementById('password-input').value;
        socket.emit('authenticate-streamer', pass);
    });

    socket.on('streamer-authenticated', (data) => {
        loginUI.classList.add('hidden');
        streamerUI.classList.remove('hidden');
        
        // Construct the link to send
        const fullLink = `${window.location.origin}/?invite=${data.token}`;
        document.getElementById('invite-link-display').value = fullLink;

        window.initStreamer(socket, data.turnConfig);
    });
}

// Global Error Handler
socket.on('auth-error', (msg) => {
    errorMsg.innerText = msg;
    document.getElementById('listener-status').innerText = msg;
});