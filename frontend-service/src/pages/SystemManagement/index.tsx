import React, { useReducer, Reducer } from 'react';
import { Grid, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import { CategoryWizard } from '../../common/wizards/category';
import { EntityTemplateFormInputProperties, EntityTemplateWizard } from '../../common/wizards/entityTemplate';
import { InfoCard } from './components/InfoCard';
import { AddCard } from './components/AddCard';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const categoryWizardReducer: Reducer<
    { showWizard: boolean; initialValues?: IMongoCategory },
    { type: 'show'; initialValues?: IMongoCategory } | { type: 'hide' }
> = (_state, action) => {
    switch (action.type) {
        case 'show':
            return { showWizard: true, initialValues: action.initialValues };
        case 'hide':
            return { showWizard: false, initialValues: undefined };
        default:
            throw new Error('Unknown action type');
    }
};

const entityTemplateWizardReducer: Reducer<
    { showWizard: boolean; initialValues?: IMongoEntityTemplatePopulated },
    { type: 'show'; initialValues?: IMongoEntityTemplatePopulated } | { type: 'hide' }
> = (_state, action) => {
    switch (action.type) {
        case 'show':
            return { showWizard: true, initialValues: action.initialValues };
        case 'hide':
            return { showWizard: false, initialValues: undefined };
        default:
            throw new Error('Unknown action type');
    }
};

const entityTemplateObjectToEntityTemplateForm = (entityTemplate?: IMongoEntityTemplatePopulated) => {
    if (!entityTemplate) return undefined;
    const { required } = entityTemplate.properties;

    const requiredProrerites: EntityTemplateFormInputProperties[] = [];
    const optionalProrerites: EntityTemplateFormInputProperties[] = [];

    Object.keys(entityTemplate.properties.properties).forEach((key) => {
        if (required.includes(key)) {
            requiredProrerites.push({ name: key, ...entityTemplate.properties.properties[key] });
        } else {
            optionalProrerites.push({ name: key, ...entityTemplate.properties.properties[key] });
        }
    });
    return { ...entityTemplate, requiredProrerites, optionalProrerites };
};

const categoryObjectToCategoryForm = (category?: IMongoCategory) => {
    if (!category) return undefined;
    const { iconFileId, ...restOfCategory } = category;

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return { ...restOfCategory, file };
    }

    return restOfCategory;
};

const SystemManagement = () => {
    const queryClient = useQueryClient();
    const [categoryWizardState, dispatchCategoryWizard] = useReducer(categoryWizardReducer, { showWizard: false });
    const [entityTemplateState, dispatchEntityTemplateWizard] = useReducer(entityTemplateWizardReducer, { showWizard: false });

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates');
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories');

    const entityTemplatesByCategory: { [id: string]: IMongoCategory & { entityTemplates: IMongoEntityTemplatePopulated[] } } = {};
    categories?.forEach((category) => {
        // eslint-disable-next-line no-param-reassign
        entityTemplatesByCategory[category._id] = {
            ...category,
            entityTemplates: entityTemplates?.filter((entityTemplate) => entityTemplate.category._id === category._id) || [],
        };
    });

    return (
        <Grid container>
            <Grid item xs={12}>
                <Typography variant="h2">קטגוריות</Typography>
                <Grid container spacing={4} textAlign="center">
                    {categories?.map((category) => (
                        <InfoCard
                            key={category._id}
                            text={category.displayName}
                            onClick={() => dispatchCategoryWizard({ type: 'show', initialValues: category })}
                        />
                    ))}
                    <AddCard onClick={() => dispatchCategoryWizard({ type: 'show' })} />
                </Grid>
            </Grid>
            {Object.values(entityTemplatesByCategory).map((category) => (
                <Grid item xs={12} key={category._id}>
                    <Typography variant="h3">{category.displayName}</Typography>
                    <Grid container spacing={4} textAlign="center">
                        {category.entityTemplates?.map((entityTemplate) => (
                            <InfoCard
                                key={entityTemplate._id}
                                text={entityTemplate.displayName}
                                onClick={() => dispatchEntityTemplateWizard({ type: 'show', initialValues: entityTemplate })}
                            />
                        ))}
                        <AddCard onClick={() => dispatchEntityTemplateWizard({ type: 'show' })} />
                    </Grid>
                </Grid>
            ))}
            <CategoryWizard
                open={categoryWizardState.showWizard}
                handleClose={() => dispatchCategoryWizard({ type: 'hide' })}
                initialValues={categoryObjectToCategoryForm(categoryWizardState.initialValues)}
                isEditMode={!!categoryWizardState.initialValues}
            />
            <EntityTemplateWizard
                open={entityTemplateState.showWizard}
                handleClose={() => dispatchEntityTemplateWizard({ type: 'hide' })}
                initialValues={entityTemplateObjectToEntityTemplateForm(entityTemplateState.initialValues)}
                isEditMode={!!entityTemplateState.initialValues}
            />
        </Grid>
    );
};

export default SystemManagement;
