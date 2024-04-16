import React, { useEffect, useRef, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import { UseQueryResult } from 'react-query';
import { isImage } from '../FilePreview/PreviewDialog';
import FlexBox from '../FlexBox';
import { IFile } from '../../interfaces/preview';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const FileToPrint: React.FC<{
    file: IFile;
    filePreview: UseQueryResult<string, unknown>;
}> = ({ file, filePreview }) => {
    const { data, refetch } = filePreview;

    const [numOfPages, setNumOfPages] = useState(1);
    const fileRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const currentPageRef = useRef(currentPage);

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
                    <img
                        src={data}
                        onError={async () => {
                            await refetch();
                        }}
                        onLoad={async () => {
                            await refetch();
                        }}
                        alt={file.name}
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                </Box>
            ) : (
                <Document file={data} onLoadSuccess={onLoadSuccess} onLoadError={() => null}>
                    <FlexBox direction="column" gap={5}>
                        {Array.from({ length: numOfPages }, (_, i) => (
                            <div key={`page-${i + 1}`} style={{ marginBottom: '20px', background: 'white', position: 'relative' }}>
                                <Page width={750} pageNumber={i + 1} renderTextLayer={false} />
                            </div>
                        ))}
                    </FlexBox>
                </Document>
            )}
        </Grid>
    );
};

export { FileToPrint };
