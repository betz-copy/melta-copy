import React from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import _debounce from 'lodash.debounce';
import { IMongoCategory } from '../../interfaces/categories';

import '../../css/pages.css';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../../services/permissionsService';
import TemplatesTablesPage from '../../common/TemplatesTablesPage';

const GlobalSearch: React.FC = () => {
    const queryClient = useQueryClient();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const allowedCategories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!.filter((category) => {
        return myPermissions.instancesPermissions.some(({ category: categoryId }) => categoryId === category._id);
    });

    const allowedTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!.filter((entityTemplate) => {
        return allowedCategories.map(({ _id }) => _id).includes(entityTemplate.category._id);
    });

    return (
        <Grid container marginLeft="0" marginRight="0">
            <TemplatesTablesPage
                pageType="globalSearch"
                key="globalSearch"
                templates={allowedTemplates}
                categories={allowedCategories}
                excelExportAllTablesFileName={`${i18next.t('pages.globalSearch')}.xlsx`}
                pageTitle={i18next.t('pages.globalSearch')}
            />
        </Grid>
    );
};

export default GlobalSearch;
