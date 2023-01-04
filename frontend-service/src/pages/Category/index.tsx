import React from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import _debounce from 'lodash.debounce';
import { Grid } from '@mui/material';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';

import '../../css/pages.css';
import TemplatesTablesPage from '../../common/TemplatesTablesPage';

const Category: React.FC = () => {
    const { categoryId } = useParams();

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const category = categories.get(categoryId!)!;
    const categoryTemplates = Array.from(entityTemplates.values()).filter((template) => template.category._id === category._id);

    return (
        <Grid container marginLeft="0" marginRight="0">
            <TemplatesTablesPage
                key={category._id}
                templates={categoryTemplates}
                excelExportAllTablesFileName={`${category.displayName}.xlsx`}
                pageType="category"
                pageTitle={category.displayName}
            />
        </Grid>
    );
};

export default Category;
