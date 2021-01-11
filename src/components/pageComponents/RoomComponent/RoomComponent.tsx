import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createSocketConnectionInstance } from '../../../services/socketConnection/socketConnection';
import FootBar from '../../resuableComponents/navbar/footbar';
import { getObjectFromUrl } from '../../../utils/helper';
import UserPopup from '../../resuableComponents/popup/userPopup';
import ChatBox from '../../resuableComponents/chatBox/ChatBox';
import { ToastContainer } from 'react-toastify';
// Icons imports
import CallIcon from '@material-ui/icons/CallEnd';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import ChatIcon from '@material-ui/icons/Chat';
import { CircularProgress } from '@material-ui/core';
import 'react-toastify/dist/ReactToastify.css';


const RoomComponent = (props: any) => {
    let socketInstance = useRef(null);
    const [micStatus, setMicStatus] = useState(true);
    const [camStatus, setCamStatus] = useState(true);
    const [streaming, setStreaming] = useState(false);
    const [chatToggle, setChatToggle] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [displayStream, setDisplayStream] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        return () => {
            socketInstance.current?.destoryConnection();
        }
    }, []);

    useEffect(() => {
        if (userDetails) startConnection();
    }, [userDetails]);

    const startConnection = () => {
        let params = getObjectFromUrl();
        if (!params) params = {quality: 12}
        socketInstance.current = createSocketConnectionInstance({
            updateInstance: updateFromInstance,
            params,
            userDetails
        });
    }

    const updateFromInstance = (key:string, value:any) => {
        if (key === 'streaming') setStreaming(value);
        if (key === 'message') setMessages([...value]);
        if (key === 'displayStream') setDisplayStream(value);
    }

    useLayoutEffect(() => {
        const appBar = document.getElementsByClassName('app-navbar');
        // @ts-ignore
        if (appBar && appBar[0]) appBar[0].style.display = 'none';
        return () => {
            // @ts-ignore
            if (appBar && appBar[0]) appBar[0].style.display = 'block';
        } 
    });

    const handleDisconnect = () => {
        socketInstance.current?.destoryConnection();
        props.history.push('/');
    }

    const handleMyMic = () => {
        const { getMyVideo, reInitializeStream } = socketInstance.current;
        const myVideo = getMyVideo();
        if (myVideo) myVideo.srcObject?.getAudioTracks().forEach((track:any) => {
            if (track.kind === 'audio')
                // track.enabled = !micStatus;
                micStatus ? track.stop() : reInitializeStream(camStatus, !micStatus);
        });
        setMicStatus(!micStatus);
    }

    const handleMyCam = () => {
        if (!displayStream) {
            const { toggleVideoTrack } = socketInstance.current;
            toggleVideoTrack({ video: !camStatus, audio: micStatus });
            setCamStatus(!camStatus);
        }
    }

    const handleuserDetails = (userDetails:any) => {
        setUserDetails(userDetails);
    }

    const chatHandle = (bool:boolean=false) => {
        setChatToggle(bool);
    }

    const toggleScreenShare = () => {
        const { reInitializeStream, toggleVideoTrack } = socketInstance.current;
        displayStream && toggleVideoTrack({video: false, audio: true});
        reInitializeStream(false, true, !displayStream ? 'displayMedia' : 'userMedia').then(() => {
            setDisplayStream(!displayStream);
            setCamStatus(false);
        });
    }

    return (
        <React.Fragment>
            {userDetails !== null && !streaming && 
                <div className="stream-loader-wrapper">
                    <CircularProgress className="stream-loader" size={24} color="primary" />
                </div>
            }
            <div id="room-container"></div>
            <FootBar className="chat-footbar">
            <div className="footbar-title">Vi CHAT</div>
                <div className="footbar-wrapper">
                    {streaming && <div className="status-action-btn mic-btn" onClick={handleMyMic} title={micStatus ? 'Disable Mic' : 'Enable Mic'}>
                        {micStatus ? 
                            <MicIcon></MicIcon>
                            :
                            <MicOffIcon></MicOffIcon>
                        }
                    </div>}
                    <div className="status-action-btn end-call-btn" onClick={handleDisconnect} title="End Call">
                        <CallIcon></CallIcon>
                    </div>
                    {streaming && <div className="status-action-btn cam-btn" onClick={handleMyCam} title={camStatus ? 'Disable Cam' : 'Enable Cam'}>
                        {camStatus ? 
                            <VideocamIcon></VideocamIcon>
                            :
                            <VideocamOffIcon></VideocamOffIcon>
                        }
                    </div>}
                </div>
                <div>
                    <div className="screen-share-btn" onClick={toggleScreenShare}>
                        <h4 className="screen-share-btn-text">{displayStream ? 'Stop Screen Share' : 'Share Screen'}</h4>
                    </div>
                    <div onClick={() => chatHandle(!chatToggle)} className="chat-btn" title="Chat">
                        <ChatIcon></ChatIcon>
                    </div>
                </div>
            </FootBar>
            <UserPopup submitHandle={handleuserDetails}></UserPopup>
            <ChatBox 
                chatToggle={chatToggle} 
                closeDrawer={() => chatHandle(false)} 
                socketInstance={socketInstance.current} 
                myDetails={userDetails} 
                messages={messages}>
            </ChatBox>
            <ToastContainer 
                autoClose={2000}
                closeOnClick
                pauseOnHover
            />
        </React.Fragment>
    )
}

export default RoomComponent;