import React from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, FormControlLabel, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { MeltaCheckbox } from '../../../common/MeltaCheckbox';
import { IFile } from '../../../interfaces/preview';
import { getFile } from '../../../utils/getFileType';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { isUnsupported, isVideoOrAudio } from '../../../common/FilePreview/PreviewDialog';
import { SelectCheckbox } from '../../../common/SelectCheckbox';
import { getFilesFromTemplate, handlePrintError } from '../../../common/print/PrintOptionsDialog';

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    processInstance: IMongoProcessInstancePopulated;
    processTemplate: IMongoProcessTemplatePopulated;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: {};
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
    options: {
        showSummary: boolean;
        setShowSummary: React.Dispatch<React.SetStateAction<boolean>>;
    };
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({
    open,
    handleClose,
    processInstance,
    processTemplate,
    files,
    setFiles,
    selectedFiles,
    setSelectedFiles,
    filesLoadingStatus,
    setFilesLoadingStatus,
    onClick,
    options,
}) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const getProcessPropertiesFiles = React.useCallback((): IFile[] => {
        console.log('processTemplate.details', processTemplate.details);
        console.log('processInstance.details', processInstance.details);

        return getFilesFromTemplate(processTemplate.details, processInstance.details);
    }, [processTemplate, processInstance]);

    const getProcessStepsFiles = React.useCallback((): IFile[] => {
        return processTemplate.steps
            .flatMap((stepTemplate) => {
                return processInstance.steps.flatMap((step) => {
                    return stepTemplate.propertiesOrder.flatMap((propertyKey) => {
                        if (step.properties) {
                            const propertySchema = stepTemplate.properties.properties[propertyKey];
                            const propertyValue = step.properties[propertyKey];
                            if (propertyValue) {
                                if (propertySchema.format === 'fileId') return [getFile(propertyValue)];
                                if (propertySchema.type === 'array' && propertySchema.items?.format === 'fileId')
                                    return propertyValue.map((id: string) => getFile(id));
                            }
                        }
                        return [];
                    });
                });
            })
            .filter((file) => file !== undefined) as IFile[];
    }, [processTemplate.steps, processInstance.steps]);

    // const getProcessStepsFiles = React.useCallback((): IFile[] => {
    //     return processTemplate.steps
    //         .flatMap((stepTemplate) => {
    //             return processInstance.steps.flatMap((step) => {
    //                 console.log({stepTemplate});
    //                 console.log({step});

    //                 return getFilesFromTemplate(stepTemplate, step);
    //             });
    //         })
    //         .filter((file) => file !== undefined) as IFile[];
    // }, [processTemplate.steps, processInstance.steps]);

    React.useEffect(() => {
        const currFiles = getProcessPropertiesFiles()
            .filter((file) => !isVideoOrAudio(file.contentType) && !isUnsupported(file.contentType))
            .concat(getProcessStepsFiles().filter((file) => !isVideoOrAudio(file.contentType) && !isUnsupported(file.contentType)));
        setFiles(currFiles);
        setSelectedFiles([]);
    }, [getProcessPropertiesFiles, getProcessStepsFiles, setFiles, setSelectedFiles]);

    React.useEffect(() => {
        setFilesLoadingStatus(
            selectedFiles.reduce((acc, file) => {
                return { ...acc, [file.id]: true };
            }, {}),
        );
    }, [selectedFiles, setFilesLoadingStatus]);

    React.useEffect(() => {
        handlePrintError(selectedFiles, setSelectedFiles);
    }, [selectedFiles]);

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
                        <Grid item>
                            {files.length !== 0 && (
                                <SelectCheckbox
                                    title={i18next.t('entityPage.print.chooseFiles')}
                                    options={files}
                                    isDraggableDisabled
                                    selectedOptions={selectedFiles}
                                    setSelectedOptions={setSelectedFiles}
                                    getOptionId={(file) => file.id}
                                    getOptionLabel={(file) => file.name}
                                />
                            )}
                        </Grid>
                        <Grid paddingTop="25px">
                            <FormControlLabel
                                control={<MeltaCheckbox checked={options.showSummary} onChange={() => options.setShowSummary((cur) => !cur)} />}
                                label={i18next.t('wizard.processInstance.print.showSummary')}
                            />
                        </Grid>
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
