import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { useQueryClient } from 'react-query';

import i18next from 'i18next';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoCategory } from '../../interfaces/categories';
import { CategoriesRow } from './components/CategoriesRow';
import { EntityTemplatesRow } from './components/EntityTemplatesRow';
import { RelationshipTemplatesRow } from './components/RelationshipTemplatesRow';
import { BlueTitle } from '../../common/BlueTitle';

const SystemManagement = () => {
    const queryClient = useQueryClient();

    const [categoriesToHide, setCategoriesToHide] = useState<string[]>([]);
    const [sourceEntityTemplatesToHide, setSourceEntityTemplatesToHide] = useState<string[]>([]);
    const [destinationEntityTemplatesToHide, setDestinationEntityTemplatesToHide] = useState<string[]>([]);

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;

    return (
        <Grid container spacing={4}>
            <BlueTitle title={i18next.t('pages.systemManagement')} component="h3" variant="h3" style={{ paddingTop: '32px', paddingRight: '32px' }} />
            <CategoriesRow categories={categories} />
            <EntityTemplatesRow
                categories={categories}
                entityTemplates={entityTemplates}
                categoriesToHide={categoriesToHide}
                setCategoriesToHide={setCategoriesToHide}
            />
            <RelationshipTemplatesRow
                relationshipTemplates={relationshipTemplates}
                entityTemplates={entityTemplates}
                sourceEntityTemplatesToHide={sourceEntityTemplatesToHide}
                setSourceEntityTemplatesToHide={setSourceEntityTemplatesToHide}
                destinationEntityTemplatesToHide={destinationEntityTemplatesToHide}
                setDestinationEntityTemplatesToHide={setDestinationEntityTemplatesToHide}
            />
        </Grid>
    );
};

export default SystemManagement;
