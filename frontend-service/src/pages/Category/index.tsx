import React, { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import EntitiesPage from '../../common/EntitiesPage';
import { ICategoryMap } from '../../interfaces/categories';
import { IChildTemplateMap, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useUserStore } from '../../stores/user';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { TablePageType } from '../../common/EntitiesTableOfTemplate';

const Category: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
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
            template.category._id === category._id &&
            (currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.entityTemplates?.[template._id] ||
                currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.scope ||
                currentUser.currentWorkspacePermissions?.admin?.scope),
    );

    const allAuthorizedTemplatesMap = new Map<string, IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated>();

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

        const children = authorizedChildTemplates.filter((child) => child.parentTemplate._id === parentId);

        children.forEach((child) => {
            defaultOrderedTemplateIds.push(child._id);
            addedTemplateIds.add(child._id);

            allAuthorizedTemplatesMap.set(child._id, child);
        });
    });

    const getParentOrChildTemplate = (id: string) => allAuthorizedTemplatesMap.get(id)!;

    authorizedChildTemplates.forEach((child) => {
        if (!addedTemplateIds.has(child._id)) {
            allAuthorizedTemplatesMap.set(child._id, child);
            defaultOrderedTemplateIds.push(child._id);
            addedTemplateIds.add(child._id);
        }
    });

    const [categoryTemplatesId, setCategoryTemplatesId] = useLocalStorage<string[]>(`tableOrder-${categoryId}`, defaultOrderedTemplateIds);
    const categoryTemplates = categoryTemplatesId.map((id) => getParentOrChildTemplate(id)).filter((template) => !!template);

    const [templateIdsToShowCheckbox, setTemplateIdsToShowCheckbox] = useLocalStorage<string[]>(
        `templatesToShow-${categoryId}`,
        categoryTemplates.map((template) => template?._id ?? ''),
    );

    const templatesToShowCheckbox: (IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[] = templateIdsToShowCheckbox.map((id) =>
        getParentOrChildTemplate(id),
    );

    const setTemplatesToShowCheckbox = (newTemplates: React.SetStateAction<(IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[]>) => {
        setTemplateIdsToShowCheckbox((prevTemplateIdsToShowCheckbox) => {
            const prevTemplates = prevTemplateIdsToShowCheckbox
                .map((id) => getParentOrChildTemplate(id))
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
            pageType={TablePageType.category}
            pageTitle={category.displayName}
        />
    );
};

const CategoryWrapper: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();

    return <Category key={categoryId} />;
};

export default CategoryWrapper;
