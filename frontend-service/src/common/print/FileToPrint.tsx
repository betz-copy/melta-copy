import { Box, Grid } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { IFile } from '../../interfaces/preview';
import { useFilePreview } from '../../utils/hooks/useFilePreview';
import FlexBox from '../FlexBox';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const FileToPrint: React.FC<{
    file: IFile;
    onPreviewLoadingFinished: (error?: boolean) => void;
}> = ({ file, onPreviewLoadingFinished }) => {
    const fileRef = useRef<HTMLDivElement>(null);

    const [numOfPages, setNumOfPages] = useState<number>(0);
    const [noSuchKeyError, setNoSuchKeyError] = useState<boolean>(false);

    const { data, isFetching: isPreviewLoading } = useFilePreview(file.id, file.contentType, setNoSuchKeyError);
    const onLoadSuccess = ({ numPages }: { numPages: number }) => setNumOfPages(numPages);

    useEffect(() => {
        if (file.contentType === 'image' && isPreviewLoading === false) onPreviewLoadingFinished();
    }, [isPreviewLoading === true]);

    useEffect(() => {
        if (noSuchKeyError) onPreviewLoadingFinished(true);
    }, [noSuchKeyError === true]);

    return (
        <Grid ref={fileRef}>
            {file.contentType === 'image' ? (
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
                    {data && <img src={data} alt={file.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />}
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
                                        if (numOfPages !== 0 && i + 1 === numOfPages && isPreviewLoading === false) onPreviewLoadingFinished();
                                    }}
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
