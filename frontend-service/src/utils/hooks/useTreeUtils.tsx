import { IMongoCategory, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared';
import { TreeViewBaseItem } from '@mui/x-tree-view-pro';

export const groupTemplatesByCategory = (
    categories: IMongoCategory[],
    templates: IMongoEntityTemplateWithConstraintsPopulated[],
    getItemId: (item: IMongoCategory | IMongoEntityTemplateWithConstraintsPopulated) => string,
): TreeViewBaseItem<IMongoCategory | IMongoEntityTemplateWithConstraintsPopulated>[] => {
    const templatesByCategory: Record<string, IMongoEntityTemplateWithConstraintsPopulated[]> = {};

    templates.forEach((template) => {
        const categoryId = getItemId(template.category);

        if (!templatesByCategory[categoryId]) {
            templatesByCategory[categoryId] = [];
        }

        templatesByCategory[categoryId].push(template);
    });

    return Object.entries(templatesByCategory).map(([categoryId, currTemplates]) => {
        const category = categories.find((currCategory) => getItemId(currCategory) === categoryId)!;

        return {
            ...category,
            children: currTemplates,
        };
    });
};
