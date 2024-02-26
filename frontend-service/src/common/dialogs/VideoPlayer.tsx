import { Button, Dialog, DialogContent, Grid, IconButton, TextField } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { Form, Formik, FormikProps } from 'formik';

const VideoPlayer: React.FC<{
    stream: MediaStream;
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onPictureTaken: (file: File) => void;
}> = ({ stream, setStream, open, setOpen, onPictureTaken }) => {
    const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [imgURL, setImgURL] = useState<string | null>(null);
    const [imgName, setImgName] = useState<string | null>(null);

    useEffect(() => {
        const initializeVideo = () => {
            if (!videoRef || !stream) return;

            videoRef.srcObject = stream;
        };

        if (open) {
            initializeVideo();
        }
    }, [open, stream, videoRef]);

    const urlToFile = async () => {
        const response = await fetch(imgURL!);
        const blob = await response.blob();
        return new File([blob], `${imgName!}.png`);
    };

    const uploadImg = async () => {
        const file = await urlToFile();
        onPictureTaken(file);
        setOpen(false);
        setImgURL(null);
        setImgName(null);
    };

    const initializeMedia = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast(i18next.t('camera.somethingWentWrong'));
            return;
        }

        const canvas = canvasRef.current!;
        canvas.width = videoRef!.videoWidth;
        canvas.height = videoRef!.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
            toast(i18next.t('camera.somethingWentWrong'));
        }

        context!.drawImage(videoRef!, 0, 0, canvas.width, canvas.height);
        stream.getVideoTracks().forEach((track) => {
            track.stop();
        });

        const dataURL = canvas.toDataURL();
        if (dataURL && dataURL !== 'data:,') {
            setImgURL(dataURL);
        } else {
            toast(i18next.t('camera.somethingWentWrong'));
        }
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false} sx={{ maxWidth: 1500, mx: 'auto' }}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {imgURL ? (
                    <>
                        <Grid style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton
                                onClick={() => {
                                    setImgURL(null);
                                    setImgName(null);
                                    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((userStream) => {
                                        setStream(userStream);
                                    });
                                }}
                            >
                                <CloseIcon style={{ width: '23px', height: '23px' }} />
                            </IconButton>
                        </Grid>
                        <img src={imgURL} alt="cameraPic" style={{ paddingLeft: '10px', paddingRight: '10px', width: 1000, height: 775 }} />
                        <Formik initialValues={{ name: imgName }} onSubmit={async (value) => setImgName(value.name)}>
                            {(formikProps: FormikProps<string>) => (
                                <Form style={{ display: 'flex', justifyContent: 'center' }}>
                                    <TextField
                                        label={i18next.t('camera.imgName')}
                                        value={imgName}
                                        onChange={(e) => setImgName(e.target.value)}
                                        variant="standard"
                                        type="text"
                                        sx={{ width: 260 }}
                                    />
                                    <IconButton disabled={!formikProps.values || !imgName} type="submit" onClick={() => uploadImg()}>
                                        <CheckIcon
                                            style={{ color: !formikProps.values || !imgName ? '#CCCFE5' : '#1E2775', width: '25px', height: '25px' }}
                                        />
                                    </IconButton>
                                </Form>
                            )}
                        </Formik>
                    </>
                ) : (
                    <>
                        <video ref={(ref) => setVideoRef(ref)} autoPlay muted style={{ padding: '10px', width: 1000, height: 775 }} />
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
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VideoPlayer;
