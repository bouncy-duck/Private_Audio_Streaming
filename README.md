# 🎧 Private Audio Link

A lightweight, highly secure, 1-to-1 WebRTC audio broadcasting application. 

This project allows a streamer to capture and broadcast their system audio (or microphone) directly to a listener via a secure Peer-to-Peer connection. It features an encrypted signaling server, bypasses strict NAT/Firewalls using TURN relays, and ensures ultra-low latency by routing data locally whenever possible.

## ✨ Key Features

* **Peer-to-Peer Audio:** Uses WebRTC to send high-fidelity Opus audio directly between browsers.
* **System Audio Capture:** Seamlessly extracts audio from screen shares while discarding heavy video data to save bandwidth.
* **Smart Routing (ICE):** Automatically detects if users are on the same Wi-Fi router (LAN) for 0ms latency, or seamlessly falls back to a TURN server to punch through strict cellular (CGNAT) or university firewalls.
* **Seamless Resume:** Hot-swaps audio tracks using `replaceTrack()`. Streamers can change the shared tab or resume a paused broadcast without dropping the WebRTC connection or requiring the listener to refresh.
* **Secure Signaling:** Uses a Node.js + Socket.io backend to broker the connection, protected by a SHA-256 hashed password.
* **One-Time Links:** Generates unique, ephemeral links for listeners to join the session.

## 🛠️ Technology Stack

* **Frontend:** Vanilla JavaScript, HTML5, CSS3, WebRTC API, standard MediaDevices API.
* **Backend:** Node.js, Express.js, Socket.io.
* **Infrastructure:** Render (Hosting/Signaling), Metered.ca (STUN/TURN Servers).

---

## 🚀 Local Setup & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.
* A free [Metered.ca](https://www.metered.ca/stun-turn) account for TURN credentials.

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/private-audio-link.git](https://github.com/YOUR_USERNAME/private-audio-link.git)
cd private-audio-link
```

### 2. Install Dependencies
**Important:** The backend configuration is located inside the `server` directory.
```bash
cd server
npm install
```

### 3. Environment Variables
Inside the `server/` directory, create a `.env` file. You will need to generate a SHA-256 hash of your desired password. 

```env
PORT=3000
STREAMER_HASH=your_64_character_sha256_hash_here
TURN_URL=turns:global.relay.metered.ca:443?transport=tcp
TURN_USERNAME=your_metered_username
TURN_PASSWORD=your_metered_password
```

*Note: Do not use quotes around your `.env` variables unless your generated password contains spaces or special characters.*

### 4. Run the Server
```bash
# Ensure you are still inside the /server directory
npm start
```
The server will lock onto port 3000. Open `http://localhost:3000` in your browser.

---

## 🌍 Deployment (Render.com)

This application is designed to be deployed as a single Web Service on Render. 

1. Push your repository to GitHub (Ensure `server/.env` is in your `.gitignore`!).
2. Create a new **Web Service** on Render.
3. Set the **Root Directory** to `server`.
4. Set the Build Command to `npm install` and the Start Command to `npm start`.
5. Add your `.env` variables directly into Render's "Environment Variables" dashboard. 
6. Deploy!

---

## 🧠 Architecture Overview

1. **Authentication:** The streamer logs in. The plaintext password is mathematically hashed on the backend and compared to the `.env` variable. 
2. **Signaling:** Socket.io acts as the middleman, passing Session Description Protocol (SDP) and ICE candidates between the streamer and listener.
3. **P2P Handshake:** Once the browsers know how to reach each other, the Socket.io server steps back.
4. **Data Flow:** The audio streams directly from Browser A to Browser B. If the users are on the same network, it stays entirely on the local router. If strict firewalls block the path, the encrypted audio routes through the Metered.ca TURN server on Port 443.

## 📝 License
MIT License