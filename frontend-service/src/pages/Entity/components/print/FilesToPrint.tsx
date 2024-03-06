import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { Document, Page } from 'react-pdf';
import { isImage, isUnsupported } from '../../../../common/FilePreview/PreviewDialog';
import { getPreviewContentType } from '../../../../utils/getFileType';
import FlexBox from '../../../../common/FlexBox';
import { getFileName } from '../../../../utils/getFileName';
import { useFilePreview } from '../../../../utils/useFilePreview';

const FilesToPrint: React.FC<{ fileId: string }> = ({ fileId }) => {
    const fileName = getFileName(fileId);
    const contentType = getPreviewContentType(fileName);
    const { data, refetch, isLoading, isError, error } = useFilePreview(fileId, contentType);
    console.log({ data });
    console.log({ fileId });
    console.log({ fileName });

    const [numOfPages, setNumOfPages] = useState(1);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    // if (isError || !data) {
    //     console.log({ error });
    //     return <div>Error loading file preview</div>;
    // }

    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumOfPages(numPages);
    };

    let previewContent;
    if (isImage(contentType)) {
        previewContent = (
            <div
                style={{
                    overflow: 'auto',
                    height: '95vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <img
                    src={data}
                    alt={`Preview of ${fileName}`}
                    onError={async () => {
                        // Handle image loading errors
                        console.log('Error loading image');
                        if (!data) {
                            await refetch();
                        }
                    }}
                    onLoad={async (event) => {
                        if (!data) {
                            await refetch();
                        }
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
                        transformOrigin: 'center center',
                    }}
                />
            </div>
        );
    }
    // else if (isVideoOrAudio(contentType)) {
    //     previewContent = <ReactPlayer style={{ marginTop: '65px' }} url={data} controls playing />;
    // }
    else if (isUnsupported(contentType) || isError || !data) {
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

    return <Grid item>{previewContent}</Grid>;
};

export { FilesToPrint };
