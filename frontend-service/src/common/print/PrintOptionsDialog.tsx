import React from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, FormControlLabel, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { SelectCheckbox } from '../SelectCheckbox';
import { IMongoRelationshipTemplatePopulated } from '../../interfaces/relationshipTemplates';
import { IMongoCategory } from '../../interfaces/categories';
import { IEntityExpanded } from '../../interfaces/entities';
import { IConnectionTemplateOfExpandedEntity } from '../../pages/Entity';
import { MeltaCheckbox } from '../MeltaCheckbox';
import { IFile } from '../../interfaces/preview';
import { getFile } from '../../utils/getFileType';
import { isUnsupported, isVideoOrAudio } from '../FilePreview/PreviewDialog';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { InstanceProperties } from '../../interfaces/processes/processInstance';
import { IProcessDetails } from '../../interfaces/processes/processTemplate';

type IOption = {
    show: boolean;
    set: React.Dispatch<React.SetStateAction<boolean>>;
    label: string;
};

export const getFilesFromTemplate = (template: any, instance: any): IFile[] => {
    return Object.keys(template.properties)
        .flatMap((propertyKey) => {
            const propertySchema = template.properties[propertyKey];
            const propertyValue = instance[propertyKey];
            console.log({ propertyKey });
            console.log({ propertySchema });
            console.log({ propertyValue });

            if (propertyValue) {
                if (propertySchema.format === 'fileId') return [getFile(propertyValue)];
                if (propertySchema.type === 'array' && propertySchema.items?.format === 'fileId')
                    return propertyValue.map((id: string) => getFile(id));
            }
            return [];
        })
        .filter((file) => file !== undefined) as IFile[];
};

export const handlePrintError = async (selectedFiles: IFile[], setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>) => {
    const refetchPromises = selectedFiles.map((file) => {
        if (file.refetch) return file.refetch();
        return undefined;
    });

    const arrRefetch = await Promise.all(refetchPromises);
    try {
        arrRefetch.forEach((refetch) => {
            if (!refetch) return;
            if (refetch.isError) throw new Error('Refetch error');
        });
    } catch {
        setSelectedFiles([]);
        toast.error(i18next.t('errorPage.filePrintError'));
    }
};

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    instanceProperties:
        | {
              properties: {
                  _id: string;
                  createdAt: string;
                  updatedAt: string;
                  disabled: boolean;
              } & Record<string, any>;
          }
        | InstanceProperties;
    templateProperties: IMongoEntityTemplatePopulated | IProcessDetails;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: {};
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
    entityConnections?: {
        expandedEntity: IEntityExpanded;
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
    instanceProperties,
    templateProperties,
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
        console.log({ templateProperties });
        console.log({ instanceProperties });

        return getFilesFromTemplate(templateProperties, instanceProperties);
    }, [templateProperties, instanceProperties]);

    React.useEffect(() => {
        const currFiles = getPropertiesFiles().filter((file) => !isVideoOrAudio(file.contentType) && !isUnsupported(file.contentType));
        // .concat(getStepsFiles().filter((file) => !isVideoOrAudio(file.contentType) && !isUnsupported(file.contentType)));
        setFiles(currFiles);
        setSelectedFiles([]);
    }, [getPropertiesFiles, /* getStepsFiles, */ setFiles, setSelectedFiles]);

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
                    <Grid item>
                        {entityConnections && entityConnections.selectedConnections.length !== 0 && (
                            <SelectCheckbox
                                title={i18next.t('entityPage.print.chooseRelationship')}
                                options={entityConnections.connectionsTemplates}
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
                                        destinationEntityId === entityConnections.expandedEntity.entity.templateId
                                    ) {
                                        // special case to differentiate between outgoing/incoming relationships of relationshipTemplate that is of format expandedEntityTemplate -> expandedEntityTemplate
                                        return `${displayName} (${sourceEntityDisplayName} < ${destinationEntityDisplayName})`;
                                    }

                                    return `${displayName} (${sourceEntityDisplayName} > ${destinationEntityDisplayName})`;
                                }}
                                groupsProps={{
                                    useGroups: true,
                                    groups: entityConnections.categoriesWithConnectionsTemplates,
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

                        {/* <Grid>
                            <FormControlLabel
                                control={
                                    <MeltaCheckbox
                                        checked={options.showPreviewPropertiesOnly}
                                        onChange={() => options.setShowPreviewPropertiesOnly((cur) => !cur)}
                                    />
                                }
                                label={i18next.t('entityPage.print.showOnlyPreviewProperties')}
                            />
                        </Grid>
                        <Grid>
                            <FormControlLabel
                                control={<MeltaCheckbox checked={options.showDate} onChange={() => options.setShowDate((cur) => !cur)} />}
                                label={i18next.t('entityPage.print.showDate')}
                            />
                        </Grid>
                        <Grid>
                            <FormControlLabel
                                control={<MeltaCheckbox checked={options.showDisabled} onChange={() => options.setShowDisabled((cur) => !cur)} />}
                                label={i18next.t('entityPage.print.showDisabled')}
                            />
                        </Grid>
                        <Grid>
                            <FormControlLabel
                                control={
                                    <MeltaCheckbox checked={options.showEntityDates} onChange={() => options.setShowEntityDates((cur) => !cur)} />
                                }
                                label={i18next.t('entityPage.print.showEntityDates')}
                            />
                        </Grid> */}
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
