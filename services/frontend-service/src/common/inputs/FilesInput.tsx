import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Grid, useTheme, Typography } from '@mui/material';
import { CloseOutlined as DeleteIcon, Visibility } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import { v4 } from 'uuid';
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
}

const FilesInput: React.FC<FilesInputProps> = ({ files, onDropFiles, onDeleteFile, inputText, acceptedFilesTypes, errorText }) => {
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
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid #c4c4c4',
        borderRadius: '10px',
        borderColor: '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        height: '150px', // Set a fixed height
        display: 'flex',
        padding: '10px',
        // alignItems: 'center',
        cursor: 'pointer',
        overflowY: 'auto',
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
                            <Grid key={v4()} item container justifyContent="space-between" alignItems="center" width="100%">
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
                        <img src="\icons\upload-files.svg" style={{ marginRight: '10px' }} />
                        <img src="\icons\Choose-File.svg" height="25px" width="120px" />
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
