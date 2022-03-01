import React from 'react';
import { useQuery } from 'react-query';
import { Navigate, useSearchParams } from 'react-router-dom';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IEntityInstance } from '../../interfaces/instances';
import { getEntityTemplatesByCategoryRequest } from '../../services/enitityTemplatesService';
import { getInstancesByCategoryRequest } from '../../services/instancesService';
import { TemplateTable } from './components/TemplateTable';

const Category: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('categoryId');
    const { data: instances } = useQuery(['getInstancesByCategory', categoryId], () => getInstancesByCategoryRequest(categoryId!));
    const { data: templates } = useQuery(['getEntityTemplatesByCategory', categoryId], () => getEntityTemplatesByCategoryRequest(categoryId!));

    if (!categoryId) {
        return <Navigate to="/" />;
    }

    if (templates) {
        const entitiesByTemplate: { [id: string]: IMongoEntityTemplatePopulated & { entities: IEntityInstance[] } } = {};
        templates.forEach((template) => {
            // eslint-disable-next-line no-param-reassign
            entitiesByTemplate[template._id] = {
                ...template,
                entities: instances?.filter((instance) => instance.templateId === template._id) || [],
            };
        });

        return (
            <>
                <h1>{categoryId}</h1>
                {Object.values(entitiesByTemplate).map((template) => (
                    <TemplateTable key={template._id} template={template} />
                ))}
            </>
        );
    }

    return (
        <>
            <h1>{categoryId}</h1>
            <div />
        </>
    );
};

export default Category;
