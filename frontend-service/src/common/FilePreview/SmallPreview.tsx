import { Card, Grid, Skeleton, SxProps, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { getPreviewContentType } from '../../utils/getFileType';
import { VideoPreview } from './VideoPreview';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface IPreviewProps {
    fileId: string;
    data: string | undefined;
    loading: boolean;
    error: boolean;
    fileName: string;
    maxHeight?: string;
    maxWidth?: string;
    sx?: SxProps;
}

const SmallPreview: React.FC<IPreviewProps> = ({ fileId, data, loading, fileName, error, maxWidth = '100%', maxHeight = '20vh', sx }) => {
    const displayImage = (type: string) => ['image', 'document'].includes(type);
    const displayVideoOrAudio = (type: string) => ['video', 'audio'].includes(type);
    const isUnsupported = (type: string) => type === 'unsupported';

    const contentType = getPreviewContentType(fileName);

    if (!fileId) return null;

    const previewContent = useMemo(() => {
        if (loading || !data)
            return (
                <div style={{ width: maxWidth, height: maxHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Skeleton variant="rectangular" sx={{ borderRadius: '1rem' }} />
                </div>
            );

        if (displayImage(contentType))
            return (
                <div style={{ maxHeight, display: 'flex', alignItems: 'center', alignContent: 'center' }}>
                    <img
                        src={data}
                        style={{
                            position: 'relative',
                            right: '50%',
                            transform: 'translate(50%)',
                            maxHeight,
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: '1rem',
                        }}
                    />
                </div>
            );

        if (displayVideoOrAudio(contentType)) return <VideoPreview data={data} maxHeight={maxHeight} maxWidth={'8.1vw'} />;

        if (isUnsupported(contentType) || error) {
            return (
                <Card
                    sx={{
                        borderRadius: '1rem',
                        bgcolor: '#4c494c',
                        display: 'grid',
                        height: maxHeight,
                        width: maxWidth,
                    }}
                    elevation={10}
                >
                    <Typography variant="body1" style={{ color: 'white', marginTop: '10px', fontSize: '20px' }}>
                        {i18next.t('errorPage.preview')}
                    </Typography>
                </Card>
            );
        }

        return (
            <div style={{ width: maxWidth, height: maxHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton variant="rectangular" sx={{ borderRadius: '1rem' }} />
            </div>
        );
    }, [loading, data]);

    return (
        <Grid container sx={{ overflowY: 'hidden', overflowX: 'hidden' }} justifyContent="center">
            <Grid item sx={sx}>
                {previewContent}
            </Grid>
        </Grid>
    );
};

export { SmallPreview };
