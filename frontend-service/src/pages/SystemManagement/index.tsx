import React, { useState } from 'react';
import { Grid, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { IMongoCategory, IMongoEntityTemplatePopulated } from '../../interfaces';
import { CategoryWizard } from '../../common/wizards/category';
import { EntityTemplateWizard } from '../../common/wizards/entityTemplate';
import { InfoCard } from './components/InfoCard';
import { AddCard } from './components/AddCard';

const SystemManagement = () => {
    const { entityTemplates, categories } = useSelector((state: RootState) => state.globalState);

    const [isCategoryWizardOpen, setIsCategoryWizardOpen] = useState(false);
    const [isEntityTemplateWizardOpen, setIsEntityTemplateWizardOpen] = useState(false);

    const entityTemplatesByCategory: (IMongoCategory & { entityTemplates: IMongoEntityTemplatePopulated[] })[] = Object.values(
        entityTemplates.reduce((group: any, product) => {
            const { category } = product;
            // eslint-disable-next-line no-param-reassign
            group[category._id] = group[category._id] ?? { ...category, entityTemplates: [] };
            group[category._id].entityTemplates.push(product);
            return group;
        }, {}),
    );

    const closeCategoryWizard = () => {
        setIsCategoryWizardOpen(false);
    };

    const openCategoryWizard = () => {
        setIsCategoryWizardOpen(true);
    };

    const closeEntityTemplateWizard = () => {
        setIsEntityTemplateWizardOpen(false);
    };

    const openEntityTemplateWizard = () => {
        setIsEntityTemplateWizardOpen(true);
    };

    return (
        <Grid container>
            <Grid item xs={12}>
                <Typography variant="h2">קטגוריות</Typography>
                <Grid container spacing={4} textAlign="center">
                    {categories.map((category) => (
                        <InfoCard key={category._id} text={category.displayName} />
                    ))}
                    <AddCard onClick={openCategoryWizard} />
                </Grid>
            </Grid>
            {entityTemplatesByCategory.map((category) => (
                <Grid item xs={12} key={category._id}>
                    <Typography variant="h2">{category.displayName}</Typography>
                    <Grid container spacing={4} textAlign="center">
                        {category.entityTemplates.map((entityTemplate) => (
                            <InfoCard key={entityTemplate._id} text={entityTemplate.displayName} />
                        ))}
                        <AddCard onClick={openEntityTemplateWizard} />
                    </Grid>
                </Grid>
            ))}
            <CategoryWizard open={isCategoryWizardOpen} handleClose={closeCategoryWizard} />
            <EntityTemplateWizard open={isEntityTemplateWizardOpen} handleClose={closeEntityTemplateWizard} />
        </Grid>
    );
};

export { SystemManagement };
