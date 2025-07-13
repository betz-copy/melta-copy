import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, FormControlLabel, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { SelectCheckbox } from '../SelectCheckBox';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { IFile } from '../../interfaces/preview';
import { getFile } from '../../utils/getFileType';
import { IEntityTemplate, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoProcessInstancePopulated, InstanceProperties } from '../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated, IProcessSingleProperty } from '../../interfaces/processes/processTemplate';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import {
    IConnectionExpanded,
    IConnectionTemplateExpanded,
    IEntityExpandedWithRelatedRelationships,
    ISelectRelationshipTemplates,
} from '../../pages/Entity/components/print';
import RelationshipSelect from '../../pages/Entity/components/print/RelationshipSelection';
import { IConnectionTemplateOfExpandedEntity } from '../../pages/Entity';
import { MeltaTooltip } from '../MeltaTooltip';

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
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: {};
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
    entityConnections?: {
        connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
        expandedRelationshipTemplates: IConnectionTemplateExpanded[];
        expandedRelationships: IConnectionExpanded[];
        selectedConnections: ISelectRelationshipTemplates[];
        setSelectedConnections: React.Dispatch<React.SetStateAction<ISelectRelationshipTemplates[]>>;
    };
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
    entityConnections,
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

    const allRelevantConnections: ISelectRelationshipTemplates[] = [];

    if (entityConnections) {
        const { connectionsTemplates, expandedRelationshipTemplates, expandedRelationships } = entityConnections;
        const entityExpanded = instance as IEntityExpanded;

        const relevantParents = connectionsTemplates.filter(({ relationshipTemplate: { _id }, isExpandedEntityRelationshipSource }) => {
            const entityType = isExpandedEntityRelationshipSource ? 'sourceEntity' : 'destinationEntity';

            const relevantConnections = entityExpanded.connections.filter(
                (connection) =>
                    connection.relationship.templateId === _id && connection[entityType].properties._id === entityExpanded.entity.properties._id,
            );

            return relevantConnections.length > 0;
        });

        const relevantChildren = expandedRelationshipTemplates.filter(
            ({ relationshipTemplate: { _id }, isExpandedEntityRelationshipSource, parentRelationship }) => {
                const relevantParentRelationship = relevantParents.find(
                    (relevantParent) => relevantParent.relationshipTemplate._id === parentRelationship!.relationshipTemplate._id,
                );

                if (!relevantParentRelationship) return false;
                const parentInstance = (instance as IEntityExpanded).connections.find(
                    (connection) => relevantParentRelationship.relationshipTemplate._id === connection.relationship.templateId,
                );
                const entityId = relevantParentRelationship.isExpandedEntityRelationshipSource
                    ? parentInstance?.destinationEntity.properties._id
                    : parentInstance?.sourceEntity.properties._id;

                const entityType = isExpandedEntityRelationshipSource ? 'destinationEntity' : 'sourceEntity';
                const relevantConnections = expandedRelationships.filter(
                    (connection) => connection.relationship.templateId === _id && connection[entityType].properties._id === entityId,
                );

                return relevantConnections.length > 0;
            },
        );

        const relationshipMap = new Map<string, ISelectRelationshipTemplates>();

        relevantParents.forEach((relevantParent) => {
            const parentId = relevantParent.relationshipTemplate._id;

            if (!relationshipMap.has(parentId)) {
                relationshipMap.set(parentId, {
                    ...relevantParent,
                    children: [],
                });
            }
        });

        relevantChildren.forEach((relevantChild) => {
            const parentId = relevantChild.parentRelationship!.relationshipTemplate._id;

            const parentNode = relationshipMap.get(parentId);
            if (parentNode) parentNode.children?.push(relevantChild);
        });

        allRelevantConnections.push(...relationshipMap.values());
    }

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
                        {entityConnections && allRelevantConnections.length > 0 && (
                            <RelationshipSelect
                                options={allRelevantConnections}
                                selectedOptions={entityConnections.selectedConnections}
                                setSelectedOptions={entityConnections.setSelectedConnections}
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
