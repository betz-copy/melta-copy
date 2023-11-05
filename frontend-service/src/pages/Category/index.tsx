import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import _debounce from 'lodash.debounce';
import { Grid } from '@mui/material';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import '../../css/pages.css';
import EntitiesPage from '../../common/EntitiesPage';
import { useLocalStorage } from '../../utils/useLocalStorage';

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
        .filter((template): template is IMongoEntityTemplatePopulated => !!template);

    const [templatesToShowCheckbox, setTemplatesToShowCheckbox] = useState<IMongoEntityTemplatePopulated[]>(categoryTemplates);

    useEffect(() => {
        setCategoryTemplatesId((prevCategoryTemplatesId) => {
            const entityTemplatesArr = Array.from(entityTemplates.values());

            const entityTemplatesToAddIds = entityTemplatesArr
                .filter((template) => template.category._id === category._id && !prevCategoryTemplatesId.includes(template._id))
                .map((template) => template._id);

            const existingCategoryTemplatesIds = prevCategoryTemplatesId.filter((templateId) =>
                entityTemplatesArr.some(({ _id }) => _id === templateId),
            );

            return [...existingCategoryTemplatesIds, ...entityTemplatesToAddIds];
        });
    }, [entityTemplates.size, category._id]);

    useEffect(() => {
        setTemplatesToShowCheckbox(categoryTemplates);
    }, [categoryTemplatesId]);

    return (
        <Grid container marginLeft="0" marginRight="0">
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
        </Grid>
    );
};

const CategoryWrapper: React.FC = () => {
    const { categoryId } = useParams();

    return <Category key={categoryId} />;
};

export default CategoryWrapper;
