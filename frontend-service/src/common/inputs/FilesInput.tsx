import { CloseOutlined as DeleteIcon, Upload, Visibility } from '@mui/icons-material';
import { Box, Button, Divider, Grid, IconButton, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { Accept, useDropzone } from 'react-dropzone';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension } from '../../utils/getFileType';
import FileIcon from '../FilePreview/FileIcon';
import OpenPreview from '../FilePreview/OpenPreview';
import { LoadingFilesInput } from './LoadingFilesInput';

interface FilesInputProps {
    files: File[] | { name: string }[];
    onDropFiles?: (acceptedFiles: File[]) => void;
    onDeleteFile: (fileIndex: number, event: React.MouseEvent<HTMLButtonElement>) => void;
    inputText: string;
    acceptedFilesTypes?: Accept;
    errorText?: string;
    setErrorText?: React.Dispatch<React.SetStateAction<string | undefined>>;
    isLoading?: boolean;
    comment?: string;
}

const FilesInput: React.FC<FilesInputProps> = ({
    files,
    onDropFiles,
    onDeleteFile,
    inputText,
    acceptedFilesTypes,
    errorText,
    setErrorText,
    isLoading,
    comment,
}) => {
    const theme = useTheme();

    const onDrop = (acceptedFiles: File[] | File) => {
        if (Array.isArray(acceptedFiles) && onDropFiles) {
            onDropFiles(acceptedFiles);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFilesTypes,
        multiple: true,
    });

    const [inputWidth, setInputWidth] = useState<number>(200);
    const inputRef = useRef<HTMLDivElement>(null);

    const updateInputWidth = () => {
        if (inputRef.current) {
            setInputWidth(inputRef.current.offsetWidth);
        }
    };

    useEffect(() => {
        updateInputWidth();
        window.addEventListener('resize', updateInputWidth);
        return () => {
            window.removeEventListener('resize', updateInputWidth);
        };
    }, []);

    const inputStyle = {
        borderRadius: '10px',
        borderColor: '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        height: comment || errorText ? '245px' : '220px',
        display: 'flex',
        cursor: 'pointer',
        overflowY: 'auto',
        padding: '10px',
        boxShadow: '-2px 2px 6px 0px #1E27754D',
    };

    const innerInputStyle = {
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '2px dashed #CCCFE5',
        BorderRadius: '10px',
        padding: '10px',
        height: errorText ? '200px' : '100%',
        width: '100%',
        display: 'flex',
        justifyContext: 'center',
        alignItems: 'center',
    };

    const fileTextStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '7px', // Adjust the gap between images
        maxWidth: '200px', // Adjust the maximum width of the container
        margin: 'auto', // Center the container horizontally
    };

    const isFileFromInput = (file: FilesInputProps['files'][number]) => file instanceof File;

    if ((isLoading || errorText) && files.length)
        return <LoadingFilesInput files={files} errorText={errorText} setErrorText={setErrorText} inputWidth={inputWidth} isFileFromInput />;

    return (
        <Grid container flexDirection="column" justifyContent="space-around" width="100%" ref={inputRef}>
            <Grid>
                <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
            </Grid>

            <Grid container sx={inputStyle} {...getRootProps()}>
                <input {...getInputProps()} />
                {files.length ? (
                    <Grid flexWrap="wrap" overflow="auto" width="100%">
                        {files.map((file: FilesInputProps['files'][number], index) => (
                            <Grid key={`${file.name}-${index}`} container justifyContent="space-between" alignItems="center" width="100%">
                                <Grid container size={{ xs: 1 }} justifyContent="center" paddingTop="5px">
                                    <Grid>
                                        <FileIcon extension={getFileExtension(file.name)} style={{ height: '20px' }} />
                                    </Grid>
                                </Grid>
                                <Grid size={{ xs: 10 }}>
                                    <Typography
                                        style={{
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            maxWidth: inputWidth * 0.7,
                                        }}
                                    >
                                        {isFileFromInput(file) ? file.name : getFileName(file.name)}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 1 }}>
                                    <Grid container justifyContent="flex-end" alignItems="center" wrap="nowrap">
                                        {!isFileFromInput(file) && (
                                            <OpenPreview fileId={file.name} img={<Visibility fontSize="small" />} showText={false} />
                                        )}

                                        <IconButton onClick={(e) => onDeleteFile(index, e)} size="small">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Grid container sx={innerInputStyle}>
                        {isDragActive ? (
                            <Typography color="#9398C2" fontSize="14px" fontWeight={400} marginX="auto">
                                {i18next.t('input.imagePicker.dropFile')}
                            </Typography>
                        ) : (
                            <Grid sx={fileTextStyle}>
                                <Box display="flex" flexDirection="column" alignItems="center" position="relative">
                                    <img src="/icons/upload-files.svg" alt="Upload Files" style={{ width: '130%' }} />
                                    <Typography
                                        fontSize="12px"
                                        style={{
                                            position: 'absolute',
                                            top: '85%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center',
                                            zIndex: 1,
                                            width: '100%',
                                            color: theme.palette.mode === 'dark' ? 'white' : 'black',
                                        }}
                                    >
                                        {i18next.t('input.imagePicker.dragFiles')}
                                    </Typography>
                                </Box>
                                <Box display="flex" flexDirection="row" alignItems="center" gap="5px">
                                    <Divider sx={{ color: '#CCCFE5', width: '33px' }} />
                                    <Typography fontSize="10px" color="#9398C2">
                                        {i18next.t('input.imagePicker.or')}
                                    </Typography>
                                    <Divider sx={{ color: '#CCCFE5', width: '33px' }} />
                                </Box>

                                <Button
                                    variant="contained"
                                    style={{
                                        gap: '5px',
                                        borderRadius: '7px',
                                        background: theme.palette.mode === 'dark' ? '#EBEFFA' : undefined,
                                        height: '32px',
                                        width: '131px',
                                    }}
                                >
                                    <Typography fontSize="12px" color={theme.palette.mode === 'dark' ? '#1E2775' : undefined}>
                                        {i18next.t('input.imagePicker.chooseFile')}
                                    </Typography>
                                    <Upload sx={{ width: '24px', height: '24px', color: theme.palette.mode === 'dark' ? '#1E2775' : undefined }} />
                                </Button>

                                {comment && (
                                    <Typography fontSize="10px" color="#9398C2">
                                        {comment}
                                    </Typography>
                                )}
                            </Grid>
                        )}
                    </Grid>
                )}

                {errorText && (
                    <Grid>
                        <p id="error" style={{ color: '#d32f2f', margin: 0, padding: 0 }}>
                            {errorText}
                        </p>
                    </Grid>
                )}
            </Grid>
        </Grid>
    );
};

export default FilesInput;
