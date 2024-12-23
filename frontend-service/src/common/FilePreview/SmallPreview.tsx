import { Box, ButtonBase, Card, CircularProgress, Grid, Skeleton, SxProps, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IFile } from '../../interfaces/preview';
import { VideoPreview } from './VideoPreview';
import { useFilePreview } from '../../utils/hooks/useFilePreview';
import { PreviewDialog } from './PreviewDialog';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface IPreviewProps {
    file: IFile;
    height?: CSSProperties['maxHeight'];
    width?: CSSProperties['maxWidth'];
    sx?: SxProps;
}
const shouldDisplayImage = (type: string) => ['image'].includes(type);
const shouldDisplayVideoOrAudio = (type: string) => ['video', 'audio'].includes(type);
const shouldDisplayDocument = (type: string) => ['document', 'pdf'].includes(type);
const isUnsupported = (type: string) => type === 'unsupported';

const SmallPreview: React.FC<IPreviewProps> = ({ file, width = '100%', height, sx }) => {
    const [noSuchKeyError, setNoSuchKeyError] = useState<boolean>(true);
    const { data, isLoading: loading, isError: error } = useFilePreview(file.id, file.contentType, setNoSuchKeyError);
    const { contentType } = file;

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const previewContent = useMemo(() => {
        if (loading)
            return (
                <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                </Box>
            );
        if (error || !data) {
            return (
                <Card sx={{ height, width }} elevation={10}>
                    <Typography
                        style={{
                            fontSize: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                        }}
                    >
                        {noSuchKeyError ? i18next.t('entitiesCardView.previewRefetch') : i18next.t('errorPage.previewLoadingError')}

                        {!noSuchKeyError ? null : <RefreshIcon />}
                    </Typography>
                </Card>
            );
        }
        if (isUnsupported(contentType))
            return (
                <Card sx={{ bgcolor: '#4c494c', display: 'grid', height, width }} elevation={10}>
                    <Typography
                        variant="body1"
                        sx={{
                            padding: '0px 10px 0px 10px',
                            color: 'white',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {i18next.t('errorPage.preview')}
                    </Typography>
                </Card>
            );

        if (shouldDisplayVideoOrAudio(contentType))
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                    <VideoPreview data={data} maxHeight={height} maxWidth={width} />
                </Box>
            );
        if (shouldDisplayImage(contentType))
            return (
                <Box sx={{ maxHeight: height, display: 'flex', alignItems: 'center', alignContent: 'center' }}>
                    <img
                        src={data}
                        style={{
                            position: 'relative',
                            right: '50%',
                            transform: 'translate(50%)',
                            maxHeight: height,
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: '1rem',
                        }}
                    />
                </Box>
            );
        if (shouldDisplayDocument(contentType))
            return (
                <Document file={data} onLoadError={() => null}>
                    <Page width={150} pageNumber={1} renderTextLayer={false} renderAnnotationLayer={false} />
                </Document>
            );

        return (
            <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton variant="rectangular" sx={{ borderRadius: '1rem' }} />
            </Box>
        );
    }, [loading, data]);

    return (
        <Grid container sx={{ height: '100%', overflowY: 'hidden', overflowX: 'hidden', fontSize: 'small' }} justifyContent="center">
            <Grid item sx={sx}>
                <ButtonBase
                    sx={{
                        height,
                        width,
                    }}
                    onClick={() => setIsOpen(true)}
                >
                    {previewContent}
                </ButtonBase>

                {isOpen && <PreviewDialog fileName={file.name} fileId={file.id} contentType={contentType} open={isOpen} setOpen={setIsOpen} />}
            </Grid>
        </Grid>
    );
};

export { SmallPreview };
