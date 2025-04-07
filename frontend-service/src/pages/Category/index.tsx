import React, { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import EntitiesPage from '../../common/EntitiesPage';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { useUserStore } from '../../stores/user';

const Category: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const category = categories.get(categoryId!)!;

    const currentUser = useUserStore((state) => state.user);

    const authorizedTemplates = Array.from(entityTemplates.values()).filter(
        (template) =>
            !!template &&
            template.category._id === category._id &&
            (!!currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.entityTemplates?.[template._id] ||
                !!currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.scope ||
                currentUser.currentWorkspacePermissions?.admin?.scope),
    );

    const [categoryTemplatesId, setCategoryTemplatesId] = useLocalStorage<string[]>(
        `tableOrder-${categoryId}`,
        // authorizedTemplates.map((template) => template._id),
        category.templateOrder,
    );

    const categoryTemplates = categoryTemplatesId
        .map((id) => entityTemplates.get(id))
        .filter((template): template is IMongoEntityTemplatePopulated => !!template);

    const [templateIdsToShowCheckbox, setTemplateIdsToShowCheckbox] = useLocalStorage<string[]>(
        `templatesToShow-${categoryId}`,
        categoryTemplates.map((template) => template._id),
    );

    const templatesToShowCheckbox = templateIdsToShowCheckbox
        .map((id) => entityTemplates.get(id))
        .filter((template): template is IMongoEntityTemplatePopulated => !!template);

    const setTemplatesToShowCheckbox = (newTemplates: React.SetStateAction<IMongoEntityTemplatePopulated[]>) => {
        setTemplateIdsToShowCheckbox((prevTemplateIdsToShowCheckbox) => {
            const prevTemplates = prevTemplateIdsToShowCheckbox
                .map((id) => entityTemplates.get(id))
                .filter((template): template is IMongoEntityTemplatePopulated => !!template);
            const updatedTemplates = typeof newTemplates === 'function' ? newTemplates(prevTemplates) : newTemplates;
            return updatedTemplates.map((template) => template._id);
        });
    };

    useEffect(() => {
        setCategoryTemplatesId((prevCategoryTemplatesId) => {
            const entityTemplatesToAddIds = authorizedTemplates
                .filter((template) => !prevCategoryTemplatesId.includes(template._id))
                .map((template) => template._id);
            const existingCategoryTemplatesIds = prevCategoryTemplatesId.filter((templateId) =>
                authorizedTemplates.some(({ _id }) => _id === templateId),
            );

            setTemplateIdsToShowCheckbox((prevTemplatesToShowCheckbox) => [
                ...prevTemplatesToShowCheckbox.filter((templateId) => authorizedTemplates.some(({ _id }) => _id === templateId)),
                ...entityTemplatesToAddIds,
            ]);
            return [...existingCategoryTemplatesIds, ...entityTemplatesToAddIds];
        });
    }, [entityTemplates.size, category._id]);

    return (
        <EntitiesPage
            key={category._id}
            templates={categoryTemplates}
            setTemplates={(newTemplates) => {
                const ids = (newTemplates as IMongoEntityTemplatePopulated[]).map((template) => template._id);
                setCategoryTemplatesId(ids);
            }}
            templatesToShowCheckbox={templatesToShowCheckbox}
            setTemplatesToShowCheckbox={setTemplatesToShowCheckbox}
            excelExportAllTablesFileName={`${category.displayName}.xlsx`}
            pageType="category"
            pageTitle={category.displayName}
        />
    );
};

const CategoryWrapper: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();

    return <Category key={categoryId} />;
};

export default CategoryWrapper;
