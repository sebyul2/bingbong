// app.js
var VideoChat = {
    socket: io(),
    uid: Math.random().toString(36).substring(2),
    requestMediaStream: function (event) {
        console.log('requestMediaStream')
        // VideoChat.socket.emit('login', uid)
        navigator.getUserMedia({
                video: true,
                audio: true
            },
            VideoChat.onMediaStream,
            VideoChat.noMediaStream
        );
    },
    onMediaStream: function (stream) {
        console.log('onMediaStream')
        VideoChat.localVideo = document.getElementById('local-video');
        VideoChat.localVideo.volume = 0;
        VideoChat.localStream = stream;
        VideoChat.videoButton.setAttribute('disabled', 'disabled');
        VideoChat.localVideo.src = window.URL.createObjectURL(stream);
        VideoChat.socket.emit('join', 'test');
        VideoChat.socket.on('ready', VideoChat.readyToCall);
        VideoChat.socket.on('offer', VideoChat.onOffer);
    },
    readyToCall: function (event) {
        console.log('onReadyToCall')
        VideoChat.callButton.removeAttribute('disabled');
    },
    noMediaStream: function () {
        console.log("No media stream for us.");
    },
    startCall: function (event) {
        console.log('startCall')
        VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createOffer));
        VideoChat.socket.emit('token');
    },
    onToken: function (callback) {
        console.log('onToken')
        return function (token) {
            console.log(token)
            VideoChat.peerConnection = new RTCPeerConnection({
                iceServers: token.iceServers
            });
            VideoChat.socket.on('candidate', VideoChat.onCandidate);
            VideoChat.socket.on('answer', VideoChat.onAnswer);
            VideoChat.peerConnection.addStream(VideoChat.localStream);
            VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
            VideoChat.peerConnection.onaddstream = VideoChat.onAddStream;
            callback();
        }
    },
    onIceCandidate: function (event) {
        if (event.candidate) {
            console.log('Generated candidate!');
            VideoChat.socket.emit('candidate', JSON.stringify(event.candidate));
        }
    },
    onCandidate: function (candidate) {
        console.log('onCandidate')
        rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
        VideoChat.peerConnection.addIceCandidate(rtcCandidate);
    },
    onOffer: function (offer) {
        console.log('onOffer') 
       VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createAnswer(offer)));
        VideoChat.socket.emit('token');
    },
    createOffer: function () {
        console.log('createOffer')
        VideoChat.peerConnection.createOffer(
            function (offer) {
                console.log('offer', offer)
                VideoChat.peerConnection.setLocalDescription(offer);
                VideoChat.socket.emit('offer', JSON.stringify(offer));
            },
            function (err) {
                console.log(err);
            }
        );
    },
    createAnswer: function (offer) {
        console.log('createAnswer')
        return function () {
            rtcOffer = new RTCSessionDescription(JSON.parse(offer));
            VideoChat.peerConnection.setRemoteDescription(rtcOffer);
            VideoChat.peerConnection.createAnswer(
                function (answer) {
                    console.log('answer', answer)
                    VideoChat.peerConnection.setLocalDescription(answer);
                    VideoChat.socket.emit('answer', JSON.stringify(answer));
                },
                function (err) {
                    console.log(err);
                }
            );
        }
    },
    onAnswer: function (answer) {
        console.log('onAnswer')
        var rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
        VideoChat.peerConnection.setRemoteDescription(rtcAnswer);
    },
    onAddStream: function (event) {
        console.log('onAddStream')
        VideoChat.remoteVideo = document.getElementById('remote-video');
        VideoChat.remoteVideo.src = window.URL.createObjectURL(event.stream);
    },
};

VideoChat.videoButton = document.getElementById('get-video');
VideoChat.videoButton.addEventListener(
    'click',
    VideoChat.requestMediaStream,
    false
);

VideoChat.callButton = document.getElementById('call');
VideoChat.callButton.addEventListener(
    'click',
    VideoChat.startCall,
    false
);