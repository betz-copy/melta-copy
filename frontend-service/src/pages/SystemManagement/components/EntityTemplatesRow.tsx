import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppRegistration as AppRegistrationIcon, Edit, SubdirectoryArrowLeft, InfoOutlined } from '@mui/icons-material';
import { Grid, IconButton, Skeleton, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { keyBy } from 'lodash';
import { CustomIcon } from '../../../common/CustomIcon';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { ErrorToast } from '../../../common/ErrorToast';
import { InfiniteScroll } from '../../../common/InfiniteScroll';
import SearchInput from '../../../common/inputs/SearchInput';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { EntityTemplateWizard } from '../../../common/wizards/entityTemplate';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { IEntitySingleProperty, IEntityTemplate, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IEntityChildTemplateMap, IEntityChildTemplate, IMongoChildEntityTemplate } from '../../../interfaces/entityChildTemplates';
import { updateCategoryRequest, updateCategoryTemplatesOrderRequest } from '../../../services/templates/categoriesService';
import {
    deleteEntityTemplateRequest,
    entityTemplateObjectToEntityTemplateForm,
    updateEntityTemplateRequest,
    updateEntityTemplateStatusRequest,
} from '../../../services/templates/enitityTemplatesService';
import { getAllRelationshipTemplatesRequest } from '../../../services/templates/relationshipTemplatesService';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getFileName } from '../../../utils/getFileName';
import { getCountByTemplateIdsRequest } from '../../../services/entitiesService';
import { mapTemplates, templatesCompareFunc } from '../../../utils/templates';
import { Box } from './Box';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { CodeEditorDialog } from './codeEditor';
import { CreateButton } from './CreateButton';
import { FilterButton } from './FilterButton';
import { useWorkspaceStore } from '../../../stores/workspace';
import { environment } from '../../../globals';
import { CreateChildTemplateDialog } from '../../../common/dialogs/createChildTemplate';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { useUserStore } from '../../../stores/user';
import { PermissionScope } from '../../../interfaces/permissions';
import { allowedCategories, allowedEntitiesOfCategory, updateUserPermissionForEntityTemplate } from '../../../utils/permissions/templatePermissions';
import { ColoredEnumChip } from '../../../common/ColoredEnumChip';
import { deleteEntityChildTemplate } from '../../../services/templates/entityChildTemplatesService';
import { checkUserChildTemplatePermission } from '../../../utils/permissions/templatePermissions';

const { infiniteScrollPageCount } = environment.processInstances;

const defaultEntityTemplatePopulated: IMongoEntityTemplatePopulated = {
    _id: '',
    propertiesOrder: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    uniqueConstraints: [],
    name: '',
    displayName: '',
    category: { displayName: '', name: '', _id: '', color: '', templatesOrder: [] },
    disabled: false,
    properties: {
        type: 'object',
        properties: {},
        required: [],
        hide: [],
    },
};

const getChildTemplateChips = (childTemplate: IEntityChildTemplate) => {
    const chips: Array<{ color: string; label: string }> = [];

    if (childTemplate.isFilterByUserUnit) {
        chips.push({
            color: '#2CB93A',
            label: i18next.t('createChildTemplateDialog.permissionsPage.unit'),
        });
    }

    if (childTemplate.isFilterByCurrentUser) {
        chips.push({
            color: '#0072C6',
            label: i18next.t('createChildTemplateDialog.permissionsPage.user'),
        });
    }

    if (childTemplate.viewType === 'userPage') {
        chips.push({
            color: '#CF9030',
            label: i18next.t('createChildTemplateDialog.permissionsPage.userPage'),
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
            entityTemplate: IMongoEntityTemplatePopulated | null;
        }>
    >;
    setAddChildTemplateDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
            childTemplate?: IMongoChildEntityTemplate;
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
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IEntityChildTemplateMap>('getChildEntityTemplates');

    const hasWritePermission = useMemo(() => {
        if (isChildTemplate) {
            const childTemplate = childTemplates?.get(entityTemplate._id);
            if (!childTemplate) return false;
            return checkUserChildTemplatePermission(currentUser.currentWorkspacePermissions, childTemplate, PermissionScope.write);
        }
        return entityHasWritePermission;
    }, [isChildTemplate, entityTemplate._id, childTemplates, currentUser, entityHasWritePermission]);

    const childTemplatesList = useMemo(() => {
        if (!childTemplates) return [];
        const templates = Array.from(childTemplates.values());
        const filtered = templates.filter((child) => {
            return child.fatherTemplateId === entityTemplate._id;
        });
        return filtered;
    }, [childTemplates, entityTemplate._id]);

    const theme = useTheme();
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const { properties, propertiesOrder, propertiesPreview, propertiesTypeOrder, uniqueConstraints } = entityTemplate;
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
                    <Grid item container alignItems="center" gap="10px" flexBasis="90%">
                        <Grid item>
                            <EntityTemplateColor entityTemplateColor={getEntityTemplateColor(entityTemplate)} style={{ height: '18px' }} />
                            {/* <FilterList fontSize="small" sx={{ fontSize: '14px' }} /> */}
                        </Grid>

                        <Grid item sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                            {entityTemplate.iconFileId ? (
                                <CustomIcon iconUrl={entityTemplate.iconFileId} height="24px" width="24px" />
                            ) : (
                                <AppRegistrationIcon style={{ ...workspace.metadata.iconSize }} fontSize="small" />
                            )}
                        </Grid>
                        <Grid item>
                            <MeltaTooltip title={entityTemplate.displayName}>
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
                                    {entityTemplate.displayName}
                                </Typography>
                            </MeltaTooltip>
                        </Grid>
                    </Grid>
                    <Grid item container flexBasis="10%" alignItems="center" justifyContent="flex-end">
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
                                                _id: childTemplate.fatherTemplateId,
                                            },
                                            childTemplate,
                                        });
                                    } else {
                                        setEntityTemplateWizardDialogState({ isWizardOpen: true, entityTemplate });
                                    }
                                    setIsHoverOnCard(false);
                                }}
                                onDuplicateClick={
                                    childTemplates?.get(entityTemplate._id)
                                        ? undefined
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
                                                  },
                                              });
                                              setIsHoverOnCard(false);
                                          }
                                }
                                onDeleteClick={() => setDeleteEntityTemplateDialogState({ isDialogOpen: true, entityTemplateId: entityTemplate._id })}
                                onAddActionsClick={
                                    childTemplates?.get(entityTemplate._id)
                                        ? undefined
                                        : () => setAddActionsDialogState({ isWizardOpen: true, entityTemplate })
                                }
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
                                              setAddChildTemplateDialogState({ isWizardOpen: true, entityTemplate });
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
                        {childTemplates?.get(entityTemplate._id) && (
                            <MeltaTooltip
                                title={
                                    <div>
                                        <Typography variant="body2">{childTemplates.get(entityTemplate._id)?.description}</Typography>
                                        <Grid container spacing={1} sx={{ mt: 1 }}>
                                            {childTemplates.get(entityTemplate._id) &&
                                                getChildTemplateChips(childTemplates.get(entityTemplate._id)!).map((chip, index) => (
                                                    <Grid item key={index}>
                                                        <ColoredEnumChip color={chip.color} label={chip.label} />
                                                    </Grid>
                                                ))}
                                        </Grid>
                                    </div>
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
                                        marginRight: isHoverOnCard ? '32px' : '8px',
                                    }}
                                />
                            </MeltaTooltip>
                        )}
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container gap="10px" alignItems="center" width="232px" paddingLeft="20px">
                    {childTemplatesList.length > 0 && (
                        <Grid item container>
                            <Typography color={theme.palette.primary.main} sx={{ mt: 2 }}>
                                {i18next.t('createChildTemplateDialog.childTemplates')}
                            </Typography>
                        </Grid>
                    )}
                    {childTemplatesList.map((childTemplate: IMongoChildEntityTemplate) => (
                        <Grid key={childTemplate._id} item container gap="10px" alignItems="center">
                            <Grid item>
                                <EntityTemplateColor entityTemplateColor={getEntityTemplateColor(entityTemplate)} style={{ marginRight: '10px' }} />
                            </Grid>
                            <Grid item>
                                <MeltaTooltip title={childTemplate.displayName}>
                                    <Typography
                                        style={{
                                            fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                            color: theme.palette.primary.main,
                                            fontWeight: '400',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {childTemplate.displayName}
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
                            <Grid item>
                                <MeltaTooltip
                                    title={
                                        <div>
                                            <Typography variant="body2">{childTemplate.description}</Typography>
                                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                                {childTemplate.isFilterByUserUnit && (
                                                    <Grid item>
                                                        <ColoredEnumChip
                                                            color="#2CB93A"
                                                            label={i18next.t('createChildTemplateDialog.permissionsPage.unit')}
                                                        />
                                                    </Grid>
                                                )}
                                                {childTemplate.isFilterByCurrentUser && (
                                                    <Grid item>
                                                        <ColoredEnumChip
                                                            color="#0072C6"
                                                            label={i18next.t('createChildTemplateDialog.permissionsPage.user')}
                                                        />
                                                    </Grid>
                                                )}
                                                {childTemplate.viewType === 'userPage' && (
                                                    <Grid item>
                                                        <ColoredEnumChip
                                                            color="#CF9030"
                                                            label={i18next.t('createChildTemplateDialog.permissionsPage.userPage')}
                                                        />
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </div>
                                    }
                                >
                                    <InfoOutlined
                                        sx={{
                                            fontSize: '16px',
                                            color: theme.palette.primary.main,
                                            opacity: 0.7,
                                            cursor: 'help',
                                            ml: 1,
                                        }}
                                    />
                                </MeltaTooltip>
                            </Grid>
                        </Grid>
                    ))}
                    <Grid item container justifyContent="space-between">
                        <Grid item color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.entityTemplate.properties')}</Typography>
                        </Grid>
                    </Grid>
                    {Object.entries(
                        childTemplates?.get(entityTemplate._id)
                            ? childTemplates.get(entityTemplate._id)?.properties || {}
                            : entityTemplate.properties?.properties || {},
                    )
                        .filter(([, value]) => !isFile(value))
                        .map(([key, value]) => (
                            <Grid key={key} item container gap="5px" flexWrap="nowrap">
                                <Grid item flexBasis="4%" color={theme.palette.primary.main}>
                                    <ArrowBackIosNewIcon sx={{ fontSize: '12px' }} />
                                </Grid>
                                <Grid item>
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
                                <Grid item color={theme.palette.primary.main} fontWeight="400" sx={{ opacity: 0.75 }}>
                                    {value.format === 'user' || value.format === 'signature'
                                        ? i18next.t(`propertyTypes.${value.format}`)
                                        : i18next.t(`propertyTypes.${value.type}`)}
                                </Grid>
                            </Grid>
                        ))}
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.entityTemplate.attachments')}</Typography>
                        </Grid>
                    </Grid>
                    {Object.entries(
                        childTemplates?.get(entityTemplate._id)
                            ? childTemplates.get(entityTemplate._id)?.properties || {}
                            : entityTemplate.properties?.properties || {},
                    )
                        .filter(([, value]) => isFile(value))
                        .map(([key, value]) => (
                            <Grid key={key} item container gap="5px">
                                <Grid item flexBasis="4%" color={theme.palette.primary.main}>
                                    <ArrowBackIosNewIcon sx={{ fontSize: '12px' }} />
                                </Grid>
                                <Grid item>
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
                                <Grid item color={theme.palette.primary.main} fontWeight="400" sx={{ opacity: 0.75 }}>
                                    {i18next.t(`propertyTypes.${value.format === 'fileId' ? value.format : 'multipleFiles'}`)}
                                </Grid>
                            </Grid>
                        ))}
                    {!!entityTemplate.documentTemplatesIds?.length && (
                        <Grid item container justifyContent="space-between">
                            <Grid item color={theme.palette.primary.main}>
                                <Typography>{i18next.t('wizard.entityTemplate.exportDocuments')}</Typography>
                            </Grid>
                        </Grid>
                    )}
                    {entityTemplate.documentTemplatesIds?.map((documentTemplateId) => (
                        <Grid key={documentTemplateId} item container gap="5px">
                            <Grid item flexBasis="4%" color={theme.palette.primary.main}>
                                <Typography>-</Typography>
                            </Grid>
                            <Grid item>
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

interface CategoryEntitiesBoxProps {
    entityTemplatesWithCategory: {
        category: IMongoCategory;
        entityTemplates: IMongoEntityTemplatePopulated[];
    };
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
            entityTemplate: IMongoEntityTemplatePopulated | null;
        }>
    >;
    setAddChildTemplateDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
            childTemplate?: IMongoChildEntityTemplate;
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
    loadedEntityTemplateId: string;
}

const orderTemplatesInCategory = (templatesOrder: string[], templates: IMongoEntityTemplatePopulated[]): IMongoEntityTemplatePopulated[] => {
    if (templatesOrder) {
        const idToTemplateMap = keyBy(templates, (t) => t._id.toString());

        return templatesOrder
            .map((id) => idToTemplateMap[id])
            .filter((template): template is IMongoEntityTemplatePopulated => template !== undefined);
    }

    return templates;
};

const CategoryEntitiesBox: React.FC<CategoryEntitiesBoxProps> = ({
    entityTemplatesWithCategory,
    setEntityTemplateWizardDialogState,
    setDeleteEntityTemplateDialogState,
    setAddActionsDialogState,
    setAddChildTemplateDialogState,
    updateEntityTemplateStatusAsync,
    loadedEntityTemplateId,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IEntityChildTemplateMap>('getChildEntityTemplates');
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');

    const [isHoverOnBox, setIsHoverOnBox] = useState(false);
    const [isEditableCategory, setIsEditableCategory] = useState(false);
    const containerWrapperRef = useRef<HTMLDivElement>(null);

    const theme = useTheme();

    useEffect(() => {
        containerWrapperRef.current?.focus();
    }, [isEditableCategory]);

    const { mutateAsync } = useMutation(
        (categoryName: string) =>
            updateCategoryRequest(entityTemplatesWithCategory.category._id, { ...entityTemplatesWithCategory.category, displayName: categoryName }),
        {},
    );

    const categoryChildTemplates = useMemo(() => {
        if (!childTemplates || !entityTemplates) return [];

        const allChildTemplates = Array.from(childTemplates.values()) as IMongoChildEntityTemplate[];
        const currentCategoryId = entityTemplatesWithCategory.category._id;

        return allChildTemplates.filter((child) => {
            return child.categories.includes(currentCategoryId);
        });
    }, [childTemplates, entityTemplatesWithCategory.category._id]);

    const disabledParentTemplates = useMemo(() => {
        if (!childTemplates || !entityTemplates) return new Map();

        const result = new Map<string, IMongoEntityTemplatePopulated>();

        categoryChildTemplates.forEach((child) => {
            const fatherTemplate = entityTemplates.get(child.fatherTemplateId);
            if (fatherTemplate && !entityTemplatesWithCategory.entityTemplates.some((t) => t._id === fatherTemplate._id)) {
                result.set(fatherTemplate._id, fatherTemplate);
            }
        });

        return result;
    }, [childTemplates, entityTemplates, entityTemplatesWithCategory, categoryChildTemplates]);

    // Get child templates that should appear in this category
    const categoryChildTemplatesFiltered = useMemo(() => {
        return categoryChildTemplates.filter((child) => {
            // If this is the parent template's category, always show the child
            const parentTemplate = entityTemplates?.get(child.fatherTemplateId);
            if (parentTemplate?.category._id === entityTemplatesWithCategory.category._id) {
                return true;
            }
            // If this is one of the child's selected categories, show it enabled
            return child.categories.includes(entityTemplatesWithCategory.category._id);
        });
    }, [categoryChildTemplates, entityTemplates, entityTemplatesWithCategory]);

    return (
        <Droppable droppableId={entityTemplatesWithCategory.category._id}>
            {(provided) => (
                <Grid ref={provided.innerRef} {...provided.droppableProps}>
                    <Box
                        key={entityTemplatesWithCategory.category._id}
                        header={
                            <Grid item container justifyContent="space-between" alignItems="center" height="40px" width="284px">
                                <Grid
                                    ref={containerWrapperRef}
                                    contentEditable={isEditableCategory}
                                    style={{
                                        fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                        fontWeight: '400',
                                        color: isEditableCategory ? theme.palette.primary.main : '#9398C2',
                                        outline: isEditableCategory ? `1px solid ${theme.palette.primary.main}` : '',
                                        borderRadius: '5px',
                                        padding: '5px',
                                        textOverflow: isEditableCategory ? undefined : 'ellipsis',
                                        whiteSpace: isEditableCategory ? undefined : 'nowrap',
                                        overflow: isEditableCategory ? 'auto' : 'hidden',
                                        width: '240px',
                                        maxHeight: '40px',
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.keyCode === 13) {
                                            mutateAsync(containerWrapperRef.current?.textContent || '');
                                            e.preventDefault();
                                            setIsEditableCategory(false);
                                        }
                                    }}
                                    onBlur={() => {
                                        mutateAsync(containerWrapperRef.current?.textContent || '');
                                        setIsEditableCategory(false);
                                    }}
                                >
                                    {entityTemplatesWithCategory.category.displayName}
                                </Grid>
                                {isHoverOnBox && (
                                    <IconButton
                                        onClick={() => {
                                            setIsEditableCategory(true);
                                            containerWrapperRef.current?.focus();
                                        }}
                                        className="edit-btn"
                                    >
                                        <Edit color="primary" />
                                    </IconButton>
                                )}
                            </Grid>
                        }
                        addingIcon={
                            <CreateButton
                                onClick={() =>
                                    setEntityTemplateWizardDialogState({
                                        isWizardOpen: true,
                                        entityTemplate: { ...defaultEntityTemplatePopulated, category: entityTemplatesWithCategory.category },
                                    })
                                }
                                text={i18next.t('systemManagement.newEntityTemplate')}
                            />
                        }
                        onHover={(isHover: boolean) => setIsHoverOnBox(isHover)}
                    >
                        {!!entityTemplatesWithCategory.entityTemplates.length &&
                            entityTemplatesWithCategory.entityTemplates.map((entityTemplate, index) => {
                                const entityHasWritePermission = checkUserTemplatePermission(
                                    currentUser.currentWorkspacePermissions,
                                    entityTemplate.category,
                                    entityTemplate._id,
                                    PermissionScope.write,
                                );

                                const templateChildTemplates = categoryChildTemplatesFiltered.filter(
                                    (child) => child.fatherTemplateId === entityTemplate._id,
                                );

                                return (
                                    <React.Fragment key={entityTemplate._id}>
                                        <Draggable draggableId={entityTemplate._id} index={index} isDragDisabled={!entityHasWritePermission}>
                                            {(draggableProvided) => (
                                                <Grid
                                                    ref={draggableProvided.innerRef}
                                                    {...draggableProvided.draggableProps}
                                                    {...draggableProvided.dragHandleProps}
                                                >
                                                    {loadedEntityTemplateId === entityTemplate._id ? (
                                                        <Skeleton variant="rounded" height="50px" />
                                                    ) : (
                                                        <EntityTemplateCard
                                                            entityTemplate={entityTemplate}
                                                            setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                                            setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                                            setAddActionsDialogState={setAddActionsDialogState}
                                                            updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                                            setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                            entityHasWritePermission={entityHasWritePermission}
                                                            isDisabledView={false}
                                                            isChildTemplate={false}
                                                        />
                                                    )}
                                                </Grid>
                                            )}
                                        </Draggable>
                                        {templateChildTemplates.map((childTemplate: IMongoChildEntityTemplate) => (
                                            <Grid
                                                key={childTemplate._id}
                                                sx={{
                                                    pl: 4,
                                                    position: 'relative',
                                                }}
                                            >
                                                <SubdirectoryArrowLeft
                                                    sx={{
                                                        position: 'absolute',
                                                        left: '6px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        color: theme.palette.primary.main,
                                                    }}
                                                />
                                                <EntityTemplateCard
                                                    entityTemplate={{
                                                        ...entityTemplate,
                                                        _id: childTemplate._id,
                                                        displayName: childTemplate.displayName,
                                                    }}
                                                    setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                                    setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                                    setAddActionsDialogState={setAddActionsDialogState}
                                                    updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                                    setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                    entityHasWritePermission={entityHasWritePermission}
                                                    isDisabledView={entityTemplate.category._id !== entityTemplatesWithCategory.category._id}
                                                    isChildTemplate={true}
                                                />
                                            </Grid>
                                        ))}
                                    </React.Fragment>
                                );
                            })}

                        {Array.from(disabledParentTemplates.values()).map((parentTemplate) => {
                            const childTemplatesForParent = categoryChildTemplatesFiltered.filter(
                                (child) => child.fatherTemplateId === parentTemplate._id,
                            );

                            return (
                                <React.Fragment key={parentTemplate._id}>
                                    <Grid sx={{ opacity: 0.6 }}>
                                        <EntityTemplateCard
                                            entityTemplate={parentTemplate}
                                            setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                            setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                            setAddActionsDialogState={setAddActionsDialogState}
                                            updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                            setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                            entityHasWritePermission={false}
                                            isDisabledView={true}
                                            isChildTemplate={false}
                                        />
                                    </Grid>
                                    {childTemplatesForParent.map((childTemplate: IMongoChildEntityTemplate) => (
                                        <Grid
                                            key={childTemplate._id}
                                            sx={{
                                                pl: 4,
                                                position: 'relative',
                                                opacity: childTemplate.categories.includes(entityTemplatesWithCategory.category._id) ? 1 : 0.6,
                                            }}
                                        >
                                            <SubdirectoryArrowLeft
                                                sx={{
                                                    position: 'absolute',
                                                    left: '6px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    color: theme.palette.primary.main,
                                                }}
                                            />
                                            <EntityTemplateCard
                                                entityTemplate={{
                                                    ...parentTemplate,
                                                    _id: childTemplate._id,
                                                    displayName: parentTemplate.disabled ? parentTemplate.displayName : childTemplate.displayName,
                                                }}
                                                setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                                setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                                setAddActionsDialogState={setAddActionsDialogState}
                                                updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                                setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                entityHasWritePermission={false}
                                                isDisabledView={!childTemplate.categories.includes(entityTemplatesWithCategory.category._id)}
                                                isChildTemplate={true}
                                            />
                                        </Grid>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </Box>
                </Grid>
            )}
        </Droppable>
    );
};

const EntityTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const currentWorkspace = useWorkspaceStore((state) => state.workspace);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedCategoriesToShow = allowedCategories(categories, currentUser);
    const [categoriesToShow, setCategoriesToShow] = useState<IMongoCategory[]>(allowedCategoriesToShow);

    const [searchText, setSearchText] = useState('');
    const [loadedEntityTemplateId, setLoadedEntityTemplateId] = useState('');

    const isFilterButtonDisabled = useMemo(
        () => !(categoriesToShow.length < allowedCategoriesToShow.length || searchText.length),
        [categoriesToShow, searchText, allowedCategoriesToShow],
    );

    const [deleteEntityTemplateDialogState, setDeleteEntityTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        entityTemplateId: string | null;
    }>({
        isDialogOpen: false,
        entityTemplateId: null,
    });

    const [entityTemplateWizardDialogState, setEntityTemplateWizardDialogState] = useState<{
        isWizardOpen: boolean;
        entityTemplate: IMongoEntityTemplatePopulated | null;
    }>({
        isWizardOpen: false,
        entityTemplate: null,
    });

    const [addActionsToEntityTemplateDialogState, setAddActionsToEntityTemplateDialogState] = useState<{
        isWizardOpen: boolean;
        entityTemplate: IMongoEntityTemplatePopulated | null;
    }>({
        isWizardOpen: false,
        entityTemplate: null,
    });

    const [addChildTemplateDialogState, setAddChildTemplateDialogState] = useState<{
        isWizardOpen: boolean;
        entityTemplate: IMongoEntityTemplatePopulated | null;
        childTemplate?: IMongoChildEntityTemplate;
    }>({
        isWizardOpen: false,
        entityTemplate: null,
    });

    const getEntityTemplatesToShowGroupedByCategories = (
        entityTemplatesToShow: IMongoEntityTemplatePopulated[],
    ): { category: IMongoCategory; entityTemplates: IMongoEntityTemplatePopulated[] }[] => {
        const categoriesToShowMapEntities: { category: IMongoCategory; entityTemplates: IMongoEntityTemplatePopulated[] }[] = [];
        categoriesToShow.forEach((category) => {
            const relatedEntityTemplatesToShow = orderTemplatesInCategory(
                category.templatesOrder,
                entityTemplatesToShow.filter((entity) => entity.category._id === category._id),
            );
            categoriesToShowMapEntities.push({
                category,
                entityTemplates: allowedEntitiesOfCategory(relatedEntityTemplatesToShow, category, currentUser),
            });
        });

        return categoriesToShowMapEntities;
    };

    const { mutateAsync: updateEntityTemplateStatusAsync } = useMutation(
        ({ entityTemplateId, disabled }: { entityTemplateId: string; disabled: boolean }) =>
            updateEntityTemplateStatusRequest(entityTemplateId, disabled),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
                if (data.disabled) toast.success(i18next.t('wizard.entityTemplate.disabledSuccessfully'));
                else toast.success(i18next.t('wizard.entityTemplate.activatedSuccessfully'));
            },
            onError: (_err, variables) => {
                if (variables.disabled) toast.error(i18next.t('wizard.entityTemplate.failedToDisable'));
                else toast.error(i18next.t('wizard.entityTemplate.failedToActivate'));
            },
        },
    );

    const { isLoading: deleteTemplateIsLoading, mutateAsync: deleteTemplateMutateAsync } = useMutation(
        (id: string) => deleteEntityTemplateRequest(id),
        {
            onSuccess: async (_data, id) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    entityTemplateMap!.delete(id);
                    return entityTemplateMap!;
                });

                setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null });
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
                toast.success(i18next.t('wizard.entityTemplate.deletedSuccessfully'));
                try {
                    const relationshipTemplates = await getAllRelationshipTemplatesRequest();
                    queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', mapTemplates(relationshipTemplates));
                } catch (error) {
                    toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                }
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToDelete')} />);
            },
        },
    );

    const { mutateAsync: deleteChildTemplateMutateAsync } = useMutation((id: string) => deleteEntityChildTemplate(id), {
        onSuccess: async () => {
            queryClient.invalidateQueries('getChildEntityTemplates');
            queryClient.invalidateQueries('getEntityTemplates');
            setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null });
            toast.success(i18next.t('entityTemplatesRow.succeededToDeleteEntityTemplate'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage="Failed to delete child template" />);
        },
    });

    const handleDelete = async () => {
        const templateId = deleteEntityTemplateDialogState.entityTemplateId;
        if (!templateId) return;

        const childTemplates = queryClient.getQueryData<IEntityChildTemplateMap>('getChildEntityTemplates');
        const isChildTemplate = childTemplates?.has(templateId);

        try {
            if (isChildTemplate) {
                await deleteChildTemplateMutateAsync(templateId);
            } else {
                await deleteTemplateMutateAsync(templateId);
            }
        } catch (error) {
            console.error('Failed to delete child entity template:', error);
        }
    };

    const { mutateAsync } = useMutation(
        ({ entityTemplateId, entityTemplate, category }: { entityTemplateId: string; entityTemplate: IEntityTemplate; category: IMongoCategory }) => {
            setLoadedEntityTemplateId(entityTemplateId);

            return updateEntityTemplateRequest(entityTemplateId, {
                ...entityTemplate,
                category: category._id,
            });
        },

        {
            onSuccess(data) {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
                const updatedUserPermissions = updateUserPermissionForEntityTemplate(data, currentUser, currentWorkspace._id);
                setUser(updatedUserPermissions);
                setLoadedEntityTemplateId('');
            },
            onError(error: AxiosError) {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToEdit')} />);
                setLoadedEntityTemplateId('');
            },
        },
    );

    const { mutateAsync: mutateOrderAsync } = useMutation(
        ({
            templateId,
            newIndex,
            srcCategoryId,
            newCategoryId,
        }: {
            templateId: string;
            newIndex: number;
            srcCategoryId: string;
            newCategoryId: string;
        }) => {
            return updateCategoryTemplatesOrderRequest(templateId, newIndex, srcCategoryId, newCategoryId);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<ICategoryMap>('getCategories', (categoryMap) => categoryMap!.set(data.newCategory._id, data.newCategory));
                setCategoriesToShow(
                    categoriesToShow.map((category) => {
                        if (category._id === data.newCategory._id) return data.newCategory;

                        if (category._id === data.oldCategory._id) return data.oldCategory;

                        return category;
                    }),
                );
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
                setLoadedEntityTemplateId('');
            },
            onError(error: AxiosError) {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToEdit')} />);
                setLoadedEntityTemplateId('');
            },
        },
    );

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        if (result.source.droppableId === result.destination.droppableId) {
            mutateOrderAsync({
                templateId: result.draggableId,
                newIndex: result.destination.index,
                srcCategoryId: result.source.droppableId,
                newCategoryId: result.destination.droppableId,
            });
        } else {
            const { category, ...restEntityTemp } = entityTemplates.get(result.draggableId)!;

            mutateAsync({
                entityTemplateId: result.draggableId,
                entityTemplate: { ...restEntityTemp, category: category._id },
                category: categories.get(result.destination.droppableId)!,
            }).then(() =>
                mutateOrderAsync({
                    templateId: result.draggableId,
                    newIndex: result.destination.index,
                    srcCategoryId: result.source.droppableId,
                    newCategoryId: result.destination.droppableId,
                }),
            );
        }
    };

    useEffect(() => {
        setCategoriesToShow(categoriesToShow.map((category) => categories.get(category._id)!));
    }, [categories]);

    return (
        <Grid item container>
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <SearchInput placeholder={i18next.t('globalSearch.searchLabel')} borderRadius="7px" onChange={setSearchText} value={searchText} />
                </Grid>
                <Grid item>
                    <SelectCheckbox
                        title={i18next.t('categories')}
                        options={allowedCategoriesToShow}
                        selectedOptions={categoriesToShow}
                        setSelectedOptions={setCategoriesToShow}
                        getOptionId={(category) => category._id}
                        getOptionLabel={(category) => category.displayName}
                        size="small"
                        isDraggableDisabled
                        horizontalOrigin={156}
                    />
                </Grid>
                <Grid item>
                    <FilterButton
                        onClick={() => {
                            setSearchText('');
                            setCategoriesToShow(allowedCategoriesToShow);
                        }}
                        text={i18next.t('entitiesTableOfTemplate.resetFilters')}
                        disabled={isFilterButtonDisabled}
                    />
                </Grid>
            </Grid>

            <DragDropContext onDragEnd={onDragEnd}>
                <Grid container gap="30px" marginTop="30px">
                    <InfiniteScroll<{
                        category: IMongoCategory;
                        entityTemplates: IMongoEntityTemplatePopulated[];
                    }>
                        queryKey={['searchEntityTemplates', searchText, categoriesToShow]}
                        queryFunction={({ pageParam }) => {
                            return getEntityTemplatesToShowGroupedByCategories(
                                Array.from(entityTemplates.values())
                                    .filter(
                                        (entityTemplate) =>
                                            categoriesToShow.some((categoryToShow) => categoryToShow._id === entityTemplate.category._id) &&
                                            (searchText === '' || entityTemplate.displayName.includes(searchText)),
                                    )
                                    .sort((a, b) => {
                                        const res = templatesCompareFunc(a, b);
                                        if (res === 0) return Number(a.disabled) - Number(b.disabled);
                                        return res;
                                    }),
                            ).splice(pageParam, infiniteScrollPageCount);
                        }}
                        onQueryError={(error) => {
                            console.error('failed to search process templates error:', error);
                            toast.error(i18next.t('failedToLoadResults'));
                        }}
                        getItemId={(entityTemplatesWithCategory) => entityTemplatesWithCategory.category._id}
                        getNextPageParam={(lastPage, allPages) => {
                            const nextPage = allPages.length * infiniteScrollPageCount;
                            return lastPage.length ? nextPage : undefined;
                        }}
                        endText={i18next.t('noSearchLeft')}
                        emptyText={i18next.t('failedToGetTemplates')}
                        useContainer={false}
                    >
                        {(entityTemplatesWithCategory) => (
                            <Grid item key={entityTemplatesWithCategory.category._id}>
                                <CategoryEntitiesBox
                                    entityTemplatesWithCategory={entityTemplatesWithCategory}
                                    setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                    setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                    updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                    loadedEntityTemplateId={loadedEntityTemplateId}
                                    setAddActionsDialogState={setAddActionsToEntityTemplateDialogState}
                                    setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                />
                            </Grid>
                        )}
                    </InfiniteScroll>
                </Grid>
            </DragDropContext>
            <EntityTemplateWizard
                open={entityTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setEntityTemplateWizardDialogState({ isWizardOpen: false, entityTemplate: null })}
                initialValues={entityTemplateObjectToEntityTemplateForm(entityTemplateWizardDialogState.entityTemplate)}
                isEditMode={Boolean(entityTemplateWizardDialogState.entityTemplate?._id)}
                initialStep={entityTemplateWizardDialogState.entityTemplate?.category._id ? 1 : 0}
            />
            <AreYouSureDialog
                open={deleteEntityTemplateDialogState.isDialogOpen}
                title={i18next.t('entityTemplatesRow.areYouSureDeleteEntityTemplate')}
                body={i18next.t('entityTemplatesRow.areYouSureDeleteEntityTemplateContent')}
                handleClose={() => setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null })}
                onYes={handleDelete}
                isLoading={deleteTemplateIsLoading}
            />
            <CodeEditorDialog
                open={addActionsToEntityTemplateDialogState.isWizardOpen}
                handleClose={() => setAddActionsToEntityTemplateDialogState({ isWizardOpen: false, entityTemplate: null })}
                entityTemplate={addActionsToEntityTemplateDialogState.entityTemplate}
                searchText={searchText}
                categoriesToShow={categoriesToShow}
            />
            <CreateChildTemplateDialog
                open={addChildTemplateDialogState.isWizardOpen}
                handleClose={() => setAddChildTemplateDialogState({ isWizardOpen: false, entityTemplate: null })}
                entityTemplate={addChildTemplateDialogState.entityTemplate}
                childTemplate={addChildTemplateDialogState.childTemplate}
            />
        </Grid>
    );
};

export { EntityTemplatesRow };
