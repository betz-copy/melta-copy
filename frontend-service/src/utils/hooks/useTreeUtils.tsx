import { TreeViewBaseItem } from '@mui/x-tree-view-pro';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

export const groupTemplatesByCategory = (
    categories: IMongoCategory[],
    templates: IMongoEntityTemplatePopulated[],
    getItemId: (item: IMongoCategory | IMongoEntityTemplatePopulated) => string,
): TreeViewBaseItem<IMongoCategory | IMongoEntityTemplatePopulated>[] => {
    const templatesByCategory: Record<string, IMongoEntityTemplatePopulated[]> = {};

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
