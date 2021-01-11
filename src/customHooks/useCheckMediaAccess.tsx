import { useState } from "react";

function useCheckMediaAccess() {
    const [access, setAccess] = useState(false);

    navigator.mediaDevices.enumerateDevices().then(devices => {
        let audio = false, video = false;
        devices.forEach(device => {
            if (device.kind === 'audioinput' && device.deviceId) audio = true;
            if (device.kind === 'videoinput' && device.deviceId) video = true;
        });
        if (audio && video) {
            setAccess(true);
            return;
        }
        if (!audio) getMedia('audio').then(() => {audio = true; if(audio && video) setAccess(true)});
        if (!video) getMedia('video').then(() => {video = true; if(audio && video) setAccess(true)});
    });

    const getMedia = (mediaType='') => {
        return new Promise((resolve, reject) => {
            navigator.getUserMedia({[mediaType]: true}, 
                (stream:MediaStream) => {
                    stream.getTracks().map((track) => {
                        track.stop();
                    });
                    resolve(true);
                    console.log(mediaType, ' access granted');
                }, 
                (err) => {
                    reject();
                    console.log('Error', err);
                });
        })
    }

    return access;
}

export default useCheckMediaAccess;