window.initListener = (socket, turnConfig) => {
    let peerConnection;
    const audioElement = document.getElementById('remote-audio');

    socket.on('webrtc-signal', async (data) => {
        if (!peerConnection) {
            peerConnection = new RTCPeerConnection(turnConfig);
            
            peerConnection.onicecandidate = event => {
                if (event.candidate) socket.emit('webrtc-signal', { ice: event.candidate });
            };

            // When the audio track arrives, attach it to the HTML5 audio element
            peerConnection.ontrack = event => {
                document.getElementById('listener-status').innerText = "LIVE. Receiving Audio...";
                audioElement.srcObject = event.streams[0];
            };
        }

        if (data.sdp) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('webrtc-signal', { sdp: peerConnection.localDescription });
        }
        
        if (data.ice) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
        }
    });

    socket.on('peer-disconnected', () => {
        document.getElementById('listener-status').innerText = "Streamer ended the broadcast.";
        if (peerConnection) peerConnection.close();
    });
};