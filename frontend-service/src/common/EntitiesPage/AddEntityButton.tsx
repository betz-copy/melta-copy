import React, { useState, CSSProperties, useRef } from 'react';
import i18next from 'i18next';
import { Box, Dialog } from '@mui/material';
import { useQueryClient } from 'react-query';
import { EntityWizardValues } from '../dialogs/entity';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { CreateOrEditEntityDetails } from '../dialogs/entity/CreateOrEditEntityDialog';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { IEntity } from '../../interfaces/entities';
import { environment } from '../../globals';
import { canUserWriteInstanceOfCategory } from '../../utils/permissions/instancePermissions';
import { IPermissionsOfUser } from '../../services/permissionsService';

const { defaultRowHeight } = environment.agGrid;

const AddEntityButton: React.FC<{
    style?: CSSProperties;
    disabled?: boolean;
    initialStep?: number;
    initialValues?: EntityWizardValues;
    disabledToolTip?: boolean;
    popoverText?: string;
}> = ({ style, children, disabled, initialStep, initialValues, popoverText, disabledToolTip = false }) => {
    const [addEntityWizardState, setAddEntityWizardState] = useState<{ isOpen: boolean; initialStep?: number; initialValues?: EntityWizardValues }>({
        isOpen: false,
    });

    // const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);
    // console.log({ entitiesTableRef });

    // const queryClient = useQueryClient();
    // const { instancesPermissions } = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    // const userHasWritePermissions = canUserWriteInstanceOfCategory(instancesPermissions, template.category);

    return (
        <>
            <IconButtonWithPopover
                popoverText={
                    popoverText || disabled ? i18next.t('permissions.dontHaveWritePermissions') : i18next.t('entitiesTableOfTemplate.addEntity')
                }
                disabledToolTip={disabledToolTip}
                iconButtonProps={{
                    onClick: () => {
                        setAddEntityWizardState({ isOpen: true, initialStep, initialValues });
                    },
                    style,
                }}
                style={style}
                disabled={disabled}
            >
                {children}
            </IconButtonWithPopover>

            {/* <Box sx={{ marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    ref={entitiesTableRef}
                    template={template}
                    showNavigateToRowButton
                    getRowId={(currentEntity) => currentEntity.properties._id}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowModelType="serverSide"
                    // quickFilterText={quickFilterText}
                    rowHeight={defaultRowHeight}
                    fontSize="14px"
                    saveStorageProps={{
                        shouldSaveFilter: true,
                        shouldSaveWidth: true,
                        shouldSaveVisibleColumns: true,
                        shouldSaveSorting: true,
                        shouldSaveColumnOrder: true,
                        shouldSavePagination: true,
                        pageType: page,
                    }}
                    editRowButtonProps={{
                        onClick: (currEntity) => {
                            setAddEntityWizardState({
                                isOpen: true,
                                initialStep: 1,
                                initialValues: currEntity,
                            });
                        },
                        popoverText: i18next.t(
                            !userHasWritePermissions ? 'permissions.dontHaveWritePermissions' : 'entitiesTableOfTemplate.editEntity',
                        ),
                        disabledButton: !userHasWritePermissions,
                    }}
                    // onFilter={() => {
                    //     setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false);
                    // }}
                />
            </Box> */}

            <Dialog open={addEntityWizardState.isOpen} maxWidth="md">
                <CreateOrEditEntityDetails
                    isEditMode={false}
                    entityTemplate={
                        addEntityWizardState.initialValues?.template || {
                            _id: '',
                            displayName: '',
                            name: '',
                            category: {
                                _id: '',
                                name: '',
                                displayName: '',
                                color: '',
                            },
                            properties: {
                                properties: {},
                                required: [],
                                type: 'object',
                                hide: [],
                            },
                            propertiesOrder: [],
                            propertiesTypeOrder: ['properties', 'attachmentProperties'],
                            propertiesPreview: [],
                            uniqueConstraints: [],
                            disabled: false,
                        }
                    }
                    entity={
                        addEntityWizardState.initialValues
                            ? addEntityWizardState.initialValues
                            : { properties: { disabled: false, _id: '', createdAt: '', updatedAt: '' }, templateId: '' }
                    }
                    onSuccessUpdate={(entity) => {
                        entitiesTableRef.current?.updateRowDataClientSide(entity);
                        setAddEntityWizardState((prev) => ({ ...prev, isOpen: false }));
                    }}
                    onCancelUpdate={() =>
                        setAddEntityWizardState({
                            isOpen: false,
                        })
                    }
                    onError={(currEntity) => {
                        setAddEntityWizardState({
                            isOpen: true,
                            initialStep: 1,
                            initialValues: currEntity as EntityWizardValues,
                        });
                    }}
                />
            </Dialog>
        </>
    );
};

export { AddEntityButton };
