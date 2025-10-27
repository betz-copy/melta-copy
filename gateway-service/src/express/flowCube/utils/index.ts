import { ICompactPermissions, IEntitySingleProperty, IMongoCategory, ISubCompactPermissions, IWorkspace } from '@microservices/shared';
import WorkspaceService from '../../workspaces/service';

export const filterWorkspacesByPermissions = async (workspaces: IWorkspace[], usersPermissions: ICompactPermissions): Promise<IWorkspace[]> => {
    return (
        await Promise.all(
            workspaces.map(async (workspace) => ({ ...workspace, hierarchyIds: await WorkspaceService.getWorkspaceHierarchyIds(workspace._id) })),
        )
    ).filter(({ hierarchyIds }) => hierarchyIds.some((id) => Boolean(usersPermissions[id])));
};

export const filterCategoriesByPermissions = (categories: IMongoCategory[], usersPermissions: ISubCompactPermissions): IMongoCategory[] => {
    if (!usersPermissions.instances) {
        return [] as IMongoCategory[];
    }

    return categories.filter(({ _id }) => usersPermissions.instances?.categories[_id]);
};

export const getEntityTemplatesPermissionsByCategory = (usersPermissions: ISubCompactPermissions): Record<string, string[]> => {
    if (!usersPermissions.instances) return {};

    return Object.entries(usersPermissions.instances.categories).reduce(
        (acc, [categoryId, category]) => {
            const templateIds = category.entityTemplates ? Object.keys(category.entityTemplates) : [];
            acc[categoryId] = templateIds;

            return acc;
        },
        {} as Record<string, string[]>,
    );
};

export const getAdditionalFields = (): { Name: string; Type: string; DisplayName: string; OntologyType: string | null }[] => {
    return [
        { Name: 'meltaLink', Type: 'string', DisplayName: 'פתח במלתעות', OntologyType: null },
        { Name: 'createdAt', Type: 'DateTime', DisplayName: 'תאריך יצירה', OntologyType: null },
        { Name: 'updatedAt', Type: 'DateTime', DisplayName: 'תאריך עדכון', OntologyType: null },
    ];
};

export const convertTypeToFlowType = (property: IEntitySingleProperty): string => {
    let flowType = 'String';

    switch (property.type) {
        case 'string':
            if (property.format === 'date' || property.format === 'date-time') {
                flowType = 'DateTime';
            } else if (property.format === 'fileId') {
                flowType = 'File';
            } else {
                flowType = 'String';
            }
            break;
        case 'number':
            flowType = 'Double';
            break;
        case 'boolean':
            flowType = 'Boolean';
            break;
        default:
            flowType = 'String';
            break;
    }

    return flowType;
};

export const getOntologyTypeByProperty = (property: IEntitySingleProperty) => {
    let ontologyType = 'TEXT';

    switch (property.type) {
        case 'string':
            if (property.format === 'date' || property.format === 'date-time') {
                ontologyType = 'TIME';
            } else if (property.format === 'email') {
                ontologyType = 'EMAIL';
            } else {
                ontologyType = 'TEXT';
            }

            break;
        case 'number':
            ontologyType = 'INTEGER';

            break;
        default:
            ontologyType = 'TEXT';

            break;
    }

    return ontologyType;
};

export const convertArrayToFlowOptions = (arr: string[]) => {
    return arr.map((item) => ({
        Name: item,
        Value: item,
    }));
};

export const makeLinkClickable = (link: string): string => {
    return `<a target="_blank" href=${link}>עמוד פרט</a>`;
};
