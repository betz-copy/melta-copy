import React, { useEffect, useRef, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import { isImage } from '../FilePreview/PreviewDialog';
import FlexBox from '../FlexBox';
import { IFile } from '../../interfaces/preview';
import { useFilePreview } from '../../utils/useFilePreview';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const FileToPrint: React.FC<{
    file: IFile;
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    onPreviewLoadingFinished: () => void;
}> = ({ file, setSelectedFiles, onPreviewLoadingFinished }) => {
    const [numOfPages, setNumOfPages] = useState(0);
    const fileRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const currentPageRef = useRef(currentPage);
    const [noSuchKeyError, setNoSuchKeyError] = useState<boolean>(true);

    console.log({ file });

    const { data, refetch, isFetching: isPreviewLoading } = useFilePreview(file.id, file.contentType, setNoSuchKeyError);

    console.log({ data });
    console.log({ isPreviewLoading });

    React.useEffect(() => {
        setSelectedFiles((prevFilesToPrint) => {
            return prevFilesToPrint.map((currFile) => {
                if (currFile.id === file.id) {
                    return {
                        ...currFile,
                        refetch,
                    };
                }
                return currFile;
            });
        });
    }, []);

    React.useEffect(() => {
        if (isImage(file.contentType) && isPreviewLoading === false) {
            onPreviewLoadingFinished();
        }
    }, [isPreviewLoading === true]);

    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumOfPages(numPages);
    };

    useEffect(() => {
        const handleScroll = async () => {
            if (fileRef.current) {
                const pageHeight = fileRef.current.scrollHeight / numOfPages;
                const scrolledPage = Math.floor(fileRef.current.scrollTop / pageHeight) + 1;
                currentPageRef.current = scrolledPage;
            }
        };

        const container = fileRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [numOfPages]);

    useEffect(() => {
        if (file) {
            setCurrentPage(1);
            currentPageRef.current = 1;
        }
        setNumOfPages(0);
    }, [file]);

    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    return (
        <Grid item ref={fileRef}>
            {isImage(file.contentType) ? (
                <Box
                    sx={{
                        overflow: 'auto',
                        margin: 'auto',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <img src={data} alt={file.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                </Box>
            ) : (
                <Document file={data} onLoadSuccess={onLoadSuccess} onLoadError={() => null}>
                    <FlexBox direction="column" gap={5}>
                        {Array.from({ length: numOfPages }, (_, i) => (
                            <div key={`page-${i + 1}`} style={{ marginBottom: '20px', background: 'white', position: 'relative' }}>
                                <Page
                                    width={750}
                                    pageNumber={i + 1}
                                    onRenderSuccess={() => {
                                        if (numOfPages !== 0 && i + 1 === numOfPages && isPreviewLoading === false) {
                                            onPreviewLoadingFinished();
                                        }
                                    }}
                                    renderTextLayer={false}
                                />
                            </div>
                        ))}
                    </FlexBox>
                </Document>
            )}
        </Grid>
    );
};

export { FileToPrint };
