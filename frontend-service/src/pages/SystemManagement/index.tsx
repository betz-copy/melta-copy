import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import { useQueryClient } from 'react-query';

import i18next from 'i18next';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoCategory } from '../../interfaces/categories';
import { CategoriesRow } from './components/CategoriesRow';
import { EntityTemplatesRow } from './components/EntityTemplatesRow';
import { RelationshipTemplatesRow } from './components/RelationshipTemplatesRow';

import '../../css/pages.css';

const SystemManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const queryClient = useQueryClient();

    const [categoriesToHide, setCategoriesToHide] = useState<string[]>([]);
    const [sourceEntityTemplatesToHide, setSourceEntityTemplatesToHide] = useState<string[]>([]);
    const [destinationEntityTemplatesToHide, setDestinationEntityTemplatesToHide] = useState<string[]>([]);

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;

    useEffect(() => setTitle(i18next.t('pages.systemManagement')), [setTitle]);

    return (
        <Grid container className="pageMargin" spacing={4}>
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
