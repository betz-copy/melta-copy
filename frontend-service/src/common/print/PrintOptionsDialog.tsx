import React from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, FormControlLabel, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { SelectCheckbox } from '../SelectCheckBox';
import { IMongoRelationshipTemplatePopulated } from '../../interfaces/relationshipTemplates';
import { IMongoCategory } from '../../interfaces/categories';
import { IConnectionTemplateOfExpandedEntity } from '../../pages/Entity';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { IFile } from '../../interfaces/preview';
import { getFile } from '../../utils/getFileType';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoProcessInstancePopulated, InstanceProperties } from '../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated, IProcessSingleProperty } from '../../interfaces/processes/processTemplate';
import { IEntityExpanded } from '../../interfaces/entities';

type IOption = {
    show: boolean;
    set: React.Dispatch<React.SetStateAction<boolean>>;
    label: string;
};

const getFilesFromTemplate = (
    instanceProperties:
        | {
              properties: {
                  _id: string;
                  createdAt: string;
                  updatedAt: string;
                  disabled: boolean;
              } & Record<string, any>;
          }
        | InstanceProperties,
    templateProperties:
        | { type: 'object'; properties: Record<string, IEntitySingleProperty>; required: string[]; hide: string[] }
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
    instance: IEntityExpanded | IMongoProcessInstancePopulated;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: {};
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
    entityConnections?: {
        connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
        selectedConnections: IConnectionTemplateOfExpandedEntity[];
        setSelectedConnections: React.Dispatch<React.SetStateAction<IConnectionTemplateOfExpandedEntity[]>>;
        categoriesWithConnectionsTemplates: {
            category: IMongoCategory;
            connectionsTemplates: {
                relationshipTemplate: IMongoRelationshipTemplatePopulated;
                isExpandedEntityRelationshipSource: boolean;
            }[];
        }[];
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
    const [isLoading, setIsLoading] = React.useState(false);

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

    React.useEffect(() => {
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

    React.useEffect(() => {
        setFilesLoadingStatus(
            selectedFiles.reduce((acc, file) => {
                return { ...acc, [file.id]: true };
            }, {}),
        );
    }, [selectedFiles]);

    React.useEffect(() => {
        if (Object.keys(filesLoadingStatus).length === 0) {
            setIsLoading(false);
            return;
        }
        setIsLoading(Object.values(filesLoadingStatus).some((loading) => loading));
    }, [filesLoadingStatus]);

    const allRelevantConnections: string[] = [];

    let filteredCategoriesWithConnectionsTemplates: {
        category: IMongoCategory;
        connectionsTemplates: {
            relationshipTemplate: IMongoRelationshipTemplatePopulated;
            isExpandedEntityRelationshipSource: boolean;
        }[];
    }[] = [];

    if (entityConnections) {
        entityConnections.connectionsTemplates.map(({ relationshipTemplate: { _id }, isExpandedEntityRelationshipSource }) => {
            const relevantConnections = (instance as IEntityExpanded).connections.filter((connection) => {
                if (isExpandedEntityRelationshipSource) {
                    return (
                        connection.relationship.templateId === _id &&
                        connection.sourceEntity.properties._id === (instance as IEntityExpanded).entity.properties._id
                    );
                }

                return (
                    connection.relationship.templateId === _id &&
                    connection.destinationEntity.properties._id === (instance as IEntityExpanded).entity.properties._id
                );
            });

            if (relevantConnections.length > 0) allRelevantConnections.push(_id);
            return relevantConnections;
        });

        filteredCategoriesWithConnectionsTemplates = entityConnections.categoriesWithConnectionsTemplates
            .map((categoryWithConnection) => {
                const filteredConnectionsTemplates = categoryWithConnection.connectionsTemplates.filter((connection) =>
                    allRelevantConnections.includes(connection.relationshipTemplate._id),
                );

                return {
                    ...categoryWithConnection,
                    connectionsTemplates: filteredConnectionsTemplates,
                };
            })
            .filter((categoryWithConnection) => categoryWithConnection.connectionsTemplates.length > 0);
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
            <DialogContent style={{ width: '500px', height: '240px' }}>
                <Grid container direction="column" spacing={1} alignItems="center">
                    <Grid item>
                        {entityConnections && allRelevantConnections.length > 0 && (
                            <SelectCheckbox
                                title={i18next.t('entityPage.print.chooseRelationship')}
                                options={entityConnections.connectionsTemplates.filter((connection) =>
                                    allRelevantConnections.some((key) => key === connection.relationshipTemplate._id),
                                )}
                                isDraggableDisabled
                                selectedOptions={entityConnections.selectedConnections}
                                setSelectedOptions={entityConnections.setSelectedConnections}
                                getOptionId={({ relationshipTemplate, isExpandedEntityRelationshipSource }) =>
                                    `${relationshipTemplate._id}${isExpandedEntityRelationshipSource}`
                                }
                                getOptionLabel={({
                                    relationshipTemplate: {
                                        displayName,
                                        sourceEntity: { displayName: sourceEntityDisplayName },
                                        destinationEntity: { _id: destinationEntityId, displayName: destinationEntityDisplayName },
                                    },
                                    isExpandedEntityRelationshipSource,
                                }) => {
                                    if (
                                        !isExpandedEntityRelationshipSource &&
                                        destinationEntityId === (instance as IEntityExpanded).entity.templateId
                                    ) {
                                        // special case to differentiate between outgoing/incoming relationships of relationshipTemplate that is of format expandedEntityTemplate -> expandedEntityTemplate
                                        return `${displayName} (${sourceEntityDisplayName} < ${destinationEntityDisplayName})`;
                                    }

                                    return `${displayName} (${sourceEntityDisplayName} > ${destinationEntityDisplayName})`;
                                }}
                                groupsProps={{
                                    useGroups: true,
                                    groups: filteredCategoriesWithConnectionsTemplates,
                                    getGroupId: ({ category: { _id } }) => _id,
                                    getGroupLabel: ({ category: { displayName } }) => displayName,
                                    getGroupOfOption: (option, groups) =>
                                        groups.find((group) =>
                                            group.connectionsTemplates.find(
                                                ({ relationshipTemplate }) => relationshipTemplate._id === option.relationshipTemplate._id,
                                            ),
                                        )!,
                                }}
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
                            return (
                                value && (
                                    <Grid key={key}>
                                        <FormControlLabel
                                            control={<MeltaCheckbox checked={value.show} onChange={() => value.set((cur) => !cur)} />}
                                            label={i18next.t(value.label)}
                                        />
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
