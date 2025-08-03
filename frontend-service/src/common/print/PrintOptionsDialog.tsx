import { CloseOutlined, PrintOutlined } from '@mui/icons-material';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    useTheme,
} from '@mui/material';
import i18next from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IFile } from '../../interfaces/preview';
import { IMongoProcessInstancePopulated, InstanceProperties } from '../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../interfaces/processes/stepTemplate';
import RelationshipSelect, { EntityConnectionsProps } from '../../pages/Entity/components/print/RelationshipSelection';
import { getFile } from '../../utils/getFileType';
import { BlueTitle } from '../BlueTitle';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { MeltaTooltip } from '../MeltaTooltip';
import { SelectCheckbox } from '../SelectCheckBox';

type IOption = {
    show: boolean;
    set: React.Dispatch<React.SetStateAction<boolean>>;
    label: string;
};

export enum PrintType {
    Entity = 'entity',
    Process = 'process',
}
interface IEntityPrint {
    type: PrintType.Entity;
    template: IMongoEntityTemplatePopulated;
    instance: IEntityExpanded;
    entityConnections: EntityConnectionsProps;
    options: {
        date: IOption;
        disabled: IOption;
        entityDates: IOption;
        previewPropertiesOnly: IOption;
    };
}

interface IProcessPrint {
    type: PrintType.Process;
    template: IMongoProcessTemplatePopulated;
    instance: IMongoProcessInstancePopulated;
    options: { processSummary: IOption };
}

type PrintItem = IEntityPrint | IProcessPrint;

const getFilesFromTemplate = (
    instanceProps: IEntity['properties'] | InstanceProperties,
    templateProps: IMongoEntityTemplatePopulated | IMongoProcessTemplatePopulated['details'] | IMongoStepTemplatePopulated,
): IFile[] => {
    return Object.keys(templateProps.properties.properties).flatMap((propertyKey) => {
        const propertySchema = templateProps.properties.properties[propertyKey];
        const propertyValue = instanceProps[propertyKey];

        if (propertyValue) {
            if (propertySchema.format === 'fileId') return [getFile(propertyValue)];
            if (propertySchema.type === 'array' && propertySchema.items?.format === 'fileId') return propertyValue.map((id: string) => getFile(id));
        }
        return [];
    });
};

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    printItem: PrintItem;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: Record<string, boolean>;
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ open, handleClose, printItem, files, setFiles, selectedFiles, setSelectedFiles, filesLoadingStatus, setFilesLoadingStatus, onClick }) => {
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const { type, template, instance, options } = printItem;

    const getPropertiesFiles = useCallback((): IFile[] => {
        if (type === PrintType.Entity) return getFilesFromTemplate(instance.entity.properties, template);
        return getFilesFromTemplate(instance.details, template.details);
    }, [template, instance]);

    const getProcessStepsFiles = useCallback((): IFile[] => {
        if (type === PrintType.Entity) return [];
        return template.steps.flatMap((stepTemplate) => instance.steps.flatMap((step) => getFilesFromTemplate(step.properties ?? {}, stepTemplate)));
    }, [instance, template]);

    useEffect(() => {
        const filterFiles = ({ contentType }: IFile) => contentType !== 'video' && contentType !== 'audio' && contentType !== 'unsupported';
        const currFiles = getPropertiesFiles().filter(filterFiles).concat(getProcessStepsFiles().filter(filterFiles));

        setFiles(currFiles);
        setSelectedFiles([]);
    }, [getPropertiesFiles, getProcessStepsFiles, setFiles, setSelectedFiles]);

    useEffect(() => {
        setFilesLoadingStatus(
            selectedFiles.reduce((acc, file) => {
                return { ...acc, [file.id]: true };
            }, {}),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFiles]);

    useEffect(() => {
        if (Object.keys(filesLoadingStatus).length === 0) {
            setIsLoading(false);
            return;
        }
        setIsLoading(Object.values(filesLoadingStatus).some((loading) => loading));
    }, [filesLoadingStatus]);

    return (
        <Dialog open={open} onClose={handleClose} onClick={(e) => e.stopPropagation()}>
            <DialogTitle>
                <Grid container display="flex" justifyContent="space-between" alignItems="center">
                    <Grid item>
                        <BlueTitle title={i18next.t('entityPage.print.printOptions')} component="h6" variant="h6" />
                    </Grid>
                    <Grid item>
                        <IconButton onClick={handleClose}>
                            <CloseOutlined sx={{ color: theme.palette.primary.main }} />
                        </IconButton>
                    </Grid>
                </Grid>
            </DialogTitle>

            <DialogContent style={{ width: '500px' }}>
                <Grid container direction="column" spacing={1} alignItems="center">
                    <Grid item>
                        {type === PrintType.Entity && printItem.entityConnections && printItem.entityConnections.connectionsTemplates.length > 0 && (
                            <RelationshipSelect
                                expandedEntity={instance}
                                entityConnections={printItem.entityConnections}
                                title={i18next.t('entityPage.print.chooseRelationship')}
                            />
                        )}

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
                        {Object.entries(options).map(([key, value]) => {
                            const isDisabled =
                                key === 'previewPropertiesOnly' && 'propertiesPreview' in template && template.propertiesPreview.length === 0;

                            const label = (
                                <FormControlLabel
                                    control={<MeltaCheckbox checked={value.show} onChange={() => value.set((cur) => !cur)} />}
                                    label={i18next.t(value.label)}
                                    disabled={isDisabled}
                                />
                            );
                            return (
                                value && (
                                    <Grid key={key}>
                                        {isDisabled ? (
                                            <MeltaTooltip title={i18next.t('entityPage.print.noPreviewProperties')}>{label}</MeltaTooltip>
                                        ) : (
                                            label
                                        )}
                                    </Grid>
                                )
                            );
                        })}
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
