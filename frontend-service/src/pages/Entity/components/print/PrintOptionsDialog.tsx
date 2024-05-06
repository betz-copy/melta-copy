import React from 'react';
import { Dialog, DialogTitle, DialogContent, Grid, Button, FormControlLabel, DialogActions, IconButton, CircularProgress } from '@mui/material';
import { PrintOutlined, CloseOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { SelectCheckbox } from '../../../../common/SelectCheckbox';
import { IMongoRelationshipTemplatePopulated } from '../../../../interfaces/relationshipTemplates';
import { IMongoCategory } from '../../../../interfaces/categories';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IConnectionTemplateOfExpandedEntity } from '../..';
import { MeltaCheckbox } from '../../../../common/MeltaCheckbox';
import { IFile } from '../../../../interfaces/preview';
import { getFileName } from '../../../../utils/getFileName';
import { getFileExtension, getPreviewContentType } from '../../../../utils/getFileType';
import { isUnsupported, isVideoOrAudio } from '../../../../common/FilePreview/PreviewDialog';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    expandedEntity: IEntityExpanded;
    entityTemplate: IMongoEntityTemplatePopulated;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    selected: IConnectionTemplateOfExpandedEntity[];
    setSelected: React.Dispatch<React.SetStateAction<IConnectionTemplateOfExpandedEntity[]>>;
    files: IFile[];
    setFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    filesLoadingStatus: {};
    setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
    categoriesWithConnectionsTemplates: {
        category: IMongoCategory;
        connectionsTemplates: {
            relationshipTemplate: IMongoRelationshipTemplatePopulated;
            isExpandedEntityRelationshipSource: boolean;
        }[];
    }[];
    options: {
        showDate: boolean;
        setShowDate: React.Dispatch<React.SetStateAction<boolean>>;
        showDisabled: boolean;
        setShowDisabled: React.Dispatch<React.SetStateAction<boolean>>;
        showEntityDates: boolean;
        setShowEntityDates: React.Dispatch<React.SetStateAction<boolean>>;
        showPreviewPropertiesOnly: boolean;
        setShowPreviewPropertiesOnly: React.Dispatch<React.SetStateAction<boolean>>;
    };
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}> = ({
    open,
    handleClose,
    expandedEntity,
    entityTemplate,
    connectionsTemplates,
    selected,
    setSelected,
    files,
    setFiles,
    selectedFiles,
    setSelectedFiles,
    filesLoadingStatus,
    setFilesLoadingStatus,
    categoriesWithConnectionsTemplates,
    onClick,
    options,
}) => {
    const getEntityFiles = React.useCallback((): IFile[] => {
        return entityTemplate.propertiesOrder
            .map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = expandedEntity.entity.properties[propertyKey];
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
    }, [entityTemplate, expandedEntity]);

    React.useEffect(() => {
        const currFiles = getEntityFiles().filter((file) => !isVideoOrAudio(file.contentType) && !isUnsupported(file.contentType));
        setFiles(currFiles);
        setSelectedFiles([]);
    }, [getEntityFiles, setFiles, setSelectedFiles]);

    React.useEffect(() => {
        setFilesLoadingStatus(
            selectedFiles.reduce((acc, file) => {
                return { ...acc, [file.id]: true };
            }, {}),
        );
    }, [selectedFiles, setFilesLoadingStatus]);

    const handlePrintError = async () => {
        const refetchPromises = selectedFiles.map((file) => {
            if (file.refetch) return file.refetch();
            return undefined;
        });

        const arrRefetch = await Promise.all(refetchPromises);
        try {
            arrRefetch.forEach((refetch) => {
                if (!refetch) return;

                if (refetch.isError) {
                    setSelectedFiles([]);
                    toast.error(i18next.t('errorPage.filePrintError'));
                }
            });
        } catch {
            setSelectedFiles([]);
            toast.error(i18next.t('errorPage.filePrintError'));
        }
    };

    React.useEffect(() => {
        handlePrintError();
    }, [selectedFiles]);

    const [isLoading, setIsLoading] = React.useState(false);
    React.useEffect(() => {
        if (Object.keys(filesLoadingStatus).length === 0) {
            setIsLoading(false);
            return;
        }
        setIsLoading(Object.values(filesLoadingStatus).some((loading) => loading));
    }, [filesLoadingStatus]);

    console.log({ selectedFiles });

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
                        <SelectCheckbox
                            title={i18next.t('entityPage.print.chooseRelationship')}
                            options={connectionsTemplates}
                            isDraggableDisabled
                            selectedOptions={selected}
                            setSelectedOptions={setSelected}
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
                                if (!isExpandedEntityRelationshipSource && destinationEntityId === expandedEntity.entity.templateId) {
                                    // special case to differentiate between outgoing/incoming relationships of relationshipTemplate that is of format expandedEntityTemplate -> expandedEntityTemplate
                                    return `${displayName} (${sourceEntityDisplayName} < ${destinationEntityDisplayName})`;
                                }

                                return `${displayName} (${sourceEntityDisplayName} > ${destinationEntityDisplayName})`;
                            }}
                            groupsProps={{
                                useGroups: true,
                                groups: categoriesWithConnectionsTemplates,
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
                        <Grid>
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
