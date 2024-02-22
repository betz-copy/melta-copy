import { CircularProgress, Dialog, DialogContent, Grid, IconButton, TextField } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { Form, Formik, FormikProps } from 'formik';

const VideoPlayer: React.FC<{
    stream: MediaStream;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onPictureTaken: (file: File) => void;
}> = ({ stream, open, setOpen, onPictureTaken }) => {
    console.log({ stream });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    console.log({ videoRef });

    const [imageURL, setImageURL] = useState<string | null>(null);
    const [imgName, setImgName] = useState<string | null>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const urlToFile = async () => {
        const response = await fetch(imageURL!);
        const blob = await response.blob();
        return new File([blob], `${imgName!}.png`);
    };

    const uploadImg = async () => {
        const file = await urlToFile();
        onPictureTaken(file);
        setOpen(false);
        setImageURL(null);
        setImgName(null);
    };

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
            setImageURL(dataURL);
        } else {
            toast(i18next.t('camera.somethingWentWrong'));
        }
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false} sx={{ maxWidth: 1500, mx: 'auto' }}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {imageURL ? (
                    <>
                        <Grid style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton onClick={() => setImageURL(null)}>
                                <CloseIcon style={{ width: '23px', height: '23px' }} />
                            </IconButton>
                        </Grid>
                        <img src={imageURL} alt="cameraPic" style={{ padding: '10px', width: 1000, height: 710 }} />
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
                        <video ref={videoRef} autoPlay muted style={{ padding: '10px', width: 1000, height: 725 }}>
                            {videoRef.current && videoRef.current.currentTime !== 0 && videoRef.current.networkState !== 0 ? (
                                <track kind="captions" src="" />
                            ) : (
                                <CircularProgress sx={{ color: '#CCCFE5', mx: 'auto', mb: '10px' }} size={35} />
                            )}
                        </video>

                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <IconButton sx={{ mx: 'auto' }} onClick={initializeMedia} disabled={!videoRef.current}>
                            <CameraIcon style={{ color: '#1E2775', width: '35px', height: '35px' }} />
                        </IconButton>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VideoPlayer;
