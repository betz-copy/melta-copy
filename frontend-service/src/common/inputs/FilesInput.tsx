import React, { useEffect, useRef, useState } from 'react';
import { IconButton, Grid, useTheme, Typography } from '@mui/material';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import FileIcon from '../FilePreview/FileIcon';
import { getFileExtension } from '../../utils/getFileType';
import i18next from 'i18next';

interface FilesInputProps {
    files: string[];
    onDropFiles?: (acceptedFiles: File[]) => void;
    onDeleteFile: (fileIndex: number, event: React.MouseEvent<HTMLButtonElement>) => void;
    inputText: string;
    acceptedFilesTypes?: Accept;
    errorText?: string;
}

const FilesInput: React.FC<FilesInputProps> = ({
    files,
    onDropFiles,
    onDeleteFile,
    inputText,
    acceptedFilesTypes,
    errorText,
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
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid #c4c4c4',
        borderRadius: '10px',
        borderColor: '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        minHeight: '40px',
        maxHeight: '150px',
        display: 'flex',
        padding: '10px',
        alignItems: 'center',
        cursor: 'pointer',
        overflowY: 'auto',
    };

    const fileTextStyle = {
        backgroundColor: "white",
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        maxWidth: inputWidth * 0.7 - 150,
        position: 'sticky',
        top: '0',
        zIndex: 1,
        display: "flex",
        flexDirection: "row",
        gap:"3px",
        paddingBottom: "2px",
        width: "100%"
    };

    return (
        <Grid container flexDirection="column" justifyContent="space-around" width="100%" ref={inputRef}>
            <Grid item>
                <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
            </Grid>

            <Grid item container sx={inputStyle} {...getRootProps()}>
                <input {...getInputProps()} />
                <Grid item sx={fileTextStyle}>
                    <img src="\icons\Choose-File.svg" height="25px" width="120px" />
                    <Typography>|</Typography>
                    <img src="\icons\File-Drag-Icon.svg" height="25px" style={{ marginRight: '10px' }} />
                    <Typography sx={{backgroundColor: "white"}}>
                        {i18next.t('input.imagePicker.dragFiles')}
                    </Typography>
                </Grid>
                <Grid item container alignItems="center" flexWrap="wrap" overflow="auto">
                    {files.map((file, index) => (
                        <Grid key={index} item container justifyContent="space-between" alignItems="center" width="100%">
                            <Grid item container xs={1} justifyContent="center" paddingTop="5px">
                                <Grid item>
                                    <FileIcon extension={getFileExtension(file)} style={{ height: '20px' }} />
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
                                    {file}
                                </Typography>
                            </Grid>
                            <Grid item container xs={1} justifyContent="flex-end">
                                <Grid item justifySelf="flex-end">
                                    <IconButton onClick={(e) => onDeleteFile(index, e)} size="small">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
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
