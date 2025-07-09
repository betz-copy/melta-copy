import React, { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import EntitiesPage from '../../common/EntitiesPage';
import { ICategoryMap, IMongoCategory } from '../../interfaces/categories';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { useUserStore } from '../../stores/user';
import { IEntityChildTemplateMap, IMongoChildEntityTemplate } from '../../interfaces/entityChildTemplates';

export const transformChild = (
    child: IMongoChildEntityTemplate,
    parent: IMongoEntityTemplatePopulated,
    category: IMongoCategory,
): IMongoEntityTemplatePopulated & { fatherTemplateId: string } => {
    const childPropertyKeys = Object.keys(child.properties);

    const childProperties = Object.fromEntries(
        Object.entries(parent.properties.properties)
            .filter(([key]) => childPropertyKeys.includes(key))
            .map(([key, parentProp]) => [
                key,
                {
                    ...parentProp,
                    defaultValue: child.properties[key].defaultValue,
                    filters: child.properties[key].filters,
                    isFilterByCurrentUser: child.filterByCurrentUserField === key,
                },
            ]),
    );

    return {
        ...parent,
        _id: child._id,
        displayName: child.displayName,
        fatherTemplateId: parent._id,
        properties: {
            ...parent.properties,
            properties: childProperties,
        },
        propertiesOrder: parent.propertiesOrder.filter((key) => key in childProperties),
        category: category,
    };
};

const Category: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IEntityChildTemplateMap>('getChildEntityTemplates')!;
    const childTemplatesList = Array.from(childTemplates.values());

    const category = categories.get(categoryId!)!;
    const currentUser = useUserStore((state) => state.user);

    const authorizedTemplates = Array.from(entityTemplates.values()).filter(
        (template) =>
            !!template &&
            template.category._id === category._id &&
            (currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.entityTemplates?.[template._id] ||
                currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.scope ||
                currentUser.currentWorkspacePermissions?.admin?.scope),
    );

    const authorizedChildTemplates = childTemplatesList.filter(
        (template) =>
            !!template &&
            template.categories.includes(category._id) &&
            (currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.entityTemplates?.[template._id] ||
                currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.scope ||
                currentUser.currentWorkspacePermissions?.admin?.scope),
    );

    const allAuthorizedTemplatesMap = new Map<string, IMongoEntityTemplatePopulated>();

    authorizedTemplates.forEach((template) => {
        allAuthorizedTemplatesMap.set(template._id, template);
    });

    const defaultOrderedTemplateIds: string[] = [];
    const addedTemplateIds = new Set<string>();

    category.templatesOrder.forEach((parentId) => {
        const parent = entityTemplates.get(parentId);
        if (!parent || !authorizedTemplates.find((t) => t._id === parentId)) return;

        defaultOrderedTemplateIds.push(parentId);
        addedTemplateIds.add(parentId);

        const children = authorizedChildTemplates.filter((child) => child.fatherTemplateId === parentId);

        children.forEach((child) => {
            defaultOrderedTemplateIds.push(child._id);
            addedTemplateIds.add(child._id);

            const childTemplate = transformChild(child, parent, category);
            allAuthorizedTemplatesMap.set(child._id, childTemplate);
            allAuthorizedTemplatesMap.set(child._id, childTemplate);
        });
    });

    authorizedChildTemplates.forEach((child) => {
        if (!addedTemplateIds.has(child._id)) {
            const parent = entityTemplates.get(child.fatherTemplateId);
            if (parent) {
                const childTemplate = transformChild(child, parent, category);
                allAuthorizedTemplatesMap.set(child._id, childTemplate);
                defaultOrderedTemplateIds.push(child._id);
                addedTemplateIds.add(child._id);
            }
        }
    });

    const [categoryTemplatesId, setCategoryTemplatesId] = useLocalStorage<string[]>(`tableOrder-${categoryId}`, defaultOrderedTemplateIds);

    const categoryTemplates = categoryTemplatesId.map((id) => allAuthorizedTemplatesMap.get(id)!);

    const [templateIdsToShowCheckbox, setTemplateIdsToShowCheckbox] = useLocalStorage<string[]>(
        `templatesToShow-${categoryId}`,
        categoryTemplates.map((template) => template?._id ?? ''),
    );

    const templatesToShowCheckbox: IMongoEntityTemplatePopulated[] = templateIdsToShowCheckbox.map((id) => allAuthorizedTemplatesMap.get(id)!);

    const setTemplatesToShowCheckbox = (newTemplates: React.SetStateAction<IMongoEntityTemplatePopulated[]>) => {
        setTemplateIdsToShowCheckbox((prevTemplateIdsToShowCheckbox) => {
            const prevTemplates = prevTemplateIdsToShowCheckbox
                .map((id) => allAuthorizedTemplatesMap.get(id))
                .filter((template): template is IMongoEntityTemplatePopulated => !!template);
            const updatedTemplates = typeof newTemplates === 'function' ? newTemplates(prevTemplates) : newTemplates;
            return updatedTemplates.map((template) => template._id);
        });
    };

    useEffect(() => {
        setCategoryTemplatesId((prevCategoryTemplatesId) => {
            const allAuthorizedTemplatesList = Array.from(allAuthorizedTemplatesMap.values());

            const templatesToAdd = allAuthorizedTemplatesList.filter((template) => !prevCategoryTemplatesId.includes(template._id));
            const templatesToAddIds = templatesToAdd.map((template) => template._id);

            const existingTemplateIds = prevCategoryTemplatesId.filter((id) => allAuthorizedTemplatesMap.has(id));

            setTemplateIdsToShowCheckbox((prevTemplatesToShowCheckbox) => [
                ...prevTemplatesToShowCheckbox.filter((id) => allAuthorizedTemplatesMap.has(id)),
                ...templatesToAddIds,
            ]);
            return [...existingTemplateIds, ...templatesToAddIds];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allAuthorizedTemplatesMap.size, category._id]);

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
