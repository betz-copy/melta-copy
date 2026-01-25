import { ICategoryMap } from '@packages/category';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import EntitiesPage from '../../common/EntitiesPage';
import { TablePageType } from '../../common/EntitiesTableOfTemplate';
import { IChildTemplateMap, IEntityTemplateMap } from '../../interfaces/template';
import { useUserStore } from '../../stores/user';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import StartPageSearch from './components/StartPageSearch';

const GlobalSearch: React.FC = () => {
    const currentUser = useUserStore((state) => state.user);

    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const allowedCategories = currentUser.currentWorkspacePermissions.admin
        ? Array.from(categories.values())
        : Array.from(categories.values()).filter((category) => Boolean(currentUser.currentWorkspacePermissions.instances?.categories[category._id]));

    const allowedTemplates = [...entityTemplates.values(), ...childTemplates.values()].filter((entityTemplate) =>
        allowedCategories.find((category) => category._id === entityTemplate.category._id),
    );

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState(allowedTemplates);
    const [urlSearchParams, setUrlSearchParams] = useSearchParams({});

    return urlSearchParams.get('search') === null ? (
        <StartPageSearch
            onSearch={(searchValue) =>
                setUrlSearchParams({ ...Object.fromEntries(urlSearchParams.entries()), search: searchValue, viewMode: 'templates-tables-view' })
            }
        />
    ) : (
        <EntitiesPage
            pageType={TablePageType.globalSearch}
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
