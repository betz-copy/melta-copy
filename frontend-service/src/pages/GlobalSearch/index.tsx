import React from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import _debounce from 'lodash.debounce';
import { ICategoryMap } from '../../interfaces/categories';

import '../../css/pages.css';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../../services/permissionsService';
import TemplatesTablesPage from '../../common/TemplatesTablesPage';

const GlobalSearch: React.FC = () => {
    const queryClient = useQueryClient();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedCategories = Array.from(categories.values()).filter((category) => {
        return myPermissions.instancesPermissions.some(({ category: categoryId }) => categoryId === category._id);
    });

    const allowedTemplates = Array.from(entityTemplates.values()).filter((entityTemplate) => {
        return allowedCategories.find((category) => category._id === entityTemplate.category._id);
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
