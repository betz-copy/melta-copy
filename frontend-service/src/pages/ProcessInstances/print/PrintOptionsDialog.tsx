import React from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, FormControlLabel, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { MeltaCheckbox } from '../../../common/MeltaCheckbox';
import { IFile } from '../../../interfaces/preview';
import { getFileExtension, getPreviewContentType } from '../../../utils/getFileType';
import { getFileName } from '../../../utils/getFileName';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { isUnsupported, isVideoOrAudio } from '../../../common/FilePreview/PreviewDialog';

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: {};
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
    options: {
        showSummary: boolean;
        setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
        showFiles: boolean;
        setShowFiles: React.Dispatch<React.SetStateAction<boolean>>;
    };
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ open, handleClose, processInstance, processTemplate, files, setFiles, filesLoadingStatus, setFilesLoadingStatus, onClick, options }) => {
    const getProcessPropertiesFiles = React.useCallback((): IFile[] => {
        return processTemplate.details.propertiesOrder
            .map((propertyKey) => {
                const propertySchema = processTemplate.details.properties.properties[propertyKey];
                const propertyValue = processInstance.details[propertyKey];
                if (propertyValue && propertySchema.format === 'fileId') {
                    const name = getFileName(propertyValue);
                    return {
                        id: propertyValue,
                        name,
                        contentType: getPreviewContentType(name),
                        key: propertyKey,
                        targetExtension: getFileExtension(name),
                    } as IFile;
                }
                if (propertyValue && propertySchema.type === 'array' && propertySchema.items?.format === 'fileId') {
                    return propertyValue.map((id: string) => {
                        const name = getFileName(id);
                        return {
                            id,
                            name,
                            contentType: getPreviewContentType(name),
                            targetExtension: getFileExtension(name),
                        } as IFile;
                    });
                }
                return undefined;
            })
            .flat()
            .filter((file) => file !== undefined) as IFile[];
    }, [processTemplate, processInstance]);

    const getProcessStepsFiles = React.useCallback((): IFile[] => {
        const stepsFiles: IFile[] = [];
        processTemplate.steps.forEach((stepTemplate) => {
            processInstance.steps.forEach((step) => {
                stepTemplate.propertiesOrder.forEach((propertyKey) => {
                    if (step.properties) {
                        const propertySchema = stepTemplate.properties.properties[propertyKey];
                        const propertyValue = step.properties[propertyKey];
                        if (propertyValue && propertySchema.format === 'fileId') {
                            const name = getFileName(propertyValue);
                            stepsFiles.push({
                                id: propertyValue,
                                name,
                                contentType: getPreviewContentType(name),
                                targetExtension: getFileExtension(name),
                            } as IFile);
                        }
                        if (propertyValue && propertySchema.type === 'array' && propertySchema.items?.format === 'fileId') {
                            propertyValue.forEach((id: string) => {
                                const name = getFileName(id);
                                stepsFiles.push({
                                    id,
                                    name,
                                    contentType: getPreviewContentType(name),
                                    targetExtension: getFileExtension(name),
                                } as IFile);
                            });
                        }
                    }
                });
            });
        });
        return stepsFiles;
    }, [processTemplate.steps, processInstance.steps]);

    React.useEffect(() => {
        const currFiles = getProcessPropertiesFiles()
            .filter((file) => !isVideoOrAudio(file.contentType) && !isUnsupported(file.contentType))
            .concat(getProcessStepsFiles().filter((file) => !isVideoOrAudio(file.contentType) && !isUnsupported(file.contentType)));
        setFiles(currFiles);
        if (options.showFiles) {
            setFilesLoadingStatus(
                currFiles.reduce((acc, file) => {
                    return { ...acc, [file.id]: true };
                }, {}),
            );
        }
    }, [processTemplate, processInstance, getProcessPropertiesFiles, getProcessStepsFiles, setFiles, options.showFiles, setFilesLoadingStatus]);

    const handlePrintError = async () => {
        const refetchPromises = files.map((file) => {
            if (file.refetch) return file.refetch();
            return undefined;
        });

        await Promise.all(refetchPromises)
            .then((arrRefetch) => {
                arrRefetch.forEach((refetch) => {
                    if (!refetch) return;

                    if (refetch.isError) {
                        options.setShowFiles(false);
                        toast.error(i18next.t('errorPage.filePrintError'));
                    }
                });
            })
            .catch((error) => {
                options.setShowFiles(false);
                toast.error(i18next.t('errorPage.filePrintError'));
            });
    };

    React.useEffect(() => {
        handlePrintError();
    }, [files]);

    const [isLoading, setIsLoading] = React.useState(false);
    React.useEffect(() => {
        if (Object.keys(filesLoadingStatus).length === 0) {
            setIsLoading(false);
            return;
        }
        setIsLoading(Object.values(filesLoadingStatus).some((loading) => loading));
    }, [filesLoadingStatus]);

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle paddingLeft="4px">
                <Grid container display="flex" justifyContent="space-between">
                    <Grid item> {i18next.t('entityPage.print.printOptions')}</Grid>
                    <Grid item>
                        <IconButton onClick={handleClose}>
                            <CloseOutlined />
                        </IconButton>
                    </Grid>
                </Grid>
            </DialogTitle>
            <DialogContent style={{ width: '500px', height: '240px' }}>
                <Grid container direction="column" spacing={1} alignItems="center">
                    <Grid paddingTop="25px">
                        <Grid>
                            <FormControlLabel
                                control={<MeltaCheckbox checked={options.showSummary} onChange={() => options.setShowSummary((cur) => !cur)} />}
                                label={i18next.t('wizard.processInstance.print.showSummary')}
                            />
                        </Grid>
                        {files && files.length > 0 && (
                            <Grid>
                                <FormControlLabel
                                    control={<MeltaCheckbox checked={options.showFiles} onChange={() => options.setShowFiles((cur) => !cur)} />}
                                    label={i18next.t('wizard.processInstance.print.showFiles')}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions style={{ paddingLeft: '24px' }}>
                <Button
                    onClick={(ev) => {
                        handleClose();
                        onClick(ev);
                    }}
                    endIcon={<PrintOutlined />}
                    disabled={isLoading}
                >
                    {i18next.t('entityPage.print.continue')}
                    {isLoading && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { PrintOptionsDialog };
