import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { IMongoCategory, IMongoEntityTemplatePopulated } from '../../interfaces';
import { CategoryWizard } from '../../common/wizards/category';
import { EntityTemplateWizard } from '../../common/wizards/entityTemplate';
import { CardRow } from './components/CardRow';

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
            <CardRow text="קטגוריות" rowValues={categories} onClick={openCategoryWizard} />
            {entityTemplatesByCategory.map((category) => (
                <CardRow key={category._id} text={category.displayName} rowValues={category.entityTemplates} onClick={openEntityTemplateWizard} />
            ))}
            <CategoryWizard open={isCategoryWizardOpen} handleClose={closeCategoryWizard} />
            <EntityTemplateWizard open={isEntityTemplateWizardOpen} handleClose={closeEntityTemplateWizard} />
        </Grid>
    );
};

export { SystemManagement };
