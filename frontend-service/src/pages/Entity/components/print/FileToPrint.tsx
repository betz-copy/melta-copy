import React, { useRef, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { Document, Page } from 'react-pdf';
import { isImage, isUnsupported } from '../../../../common/FilePreview/PreviewDialog';
import FlexBox from '../../../../common/FlexBox';
import { useFilePreview } from '../../../../utils/useFilePreview';
import { IFile } from '../../../../interfaces/entities';

const FileToPrint: React.FC<{ file: IFile; setFiles: React.Dispatch<React.SetStateAction<IFile[]>> }> = ({ file, setFiles }) => {
    const { data, refetch, isLoading, isError, error } = useFilePreview(file.id, file.type);
    console.log({ data });
    console.log('file.id', file.id);
    console.log('file.name', file.name);
    console.log('file.type', file.type);

    const [numOfPages, setNumOfPages] = useState(1);
    const fileRef = useRef(null);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (fileRef.current) {
        const element = fileRef.current as HTMLElement;
        setFiles((prevFiles) => {
            return prevFiles.map((existingFile) => {
                if (existingFile.id === file.id) {
                    return { ...existingFile, firstPage: element.offsetTop };
                }
                return existingFile;
            });
        });
    }

    // if (isError || !data) {
    //     console.log({ error });
    //     return <div>Error loading file preview</div>;
    // }

    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumOfPages(numPages);
    };

    let previewContent;
    if (isImage(file.type)) {
        previewContent = (
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
                        // Handle image loading errors
                        console.log('Error loading image');
                        if (!data) {
                            await refetch();
                        }
                    }}
                    onLoad={async () => {
                        if (!data) {
                            await refetch();
                        }
                    }}
                    style={
                        {
                            // maxWidth: '100%',
                            // maxHeight: '100%',
                            // transformOrigin: 'center center',
                        }
                    }
                />
            </Box>
        );
    }
    // else if (isVideoOrAudio(contentType)) {
    //     previewContent = <ReactPlayer style={{ marginTop: '65px' }} url={data} controls playing />;
    // }
    else if (isUnsupported(file.type) || isError || !data) {
        previewContent = toast(i18next.t('errorPage.preview'));
    } else {
        previewContent = (
            <Document file={data} onLoadSuccess={onLoadSuccess} onLoadError={() => null}>
                <FlexBox direction="column" gap={5}>
                    {Array.from({ length: numOfPages }, (_, i) => (
                        <div key={`page-${i + 1}`} style={{ width: '100%', height: '100%' }}>
                            <Page width={750} pageNumber={i + 1} renderTextLayer={false} />
                        </div>
                    ))}
                </FlexBox>
            </Document>
        );
    }

    return (
        <Grid item ref={fileRef}>
            {previewContent}
        </Grid>
    );
};

export { FileToPrint };
