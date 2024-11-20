import _debounce from 'lodash.debounce';
import React, { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import { IEntityTemplateMap, IMongoEntityTemplateWithConstraintsPopulated, ICategoryMap } from '@microservices/shared';
import EntitiesPage from '../../common/EntitiesPage';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';

const Category: React.FC = () => {
    const { categoryId } = useParams();
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const category = categories.get(categoryId!)!;

    const [categoryTemplatesId, setCategoryTemplatesId] = useLocalStorage<string[]>(
        `tableOrder-${categoryId}`,
        Array.from(entityTemplates.values())
            .filter((template) => template.category._id === category._id)
            .map((template) => template._id),
    );

    const categoryTemplates = categoryTemplatesId
        .map((id) => entityTemplates.get(id))
        .filter((template): template is IMongoEntityTemplateWithConstraintsPopulated => !!template);

    const [templateIdsToShowCheckbox, setTemplateIdsToShowCheckbox] = useLocalStorage<string[]>(
        `templatesToShow-${categoryId}`,
        categoryTemplates.map((template) => template._id),
    );

    const templatesToShowCheckbox = templateIdsToShowCheckbox
        .map((id) => entityTemplates.get(id))
        .filter((template): template is IMongoEntityTemplateWithConstraintsPopulated => !!template);

    const setTemplatesToShowCheckbox = (newTemplates: React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>) => {
        setTemplateIdsToShowCheckbox((prevtemplateIdsToShowCheckbox) => {
            const prevTemplates = prevtemplateIdsToShowCheckbox
                .map((id) => entityTemplates.get(id))
                .filter((template): template is IMongoEntityTemplateWithConstraintsPopulated => !!template);
            const updatedTemplates = typeof newTemplates === 'function' ? newTemplates(prevTemplates) : newTemplates;
            return updatedTemplates.map((template) => template._id);
        });
    };

    useEffect(() => {
        setCategoryTemplatesId((prevCategoryTemplatesId) => {
            const relevantTemplates = Array.from(entityTemplates.values()).filter((template) => template.category._id === category._id);
            const entityTemplatesToAddIds = relevantTemplates
                .filter((template) => !prevCategoryTemplatesId.includes(template._id))
                .map((template) => template._id);
            const existingCategoryTemplatesIds = prevCategoryTemplatesId.filter((templateId) =>
                relevantTemplates.some(({ _id }) => _id === templateId),
            );

            setTemplateIdsToShowCheckbox((prevTemplatesToShowCheckbox) => [
                ...prevTemplatesToShowCheckbox.filter((templateId) => relevantTemplates.some(({ _id }) => _id === templateId)),
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
                const ids = (newTemplates as IMongoEntityTemplateWithConstraintsPopulated[]).map((template) => template._id);
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
