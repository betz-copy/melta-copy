import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Grid, useTheme, Typography, LinearProgress, Button, Box, Divider } from '@mui/material';
import { CloseOutlined as DeleteIcon, Visibility, Upload } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import i18next from 'i18next';
import FileIcon from '../FilePreview/FileIcon';
import { getFileExtension } from '../../utils/getFileType';
import OpenPreview from '../FilePreview/OpenPreview';
import { getFileName } from '../../utils/getFileName';

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

    const loadingStyle = {
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid #c4c4c4',
        borderRadius: '10px',
        borderColor: errorText ? '#A40000' : '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        display: 'flex',
        padding: '5px 20px',
        cursor: 'pointer',
    };

    const inputStyle = {
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid #c4c4c4',
        borderRadius: '10px',
        borderColor: '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        height: comment ? '225px' : '200px', // Set a fixed height
        display: 'flex',
        padding: '10px',
        // alignItems: 'center',
        cursor: 'pointer',
        overflowY: 'auto',
        boxShadow: '-2px 2px 6px 0px #1E27754D',
    };

    const fileTextStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px', // Adjust the gap between images
        maxWidth: '200px', // Adjust the maximum width of the container
        margin: 'auto', // Center the container horizontally
    };

    const isFileFromInput = (file: FilesInputProps['files'][number]) => file instanceof File;

    if ((isLoading || errorText) && files) {
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Grid container style={loadingStyle} direction="column">
                <Grid item container alignItems="center" wrap="nowrap">
                    <Grid item xs={10}>
                        <Typography
                            style={{
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                maxWidth: inputWidth * 0.7,
                                color: errorText ? '#A40000' : '',
                            }}
                        >
                            {errorText ?? files.join(', ')}
                        </Typography>
                    </Grid>
                    <Grid item container justifyContent="flex-end" alignItems="center" wrap="nowrap">
                        <IconButton
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setErrorText?.(undefined);
                            }}
                            size="small"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Grid>
                </Grid>

                <Grid display="flex" justifyContent="center">
                    <LinearProgress
                        style={{
                            width: '100%',
                            backgroundColor: errorText ? '#A4000' : '#E1F5FE',
                            borderRadius: '25px',
                            margin: '5px',
                        }}
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: errorText ? '#A4000' : '#4752B6',
                            },
                        }}
                        variant={errorText ? 'determinate' : 'indeterminate'}
                        value={errorText ? 100 : undefined}
                    />
                </Grid>
            </Grid>
        );
    }

    return (
        <Grid container flexDirection="column" justifyContent="space-around" width="100%" ref={inputRef}>
            <Grid item>
                <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
            </Grid>

            <Grid item container sx={inputStyle} {...getRootProps()}>
                <input {...getInputProps()} />
                {files.length > 0 ? (
                    <Grid item flexWrap="wrap" overflow="auto" width="100%">
                        {files.map((file: FilesInputProps['files'][number], index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <Grid key={`${file.name}-${index}`} item container justifyContent="space-between" alignItems="center" width="100%">
                                <Grid item container xs={1} justifyContent="center" paddingTop="5px">
                                    <Grid item>
                                        <FileIcon extension={getFileExtension(file.name)} style={{ height: '20px' }} />
                                    </Grid>
                                </Grid>
                                <Grid item xs={10}>
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
                                <Grid item container xs={1}>
                                    <Grid container item justifyContent="flex-end" alignItems="center" wrap="nowrap">
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
                    <Grid item sx={fileTextStyle}>
                        <Box display="flex" flexDirection="column" alignItems="center" position="relative">
                            <img src="/icons/upload-files.svg" alt="Upload Files" style={{ width: '120%' }} />
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

            {errorText && (
                <p id="error" style={{ color: '#d32f2f', margin: 0, padding: 0 }}>
                    {errorText}
                </p>
            )}
        </Grid>
    );
};

export default FilesInput;
