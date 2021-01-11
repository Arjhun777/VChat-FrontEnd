import openSocket from 'socket.io-client';
import Peer from 'peerjs';
import { toast } from 'react-toastify';
// @ts-ignore
const { websocket, peerjsEndpoint } = env_config;

let socketInstance:any = null;
let peers:any = {};

class SocketConnection {
    videoContainer:any = {};
    message:Array<object> = [];
    settings:any;
    streaming:Boolean = false;
    myPeer:Peer;
    socket:SocketIOClient.Socket;
    isSocketConnected:boolean = false;
    isPeersConnected:boolean = false;
    myID:string = '';

    constructor(settings:any) {
        this.settings = settings;
        this.myPeer = initializePeerConnection();
        this.socket = initializeSocketConnection();
        if (this.socket) this.isSocketConnected = true; 
        if (this.myPeer) this.isPeersConnected = true;
        this.initializeSocketEvents();
        this.initializePeersEvents();
    }

    initializeSocketEvents = () => {
        this.socket.on('connect', () => {
            console.log('socket connected');
        });
        this.socket.on('user-disconnected', (userID:string) => {
            console.log('user disconnected-- closing peers', userID);
            peers[userID] && peers[userID].close();
            this.removeVideo(userID);
        });
        this.socket.on('disconnect', () => {
            console.log('socket disconnected --');
        });
        this.socket.on('error', (err:Error) => {
            console.log('socket error --', err);
        });
        this.socket.on('new-broadcast-messsage', (data:any) => {
            this.message.push(data);
            this.settings.updateInstance('message', this.message);
            toast.info(`${data.message.message} By ${data.userData.name}`)
        });
        this.socket.on('display-media', (data:any) => {
            if (data.value) checkAndAddClass(this.getMyVideo(data.userID), 'displayMedia');
            else checkAndAddClass(this.getMyVideo(data.userID), 'userMedia');
        });
        // this.socket.on('user-video-off', (data:UserVideoToggle) => {
        //     changeMediaView(data.id, data.status);
        // });
    }

    initializePeersEvents = () => {
        this.myPeer.on('open', (id) => {
            const { userDetails } = this.settings;
            this.myID = id;
            const roomID = window.location.pathname.split('/')[2];
            const userData = {
                userID: id, roomID, ...userDetails
            }
            console.log('peers established and joined room', userData);
            this.socket.emit('join-room', userData);
            this.setNavigatorToStream();
        });
        this.myPeer.on('error', (err:Error) => {
            console.log('peer connection error', err);
            this.myPeer.reconnect();
        })
    }

    setNavigatorToStream = () => {
        this.getVideoAudioStream().then((stream:MediaStream) => {
            if (stream) {
                this.streaming = true;
                this.settings.updateInstance('streaming', true);
                this.createVideo({ id: this.myID, stream });
                this.setPeersListeners(stream);
                this.newUserConnection(stream);
            }
        })
    }

    getVideoAudioStream = (video:boolean=true, audio:boolean=true) => {
        let quality = this.settings.params?.quality;
        if (quality) quality = parseInt(quality);
        // @ts-ignore
        const myNavigator = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.msGetUserMedia;
        return myNavigator({
            video: video ? {
                frameRate: quality ? quality : 12,
                noiseSuppression: true,
                width: {min: 640, ideal: 1280, max: 1920},
                height: {min: 480, ideal: 720, max: 1080}
            } : false,
            audio: audio,
        });
    }

    setPeersListeners = (stream:MediaStream) => {
        this.myPeer.on('call', (call:any) => {
            call.answer(stream);
            call.on('stream', (userVideoStream:MediaStream) => {
                this.createVideo({ id: call.metadata.id, stream: userVideoStream });
            });
            call.on('close', () => {
                console.log('closing peers listeners', call.metadata.id);
                this.removeVideo(call.metadata.id);
            });
            call.on('error', () => {
                console.log('peer error ------');
                this.removeVideo(call.metadata.id);
            });
            peers[call.metadata.id] = call;
        });
    }

    newUserConnection = (stream:MediaStream) => {
        this.socket.on('new-user-connect', (userData:any) => {
            console.log('New User Connected', userData);
            this.connectToNewUser(userData, stream);
        });
    }

    connectToNewUser(userData:any, stream:MediaStream) {
        const { userID } = userData;
        const call = this.myPeer.call(userID, stream, { metadata: { id: this.myID } });
        call.on('stream', (userVideoStream:MediaStream) => {
            this.createVideo({ id: userID, stream: userVideoStream, userData });
        });
        call.on('close', () => {
            console.log('closing new user', userID);
            this.removeVideo(userID);
        });
        call.on('error', () => {
            console.log('peer error ------')
            this.removeVideo(userID);
        })
        peers[userID] = call;
    }

    boradcastMessage = (message: Object) => {
        this.message.push(message);
        this.settings.updateInstance('message', this.message);
        this.socket.emit('broadcast-message', message);
    }

    createVideo = (createObj:CreateVideo) => {
        if (!this.videoContainer[createObj.id]) {
            this.videoContainer[createObj.id] = {
                ...createObj,
            };
            const roomContainer = document.getElementById('room-container');
            const videoContainer = document.createElement('div');
            const video = document.createElement('video');
            video.srcObject = this.videoContainer[createObj.id].stream;
            video.id = createObj.id;
            video.autoplay = true;
            if (this.myID === createObj.id) video.muted = true;
            videoContainer.appendChild(video)
            roomContainer.append(videoContainer);
        } else {
            // @ts-ignore
            document.getElementById(createObj.id)?.srcObject = createObj.stream;
        }
    }

    reInitializeStream = (video?:boolean, audio?:boolean, type:string='userMedia') => {
        // @ts-ignore
        const media = type === 'userMedia' ? this.getVideoAudioStream(video, audio) : navigator.mediaDevices.getDisplayMedia();
        return new Promise((resolve) => {
            media.then((stream:MediaStream) => {
                // @ts-ignore
                const myVideo = this.getMyVideo();
                if (type === 'displayMedia') {
                    this.toggleVideoTrack({audio, video});
                    this.listenToEndStream(stream, {video, audio});
                    this.socket.emit('display-media', true);
                }
                checkAndAddClass(myVideo, type);
                this.createVideo({ id: this.myID, stream });
                replaceStream(stream);
                resolve(true);
            });
        });
    }
    
    removeVideo = (id:string) => {
        delete this.videoContainer[id];
        const video = document.getElementById(id);
        if (video) video.remove();
    }

    destoryConnection = () => {
        const myMediaTracks = this.videoContainer[this.myID]?.stream.getTracks();
        myMediaTracks?.forEach((track:any) => {
            track.stop();
        })
        socketInstance?.socket.disconnect();
        this.myPeer.destroy();
    }

    getMyVideo = (id:string=this.myID) => {
        return document.getElementById(id);
    }

    listenToEndStream = (stream:MediaStream, status:MediaStatus) => {
        const videoTrack = stream.getVideoTracks();
        if (videoTrack[0]) {
            videoTrack[0].onended = () => {
                this.socket.emit('display-media', false);
                this.reInitializeStream(status.video, status.audio, 'userMedia');
                this.settings.updateInstance('displayStream', false);
                this.toggleVideoTrack(status);
            }
        }
    };

    toggleVideoTrack = (status:MediaStatus) => {
        const myVideo = this.getMyVideo();
        // @ts-ignore
        if (myVideo && !status.video) myVideo.srcObject?.getVideoTracks().forEach((track:any) => {
            if (track.kind === 'video') {
                // track.enabled = status.video;
                // this.socket.emit('user-video-off', {id: this.myID, status: true});
                // changeMediaView(this.myID, true);
                !status.video && track.stop();
            }
        });
        else if (myVideo) {
            // this.socket.emit('user-video-off', {id: this.myID, status: false});
            // changeMediaView(this.myID, false);
            this.reInitializeStream(status.video, status.audio);
        }
    }

    toggleAudioTrack = (status:MediaStatus) => {
        const myVideo = this.getMyVideo();
        // @ts-ignore
        if (myVideo) myVideo.srcObject?.getAudioTracks().forEach((track:any) => {
            if (track.kind === 'audio')
                track.enabled = status.audio;
                status.audio ? this.reInitializeStream(status.video, status.audio) : track.stop();
        });
    }

}

const initializePeerConnection = () => {
    return new Peer('', {
        host: peerjsEndpoint,
        secure: true
    });
}

const initializeSocketConnection = () => {
    return openSocket.connect(websocket, {
        secure: true, 
        reconnection: true, 
        rejectUnauthorized: false,
        reconnectionAttempts: 10
    });
}

const replaceStream = (mediaStream:MediaStream) => {
    Object.values(peers).map((peer:any) => {
        peer.peerConnection?.getSenders().map((sender:any) => {
            if(sender.track.kind == "audio") {
                if(mediaStream.getAudioTracks().length > 0){
                    sender.replaceTrack(mediaStream.getAudioTracks()[0]);
                }
            }
            if(sender.track.kind == "video") {
                if(mediaStream.getVideoTracks().length > 0){
                    sender.replaceTrack(mediaStream.getVideoTracks()[0]);
                }
            }
        });
    })
}

const checkAndAddClass = (video?:any, type:string='userMedia') => {
    if (video?.classList?.length === 0 && type === 'displayMedia')  
        video.classList.add('display-media');
    else 
        video.classList.remove('display-media');
}

const changeMediaView = (userID:any, status:boolean) => {
    const userVideoDOM = document.getElementById(userID) as HTMLVideoElement;
    if (status) {
        const clientPosition = userVideoDOM.getBoundingClientRect();
        const createdCanvas = document.createElement("SPAN");
        createdCanvas.className = userID;
        createdCanvas.style.position = 'absolute';
        createdCanvas.style.left = `${clientPosition.left}px`;
        createdCanvas.style.top = `${clientPosition.top}px`;
        // createdCanvas.style.width = `${userVideoDOM.videoWidth}px`;
        // createdCanvas.style.height = `${clientPosition.height}px`;
        createdCanvas.style.width = '100%';
        createdCanvas.style.height = '100%';
        createdCanvas.style.backgroundColor = 'green';
        userVideoDOM.parentElement.appendChild(createdCanvas);
    } else {
        const canvasElement = document.getElementsByClassName(userID);
        if (canvasElement[0]) canvasElement[0].remove();
    }
}

export function createSocketConnectionInstance(settings={}) {
    return socketInstance = new SocketConnection(settings);
}

interface CreateVideo {
    id: string,
    stream: MediaStream,
    userData?: any,
}

interface MediaStatus {
    video: boolean,
    audio: boolean
}

interface UserVideoToggle {
    id: string,
    status: boolean
}