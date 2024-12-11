/* eslint-disable new-cap */
/* eslint-disable import/no-extraneous-dependencies */
import { Box, Dialog, DialogContent, Grid, IconButton, TextField } from '@mui/material';
import React, { useRef, useState } from 'react';
import { Check as CheckIcon, Close as CloseIcon, PictureAsPdf, FilterBAndW } from '@mui/icons-material';
import i18next from 'i18next';
import { Form, Formik, FormikProps } from 'formik';
import { toast } from 'react-toastify';
import { Cropper } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import jsPDF from 'jspdf';
import { MeltaTooltip } from '../../MeltaTooltip';

interface IImageView {
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    imgURL: string;
    setImgURL: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenImageView: React.Dispatch<React.SetStateAction<boolean>>;
    openImageView: boolean;
    onPictureTaken: (file: File) => void;
}

const ImageView: React.FC<IImageView> = ({ setStream, imgURL, setImgURL, setOpenImageView, openImageView, onPictureTaken }) => {
    const [usePdf, setUsePdf] = useState(false);
    const [applyFilter, setApplyFilter] = useState(false);
    const [imgName, setImgName] = useState<string | null>(null);

    const cropperRef = useRef<any>(null);

    const urlToFile = async () => {
        const response = await fetch(imgURL!);
        const blob = await response.blob();
        return new File([blob], `${imgName!}.png`);
    };

    const handleUploadPng = async () => {
        const file = await urlToFile();
        onPictureTaken(file);
        setOpenImageView(false);
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

    const handleExportToPDF = () => {
        if (!cropperRef.current) return;

        const { cropper } = cropperRef.current;
        const croppedCanvas = cropper.getCroppedCanvas();

        if (!croppedCanvas) return;

        const filteredCanvas = document.createElement('canvas');
        filteredCanvas.width = croppedCanvas.width;
        filteredCanvas.height = croppedCanvas.height;

        const context = filteredCanvas.getContext('2d');
        if (!context) return;

        if (applyFilter) {
            context.filter = 'grayscale(100%) contrast(150%) brightness(120%)';
            context.drawImage(croppedCanvas, 0, 0);

            const imageData = context.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
            const { data } = imageData;

            for (let i = 0; i < data.length; i += 4) {
                // Calculate the brightness of the pixel (using the average of RGB values)
                const brightness = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

                // Threshold: If brightness is above the threshold, make it white, otherwise black
                const threshold = 150;
                const color = brightness > threshold ? 255 : 0;

                // Set the new pixel color (RGB)
                data[i] = color; // Red
                data[i + 1] = color; // Green
                data[i + 2] = color; // Blue
            }

            context.putImageData(imageData, 0, 0);
        } else {
            context.drawImage(croppedCanvas, 0, 0);
        }

        const croppedImageURL = filteredCanvas.toDataURL('image/png');

        const pdf = new jsPDF();
        pdf.addImage(croppedImageURL, 'PNG', 10, 10, 190, 0);
        const pdfBlob = pdf.output('blob');

        const file = new File([pdfBlob], `${imgName}.pdf`, { type: 'application/pdf' });
        onPictureTaken(file);

        setOpenImageView(false);
        setImgURL(null);
        setImgName(null);
    };

    const uploadImgOrPdf = async () => {
        if (usePdf) handleExportToPDF();
        else handleUploadPng();
    };

    const onCloseImageView = async () => {
        setOpenImageView(false);
        setStream(null);
    };

    return (
        <Dialog open={openImageView} onClose={onCloseImageView} maxWidth={false} sx={{ maxWidth: 1500, mx: 'auto' }}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Grid style={{ position: 'absolute', left: '0.2rem', top: '0.2rem' }}>
                    <IconButton onClick={onClose}>
                        <CloseIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    </IconButton>
                </Grid>
                <Box sx={{ padding: '10px' }}>
                    {usePdf ? (
                        <Cropper
                            src={imgURL}
                            ref={cropperRef}
                            style={{ width: 1000, height: 775 }}
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
                        <img src={imgURL} alt="cameraPic" style={{ width: 1000, height: 775 }} />
                    )}
                </Box>
                <Formik initialValues={{ name: imgName }} onSubmit={async (value) => setImgName(value.name)}>
                    {(formikProps: FormikProps<string>) => (
                        <Form style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <TextField
                                label={usePdf ? i18next.t('camera.fileName') : i18next.t('camera.imgName')}
                                value={imgName}
                                onChange={(e) => setImgName(e.target.value)}
                                variant="standard"
                                type="text"
                                sx={{ width: 260 }}
                            />
                            <IconButton disabled={!formikProps.values || !imgName} type="submit" onClick={() => uploadImgOrPdf()}>
                                <CheckIcon
                                    style={{ color: !formikProps.values || !imgName ? '#CCCFE5' : '#1E2775', width: '25px', height: '25px' }}
                                />
                            </IconButton>
                            <IconButton onClick={() => setUsePdf(!usePdf)}>
                                <PictureAsPdf color={usePdf ? 'primary' : 'disabled'} />
                            </IconButton>
                            <MeltaTooltip title="שחור לבן" placement="bottom">
                                <IconButton onClick={() => setApplyFilter(!applyFilter)}>
                                    <FilterBAndW color={applyFilter ? 'primary' : 'disabled'} />
                                </IconButton>
                            </MeltaTooltip>
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
};

export default ImageView;
