import React, { useRef, useState } from 'react';
import { Box, Grid } from '@mui/material';
import i18next from 'i18next';
import { Document, Page } from 'react-pdf';
import { UseQueryResult } from 'react-query';
import { isImage, isUnsupported } from '../../../../common/FilePreview/PreviewDialog';
import FlexBox from '../../../../common/FlexBox';
import { IFile } from '../../../../interfaces/entities';

const FileToPrint: React.FC<{
    file: IFile;
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filePreview: UseQueryResult<string, unknown>;
}> = ({ file, setFiles, filePreview }) => {
    const { data, refetch, isLoading, isError } = filePreview;

    const [numOfPages, setNumOfPages] = useState(1);
    const fileRef = useRef(null);

    if (isLoading || isError) {
        return <div>{i18next.t('errorPage.preview')}</div>;
    }

    if (isError || !data || isUnsupported(file.type)) {
        return <div>Error loading file preview</div>;
    }

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
