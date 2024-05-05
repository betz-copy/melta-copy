import React, { useState, useRef, useEffect } from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import { Button, Card, CircularProgress, Dialog, DialogContent, Grid, IconButton, TextField, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { Document, Page, pdfjs } from 'react-pdf';
import ReactPlayer from 'react-player';
import i18next from 'i18next';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { RootState } from '../../store';
import FlexBox from '../FlexBox';
import { getFileExtension, getPreviewContentType } from '../../utils/getFileType';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { DownloadButton } from '../DownloadButton';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

type PreviewProps = {
    open: boolean;
    fileId: string;
    data: string | undefined;
    setOpen: (value: boolean) => void;
    loading: boolean;
    error: boolean;
    fileName: string;
};

export const isImage = (type: string) => type === 'image';
export const isVideoOrAudio = (type: string) => ['video', 'audio'].includes(type);
export const isUnsupported = (type: string) => type === 'unsupported';
export const isSpecial = (type: string) => !(isImage(type) || isVideoOrAudio(type) || isUnsupported(type));

const PreviewDialog: React.FC<PreviewProps> = ({ open, fileId, data, setOpen, loading, fileName, error }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const [numOfPages, setNumOfPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [jumpToPage, setJumpToPage] = useState('1');
    const [zoomLevel, setZoomLevel] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentPageRef = useRef(currentPage);
    const contentType = getPreviewContentType(fileName);
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

    const handleEnterKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJumpToPage();
        }
    };

    let previewContent;
    if (isImage(contentType)) {
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
                    style={{ maxWidth: '100%', maxHeight: '95vh', transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                />
            </div>
        );
    } else if (isVideoOrAudio(contentType)) {
        previewContent = <ReactPlayer style={{ marginTop: '65px' }} url={data} controls playing />;
    } else if (isUnsupported(contentType) || error) {
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
    } else if (loading || !data) {
        previewContent = <CircularProgress />;
    } else {
        previewContent = (
            <Document file={data} onLoadSuccess={onLoadSuccess} onLoadError={() => null}>
                <FlexBox direction="column" gap={5}>
                    {Array.from({ length: numOfPages }, (_, i) => (
                        <div key={`page-${i + 1}`} style={{ marginBottom: '20px', background: 'white', position: 'relative' }}>
                            <Page width={950 * zoomLevel} pageNumber={i + 1} renderTextLayer={false} />
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
            PaperProps={{ sx: { bgcolor: darkMode ? 'rgba(20,20,20,0.7)' : 'rgba(49,49,49,0.7)' } }}
            disableEnforceFocus
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
                            <ZoomInIcon />
                        </IconButton>
                        <IconButton onClick={handleZoomOut}>
                            <ZoomOutIcon />
                        </IconButton>
                    </FlexBox>
                    {isSpecial(contentType) && extension !== 'pptx' && (
                        <FlexBox direction="row" sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TextField
                                type="number"
                                value={jumpToPage}
                                onChange={(e) => setJumpToPage(e.target.value)}
                                inputProps={{
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
                    sx={{ height: '95%', overflowY: isImage(contentType) || isVideoOrAudio(contentType) ? 'hidden' : 'scroll' }}
                    container
                    justifyContent="center"
                    alignItems="center"
                >
                    <Grid item>{previewContent}</Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export { PreviewDialog };
