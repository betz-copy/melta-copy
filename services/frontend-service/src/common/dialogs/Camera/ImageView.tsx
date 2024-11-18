import { Grid, IconButton, TextField } from '@mui/material';
import React, { useState } from 'react';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { Form, Formik, FormikProps } from 'formik';
import { toast } from 'react-toastify';

interface IImageView {
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    imgURL: string;
    setImgURL: React.Dispatch<React.SetStateAction<string | null>>;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onPictureTaken: (file: File) => void;
    cameraSize: { width: number; height: number };
}

const ImageView: React.FC<IImageView> = ({ setStream, imgURL, setImgURL, setOpen, onPictureTaken, cameraSize }) => {
    const [imgName, setImgName] = useState<string | null>(null);
    const iconSize = '23px';
    const { width, height } = cameraSize;

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

    const onClose = async () => {
        setImgURL(null);
        setImgName(null);
        try {
            const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(userStream);
        } catch {
            toast.error(i18next.t('camera.cameraNotFound'));
        }
    };

    return (
        <>
            <Grid style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton onClick={onClose}>
                    <CloseIcon style={{ width: iconSize, height: iconSize }} />
                </IconButton>
            </Grid>
            <img src={imgURL} alt="cameraPic" style={{ paddingLeft: '10px', paddingRight: '10px', width, height }} />
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
                            <CheckIcon style={{ color: !formikProps.values || !imgName ? '#CCCFE5' : '#1E2775', width: '25px', height: '25px' }} />
                        </IconButton>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default ImageView;
