import { Dialog, DialogContent, Grid, IconButton } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { Camera as CameraIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

const VideoPlayer: React.FC<{ stream: MediaStream; open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }> = ({
    stream,
    open,
    setOpen,
}) => {
    console.log({ stream });

    const videoRef = useRef<HTMLVideoElement>(null);

    let state: { imageDataURL: string | null } = { imageDataURL: null };

    useEffect(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
    }, [stream]);

    const initializeMedia = async () => {
        state = { imageDataURL: null };

        if (!('mediaDevices' in navigator)) {
            navigator.mediaDevices = {};
        }

        if (!('getUserMedia' in navigator.mediaDevices)) {
            navigator.mediaDevices.getUserMedia = (constraints) => {
                const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia Not Implemented'));
                }

                return new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            };
        }

        const canvas = document.createElement('canvas');
        canvas.width = player.videoWidth;
        canvas.height = player.videoHeight;
        const contex = canvas.getContext('2d');
        contex!.drawImage(player, 0, 0, canvas.width, canvas.height);
        player.srcObject.getVideoTracks().forEach((track) => {
            track.stop();
        });

        console.log(canvas.toDataURL());
        state = { imageDataURL: canvas.toDataURL() };
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {state.imageDataURL ? (
                    <>
                        <img src={state.imageDataURL} alt="cameraPic" style={{ padding: '10px' }} />
                        <Grid sx={{ display: 'flex', padding: '5px', justifyContent: 'space-between' }}>
                            <IconButton sx={{ mx: 'auto' }}>
                                <CheckIcon style={{ color: '#8D8D8E', width: '35px', height: '35px' }} />
                            </IconButton>
                            <IconButton sx={{ mx: 'auto' }}>
                                <CloseIcon style={{ color: '#8D8D8E', width: '35px', height: '35px' }} />
                            </IconButton>
                        </Grid>
                    </>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay muted style={{ padding: '10px' }}>
                            <track kind="captions" src="" />
                        </video>
                        <IconButton sx={{ mx: 'auto' }} onClick={initializeMedia}>
                            <CameraIcon style={{ color: '#8D8D8E', width: '35px', height: '35px' }} />
                        </IconButton>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VideoPlayer;
