import { Button, Dialog, DialogContent, Grid, IconButton, TextField } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, Check as CheckIcon, Close as CloseIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
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
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [imgURL, setImgURL] = useState<string | null>(null);
    const [imgName, setImgName] = useState<string | null>(null);
    const [streamKey, setStreamKey] = useState(false);

    useEffect(() => {
        const initializeVideo = () => {
            if (!videoRef.current || !stream) return;

            videoRef.current.srcObject = stream;
            canvasRef.current!.width = videoRef.current.videoWidth;
            canvasRef.current!.height = videoRef.current.videoHeight;
        };

        if (open) {
            initializeVideo();
        }
    }, [open, stream, streamKey]);

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

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((userStream) => {
            setStream(userStream);
        });
    }, [setStream, streamKey]);

    const initializeMedia = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast(i18next.t('camera.somethingWentWrong'));
            return;
        }

        const canvas = canvasRef.current!;
        canvas.width = videoRef.current!.videoWidth;
        canvas.height = videoRef.current!.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
            toast(i18next.t('camera.somethingWentWrong'));
        }

        context!.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
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
                                }}
                            >
                                <CloseIcon style={{ width: '23px', height: '23px' }} />
                            </IconButton>
                        </Grid>
                        <img src={imgURL} alt="cameraPic" style={{ padding: '10px', width: 1000, height: 710 }} />
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
                                        <CheckIcon style={{ color: '#1E2775', width: '25px', height: '25px' }} />
                                    </IconButton>
                                </Form>
                            )}
                        </Formik>
                    </>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay muted style={{ padding: '10px', width: 1000, height: 725 }} />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="space-between" padding="25px 15px 0px 15px">
                            <Grid item>
                                <Button
                                    style={{ borderRadius: '7px' }}
                                    onClick={() => setStreamKey((prevKey) => !prevKey)}
                                    variant="outlined"
                                    startIcon={<PlayIcon />}
                                >
                                    {i18next.t('camera.startVideo')}
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    style={{ borderRadius: '7px' }}
                                    variant="contained"
                                    onClick={initializeMedia}
                                    disabled={!videoRef.current}
                                    startIcon={<CameraIcon />}
                                >
                                    {i18next.t('camera.takePicture')}
                                </Button>
                            </Grid>
                        </Grid>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VideoPlayer;
