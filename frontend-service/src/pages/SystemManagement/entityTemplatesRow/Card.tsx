import { AppRegistration as AppRegistrationIcon, ArrowBackIosNew, InfoOutlined } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { UseMutateAsyncFunction, useQueryClient } from 'react-query';
import { defaultEntityTemplatePopulated } from '.';
import { ColoredEnumChip } from '../../../common/ColoredEnumChip';
import { CustomIcon } from '../../../common/CustomIcon';
import { ActionMode, IMutationWithPayload } from '../../../common/dialogs/ChildTemplateDialog';
import { emptyEntityTemplate } from '../../../common/dialogs/entity';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { ICategoryMap } from '../../../interfaces/categories';
import { EntityTemplateType, IChildTemplateMap, IChildTemplatePopulated, TemplateItem, ViewType } from '../../../interfaces/childTemplates';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { getCountByTemplateIdsRequest } from '../../../services/entitiesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getFileName } from '../../../utils/getFileName';
import { checkUserChildTemplatePermission } from '../../../utils/permissions/templatePermissions';
import { ViewingCard } from '../components/Card';
import { CardMenu } from '../components/CardMenu';

const getChildTemplateChips = (childTemplate: IChildTemplatePopulated) => {
    const chips: Array<{ color: string; label: string }> = [];

    if (childTemplate.isFilterByUserUnit) {
        chips.push({
            color: '#2CB93A',
            label: i18next.t('childTemplate.permissionsPage.unit'),
        });
    }

    if (childTemplate.isFilterByCurrentUser) {
        chips.push({
            color: '#0072C6',
            label: i18next.t('childTemplate.permissionsPage.user'),
        });
    }

    if (childTemplate.viewType === ViewType.userPage) {
        chips.push({
            color: '#CF9030',
            label: i18next.t('childTemplate.permissionsPage.userPage'),
        });
    }

    return chips;
};

interface EntityTemplateCardProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    setEntityTemplateWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
        }>
    >;
    setDeleteEntityTemplateDialogState: React.Dispatch<
        React.SetStateAction<{
            isDialogOpen: boolean;
            entityTemplateId: string | null;
        }>
    >;
    setAddActionsDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: TemplateItem | null;
        }>
    >;
    setAddChildTemplateDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
            mutationProps?: IMutationWithPayload;
        }>
    >;
    updateEntityTemplateStatusAsync: UseMutateAsyncFunction<
        IMongoEntityTemplatePopulated,
        unknown,
        {
            entityTemplateId: string;
            disabled: boolean;
        },
        unknown
    >;
    entityHasWritePermission: boolean;
    isDisabledView?: boolean;
    isChildTemplate?: boolean;
    title?: string;
    categoryColor: string;
}

const EntityTemplateCard: React.FC<EntityTemplateCardProps> = ({
    entityTemplate,
    setEntityTemplateWizardDialogState,
    setDeleteEntityTemplateDialogState,
    setAddActionsDialogState,
    setAddChildTemplateDialogState,
    updateEntityTemplateStatusAsync,
    entityHasWritePermission,
    isDisabledView = false,
    isChildTemplate = false,
    title = entityTemplate.displayName,
    categoryColor,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates');
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const hasWritePermission = useMemo(() => {
        if (isChildTemplate) {
            const childTemplate = childTemplates?.get(entityTemplate._id);
            if (!childTemplate) return false;
            return checkUserChildTemplatePermission(currentUser.currentWorkspacePermissions, childTemplate, PermissionScope.write);
        }
        return entityHasWritePermission;
    }, [isChildTemplate, entityTemplate._id, childTemplates, currentUser, entityHasWritePermission]);

    const theme = useTheme();
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const { properties, propertiesOrder, propertiesPreview, propertiesTypeOrder, uniqueConstraints, fieldGroups } = entityTemplate;
    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(false);

    const checkEntityTemplateHasEntities = async (templates: IMongoEntityTemplatePopulated[]) => {
        const templateIds = templates.map(({ _id }) => _id);
        const entitiesCountByTemplates = await getCountByTemplateIdsRequest(templateIds);
        const countByTemplateIdMap = new Map(entitiesCountByTemplates.map(({ templateId, count }) => [templateId, count]));
        const templatesHaveEntities = templates.some(({ _id }) => {
            const count = countByTemplateIdMap.get(_id) || 0;
            return count > 0;
        });

        setIsDeleteButtonDisabled(!hasWritePermission || templatesHaveEntities);
    };

    const entityTemplateCardTooltip = () => {
        if (!hasWritePermission) return i18next.t('systemManagement.entityTemplateEditDisabled');
        if (entityTemplate.disabled) return i18next.t('systemManagement.disabledEntityTemplate');
        if (isDeleteButtonDisabled) return i18next.t('systemManagement.cannotDeleteWithEntities');
        return '';
    };

    const isFile = (value: IEntitySingleProperty) => value.format === 'fileId' || value.items?.format === 'fileId';

    const filesProps = useMemo(
        () =>
            Object.entries(
                childTemplates?.get(entityTemplate._id)
                    ? childTemplates.get(entityTemplate._id)?.properties.properties || {}
                    : entityTemplate.properties?.properties || {},
            ).filter(([, value]) => isFile(value) && value.display !== false),
        [childTemplates, entityTemplate._id],
    );

    return (
        <ViewingCard
            width={250}
            title={
                <Grid
                    container
                    direction="row"
                    justifyContent="space-between"
                    minWidth="232px"
                    alignItems="center"
                    paddingLeft="20px"
                    flexWrap="nowrap"
                >
                    <Grid container alignItems="center" gap="10px" flexBasis="90%">
                        <Grid>
                            <EntityTemplateColor
                                entityTemplateColor={getEntityTemplateColor(childTemplates?.get(entityTemplate._id) ?? entityTemplate, categoryColor)}
                                style={{ height: '18px' }}
                            />
                        </Grid>

                        <Grid sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                            {entityTemplate.iconFileId ? (
                                <CustomIcon iconUrl={entityTemplate.iconFileId} height="24px" width="24px" />
                            ) : (
                                <AppRegistrationIcon style={{ ...workspace.metadata.iconSize }} fontSize="small" />
                            )}
                        </Grid>
                        <Grid>
                            <MeltaTooltip title={title}>
                                <Typography
                                    style={{
                                        fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                        color: theme.palette.primary.main,
                                        fontWeight: '400',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        width: '130px',
                                    }}
                                >
                                    {title}
                                </Typography>
                            </MeltaTooltip>
                        </Grid>
                    </Grid>
                    <Grid container flexBasis="10%" alignItems="center" justifyContent="flex-end">
                        {isHoverOnCard && !isDisabledView && (
                            <CardMenu
                                onOptionsIconClose={() => setIsHoverOnCard(false)}
                                onOptionsIconClick={async () => {
                                    if (childTemplates?.get(entityTemplate._id)) {
                                        return;
                                    }
                                    await checkEntityTemplateHasEntities([entityTemplate]);
                                }}
                                onEditClick={() => {
                                    if (childTemplates?.get(entityTemplate._id)) {
                                        const childTemplate = childTemplates.get(entityTemplate._id)!;
                                        setAddChildTemplateDialogState({
                                            isWizardOpen: true,
                                            entityTemplate: {
                                                ...entityTemplate,
                                                _id: childTemplate.parentTemplate._id,
                                            },
                                            mutationProps: {
                                                actionType: ActionMode.Update,
                                                payload: childTemplate,
                                            },
                                        });
                                    } else {
                                        setEntityTemplateWizardDialogState({ isWizardOpen: true, entityTemplate });
                                    }
                                    setIsHoverOnCard(false);
                                }}
                                onDuplicateClick={
                                    childTemplates?.get(entityTemplate._id)
                                        ? () => {
                                              const childTemplate = childTemplates?.get(entityTemplate._id)!;
                                              setAddChildTemplateDialogState({
                                                  isWizardOpen: true,
                                                  entityTemplate: childTemplate.parentTemplate,
                                                  mutationProps: {
                                                      actionType: ActionMode.Duplicate,
                                                      payload: {
                                                          ...childTemplate,
                                                          category: emptyEntityTemplate.category,
                                                          displayName: emptyEntityTemplate.displayName,
                                                          name: emptyEntityTemplate.name,
                                                          description: '',
                                                      },
                                                  },
                                              });
                                              setIsHoverOnCard(false);
                                          }
                                        : () => {
                                              setEntityTemplateWizardDialogState({
                                                  isWizardOpen: true,
                                                  entityTemplate: {
                                                      ...defaultEntityTemplatePopulated,
                                                      properties,
                                                      propertiesOrder,
                                                      propertiesPreview,
                                                      propertiesTypeOrder,
                                                      uniqueConstraints,
                                                      fieldGroups,
                                                  },
                                              });
                                              setIsHoverOnCard(false);
                                          }
                                }
                                onDeleteClick={() => setDeleteEntityTemplateDialogState({ isDialogOpen: true, entityTemplateId: entityTemplate._id })}
                                onAddActionsClick={() => {
                                    setAddActionsDialogState({
                                        isWizardOpen: true,
                                        entityTemplate: isChildTemplate
                                            ? { type: EntityTemplateType.Child, metaData: childTemplates!.get(entityTemplate._id)! }
                                            : { type: EntityTemplateType.Parent, metaData: entityTemplate },
                                    });
                                }}
                                onDisableClick={
                                    childTemplates?.get(entityTemplate._id)
                                        ? undefined
                                        : () => {
                                              updateEntityTemplateStatusAsync({
                                                  entityTemplateId: entityTemplate._id,
                                                  disabled: !entityTemplate.disabled,
                                              });
                                              setIsHoverOnCard(false);
                                          }
                                }
                                onAddChildTemplateClick={
                                    childTemplates?.get(entityTemplate._id)
                                        ? undefined
                                        : () => {
                                              setAddChildTemplateDialogState({
                                                  isWizardOpen: true,
                                                  entityTemplate,
                                                  mutationProps: { actionType: ActionMode.Create, payload: undefined },
                                              });
                                              setIsHoverOnCard(false);
                                          }
                                }
                                disabledProps={{
                                    disableForReadPermissions: !hasWritePermission,
                                    isDeleteDisabled: isDeleteButtonDisabled,
                                    isDisabled: entityTemplate.disabled,
                                    isEditDisabled: entityTemplate.disabled || !hasWritePermission,
                                    tooltipTitle: entityTemplateCardTooltip(),
                                }}
                            />
                        )}
                        {(childTemplates?.get(entityTemplate._id) || isDisabledView) && (
                            <MeltaTooltip
                                title={
                                    <Grid container flexDirection="column" alignItems="center">
                                        {isDisabledView &&
                                            (entityTemplate.category.displayName || categories.get(String(entityTemplate.category))) && (
                                                <Grid container gap="5px">
                                                    <Typography variant="body2">{`${i18next.t('entityTemplatesRow.existsInCategory')}: `}</Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {entityTemplate.category.displayName ||
                                                            categories.get(String(entityTemplate.category))!.displayName}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        {childTemplates?.get(entityTemplate._id) && (
                                            <Grid>
                                                <Typography variant="body2">{childTemplates.get(entityTemplate._id)?.description}</Typography>
                                                <Grid container spacing={1} sx={{ mt: 1 }}>
                                                    {getChildTemplateChips(childTemplates.get(entityTemplate._id)!).map((chip, index) => (
                                                        <Grid key={index}>
                                                            <ColoredEnumChip color={chip.color} label={chip.label} />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Grid>
                                        )}
                                    </Grid>
                                }
                            >
                                <InfoOutlined
                                    sx={{
                                        fontSize: '16px',
                                        color: theme.palette.primary.main,
                                        opacity: 0.7,
                                        cursor: 'help',
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        marginRight: isHoverOnCard && !isDisabledView ? '32px' : '8px',
                                    }}
                                />
                            </MeltaTooltip>
                        )}
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container direction="column" gap="10px" width="232px" paddingLeft="20px">
                    <Grid container justifyContent="space-between">
                        <Grid color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.entityTemplate.properties')}</Typography>
                        </Grid>
                    </Grid>
                    {Object.entries(
                        childTemplates?.get(entityTemplate._id)
                            ? childTemplates.get(entityTemplate._id)?.properties.properties || {}
                            : entityTemplate.properties?.properties || {},
                    )
                        .filter(([, value]) => !isFile(value) && value.display !== false)
                        .map(([key, value]) => (
                            <Grid key={key} container gap="5px" flexWrap="nowrap">
                                <Grid flexBasis="4%" color={theme.palette.primary.main}>
                                    <ArrowBackIosNew sx={{ fontSize: '12px' }} />
                                </Grid>
                                <Grid>
                                    <MeltaTooltip title={value.title}>
                                        <Typography
                                            style={{
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                width: '100px',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {value.title}
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                                <Grid color={theme.palette.primary.main} fontWeight="400" sx={{ opacity: 0.75 }}>
                                    {value.format === 'user' || value.format === 'signature'
                                        ? i18next.t(`propertyTypes.${value.format}`)
                                        : i18next.t(`propertyTypes.${value.type}`)}
                                </Grid>
                            </Grid>
                        ))}
                    {!!filesProps.length && (
                        <Grid container justifyContent="space-between">
                            <Grid flexBasis="27%" color={theme.palette.primary.main}>
                                <Typography>{i18next.t('wizard.entityTemplate.attachments')}</Typography>
                            </Grid>
                        </Grid>
                    )}
                    {filesProps.map(([key, value]) => (
                        <Grid key={key} container gap="5px">
                            <Grid flexBasis="4%" color={theme.palette.primary.main}>
                                <ArrowBackIosNew sx={{ fontSize: '12px' }} />
                            </Grid>
                            <Grid>
                                <MeltaTooltip title={key}>
                                    <Typography
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            width: '100px',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {key}
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
                            <Grid color={theme.palette.primary.main} fontWeight="400" sx={{ opacity: 0.75 }}>
                                {i18next.t(`propertyTypes.${value.format === 'fileId' ? value.format : 'multipleFiles'}`)}
                            </Grid>
                        </Grid>
                    ))}
                    {!!entityTemplate.documentTemplatesIds?.length && (
                        <Grid container justifyContent="space-between">
                            <Grid color={theme.palette.primary.main}>
                                <Typography>{i18next.t('wizard.entityTemplate.exportDocuments')}</Typography>
                            </Grid>
                        </Grid>
                    )}
                    {entityTemplate.documentTemplatesIds?.map((documentTemplateId) => (
                        <Grid key={documentTemplateId} container gap="5px">
                            <Grid flexBasis="4%" color={theme.palette.primary.main}>
                                <Typography>-</Typography>
                            </Grid>
                            <Grid>
                                <MeltaTooltip title={getFileName(documentTemplateId)}>
                                    <Typography
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            width: '175px',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {getFileName(documentTemplateId)}
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
            }
            onHover={(isHover) => setIsHoverOnCard(isHover)}
            isDisabled={isDisabledView || entityTemplate.disabled}
        />
    );
};

export default EntityTemplateCard;
