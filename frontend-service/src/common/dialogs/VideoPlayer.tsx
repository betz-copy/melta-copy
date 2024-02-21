import { Button, Dialog, DialogContent, Grid, IconButton } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, Check as CheckIcon, Close as CloseIcon, Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { Form, Formik, FormikProps } from 'formik';
import Yup from "yup";

const VideoPlayer: React.FC<{
    stream: MediaStream;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ stream, open, setOpen }) => {
    console.log({ stream });

    const videoRef = useRef<HTMLVideoElement>(null);

    // const [state, setState] = useState<{
    //     imageDataURL: string | null;
    // }>({ imageDataURL: null });

    const [imageDataURL, setImageDataURL] = useState<string | null>(null);
    const [imgName, setImgName] = useState<string | null>(null);

    useEffect(() => {
        // if (videoRef.current) videoRef.current.srcObject = stream;
        // if (stream.active === false) {
        //     toast(i18next.t('camera.somethingWentWrong'));
        //     setOpen(false);
        // } // ISN'T DOING ANYTHING
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const initializeMedia = async () => {
        // setState({ imageDataURL: null });

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast(i18next.t('camera.somethingWentWrong'));
            return;
        }

        // if (!('mediaDevices' in navigator)) {
        //     navigator.mediaDevices = {};
        // }

        // if (!('getUserMedia' in navigator.mediaDevices)) {
        //     navigator.mediaDevices.getUserMedia = (constraints) => {
        //         const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        //         if (!getUserMedia) {
        //             return Promise.reject(new Error('getUserMedia Not Implemented'));
        //         }

        //         return new Promise((resolve, reject) => {
        //             getUserMedia.call(navigator, constraints, resolve, reject);
        //         });
        //     };
        // }
        console.log('hi im here!');

        const canvas = document.createElement('canvas');
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

        // console.log('canvas.toDataURL()', canvas.toDataURL());
        // if (canvas.toDataURL() && canvas.toDataURL() !== 'data:,') {
        //     setState({ imageDataURL: canvas.toDataURL() });
        // }
        const dataURL = canvas.toDataURL();
        console.log({ dataURL });

        if (dataURL && dataURL !== 'data:,') {
            setImageDataURL(dataURL);
        } else {
            toast(i18next.t('camera.somethingWentWrong'));
            // setState({ imageDataURL: null });
        }
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false} sx={{ maxWidth: imgName? 1500 : 500, mx: 'auto' }}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {imgName? (
                         <Formik
                         initialValues={{name: imgName}}
                         onSubmit={async (value) => setImgName(value.name)}
                       >
                         {(formikProps: FormikProps<string>) => (
                           <Form>
                                 <Grid
                                            container
                                            flexDirection="row"
                                            flexWrap="nowrap"
                                            justifyContent="space-between"
                                            padding="25px 15px 0px 15px"
                                        >
                                            <Grid item>
                                                <Button
                                                    style={{ borderRadius: '7px' }}
                                                    variant="outlined"
                                                    startIcon={<ClearIcon />}
                                                    onClick={() => setImgName(null)}
                                                >
                                                    {i18next.t('entityPage.cancel')}
                                                </Button>
                                            </Grid>
                                            <Grid item>
                                                <Button
                                                    style={{ borderRadius: '7px' }}
                                                    type="submit"
                                                    variant="contained"
                                                    startIcon={
                                                        // isUpdateLoading || isCreateLoading ? (
                                                        //     <CircularProgress sx={{ color: 'white' }} size={20} />
                                                        // ) : (
                                                            <DoneIcon />
                                                        // )
                                                    }
                                                    disabled={!formikProps.values}
                                                >
                                                    {i18next.t('entityPage.save')}
                                                </Button>
                                            </Grid>
                                        </Grid>
                           </Form>
                         )}
                       </Formik>
                ):(
                {imageDataURL ? (
                    <>
                        <img src={imageDataURL} alt="cameraPic" style={{ padding: '10px', width: 1000, height: 750 }} />
                        <Grid sx={{ display: 'flex', padding: '5px', justifyContent: 'space-between' }}>
                            <IconButton sx={{ mx: 'auto' }}>
                                <CheckIcon style={{ color: '#3CB371', width: '35px', height: '35px' }} />
                            </IconButton>
                            <IconButton sx={{ mx: 'auto' }} onClick={() => setImageDataURL(null)}>
                                <CloseIcon style={{ color: '#D22B2B', width: '35px', height: '35px' }} />
                            </IconButton>
                        </Grid>
                    </>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay muted style={{ padding: '10px', width: 1000, height: 750 }}>
                            <track kind="captions" src="" />
                        </video>
                        <IconButton sx={{ mx: 'auto' }} onClick={initializeMedia}>
                            <CameraIcon style={{ color: '#1E2775', width: '35px', height: '35px' }} />
                        </IconButton>
                    </>
                )}
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VideoPlayer;
