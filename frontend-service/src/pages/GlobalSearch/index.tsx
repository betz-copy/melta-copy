import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import i18next from 'i18next';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../../services/permissionsService';
import StartPageSearch from './components/StartPageSearch';
import EntitiesPage from '../../common/EntitiesPage';
import { useLocalStorage } from '../../utils/useLocalStorage';

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
    const [urlSearchParams, setUrlSearchParams] = useSearchParams({});

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useLocalStorage('globalSearch', allowedTemplates);
    const [templates, setTemplates] = useState<IMongoEntityTemplatePopulated[]>([]);

    return urlSearchParams.get('search') === null ? (
        <StartPageSearch onSearch={(searchValue) => setUrlSearchParams({ search: searchValue })} />
    ) : (
        <EntitiesPage
            pageType="globalSearch"
            templates={allowedTemplates}
            categories={allowedCategories}
            excelExportAllTablesFileName={`${i18next.t('pages.globalSearch')}.xlsx`}
            pageTitle={i18next.t('pages.globalSearch')}
            templatesToShowCheckbox={templatesToShowCheckbox}
            setTemplatesToShowCheckbox={setTemplatesToShowCheckbox}
            setTemplates={setTemplates}
            isTemplatesCheckboxDraggable
        />
    );
};

export default GlobalSearch;
