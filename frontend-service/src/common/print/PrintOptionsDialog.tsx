import { CloseOutlined, PrintOutlined } from '@mui/icons-material';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IEntityTemplate, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IFile } from '../../interfaces/preview';
import { IMongoProcessInstancePopulated, InstanceProperties } from '../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated, IProcessSingleProperty } from '../../interfaces/processes/processTemplate';
import { IConnectionTemplateOfExpandedEntity } from '../../pages/Entity';
import { IEntityExpandedWithRelatedRelationships } from '../../pages/Entity/components/print';
import RelationshipSelect from '../../pages/Entity/components/print/RelationshipSelection';
import { getFile } from '../../utils/getFileType';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { MeltaTooltip } from '../MeltaTooltip';
import { SelectCheckbox } from '../SelectCheckBox';

type IOption = {
    show: boolean;
    set: React.Dispatch<React.SetStateAction<boolean>>;
    label: string;
};

const getFilesFromTemplate = (
    instanceProperties: IEntity | InstanceProperties,
    templateProperties:
        | IEntityTemplate['properties']
        | {
              type: 'object';
              properties: Record<string, IProcessSingleProperty>;
              required: string[];
          },
): IFile[] => {
    return Object.keys(templateProperties.properties)
        .flatMap((propertyKey) => {
            const propertySchema = templateProperties.properties[propertyKey];
            const propertyValue = instanceProperties[propertyKey];

            if (propertyValue) {
                if (propertySchema.format === 'fileId') return [getFile(propertyValue)];
                if (propertySchema.type === 'array' && propertySchema.items?.format === 'fileId')
                    return propertyValue.map((id: string) => getFile(id));
            }
            return [];
        })
        .filter((file) => file !== undefined) as IFile[];
};

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    template: IMongoEntityTemplatePopulated | IMongoProcessTemplatePopulated;
    instance: IEntityExpandedWithRelatedRelationships | IMongoProcessInstancePopulated;
    connections: IConnectionTemplateOfExpandedEntity[];
    setConnections: React.Dispatch<IConnectionTemplateOfExpandedEntity[]>;
    selectedConnections: IConnectionTemplateOfExpandedEntity[];
    setSelectedConnections: React.Dispatch<React.SetStateAction<IConnectionTemplateOfExpandedEntity[]>>;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: {};
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
    options: {
        date?: IOption;
        disabled?: IOption;
        entityDates?: IOption;
        previewPropertiesOnly?: IOption;
        processSummary?: IOption;
    };
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({
    open,
    handleClose,
    template,
    instance,
    connections,
    setConnections,
    selectedConnections,
    setSelectedConnections,
    files,
    setFiles,
    selectedFiles,
    setSelectedFiles,
    filesLoadingStatus,
    setFilesLoadingStatus,
    onClick,
    options,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const getPropertiesFiles = React.useCallback((): IFile[] => {
        if ('category' in template && 'entity' in instance) return getFilesFromTemplate(instance.entity.properties, template.properties);
        return getFilesFromTemplate(
            (instance as IMongoProcessInstancePopulated).details,
            (template as IMongoProcessTemplatePopulated).details.properties,
        );
    }, [template, instance]);

    const getProcessStepsFiles = React.useCallback((): IFile[] => {
        if ('steps' in template && 'steps' in instance) {
            return template.steps
                .flatMap((stepTemplate) => {
                    return instance.steps.flatMap((step) => {
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
        }
        return [];
    }, [instance, template]);

    useEffect(() => {
        const currFiles = getPropertiesFiles()
            .filter((file) => file.contentType !== 'video' && file.contentType !== 'audio' && file.contentType !== 'unsupported')
            .concat(
                getProcessStepsFiles().filter(
                    (file) => file.contentType !== 'video' && file.contentType !== 'audio' && file.contentType !== 'unsupported',
                ),
            );
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
            <DialogContent style={{ width: '500px' }}>
                <Grid container direction="column" spacing={1} alignItems="center">
                    <Grid item>
                        {connections.length > 0 && (
                            <RelationshipSelect
                                expandedEntity={instance as IEntityExpanded}
                                connections={connections}
                                setConnections={setConnections}
                                selectedConnections={selectedConnections}
                                setSelectedConnections={setSelectedConnections}
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
