import { Camera as CameraIcon } from '@mui/icons-material';
import { Button } from '@mui/material';
import i18next from 'i18next';
import React, { useRef } from 'react';
import { toast } from 'react-toastify';

interface ICameraViewProps {
    videoRef: HTMLVideoElement | null;
    setVideoRef: React.Dispatch<React.SetStateAction<HTMLVideoElement | null>>;
    stream: MediaStream;
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    setImgURL: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenImageView: React.Dispatch<React.SetStateAction<boolean>>;
    cameraSize: { width: number; height: number };
}

const CameraView: React.FC<ICameraViewProps> = ({ videoRef, setVideoRef, stream, setStream, setImgURL, setOpenImageView, cameraSize }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { width, height } = cameraSize;

    const takePicture = () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !videoRef || !canvasRef.current || !stream) {
            toast.error(i18next.t('camera.somethingWentWrong'));
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        context?.scale(pixelRatio, pixelRatio);

        context?.drawImage(videoRef, 0, 0, width, height);

        const dataURL = canvas.toDataURL('image/png');
        if (dataURL && dataURL !== 'data:,') {
            setImgURL(dataURL);
        } else {
            toast.error(i18next.t('camera.somethingWentWrong'));
        }

        stream.getVideoTracks().forEach((track) => track.stop());
        setStream(null);
        setOpenImageView(true);
    };

    return (
        <>
            <video ref={(ref) => setVideoRef(ref)} autoPlay muted style={{ padding: '10px', width: 1000, height: 775 }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Button
                variant="contained"
                sx={{ borderRadius: '7px', width: '135px', mx: 'auto' }}
                onClick={takePicture}
                disabled={!videoRef || !stream}
                startIcon={<CameraIcon />}
            >
                {i18next.t('camera.takePicture')}
            </Button>
        </>
    );
};

export default CameraView;
