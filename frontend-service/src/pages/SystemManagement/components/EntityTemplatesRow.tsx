/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect, useRef, useState } from 'react';
import { Grid, IconButton, Skeleton, Typography, useTheme } from '@mui/material';
import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { ViewingCard } from './Card';
import { CustomIcon } from '../../../common/CustomIcon';
import { SelectCheckbox } from '../../../common/SelectCheckbox';
import { IEntityTemplate, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityTemplateWizard } from '../../../common/wizards/entityTemplate';
import {
    deleteEntityTemplateRequest,
    entityTemplateObjectToEntityTemplateForm,
    updateEntityTemplateRequest,
    updateEntityTemplateStatusRequest,
} from '../../../services/templates/enitityTemplatesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import SearchInput from '../../../common/inputs/SearchInput';
import { templatesCompareFunc } from '../../../utils/templates';
import { ErrorToast } from '../../../common/ErrorToast';
import { Box } from './Box';
import { getEntityTemplateColor } from '../../../utils/colors';
import { CardMenu } from './CardMenu';
import { updateCategoryRequest } from '../../../services/templates/categoriesService';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { environment } from '../../../globals';

const defaultEntityTemplatePopulated: IMongoEntityTemplatePopulated = {
    _id: '',
    propertiesOrder: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    uniqueConstraints: [],
    name: '',
    displayName: '',
    category: { displayName: '', name: '', _id: '', color: '' },
    disabled: false,
    properties: {
        type: 'object',
        properties: {},
        required: [],
        hide: [],
    },
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
    updateEntityTemplateStatusAsync: UseMutateAsyncFunction<
        IMongoEntityTemplatePopulated,
        unknown,
        {
            entityTemplateId: string;
            disabled: boolean;
        },
        unknown
    >;
}

const EntityTemplateCard: React.FC<EntityTemplateCardProps> = ({
    entityTemplate,
    setEntityTemplateWizardDialogState,
    setDeleteEntityTemplateDialogState,
    updateEntityTemplateStatusAsync,
}) => {
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const theme = useTheme();

    return (
        <ViewingCard
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
                        </Grid>

                        <Grid item>
                            {entityTemplate.iconFileId ? (
                                <CustomIcon iconUrl={entityTemplate.iconFileId} height="24px" width="24px" />
                            ) : (
                                <AppRegistrationIcon style={{ ...environment.iconSize }} fontSize="small" />
                            )}
                        </Grid>
                        <Grid item>
                            <MeltaTooltip title={entityTemplate.displayName}>
                                <Typography
                                    style={{
                                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
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
                    <Grid item container flexBasis="10%">
                        {isHoverOnCard && (
                            <CardMenu
                                onEditClick={() => setEntityTemplateWizardDialogState({ isWizardOpen: true, entityTemplate })}
                                onDeleteClick={() => setDeleteEntityTemplateDialogState({ isDialogOpen: true, entityTemplateId: entityTemplate._id })}
                                onDisableClick={() =>
                                    updateEntityTemplateStatusAsync({ entityTemplateId: entityTemplate._id, disabled: !entityTemplate.disabled })
                                }
                                disabledProps={{
                                    isDisabled: entityTemplate.disabled,
                                    canEdit: entityTemplate.disabled,
                                    tooltipTitle: i18next.t('systemManagement.disabledEntityTemplate'),
                                }}
                            />
                        )}
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container gap="10px" alignItems="center" width="232px" paddingLeft="20px">
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color="#9398C2">
                            <Typography>{i18next.t('category')}</Typography>
                        </Grid>
                        <Grid item flexBasis="70%" color="#53566E" fontWeight="400">
                            {entityTemplate.category.displayName}
                        </Grid>
                    </Grid>
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color="#9398C2">
                            <Typography>{i18next.t('wizard.entityTemplate.properties')}</Typography>
                        </Grid>
                    </Grid>
                    {Object.entries(entityTemplate.properties.properties)
                        .filter(([, value]) => value.format !== 'fileId')
                        .map(([key, value]) => (
                            <Grid key={key} item container gap="5px" flexWrap="nowrap">
                                <Grid item flexBasis="4%" color="#9398C2">
                                    <Typography>-</Typography>
                                </Grid>
                                <Grid item color="#53566E">
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
                                <Grid item color="#9398C2" fontWeight="400">
                                    {i18next.t(`propertyTypes.${value.type}`)}
                                </Grid>
                            </Grid>
                        ))}
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color="#9398C2">
                            <Typography>{i18next.t('wizard.entityTemplate.attachments')}</Typography>
                        </Grid>
                    </Grid>
                    {Object.entries(entityTemplate.properties.properties)
                        .filter(([, value]) => value.format === 'fileId')
                        .map(([key]) => (
                            <Grid key={key} item container gap="5px">
                                <Grid item flexBasis="4%" color="#9398C2">
                                    <Typography>-</Typography>
                                </Grid>
                                <Grid item color="#53566E">
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
                                <Grid item color="#9398C2" fontWeight="400">
                                    {entityTemplate.properties.required.includes(key) ? i18next.t('validation.required') : ''}
                                </Grid>
                            </Grid>
                        ))}
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
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
    updateEntityTemplateStatusAsync,
    loadedEntityTemplateId,
}) => {
    const [isHoverOnBox, setIsHoverOnBox] = useState(false);
    const [isEditableCategory, setIsEditableCategory] = useState(false);
    const containerWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        containerWrapperRef.current?.focus();
    }, [isEditableCategory]);

    const { mutateAsync } = useMutation(
        (categoryName: string) =>
            updateCategoryRequest(entityTemplatesWithCategory.category._id, { ...entityTemplatesWithCategory.category, displayName: categoryName }),
        {},
    );

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
                                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                        fontWeight: '400',
                                        color: isEditableCategory ? 'black' : '#9398C2',
                                        outline: isEditableCategory ? '1px solid black' : '',
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
                                        <img src="\icons\edit-icon.svg" />
                                    </IconButton>
                                )}
                            </Grid>
                        }
                        addingIcon={
                            <IconButton
                                style={{ borderRadius: '5px', width: 'fit-content' }}
                                onClick={() =>
                                    setEntityTemplateWizardDialogState({
                                        isWizardOpen: true,
                                        entityTemplate: { ...defaultEntityTemplatePopulated, category: entityTemplatesWithCategory.category },
                                    })
                                }
                            >
                                <img src="/icons/add-new-entity-template.svg" />
                            </IconButton>
                        }
                        onHover={(isHover: boolean) => setIsHoverOnBox(isHover)}
                    >
                        {!!entityTemplatesWithCategory.entityTemplates.length &&
                            entityTemplatesWithCategory.entityTemplates.map((entityTemplate, index) => (
                                <Draggable draggableId={entityTemplate._id} key={entityTemplate._id} index={index}>
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
                                                    updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                                />
                                            )}
                                        </Grid>
                                    )}
                                </Draggable>
                            ))}
                    </Box>
                </Grid>
            )}
        </Droppable>
    );
};

const EntityTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const categoriesArray = Array.from(categories.values());
    const [categoriesToShow, setCategoriesToShow] = useState<IMongoCategory[]>(categoriesArray);

    const [searchText, setSearchText] = useState('');
    const [loadedEntityTemplateId, setLoadedEntityTemplateId] = useState('');
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

    const getEntityTemplatesToShowGroupedByCategories = (
        entityTemplatesToShow: IMongoEntityTemplatePopulated[],
    ): { category: IMongoCategory; entityTemplates: IMongoEntityTemplatePopulated[] }[] => {
        const categoriesToShowMapEntities: { category: IMongoCategory; entityTemplates: IMongoEntityTemplatePopulated[] }[] = [];
        categoriesToShow.forEach((category) => {
            const relatedEntityTemplatesToShow = entityTemplatesToShow.filter((entity) => entity.category._id === category._id);
            categoriesToShowMapEntities.push({
                category,
                entityTemplates: relatedEntityTemplatesToShow,
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
            onSuccess: (_data, id) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    entityTemplateMap!.delete(id);
                    return entityTemplateMap!;
                });
                setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null });
                toast.success(i18next.t('wizard.entityTemplate.deletedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToDelete')} />);
            },
        },
    );

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
            return;
        }

        const { category, ...restEntityTemp } = entityTemplates.get(result.draggableId)!;

        mutateAsync({
            entityTemplateId: result.draggableId,
            entityTemplate: { ...restEntityTemp, category: category._id },
            category: categories.get(result.destination.droppableId)!,
        });
    };

    return (
        <Grid item container>
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <SearchInput placeholder={i18next.t('globalSearch.searchLabel')} borderRadius="7px" onChange={setSearchText} value={searchText} />
                </Grid>
                <Grid item>
                    <SelectCheckbox
                        title={i18next.t('categories')}
                        options={categoriesArray}
                        selectedOptions={categoriesToShow}
                        setSelectedOptions={setCategoriesToShow}
                        getOptionId={(category) => category._id}
                        getOptionLabel={(category) => category.displayName}
                        size="small"
                        isDraggableDisabled
                    />
                </Grid>
                <Grid item>
                    {categoriesToShow.length < categoriesArray.length || searchText.length ? (
                        <IconButton
                            style={{ borderRadius: '5px' }}
                            onClick={() => {
                                setSearchText('');
                                setCategoriesToShow(categoriesArray);
                            }}
                        >
                            <img src="/icons/delete-filters-enable.svg" />
                        </IconButton>
                    ) : (
                        <IconButton style={{ borderRadius: '5px', cursor: 'default' }}>
                            <img src="/icons/delete-filters.svg" />
                        </IconButton>
                    )}
                </Grid>
            </Grid>

            <DragDropContext onDragEnd={onDragEnd}>
                <Grid container gap="30px" marginTop="30px">
                    {getEntityTemplatesToShowGroupedByCategories(
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
                    ).map((entityTemplatesWithCategory) => (
                        <Grid item key={entityTemplatesWithCategory.category._id}>
                            <CategoryEntitiesBox
                                entityTemplatesWithCategory={entityTemplatesWithCategory}
                                setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                loadedEntityTemplateId={loadedEntityTemplateId}
                            />
                        </Grid>
                    ))}
                </Grid>
            </DragDropContext>
            <EntityTemplateWizard
                open={entityTemplateWizardDialogState.isWizardOpen}
                handleClose={() => {
                    setEntityTemplateWizardDialogState({ isWizardOpen: false, entityTemplate: null });
                }}
                initialValues={entityTemplateObjectToEntityTemplateForm(entityTemplateWizardDialogState.entityTemplate)}
                isEditMode={Boolean(entityTemplateWizardDialogState.entityTemplate?._id)}
                initalStep={entityTemplateWizardDialogState.entityTemplate?.category ? 1 : 0}
            />
            <AreYouSureDialog
                open={deleteEntityTemplateDialogState.isDialogOpen}
                handleClose={() => setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null })}
                onYes={() => deleteTemplateMutateAsync(deleteEntityTemplateDialogState.entityTemplateId!)}
                isLoading={deleteTemplateIsLoading}
            />
        </Grid>
    );
};

export { EntityTemplatesRow };
