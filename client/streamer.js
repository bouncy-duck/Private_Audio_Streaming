window.initStreamer = (socket, turnConfig) => {
    let peerConnection;
    let localStream;

    document.getElementById('start-capture-btn').addEventListener('click', async () => {
        try {
            // The "Google Meet" logic: Get Display Media
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true 
            });

            // Extract Audio, Kill Video to save CPU
            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) throw new Error("No audio track found. Did you check 'Share Audio'?");
            
            stream.getVideoTracks().forEach(track => track.stop()); // Kill video
            
            localStream = new MediaStream([audioTrack]);
            document.getElementById('streamer-status').innerText = "Audio Captured. Waiting for Listener...";
            document.getElementById('start-capture-btn').classList.add('hidden');

        } catch (err) {
            alert(err.message);
        }
    });

    // When the Bouncer lets the listener in
    socket.on('listener-joined', async () => {
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
    });

    // Handle incoming answer/ICE from listener
    socket.on('webrtc-signal', async (data) => {
        if (data.sdp) await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.ice) await peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
    });

    socket.on('peer-disconnected', () => {
        document.getElementById('streamer-status').innerText = "Listener disconnected.";
        if (peerConnection) peerConnection.close();
    });
};