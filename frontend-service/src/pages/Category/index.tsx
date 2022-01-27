/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAxios } from '../../axios';
import { environment } from '../../globals';
import { IEntityInstance, IMongoEntityTemplatePopulated } from '../../interfaces';

const Category: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('categoryId');
    const [{ data: instances }, getEntitiesByCategory] = useAxios<IEntityInstance[]>(`${environment.api.entities}?category=${categoryId}`, {
        manual: true,
    });
    const [{ data: templates }, getTemplatesByCategory] = useAxios<IMongoEntityTemplatePopulated[]>(
        `${environment.api.entityTemplates}?category=${categoryId}`,
        {
            manual: true,
        },
    );

    useEffect(() => {
        if (categoryId) {
            getTemplatesByCategory();
            getEntitiesByCategory();
        }
    }, [categoryId, getTemplatesByCategory, getEntitiesByCategory]);

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
                {Object.values(entitiesByTemplate).map((template) => {
                    return (
                        <div key={template._id}>
                            <h1> {template.displayName}</h1>
                            {template.entities.map((entity) => JSON.stringify(entity.properties))}
                        </div>
                    );
                })}
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

export { Category };
