import { Box, Card, CircularProgress, Grid, Skeleton, SxProps, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { environment } from '../../globals';
import { IFile } from '../../interfaces/preview';
import { VideoPreview } from './VideoPreview';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface IPreviewProps {
    data: string | undefined;
    loading: boolean;
    error: boolean;
    contentType: IFile['contentType'];
    height?: CSSProperties['maxHeight'];
    width?: CSSProperties['maxWidth'];
    sx?: SxProps;
}

const SmallPreview: React.FC<IPreviewProps> = ({
    data,
    loading,
    contentType,
    error,
    width = '100%',
    height = `${environment.smallPreviewHeight.number}${environment.smallPreviewHeight.unit}`,
    sx,
}) => {
    const shouldDisplayImage = (type: string) => ['document', 'image'].includes(type);
    const shouldDisplayVideoOrAudio = (type: string) => ['video', 'audio'].includes(type);
    const shouldDisplayDocument = (type: string) => ['pdf'].includes(type);

    const isUnsupported = (type: string) => type === 'unsupported';

    const previewContent = useMemo(() => {
        if (loading)
            return (
                <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                </Box>
            );

        if (isUnsupported(contentType) || error || !data) {
            return (
                <Card sx={{ borderRadius: '1rem', bgcolor: '#4c494c', display: 'grid', height, width }} elevation={10}>
                    <Typography variant="body1" sx={{ color: 'white', marginTop: '10px', fontSize: '20px' }}>
                        {i18next.t('errorPage.preview')}
                    </Typography>
                </Card>
            );
        }

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

        if (shouldDisplayVideoOrAudio(contentType))
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                    <VideoPreview data={data} maxHeight={height} maxWidth={width} />
                </Box>
            );

        if (shouldDisplayDocument(contentType))
            return (
                <Document file={data} onLoadError={() => null}>
                    <Document key={data} file={data} loading={null}>
                        <Page width={150} pageNumber={1} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                </Document>
            );

        return (
            <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton variant="rectangular" sx={{ borderRadius: '1rem' }} />
            </Box>
        );
    }, [loading, data]);

    return (
        <Grid container sx={{ overflowY: 'hidden', overflowX: 'hidden', fontSize: 'small' }} justifyContent="center">
            <Grid item sx={sx}>
                {previewContent}
            </Grid>
        </Grid>
    );
};

export { SmallPreview };
