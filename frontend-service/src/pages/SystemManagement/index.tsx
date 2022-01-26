import React, { useReducer, Reducer } from 'react';
import { Grid, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { IMongoCategory, IMongoEntityTemplatePopulated } from '../../interfaces';
import { CategoryWizard } from '../../common/wizards/category';
import { EntityTemplateWizard } from '../../common/wizards/entityTemplate';
import { InfoCard } from './components/InfoCard';
import { AddCard } from './components/AddCard';

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
    const properties = Object.keys(entityTemplate.properties.properties).map((key) => {
        return {
            name: key,
            ...entityTemplate.properties.properties[key],
            isRequired: !!required.includes(key),
        };
    });
    return { ...entityTemplate, properties };
};

const SystemManagement = () => {
    const { entityTemplates, categories } = useSelector((state: RootState) => state.globalState);
    const [categoryWizardState, dispatchCategoryWizard] = useReducer(categoryWizardReducer, { showWizard: false });
    const [entityTemplateState, dispatchEntityTemplateWizard] = useReducer(entityTemplateWizardReducer, { showWizard: false });

    const entityTemplatesByCategory: (IMongoCategory & { entityTemplates: IMongoEntityTemplatePopulated[] })[] = Object.values(
        entityTemplates.reduce((group: any, product) => {
            const { category } = product;
            // eslint-disable-next-line no-param-reassign
            group[category._id] = group[category._id] ?? { ...category, entityTemplates: [] };
            group[category._id].entityTemplates.push(product);
            return group;
        }, {}),
    );

    return (
        <Grid container>
            <Grid item xs={12}>
                <Typography variant="h2">קטגוריות</Typography>
                <Grid container spacing={4} textAlign="center">
                    {categories.map((category) => (
                        <InfoCard
                            key={category._id}
                            text={category.displayName}
                            onClick={() => dispatchCategoryWizard({ type: 'show', initialValues: category })}
                        />
                    ))}
                    <AddCard onClick={() => dispatchCategoryWizard({ type: 'show' })} />
                </Grid>
            </Grid>
            {entityTemplatesByCategory.map((category) => (
                <Grid item xs={12} key={category._id}>
                    <Typography variant="h2">{category.displayName}</Typography>
                    <Grid container spacing={4} textAlign="center">
                        {category.entityTemplates.map((entityTemplate) => (
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
                initialValues={categoryWizardState.initialValues}
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

export { SystemManagement };
