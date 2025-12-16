import {
    IChildTemplateMap,
    IEntityTemplateMap,
    IMongoCategory,
    IMongoChildTemplateWithConstraintsPopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
    PermissionScope,
    TemplateItem,
} from '@microservices/shared';
import { Edit, SubdirectoryArrowLeft } from '@mui/icons-material';
import { Grid, IconButton, Skeleton, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { IMutationWithPayload } from '../../../common/dialogs/ChildTemplateDialog';
import { updateCategoryRequest } from '../../../services/templates/categoriesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { Box } from '../components/Box';
import { CreateButton } from '../components/CreateButton';
import { defaultEntityTemplatePopulated } from '.';
import EntityTemplateCard from './Card';

interface CategoryEntitiesBoxProps {
    entityTemplatesWithCategory: {
        category: IMongoCategory;
        entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    };
    setEntityTemplateWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | null;
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
            entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | null;
            mutationProps?: IMutationWithPayload;
        }>
    >;
    updateTemplateStatusAsync: UseMutateAsyncFunction<
        | IMongoChildTemplateWithConstraintsPopulated
        | {
              entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
              childTemplates: IMongoChildTemplateWithConstraintsPopulated[];
          },
        unknown,
        {
            entityTemplateId: string;
            disabled: boolean;
            isChild?: boolean;
        },
        unknown
    >;
    loadedEntityTemplateId: string;
    searchText: string;
}

const CategoryEntitiesBox: React.FC<CategoryEntitiesBoxProps> = ({
    entityTemplatesWithCategory,
    setEntityTemplateWizardDialogState,
    setDeleteEntityTemplateDialogState,
    setAddActionsDialogState,
    setAddChildTemplateDialogState,
    updateTemplateStatusAsync,
    loadedEntityTemplateId,
    searchText,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates');
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

        const allChildTemplates = Array.from(childTemplates.values());
        const currentCategoryId = entityTemplatesWithCategory.category._id;

        return allChildTemplates.filter((child) => {
            const matchesCategory = child.category._id === currentCategoryId || child.parentTemplate.category.toString() === currentCategoryId;
            const matchesSearch = searchText === '' || (child.displayName ?? '').toLowerCase().includes(searchText.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [childTemplates, entityTemplatesWithCategory.category._id, searchText]);

    const disabledParentTemplates = useMemo(() => {
        if (!childTemplates || !entityTemplates) return new Map();

        const result = new Map<string, IMongoEntityTemplateWithConstraintsPopulated>();

        categoryChildTemplates.forEach(({ parentTemplate }) => {
            const populatedParentTemplate = entityTemplates?.get(parentTemplate._id);

            if (populatedParentTemplate && !entityTemplatesWithCategory.entityTemplates.some((t) => t._id === populatedParentTemplate._id)) {
                result.set(populatedParentTemplate._id, populatedParentTemplate);
            }
        });

        return result;
    }, [childTemplates, entityTemplates, entityTemplatesWithCategory, categoryChildTemplates]);

    const categoryChildTemplatesFiltered = useMemo(() => {
        return categoryChildTemplates.filter((child) => {
            if (child.parentTemplate?.category.toString() === entityTemplatesWithCategory.category._id) return true;
            return child.category._id === entityTemplatesWithCategory.category._id;
        });
    }, [categoryChildTemplates, entityTemplates, entityTemplatesWithCategory]);

    return (
        <Droppable
            direction="vertical"
            droppableId={entityTemplatesWithCategory.category._id}
            isDropDisabled={false}
            isCombineEnabled={false}
            ignoreContainerClipping={false}
        >
            {(provided) => (
                <Grid ref={provided.innerRef} {...provided.droppableProps}>
                    <Box
                        key={entityTemplatesWithCategory.category._id}
                        header={
                            <Grid container justifyContent="space-between" alignItems="center" height="40px" width="284px">
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
                                    entityTemplate.category._id,
                                    entityTemplate._id,
                                    PermissionScope.write,
                                );

                                const templateChildTemplates = categoryChildTemplatesFiltered.filter(
                                    (child) => child.parentTemplate._id === entityTemplate._id,
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
                                                            updateTemplateStatusAsync={updateTemplateStatusAsync}
                                                            setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                            entityHasWritePermission={entityHasWritePermission}
                                                            isDisabledView={false}
                                                            isChildTemplate={false}
                                                            categoryColor={entityTemplatesWithCategory.category.color}
                                                        />
                                                    )}
                                                </Grid>
                                            )}
                                        </Draggable>
                                        {templateChildTemplates.map((childTemplate) => {
                                            const isDisabled = childTemplate.category._id !== entityTemplatesWithCategory.category._id;

                                            return (
                                                <Grid
                                                    key={childTemplate._id}
                                                    sx={{
                                                        pl: 4,
                                                        position: 'relative',
                                                        opacity: isDisabled ? 0.6 : 1,
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
                                                            category: childTemplate.category,
                                                            _id: childTemplate._id,
                                                            disabled: childTemplates?.get(childTemplate._id)!.disabled!,
                                                        }}
                                                        parentDisabled={entityTemplate.disabled}
                                                        setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                                        setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                                        setAddActionsDialogState={setAddActionsDialogState}
                                                        updateTemplateStatusAsync={updateTemplateStatusAsync}
                                                        setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                        entityHasWritePermission={entityHasWritePermission}
                                                        isDisabledView={isDisabled}
                                                        isChildTemplate={true}
                                                        title={childTemplate.displayName}
                                                        categoryColor={entityTemplatesWithCategory.category.color}
                                                    />
                                                </Grid>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}

                        {Array.from(disabledParentTemplates.values()).map((parentTemplate) => {
                            const childTemplatesForParent = categoryChildTemplatesFiltered.filter(
                                (child) => child.parentTemplate._id === parentTemplate._id,
                            );

                            return (
                                <React.Fragment key={parentTemplate._id}>
                                    <Grid sx={{ opacity: 0.6 }}>
                                        <EntityTemplateCard
                                            entityTemplate={parentTemplate}
                                            setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                            setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                            setAddActionsDialogState={setAddActionsDialogState}
                                            updateTemplateStatusAsync={updateTemplateStatusAsync}
                                            setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                            entityHasWritePermission={false}
                                            isDisabledView={true}
                                            isChildTemplate={false}
                                            categoryColor={entityTemplatesWithCategory.category.color}
                                        />
                                    </Grid>
                                    {childTemplatesForParent.map((childTemplate) => (
                                        <Grid
                                            key={childTemplate._id}
                                            sx={{
                                                pl: 4,
                                                position: 'relative',
                                                opacity: childTemplate.category._id === entityTemplatesWithCategory.category._id ? 1 : 0.6,
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
                                                updateTemplateStatusAsync={updateTemplateStatusAsync}
                                                setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                                entityHasWritePermission={false}
                                                isDisabledView={childTemplate.category._id !== entityTemplatesWithCategory.category._id}
                                                isChildTemplate={true}
                                                title={childTemplate.displayName}
                                                categoryColor={entityTemplatesWithCategory.category.color}
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
