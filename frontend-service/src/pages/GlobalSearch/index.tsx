import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import EntitiesPage from '../../common/EntitiesPage';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import StartPageSearch from './components/StartPageSearch';

const GlobalSearch: React.FC<{}> = () => {
    const queryClient = useQueryClient();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedCategories = Array.from(categories.values()).filter((category) =>
        myPermissions.instancesPermissions.some(({ category: categoryId }) => categoryId === category._id),
    );

    const allowedTemplates = Array.from(entityTemplates.values()).filter((entityTemplate) =>
        allowedCategories.find((category) => category._id === entityTemplate.category._id),
    );

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState(allowedTemplates);
    const [urlSearchParams, setUrlSearchParams] = useSearchParams({});

    return urlSearchParams.get('search') === null ? (
        <StartPageSearch onSearch={(searchValue) => setUrlSearchParams({ search: searchValue, viewMode: 'templates-tables-view' })} />
    ) : (
        <EntitiesPage
            pageType="globalSearch"
            templates={allowedTemplates}
            categories={allowedCategories}
            excelExportAllTablesFileName={`${i18next.t('pages.globalSearch')}.xlsx`}
            pageTitle={i18next.t('pages.globalSearch')}
            templatesToShowCheckbox={templatesToShowCheckbox}
            setTemplatesToShowCheckbox={setTemplatesToShowCheckbox}
            isTemplatesCheckboxDraggableDisabled
        />
    );
};

export default GlobalSearch;
