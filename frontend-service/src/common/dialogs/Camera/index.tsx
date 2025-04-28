import { Dialog, DialogContent } from '@mui/material';
import React, { useEffect, useState } from 'react';
import CameraView from './CameraView';

interface ICameraProps {
    stream: MediaStream;
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    open: boolean;
    setImgURL: React.Dispatch<React.SetStateAction<string | null>>;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setOpenImageView: React.Dispatch<React.SetStateAction<boolean>>;
}

const Camera: React.FC<ICameraProps> = ({ stream, setStream, open, setOpen, setImgURL, setOpenImageView }) => {
    const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
    const cameraSize = { width: 1000, height: 775 };

    useEffect(() => {
        const initializeVideo = () => {
            if (!videoRef || !stream) return;
            videoRef.srcObject = stream;
        };

        if (open) {
            initializeVideo();
        }
    }, [open, stream, videoRef]);

    const onCloseCamera = async () => {
        setOpen(false);
        setOpenImageView(false);
        stream.getVideoTracks().forEach((track) => {
            track.stop();
        });
        setStream(null);
    };

    return (
        <Dialog open={open} onClose={onCloseCamera} maxWidth={false} sx={{ maxWidth: 1500, mx: 'auto' }}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <CameraView
                    videoRef={videoRef}
                    setVideoRef={setVideoRef}
                    stream={stream}
                    setStream={setStream}
                    setImgURL={setImgURL}
                    setOpenImageView={setOpenImageView}
                    cameraSize={cameraSize}
                />
            </DialogContent>
        </Dialog>
    );
};

export default Camera;
