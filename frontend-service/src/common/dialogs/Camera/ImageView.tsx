import { Box, Grid, IconButton, TextField } from '@mui/material';
import React, { useRef, useState } from 'react';
import { Check as CheckIcon, Close as CloseIcon, PictureAsPdf } from '@mui/icons-material';
import i18next from 'i18next';
import { Form, Formik, FormikProps } from 'formik';
import { toast } from 'react-toastify';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Cropper } from 'react-cropper';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'cropperjs/dist/cropper.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import jsPDF from 'jspdf';

interface IImageView {
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    imgURL: string;
    setImgURL: React.Dispatch<React.SetStateAction<string | null>>;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onPictureTaken: (file: File) => void;
    cameraSize: { width: number; height: number };
}

const ImageView: React.FC<IImageView> = ({ setStream, imgURL, setImgURL, setOpen, onPictureTaken, cameraSize }) => {
    const [usePdf, setUsePdf] = useState(false);
    const [imgName, setImgName] = useState<string | null>(null);
    const iconSize = '23px';
    const { width, height } = cameraSize;

    const urlToFile = async () => {
        const response = await fetch(imgURL!);
        const blob = await response.blob();
        return new File([blob], `${imgName!}.png`);
    };

    const handleUploadPng = async () => {
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

    const cropperRef = useRef<any>(null); // Reference to the cropper instance

    const handleExportToPdf = () => {
        if (!cropperRef.current) return;

        const { cropper } = cropperRef.current;
        const croppedCanvas = cropper.getCroppedCanvas();

        const croppedImageURL = croppedCanvas.toDataURL('image/png');

        // eslint-disable-next-line new-cap
        const pdf = new jsPDF();
        pdf.addImage(croppedImageURL, 'PNG', 10, 10, 190, 0);

        const pdfBlob = pdf.output('blob');

        const file = new File([pdfBlob], `${imgName}.pdf`, { type: 'application/pdf' });

        onPictureTaken(file);
        setOpen(false);
        setImgURL(null);
        setImgName(null);
    };

    const uploadImgOrPdf = async () => {
        if (usePdf) handleExportToPdf();
        else handleUploadPng();
    };

    return (
        <>
            <Grid style={{ position: 'absolute', left: '0.2rem', top: '0.2rem' }}>
                <IconButton onClick={onClose}>
                    <CloseIcon style={{ width: iconSize, height: iconSize }} />
                </IconButton>
            </Grid>
            <Box sx={{ padding: '10px' }}>
                {usePdf ? (
                    <Cropper
                        src={imgURL}
                        ref={cropperRef}
                        style={{ width, height }}
                        zoomTo={0.5}
                        initialAspectRatio={1}
                        preview=".img-preview"
                        viewMode={1}
                        minCropBoxHeight={10}
                        minCropBoxWidth={10}
                        background={false}
                        responsive
                        autoCropArea={1}
                        checkOrientation={false}
                        guides
                    />
                ) : (
                    <img src={imgURL} alt="cameraPic" style={{ width, height }} />
                )}
            </Box>
            <Formik initialValues={{ name: imgName }} onSubmit={async (value) => setImgName(value.name)}>
                {(formikProps: FormikProps<string>) => (
                    <Form style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <TextField
                            label={i18next.t('camera.imgName')}
                            value={imgName}
                            onChange={(e) => setImgName(e.target.value)}
                            variant="standard"
                            type="text"
                            sx={{ width: 260 }}
                        />
                        <IconButton disabled={!formikProps.values || !imgName} type="submit" onClick={() => uploadImgOrPdf()}>
                            <CheckIcon style={{ color: !formikProps.values || !imgName ? '#CCCFE5' : '#1E2775', width: '25px', height: '25px' }} />
                        </IconButton>
                        <IconButton onClick={() => setUsePdf(!usePdf)}>
                            <PictureAsPdf color={usePdf ? 'primary' : 'disabled'} />
                        </IconButton>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default ImageView;
