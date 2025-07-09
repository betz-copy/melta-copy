import { Edit, SubdirectoryArrowLeft } from '@mui/icons-material';
import { Grid, IconButton, Skeleton, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { IMongoCategory } from '../../../interfaces/categories';
import { IEntityChildTemplateMap, IMongoChildEntityTemplate, TemplateItem } from '../../../interfaces/entityChildTemplates';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { updateCategoryRequest } from '../../../services/templates/categoriesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { Box } from '../components/Box';
import { CreateButton } from '../components/CreateButton';
import EntityTemplateCard from './Card';
import { defaultEntityTemplatePopulated } from '.';

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
            entityTemplate: TemplateItem | null;
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
                                                    }}
                                                    setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                                    setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                                    setAddActionsDialogState={setAddActionsDialogState}
                                                    updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                                    setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                    entityHasWritePermission={entityHasWritePermission}
                                                    isDisabledView={entityTemplate.category._id !== entityTemplatesWithCategory.category._id}
                                                    isChildTemplate={true}
                                                    title={childTemplate.displayName}
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
                                                }}
                                                setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                                setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                                setAddActionsDialogState={setAddActionsDialogState}
                                                updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                                setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                entityHasWritePermission={false}
                                                isDisabledView={!childTemplate.categories.includes(entityTemplatesWithCategory.category._id)}
                                                isChildTemplate={true}
                                                title={childTemplate.displayName}
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

export default CategoryEntitiesBox;
