import React, { MouseEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton, Grid, useTheme, Typography } from '@mui/material';
import { CloseOutlined as DeleteIcon, CameraAltOutlined as CameraIcon, Visibility, DocumentScanner } from '@mui/icons-material';
import { Accept, useDropzone } from 'react-dropzone';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import Camera from '../dialogs/Camera';
import { getFileExtension } from '../../utils/getFileType';
import FileIcon from '../FilePreview/FileIcon';
import OpenPreview from '../FilePreview/OpenPreview';
import { getFileName } from '../../utils/getFileName';
import { MeltaTooltip } from '../MeltaTooltip';
import ImageView from '../dialogs/Camera/ImageView';

interface FileInputProps {
    file: Partial<File> | { name: string } | undefined;
    onDeleteFile: MouseEventHandler;
    onDropFile: (acceptedFile: File) => void;
    inputText: string;
    acceptedFilesTypes?: Accept;
    fileFieldName?: string;
    errorText?: string;
    disableCamera?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({ file, onDeleteFile, onDropFile, inputText, acceptedFilesTypes, errorText, disableCamera = false }) => {
    const theme = useTheme();

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [openCamera, setOpenCamera] = useState(false);
    const [imgURL, setImgURL] = useState<string | null>(null);
    const [openImageView, setOpenImageView] = useState(false);

    const errorStyle = {
        color: '#d32f2f',
        margin: 0,
        padding: 0,
    };

    const onDrop = (acceptedFiles: File[]) => {
        onDropFile(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFilesTypes,
        multiple: false,
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

    const onCameraClick = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        try {
            const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setStream(userStream);
            setOpenCamera(true);
        } catch {
            toast.error(i18next.t('camera.cameraNotFound'));
        }
    };

    const onScannerClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        setOpenImageView(true);
    };

    const inputStyle = {
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid #c4c4c4',
        borderRadius: '10px',
        borderColor: '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        height: '40px',
        display: 'flex',
        padding: '0px 10px',
        alignItems: 'center',
        cursor: 'pointer',
    };

    const isFileFromInput = useMemo(() => file instanceof File, [file]);

    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];

    const isImageFile = () => {
        if (!file) return false;

        if ('type' in file && typeof file.type === 'string') {
            return file.type.startsWith('image/');
        }

        if ('name' in file && typeof file.name === 'string') {
            const extension = file.name.split('.').pop()?.toLowerCase();
            return imageExtensions.includes(extension || '');
        }

        return false;
    };

    return (
        <>
            <Grid container flexDirection="column" justifyContent="space-around" width="100%" ref={inputRef}>
                <Grid item>
                    <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
                </Grid>

                <Grid item container>
                    {file ? (
                        <Grid item container style={inputStyle} {...getRootProps()}>
                            <input {...getInputProps()} />
                            <Grid container item flexDirection="row" alignItems="center" flexWrap="nowrap">
                                <Grid item container xs={1} justifyContent="center" paddingTop="5px">
                                    <Grid item>
                                        <FileIcon extension={getFileExtension(file.name!)} style={{ height: '20px' }} />
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
                                        {isFileFromInput ? file.name : getFileName(file.name!)}
                                    </Typography>
                                </Grid>
                                <Grid item container xs={1} justifyContent="flex-end">
                                    <Grid container item justifyContent="flex-end" alignItems="center" wrap="nowrap">
                                        {!isFileFromInput && (
                                            <OpenPreview fileId={file.name!} img={<Visibility fontSize="small" />} showText={false} />
                                        )}

                                        {isImageFile() && (
                                            <MeltaTooltip title="סריקה מתמונה">
                                                <IconButton
                                                    style={{
                                                        height: '25px',
                                                        width: '25px',
                                                        borderRadius: '7px',
                                                        marginLeft: '5px',
                                                    }}
                                                    onClick={onScannerClick}
                                                    size="small"
                                                >
                                                    <DocumentScanner style={{ width: '20px', height: '20px' }} />
                                                </IconButton>
                                            </MeltaTooltip>
                                        )}
                                        <IconButton
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDeleteFile(e);
                                            }}
                                            size="small"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid style={inputStyle} {...getRootProps()}>
                            <input {...getInputProps()} placeholder="aa" />
                            <img src="\icons\Choose-File.svg" height="25px" width="120px" />
                            {!disableCamera && (
                                <IconButton
                                    style={{
                                        background: '#CCCFE5',
                                        height: '25px',
                                        width: '25px',
                                        borderRadius: '7px',
                                        marginLeft: '5px',
                                    }}
                                    onClick={onCameraClick}
                                >
                                    <CameraIcon style={{ color: '#1E2775', width: '20px', height: '20px' }} />
                                </IconButton>
                            )}
                            <Typography>|</Typography>
                            <img src="\icons\File-Drag-Icon.svg" height="25px" style={{ marginRight: '10px' }} />
                            <Typography
                                style={{
                                    marginRight: '30px',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    maxWidth: inputWidth * 0.7 - 150,
                                }}
                            >
                                {i18next.t('input.imagePicker.dragFile')}
                            </Typography>
                        </Grid>
                    )}
                    {errorText && (
                        <p id="error" style={errorStyle}>
                            {errorText}
                        </p>
                    )}
                </Grid>
            </Grid>
            {openImageView && imgURL && (
                <ImageView
                    setStream={setStream}
                    imgURL={imgURL}
                    setImgURL={setImgURL}
                    setOpenImageView={setOpenImageView}
                    openImageView={openImageView}
                    onPictureTaken={onDropFile}
                />
            )}
            {openCamera && (
                <Camera
                    stream={stream!}
                    setStream={setStream}
                    open={openCamera}
                    setOpen={setOpenCamera}
                    setImgURL={setImgURL}
                    onPictureTaken={onDropFile}
                    setOpenImageView={setOpenImageView}
                />
            )}
        </>
    );
};

export default FileInput;
