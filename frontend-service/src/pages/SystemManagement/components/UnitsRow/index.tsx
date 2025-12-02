import AddCircleIcon from '@mui/icons-material/AddCircle';
import { FormControlLabel, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { AreYouSureDialog } from '../../../../common/dialogs/AreYouSureDialog';
import MeltaCheckbox from '../../../../common/MeltaDesigns/MeltaCheckbox';
import Tree from '../../../../common/Tree';
import { IMongoUnit, IUnitHierarchy } from '../../../../interfaces/units';
import { getUnitHierarchy } from '../../../../services/userService';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { useUnitStore } from '../../../../stores/unit';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { CardMenu } from '../CardMenu';
import Header from './Header';
import { treeNodeContent, treeNodeGroupTransition } from './styles';
import { useSearchUnits } from './useSearchUnits';
import { defaultInitialValues, UnitWizard, useUnitMutation } from './Wizard';
import { canEnableUnit } from './Wizard/CreateOrEdit';

const UnitsRow: React.FC = () => {
    const [unitToDisable, setUnitToDisable] = useState<{ _id: string; disabled: boolean }>();
    const [effectChildrenOnEnable, setEffectChildrenOnEnable] = useState<boolean>(true);
    const [wizardDialogState, setWizardDialogState] = useState<{ isWizardOpen: boolean; unit: IMongoUnit | Partial<IMongoUnit> | null }>({
        isWizardOpen: false,
        unit: null,
    });

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const enabledUnits = useUnitStore((state) => state.enabledUnits);

    const { data: unitHierarchies = [] } = useQuery({
        queryKey: ['unitHierarchy', workspace._id],
        queryFn: () => getUnitHierarchy(workspace._id),
        initialData: [],
    });

    const { expandedIds, onSearch, searchedUnits, setExpandedIds, setIsShowDisabled, setSearchedUnits, isShowDisabled } =
        useSearchUnits(unitHierarchies);

    const handleClose = () => {
        setUnitToDisable(undefined);
        setEffectChildrenOnEnable(true);
        setWizardDialogState({ isWizardOpen: false, unit: null });
    };

    const onSuccess = (unit: Partial<IMongoUnit> & { _id: string }) => {
        const parentId = unit.parentId;

        if (parentId) setExpandedIds((prev) => [...prev, parentId]);
        handleClose();
    };

    const { mutateAsync } = useUnitMutation(onSuccess);

    const handleDragEnd = async ({ itemId, newPosition }) => {
        await mutateAsync({
            unit: { _id: itemId, parentId: newPosition?.parentId },
            isEditMode: true,
        });
    };

    const renderCardMenu = (unit: IUnitHierarchy) => (
        <CardMenu
            disabledProps={{
                isDisabled: unit.disabled,
                tooltipTitle: '',
                isEditDisabled: false,
                disableForReadPermissions: canEnableUnit(enabledUnits, unit.parentId),
            }}
            onEditClick={() => setWizardDialogState({ isWizardOpen: true, unit })}
            onDisableClick={() => {
                setUnitToDisable({
                    _id: unit._id,
                    disabled: !unit.disabled,
                });
            }}
            additionalButtons={[
                {
                    title: i18next.t('wizard.unit.addUnitBelow'),
                    key: 'Add Unit Below',
                    onClick: () => setWizardDialogState({ isWizardOpen: true, unit: { parentId: unit._id, disabled: unit.disabled } }),
                    icon: <AddCircleIcon color="action" />,
                },
            ]}
        />
    );

    return (
        <Grid container direction="column" marginBottom="30px" gap="30px">
            <Header
                expandedIds={expandedIds}
                setExpandedIds={setExpandedIds}
                hierarchy={unitHierarchies}
                setFilteredUnits={setSearchedUnits}
                setWizardDialogState={setWizardDialogState}
                isShowDisabled={isShowDisabled}
                setIsShowDisabled={setIsShowDisabled}
                onSearch={onSearch}
            />

            <Grid direction="column" width="100%">
                {unitHierarchies.length ? (
                    <Tree
                        filteredTreeItems={searchedUnits}
                        getStyles={({ itemDepth, node, status }) => ({
                            treeItemContent: treeNodeContent(status, node.disabled, itemDepth, darkMode),
                            treeNodeGroupTransition,
                        })}
                        treeItems={unitHierarchies}
                        getItemId={({ _id }) => _id}
                        getItemLabel={({ name }) => name}
                        removeDivider
                        isSelectable={false}
                        isDraggable
                        allowDraggingBetweenParents
                        dragAllowNewRoot
                        preExpandedItemIds={expandedIds}
                        onExpandedItemsChange={(_e, items) => setExpandedIds(items)}
                        onDragEnd={handleDragEnd}
                        additionalOptions={[renderCardMenu]}
                    />
                ) : (
                    <Typography>{i18next.t('noOptions')}</Typography>
                )}
            </Grid>
            <UnitWizard
                open={wizardDialogState.isWizardOpen}
                initialValues={{ ...defaultInitialValues, ...wizardDialogState.unit }}
                handleClose={handleClose}
                isEditMode={Boolean(wizardDialogState.unit?._id)}
                onSuccess={onSuccess}
            />
            <AreYouSureDialog
                handleClose={handleClose}
                body={
                    unitToDisable?.disabled ? (
                        <Typography>{i18next.t('wizard.unit.warning.disable')}</Typography>
                    ) : (
                        <FormControlLabel
                            label={i18next.t('wizard.unit.warning.enable')}
                            control={<MeltaCheckbox checked={effectChildrenOnEnable} onChange={() => setEffectChildrenOnEnable((prev) => !prev)} />}
                        />
                    )
                }
                open={!!unitToDisable?._id}
                onNo={handleClose}
                onYes={async () => {
                    if (!unitToDisable) return;
                    await mutateAsync({
                        unit: unitToDisable,
                        isEditMode: true,
                        effectChildrenOnEnable,
                    });
                }}
            />
        </Grid>
    );
};

export default UnitsRow;
