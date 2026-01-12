import { Check as CheckIcon, Close as CloseIcon, FilterBAndW, PictureAsPdf } from '@mui/icons-material';
import { Box, Dialog, DialogContent, Grid, IconButton, TextField, useTheme } from '@mui/material';
import 'cropperjs/dist/cropper.css';
import { Form, Formik, FormikProps } from 'formik';
import i18next from 'i18next';
import jsPDF from 'jspdf';
import React, { useRef, useState } from 'react';
import { Cropper, ReactCropperElement } from 'react-cropper';
import { toast } from 'react-toastify';
import { filterImageData } from '../../../utils/filterImageData';
import urlToFile from '../../fileConversions';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';

interface IImageView {
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    imgURL: string;
    setImgURL: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenImageView: React.Dispatch<React.SetStateAction<boolean>>;
    openCamera: boolean;
    openImageView: boolean;
    setOpenCamera: React.Dispatch<React.SetStateAction<boolean>>;
    onPictureTaken: (file: File) => void;
}

const ImageView: React.FC<IImageView> = ({
    setStream,
    imgURL,
    setImgURL,
    setOpenImageView,
    openCamera,
    openImageView,
    setOpenCamera,
    onPictureTaken,
}) => {
    const theme = useTheme();

    const [usePdf, setUsePdf] = useState<boolean>(false);
    const [applyFilter, setApplyFilter] = useState<boolean>(false);
    const [imgName, setImgName] = useState<string | null>(null);

    const cropperRef = useRef<ReactCropperElement>(null);

    const handleUploadPng = async () => {
        const file = await urlToFile(imgURL, imgName!);
        onPictureTaken(file);
        setOpenImageView(false);
        setImgName(null);
        setOpenCamera(false);
    };

    const onClose = async () => {
        setImgName(null);
        setOpenImageView(false);
        if (openCamera)
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

        if (applyFilter) filterImageData(context, croppedCanvas, filteredCanvas);
        else context.drawImage(croppedCanvas, 0, 0);

        const croppedImageURL = filteredCanvas.toDataURL('image/png');

        const pdf = new jsPDF();
        pdf.addImage(croppedImageURL, 'PNG', 10, 10, 190, 0);
        const pdfBlob = pdf.output('blob');

        const file = new File([pdfBlob], `${imgName}.pdf`, { type: 'application/pdf' });
        onPictureTaken(file);

        setOpenImageView(false);
        setOpenCamera(false);
        setImgURL(null);
        setImgName(null);
    };

    const uploadImgOrPdf = () => {
        if (usePdf) handleExportToPDF();
        else handleUploadPng();
    };

    const pdfClick = () => {
        if (usePdf) {
            setUsePdf(false);
            setApplyFilter(false);
        } else setUsePdf(true);
    };

    return (
        <Dialog open={openImageView} onClose={onClose} maxWidth={false} sx={{ maxWidth: 1500, mx: 'auto' }}>
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
                <Formik<{ name: string | null }> initialValues={{ name: imgName }} onSubmit={async (value) => setImgName(value.name)}>
                    {(formikProps: FormikProps<{ name: string | null }>) => (
                        <Form style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <TextField
                                label={usePdf ? i18next.t('camera.fileName') : i18next.t('camera.imgName')}
                                value={formikProps.values.name}
                                onChange={(e) => {
                                    formikProps.setFieldValue('name', e.target.value);
                                    setImgName(e.target.value);
                                }}
                                variant="standard"
                                type="text"
                                sx={{ width: 260 }}
                            />
                            <IconButton disabled={!formikProps.values.name} type="submit" onClick={() => uploadImgOrPdf()}>
                                <CheckIcon
                                    style={{
                                        color: !formikProps.values.name ? '#CCCFE5' : theme.palette.primary.main,
                                        width: '25px',
                                        height: '25px',
                                    }}
                                />
                            </IconButton>
                            <IconButton onClick={pdfClick}>
                                <PictureAsPdf color={usePdf ? 'primary' : 'disabled'} />
                            </IconButton>
                            <MeltaTooltip title={i18next.t('camera.blackAndWhite')} placement="bottom">
                                <IconButton onClick={() => setApplyFilter(!applyFilter)} disabled={!usePdf}>
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
