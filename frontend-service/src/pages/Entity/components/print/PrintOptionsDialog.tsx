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

const PrintOptionsDialog: React.FC<{
    open: boolean;
    handleClose: () => void;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    selected: IConnectionTemplateOfExpandedEntity[];
    setSelected: React.Dispatch<React.SetStateAction<IConnectionTemplateOfExpandedEntity[]>>;
    files: IFile[];
    selectedFiles: IFile[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
    isFilesLoading: Set<string> | undefined;
    setIsFilesLoading: React.Dispatch<React.SetStateAction<Set<string> | undefined>>;
    isFilesError: boolean;
    setIsFilesError: React.Dispatch<React.SetStateAction<boolean>>;
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
    connectionsTemplates,
    selected,
    setSelected,
    files,
    selectedFiles,
    setSelectedFiles,
    isFilesLoading,
    setIsFilesLoading,
    isFilesError,
    setIsFilesError,
    categoriesWithConnectionsTemplates,
    onClick,
    options,
}) => {
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
                        if (isFilesError) {
                            setSelectedFiles([]);
                            setIsFilesError(false);
                            setIsFilesLoading(undefined);
                            toast.error(i18next.t('errorPage.filePrintError'));
                        } else {
                            handleClose();
                            onClick(ev);
                        }
                    }}
                    endIcon={<PrintOutlined />}
                    disabled={isFilesLoading && isFilesLoading.size > 0}
                >
                    {i18next.t('entityPage.print.continue')}
                    {isFilesLoading && isFilesLoading.size > 0 && <CircularProgress size={20} />}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { PrintOptionsDialog };
