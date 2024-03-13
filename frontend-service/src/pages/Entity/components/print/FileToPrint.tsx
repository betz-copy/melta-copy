import React, { useRef, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { Document, Page } from 'react-pdf';
import { UseQueryResult } from 'react-query';
import { isImage } from '../../../../common/FilePreview/PreviewDialog';
import FlexBox from '../../../../common/FlexBox';
import { IFile } from '../../../../interfaces/entities';

const FileToPrint: React.FC<{
    file: IFile;
    filePreview: UseQueryResult<string, unknown>;
}> = ({ file, filePreview }) => {
    const { data, refetch } = filePreview;

    const [numOfPages, setNumOfPages] = useState(1);
    const fileRef = useRef(null);

    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumOfPages(numPages);
    };

    return (
        <Grid item ref={fileRef}>
            {isImage(file.type) ? (
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
                            <div key={`page-${i + 1}`} style={{ width: '100%', height: '100%' }}>
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
