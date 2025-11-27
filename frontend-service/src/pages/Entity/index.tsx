import { AccountBalanceWallet } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, CircularProgress, Grid, Tab, useTheme } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams, useSearchParams } from 'wouter';
import { getChildTemplatesFilter } from '../../common/inputs/TemplateEntitiesAutocomplete';
import '../../css/pages.css';
import '../../css/pages.css';
import { IChildTemplateMap, IChildTemplatePopulated } from '../../interfaces/childTemplates';
import { ISearchFilter } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { checkUserTemplatePermission } from '../../utils/permissions/instancePermissions';
import { getFullRelationshipTemplates, groupChildTemplatesByParent } from '../../utils/templates';
import { EntityDetails } from './components/EntityDetails';
import { EntityTopBar } from './components/TopBar';
import { EntityConnections } from './entityConnections';
import { RelationshipIcon } from './RelationshipIcon';
import { WalletTransfers } from './walletTransfers';

export const getButtonState = (
    isEntityDisabled: boolean,
    hasWritePermissionToCurrTemplate: boolean,
    relatedTemplate: IMongoEntityTemplatePopulated,
    groupChildTemplate: Record<string, IChildTemplatePopulated[]>,
    permissions?: ISubCompactPermissions,
) => {
    let isEditButtonsDisabled = false;
    let disabledButtonText = '';

    const childIds = groupChildTemplate[relatedTemplate._id]?.map(({ _id }) => _id);

    const categoryPermission = permissions?.instances?.categories?.[relatedTemplate.category._id];
    const permissionToRelatedTemplate =
        categoryPermission?.entityTemplates?.[relatedTemplate._id] ||
        childIds?.map((childId) => categoryPermission?.entityTemplates?.[childId]).find((perm) => !!perm) ||
        categoryPermission;

    if (isEntityDisabled) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('entityPage.disabledEntity');
    } else if (!hasWritePermissionToCurrTemplate) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissions');
    } else if (!permissions?.admin && !permissions?.instances) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissionsToTemplate');
    } else if (!permissions?.admin && permissionToRelatedTemplate?.scope !== PermissionScope.write) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissionsToTemplate');
    } else {
        disabledButtonText = i18next.t('ruleManagement.create-relationship');
    }

    return { isEditButtonsDisabled, disabledButtonText, hasPermissionToRelatedTemplate: Boolean(permissions?.admin || permissionToRelatedTemplate) };
};

export interface INestedRelationshipTemplates {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    isExpandedEntityRelationshipSource: boolean; // for relationship that is of format currentEntityTemplate -> currentEntityTemplate, we want it twice, once with outgoing connections of expandedEntity, and once with incoming connections of expandedEntity
    hasInstances: boolean;
    depth: number;
    parentRelationship?: IMongoRelationshipTemplatePopulated;
    children: INestedRelationshipTemplates[];
}

const Entity: React.FC = () => {
    const theme = useTheme();
    const { entityId } = useParams();
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const { setDisabledActions, setCurrentStep } = useTour();

    const [searchParams, _setSearchParams] = useSearchParams();
    const childTemplateId = searchParams.get('childTemplateId') ?? undefined;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const templateIds = Array.from(entityTemplates.keys());

    const groupChildTemplate = groupChildTemplatesByParent(childTemplates, entityTemplates);

    const filters: any =
        Object.entries(groupChildTemplate).length > 0
            ? Object.fromEntries(
                  Object.entries(groupChildTemplate)
                      .map(([key, children]) => {
                          const childFilter = getChildTemplatesFilter(children, workspace, currentUser, true);
                          if (!childFilter) return null;
                          return [key, { filter: childFilter }] as const;
                      })
                      .filter((f): f is readonly [string, { filter: ISearchFilter }] => f !== null),
              )
            : undefined;

    const expanded = entityId ? { [entityId]: { maxLevel: 1 } } : {};
    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, expanded, { templateIds }], () =>
        getExpandedEntityByIdRequest(entityId!, expanded, { templateIds, childTemplateId }, {}, filters),
    );

    const [selectTransfersOrConnections, setSelectTransfersOrConnections] = useState('walletTransfers');

    useEffect(() => {
        if (!expandedEntity) return;

        setCurrentStep((currStep) => currStep + 1);
        setDisabledActions(false);
    }, [expandedEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    const currentEntityTemplate = childTemplateId
        ? childTemplates.get(childTemplateId)!
        : entityTemplates.get(expandedEntity?.entity.templateId ?? '')!;

    const connectionsTemplates = useMemo(() => {
        if (!currentEntityTemplate) return;

        return getFullRelationshipTemplates(
            relationshipTemplates,
            entityTemplates,
            {
                ...currentEntityTemplate,
                _id: childTemplateId ? (currentEntityTemplate as IChildTemplatePopulated).parentTemplate._id : currentEntityTemplate._id,
                displayName: childTemplateId
                    ? (currentEntityTemplate as IChildTemplatePopulated).parentTemplate.displayName
                    : currentEntityTemplate.displayName,
            },
            1,
            undefined,
            expandedEntity,
            groupChildTemplate,
        );
    }, [currentEntityTemplate, expandedEntity]);

    // Early return if data is not ready - must be after all hooks
    if (!expandedEntity || !currentEntityTemplate || !currentEntityTemplate.category) {
        return <CircularProgress />;
    }
    const isWalletTemplate = Object.values(currentEntityTemplate.properties.properties).find((property) => property.accountBalance);

    const isEntityDisabled = !!expandedEntity?.entity.properties.disabled;
    const hasWritePermissionToCurrTemplate = checkUserTemplatePermission(
        currentUser.currentWorkspacePermissions,
        currentEntityTemplate?.category?._id ?? '',
        currentEntityTemplate?._id ?? '',
        PermissionScope.write,
    );

    const getButtonStateByRelatedTemplate = (relatedTemplate: IMongoEntityTemplatePopulated) => {
        const { isEditButtonsDisabled, disabledButtonText, hasPermissionToRelatedTemplate } = getButtonState(
            isEntityDisabled,
            hasWritePermissionToCurrTemplate,
            relatedTemplate,
            groupChildTemplate,
            currentUser.currentWorkspacePermissions,
        );
        return { isEditButtonsDisabled, disabledButtonText, hasPermissionToRelatedTemplate };
    };

    return (
        <>
            <EntityTopBar
                entityTemplate={currentEntityTemplate}
                expandedEntity={expandedEntity}
                connectionsTemplates={(connectionsTemplates ?? []).filter((relTemplate) => relTemplate.hasInstances)}
            />
            <Grid className="pageMargin">
                <Grid marginTop="20px" data-tour="entity-details">
                    <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
                </Grid>

                <Grid>
                    {!isWalletTemplate ? (
                        <EntityConnections
                            currentEntityTemplate={currentEntityTemplate}
                            expandedEntity={expandedEntity}
                            templateIds={templateIds}
                            connectionsTemplates={connectionsTemplates}
                            getButtonStateByRelatedTemplate={getButtonStateByRelatedTemplate}
                            groupChildTemplate={groupChildTemplate}
                        />
                    ) : (
                        <TabContext value={selectTransfersOrConnections}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <TabList
                                    onChange={(_event, newValue) => setSelectTransfersOrConnections(newValue)}
                                    slotProps={{
                                        indicator: { style: { display: 'none' } },
                                    }}
                                    sx={{
                                        '& .MuiTab-root': {
                                            minWidth: 'auto',
                                            p: 1,
                                        },
                                        mb: 0,
                                    }}
                                >
                                    <Tab icon={<RelationshipIcon />} value="walletTransfers" />
                                    <Tab icon={<AccountBalanceWallet sx={{ color: theme.palette.primary.main }} />} value="connectionsByCategories" />
                                </TabList>
                            </Box>
                            <TabPanel value="walletTransfers" sx={{ p: 0 }}>
                                <EntityConnections
                                    currentEntityTemplate={currentEntityTemplate}
                                    expandedEntity={expandedEntity}
                                    templateIds={templateIds}
                                    connectionsTemplates={connectionsTemplates}
                                    getButtonStateByRelatedTemplate={getButtonStateByRelatedTemplate}
                                    groupChildTemplate={groupChildTemplate}
                                />
                            </TabPanel>
                            <TabPanel value="connectionsByCategories" sx={{ p: 0 }}>
                                <WalletTransfers
                                    connectionsTemplates={connectionsTemplates}
                                    templateId={currentEntityTemplate._id}
                                    expandedEntity={expandedEntity}
                                    getButtonStateByRelatedTemplate={getButtonStateByRelatedTemplate}
                                />
                            </TabPanel>
                        </TabContext>
                    )}
                </Grid>
            </Grid>
        </>
    );
};

export default Entity;
