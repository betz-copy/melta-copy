import { useMatomo } from '@datapunt/matomo-tracker-react';
import { CameraAltOutlined as CameraIcon, CloseOutlined as DeleteIcon, DocumentScanner, Visibility } from '@mui/icons-material';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { MouseEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { Accept, useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { getFileName } from '../../utils/getFileName';
import { getFileExtension } from '../../utils/getFileType';
import FileIcon from '../FilePreview/FileIcon';
import OpenPreview from '../FilePreview/OpenPreview';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import Camera from '../dialogs/Camera';
import ImageView from '../dialogs/Camera/ImageView';
import { LoadingFilesInput } from './LoadingFilesInput';

interface FileInputProps {
    file: Partial<File> | { name: string } | undefined;
    fileName?: string;
    onDeleteFile: MouseEventHandler;
    onDropFile: (acceptedFile: File) => void;
    inputText: string;
    acceptedFilesTypes?: Accept;
    errorText?: string;
    setErrorText?: React.Dispatch<React.SetStateAction<string | undefined>>;
    disableCamera?: boolean;
    disablePreview?: boolean;
    isLoading?: boolean;
    comment?: string;
    scanFromImage?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({
    file,
    onDeleteFile,
    onDropFile,
    inputText,
    acceptedFilesTypes,
    errorText,
    disableCamera = false,
    disablePreview = false,
    setErrorText,
    isLoading,
    comment,
    scanFromImage,
}) => {
    const theme = useTheme();
    const { trackEvent } = useMatomo();

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
        if (acceptedFiles[0].type.startsWith('image/')) setImgURL(URL.createObjectURL(acceptedFiles[0]));
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

    const style = {
        border: isDragActive ? `2px dashed ${theme.palette.primary.main}` : '1px solid #c4c4c4',
        borderRadius: '10px',
        borderColor: '#CCCFE5',
        color: '#9398C2',
        width: '100%',
        display: 'flex',
        padding: '5px 20px',
        cursor: 'pointer',
    };

    const inputStyle = { ...style, height: '40px', alignItems: 'center', padding: '0px 10px' };

    const isFileFromInput = useMemo(() => file instanceof File, [file]);

    const isImageFile = () => {
        if (!file) return false;

        if ('type' in file && typeof file.type === 'string') {
            return file.type.startsWith('image/');
        }

        if ('name' in file && typeof file.name === 'string') {
            const extension = getFileExtension(file.name);
            return environment.fileExtensions.imageToManipulate.includes(extension);
        }

        return false;
    };
    if ((isLoading || errorText) && file)
        return (
            <LoadingFilesInput
                files={[file]}
                errorText={errorText}
                setErrorText={setErrorText}
                inputWidth={inputWidth}
                isFileFromInput={isFileFromInput}
            />
        );

    return (
        <>
            <Grid container flexDirection="column" justifyContent="space-around" width="100%" ref={inputRef}>
                <Grid>
                    <Typography style={{ color: '#9398C2' }}>{inputText}</Typography>
                </Grid>

                <Grid container>
                    {file?.name?.trim() ? (
                        <Grid container style={inputStyle} {...getRootProps()}>
                            <input {...getInputProps()} />
                            <Grid container flexDirection="row" alignItems="center" flexWrap="nowrap">
                                <Grid container size={{ xs: 1 }} justifyContent="center" paddingTop="5px">
                                    <Grid>
                                        <FileIcon extension={getFileExtension(file.name!)} style={{ height: '20px' }} />
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
                                        {isFileFromInput ? file.name : getFileName(file.name!)}
                                    </Typography>
                                </Grid>
                                <Grid container size={{ xs: 1 }} justifyContent="flex-end">
                                    <Grid container justifyContent="flex-end" alignItems="center" wrap="nowrap">
                                        {!isFileFromInput && !disablePreview && (
                                            <OpenPreview fileId={file.name!} img={<Visibility fontSize="small" />} showText={false} />
                                        )}

                                        {scanFromImage && isImageFile() && (
                                            <MeltaTooltip title={i18next.t('input.imagePicker.scanFromImage')}>
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
                                                setImgURL(null);
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
                                    onClick={(event) => {
                                        onCameraClick(event);
                                        trackEvent({
                                            category: 'entity',
                                            action: 'camera icon click',
                                        });
                                    }}
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
                    {comment && (
                        <Typography fontSize="12px" color="#9398C2" paddingLeft="7px">
                            {comment}
                        </Typography>
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
                    openCamera={openCamera}
                    openImageView={openImageView}
                    setOpenCamera={setOpenCamera}
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
                    setOpenImageView={setOpenImageView}
                />
            )}
        </>
    );
};

export default FileInput;
