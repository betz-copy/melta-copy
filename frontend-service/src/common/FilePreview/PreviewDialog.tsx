import { Close as CloseIcon, Refresh, ZoomIn, ZoomOut } from '@mui/icons-material';
import { Button, Card, CircularProgress, Dialog, DialogContent, Grid, IconButton, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ReactPlayer from 'react-player';
import { useDarkModeStore } from '../../stores/darkMode';
import { getFileExtension } from '../../utils/getFileType';
import { useFilePreview } from '../../utils/hooks/useFilePreview';
import { DownloadButton } from '../DownloadButton';
import FlexBox from '../FlexBox';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

type PreviewProps = {
    open: boolean;
    fileId: string | File;
    setOpen: (value: boolean) => void;
    fileName: string;
    contentType: 'image' | 'video' | 'audio' | 'unsupported' | 'pdf' | 'document';
};

const PreviewDialog: React.FC<PreviewProps> = ({ fileId, contentType, open, setOpen, fileName }) => {
    const [noSuchKeyError, setNoSuchKeyError] = useState<boolean>(true);
    const { data, refetch, isLoading: loading, isError: error } = useFilePreview(fileId, contentType, setNoSuchKeyError);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const [numOfPages, setNumOfPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpToPage, setJumpToPage] = useState('1');
    const [zoomLevel, setZoomLevel] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentPageRef = useRef(currentPage);
    const extension = getFileExtension(fileName);
    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumOfPages(numPages);
    };

    const handleZoomIn = () => {
        setZoomLevel((prevZoom) => Math.min(prevZoom + 0.1, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
    };

    const [isFetching, setIsFetching] = useState(false);

    const handleRefetch = () => {
        setIsFetching(true);
        refetch();

        setTimeout(() => {
            setIsFetching(false);
        }, 5000);
    };

    useEffect(() => {
        const handleScroll = async () => {
            if (containerRef.current) {
                const pageHeight = containerRef.current.scrollHeight / numOfPages;
                const scrolledPage = Math.floor(containerRef.current.scrollTop / pageHeight) + 1;
                currentPageRef.current = scrolledPage;
                setJumpToPage(scrolledPage.toString());
            }
        };

        const container = containerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [numOfPages]);

    useEffect(() => {
        if (open) {
            setCurrentPage(1);
            setJumpToPage('1');
            currentPageRef.current = 1;
        }
        setNumOfPages(0);
    }, [open]);

    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    if (!fileId) return null;

    const handleJumpToPage = async () => {
        const pageNumber = parseInt(jumpToPage, 10);
        if (pageNumber >= 1 && pageNumber <= numOfPages) {
            const container = containerRef.current;
            if (container) {
                const pageHeight = container.scrollHeight / numOfPages;
                container.scrollTop = (pageNumber - 1) * pageHeight;
            }
            currentPageRef.current = pageNumber;
            setCurrentPage(pageNumber);
        }
    };

    const handleEnterKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleJumpToPage();
        }
    };

    let previewContent: React.ReactNode;
    if (contentType === 'image') {
        previewContent = (
            <div style={{ overflow: 'auto', height: '95vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img
                    src={data}
                    onLoad={(event) => {
                        const img = event.target as HTMLImageElement;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        const containerHeight = window.innerHeight * 0.95;
                        const containerWidth = containerHeight * aspectRatio;

                        if (containerWidth > window.innerWidth) {
                            img.style.width = '100%';
                            img.style.height = 'auto';
                        } else {
                            img.style.height = '95vh';
                            img.style.width = 'auto';
                        }
                    }}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '95vh',
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        backgroundColor: 'white',
                    }}
                />
            </div>
        );
    } else if (contentType === 'video' || contentType === 'audio') {
        previewContent = <ReactPlayer style={{ marginTop: '65px' }} src={data} controls playing />;
    } else if (contentType === 'unsupported' || fileId instanceof File) {
        previewContent = (
            <Card sx={{ borderRadius: 2, bgcolor: '#4c494c', display: 'grid', height: 150, padding: 3 }} elevation={10}>
                <Typography variant="body1" style={{ color: 'white', marginTop: '10px', fontSize: '20px' }}>
                    {i18next.t('errorPage.preview')}
                </Typography>
                <Button>
                    <DownloadButton fileId={fileId} />
                </Button>
            </Card>
        );
    } else if (error) {
        previewContent = (
            <Grid sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography
                    style={{
                        color: 'white',
                        fontSize: '20px',
                    }}
                >
                    {noSuchKeyError ? i18next.t('entityPage.previewRefetch') : i18next.t('errorPage.previewLoadingError')}
                </Typography>
                <Button onClick={handleRefetch} sx={{ color: 'white' }}>
                    {isFetching || !noSuchKeyError ? null : <Refresh />}
                </Button>
            </Grid>
        );
    } else if (loading || !data) {
        previewContent = <CircularProgress />;
    } else {
        previewContent = (
            <Document file={data} onLoadSuccess={onLoadSuccess} onLoadError={() => null}>
                <FlexBox direction="column" gap={5}>
                    {Array.from({ length: numOfPages }, (_, i) => (
                        <div key={`page-${i + 1}`} style={{ marginBottom: '20px', background: 'white', position: 'relative' }}>
                            <Page width={950 * zoomLevel} pageNumber={i + 1} renderAnnotationLayer renderTextLayer />
                        </div>
                    ))}
                </FlexBox>
            </Document>
        );
    }

    return (
        <Dialog
            open={open}
            maxWidth="lg"
            fullScreen
            slotProps={{ paper: { sx: { bgcolor: darkMode ? 'rgba(20,20,20,0.7)' : 'rgba(49,49,49,0.7)' } } }}
            disableEnforceFocus
            onClick={(e) => e.stopPropagation()}
        >
            <DialogContent sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
                <FlexBox
                    direction="row"
                    sx={{ paddingBottom: '10px', justifyContent: 'space-between', position: 'sticky', top: 5, left: 10, zIndex: 1, gap: '10px' }}
                >
                    <FlexBox
                        direction="row"
                        sx={{
                            '& .MuiIconButton-root': {
                                color: 'white',
                                margin: '0 10px',
                            },
                        }}
                    >
                        <IconButton onClick={() => setOpen(false)}>
                            <CloseIcon />
                        </IconButton>

                        <DownloadButton fileId={fileId} />
                        <IconButton onClick={handleZoomIn}>
                            <ZoomIn />
                        </IconButton>
                        <IconButton onClick={handleZoomOut}>
                            <ZoomOut />
                        </IconButton>
                    </FlexBox>
                    {contentType === 'document' && extension !== 'pptx' && (
                        <FlexBox direction="row" sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TextField
                                type="number"
                                value={jumpToPage}
                                onChange={(e) => setJumpToPage(e.target.value)}
                                slotProps={{
                                    htmlInput: {
                                        min: 1,
                                        max: numOfPages,
                                        style: {
                                            width: '40px',
                                            fontSize: '16px',
                                            outline: 'none',
                                            padding: '6px 10px',
                                            color: 'white',
                                            border: '2px solid white',
                                        },
                                    },
                                }}
                                onKeyDown={handleEnterKeyPress}
                            />

                            <div style={{ color: 'white' }}>
                                {numOfPages} / {currentPageRef.current}
                            </div>
                        </FlexBox>
                    )}
                </FlexBox>

                <Grid
                    ref={containerRef}
                    sx={{
                        height: '95%',
                        overflowY: ['image', 'video', 'audio'].includes(contentType) ? 'hidden' : 'scroll',
                    }}
                    container
                    justifyContent="center"
                    alignItems="center"
                >
                    <Grid>{previewContent}</Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export { PreviewDialog };
