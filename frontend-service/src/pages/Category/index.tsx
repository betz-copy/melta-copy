import React from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import _debounce from 'lodash.debounce';
import { Grid } from '@mui/material';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

import '../../css/pages.css';
import TemplatesTablesPage from '../../common/TemplatesTablesPage';

const Category: React.FC = () => {
    const queryClient = useQueryClient();
    const params = useParams();
    const { categoryId } = params;

    const category = queryClient.getQueryData<IMongoCategory[]>('getCategories')!.find((currCategory) => currCategory._id === categoryId)!;

    const templates = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!
        .filter((template) => template.category._id === category._id);

    return (
        <Grid container marginLeft="0" marginRight="0">
            <TemplatesTablesPage
                key={category._id}
                templates={templates}
                excelExportAllTablesFileName={`${category.displayName}.xlsx`}
                pageType="category"
                pageTitle={category.displayName}
            />
        </Grid>
    );
};

export default Category;
