window.initStreamer = (socket, turnConfig) => {
    let peerConnection;
    let localStream;
    let isListenerReady = false; // NEW: Track if listener is waiting

    // NEW: We moved the handshake into a reusable function
    const startWebRTC = async () => {
        document.getElementById('streamer-status').innerText = "Listener Joined! Broadcasting LIVE.";
        
        peerConnection = new RTCPeerConnection(turnConfig);
        
        // Add our extracted audio track
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        // ICE Candidates
        peerConnection.onicecandidate = event => {
            if (event.candidate) socket.emit('webrtc-signal', { ice: event.candidate });
        };

        // Create WebRTC Offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc-signal', { sdp: peerConnection.localDescription });
    };

    // 1. Streamer clicks capture button
    document.getElementById('start-capture-btn').addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true 
            });

            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) throw new Error("No audio track found. Did you check 'Share Audio'?");
            
            stream.getVideoTracks().forEach(track => track.stop()); 
            
            localStream = new MediaStream([audioTrack]);
            document.getElementById('start-capture-btn').classList.add('hidden');

            // Did the listener already join while we were picking a screen?
            if (isListenerReady) {
                startWebRTC();
            } else {
                document.getElementById('streamer-status').innerText = "Audio Captured. Waiting for Listener...";
            }

        } catch (err) {
            alert(err.message);
        }
    });

    // 2. The server says the listener arrived
    socket.on('listener-joined', async () => {
        isListenerReady = true;

        // Did we already capture the audio?
        if (localStream) {
            startWebRTC();
        } else {
            document.getElementById('streamer-status').innerText = "Listener is in the room. Waiting for you to capture audio.";
        }
    });

    // 3. Handle incoming answer/ICE from listener
    socket.on('webrtc-signal', async (data) => {
        if (!peerConnection) return; // Safety check
        if (data.sdp) await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.ice) await peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
    });

    // 4. Handle Disconnects smoothly
    socket.on('peer-disconnected', () => {
        document.getElementById('streamer-status').innerText = "Listener disconnected.";
        isListenerReady = false; // Reset the flag
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
    });
};