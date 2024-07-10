import { Button } from '@mui/material';
import React, { useRef } from 'react';
import { Camera as CameraIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { toast } from 'react-toastify';

interface ICameraViewProps {
    videoRef: HTMLVideoElement | null;
    setVideoRef: React.Dispatch<React.SetStateAction<HTMLVideoElement | null>>;
    stream: MediaStream;
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    setImgURL: React.Dispatch<React.SetStateAction<string | null>>;
    cameraSize: { width: number; height: number };
}

const CameraView: React.FC<ICameraViewProps> = ({ videoRef, setVideoRef, stream, setStream, setImgURL, cameraSize }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { width, height } = cameraSize;

    const initializeMedia = () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error(i18next.t('camera.somethingWentWrong'));
            return;
        }

        const canvas = canvasRef.current!;
        canvas.width = videoRef!.videoWidth;
        canvas.height = videoRef!.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
            toast.error(i18next.t('camera.somethingWentWrong'));
        }

        context!.drawImage(videoRef!, 0, 0, canvas.width, canvas.height);
        stream.getVideoTracks().forEach((track) => {
            track.stop();
        });
        const dataURL = canvas.toDataURL();
        if (dataURL && dataURL !== 'data:,') {
            setImgURL(dataURL);
        } else {
            toast.error(i18next.t('camera.somethingWentWrong'));
        }
        setStream(null);
    };

    return (
        <>
            <video ref={(ref) => setVideoRef(ref)} autoPlay muted style={{ padding: '10px', width, height }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Button
                sx={{ borderRadius: '7px', width: '135px', mx: 'auto' }}
                variant="contained"
                onClick={initializeMedia}
                disabled={!videoRef}
                startIcon={<CameraIcon />}
            >
                {i18next.t('camera.takePicture')}
            </Button>
        </>
    );
};

export default CameraView;
