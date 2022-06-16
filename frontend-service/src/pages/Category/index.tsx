import React, { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import _debounce from 'lodash.debounce';
import { Grid } from '@mui/material';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

import '../../css/pages.css';
import TemplatesTablesPage from '../../common/TemplatesTablesPage';

const Category: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const params = useParams();
    const { categoryId } = params;

    const category = queryClient.getQueryData<IMongoCategory[]>('getCategories')!.find((currCategory) => currCategory._id === categoryId)!;

    useEffect(() => setTitle(category.displayName), [category.displayName, setTitle]);

    const templates = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!
        .filter((template) => template.category._id === category._id);

    return (
        <Grid container className="pageMargin">
            <TemplatesTablesPage key={category._id} templates={templates} excelExportAllTablesFileName={`${category.displayName}.xlsx`} />
        </Grid>
    );
};

export default Category;
