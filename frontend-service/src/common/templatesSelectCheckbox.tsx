import { FilterList } from '@mui/icons-material';
import i18next from 'i18next';
import React, { Dispatch } from 'react';
import { IMongoCategory } from '../interfaces/categories';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { SelectCheckbox, SelectCheckboxProps } from './SelectCheckbox';

const getCategoriesSelectCheckboxGroupProps = (
    categories: IMongoCategory[] | undefined,
): SelectCheckboxProps<IMongoEntityTemplatePopulated, IMongoCategory>['groupsProps'] => {
    if (!categories) {
        return {
            useGroups: false,
        };
    }

    return {
        useGroups: true,
        groups: categories,
        getGroupId: (category) => category._id,
        getGroupLabel: (category) => category.displayName,
        getGroupOfOption: (entityTemplate, _categories) => entityTemplate.category,
    };
};

const TemplatesSelectCheckbox: React.FC<{
    title: string;
    templates: IMongoEntityTemplatePopulated[];
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    categories?: any[];
    isDraggableDisabled?: boolean;
    setTemplates?: Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    size?: 'small' | 'medium';
    toTopBar?: boolean;
}> = ({ title, templates, selectedTemplates, setSelectedTemplates, categories, isDraggableDisabled, setTemplates, size, toTopBar }) => {
    // TODO: convert to Tree component
    let formattedTemplates: any[] = templates;

    if (categories) {
        const templatesByCategory = {};

        // Group templates by category ID
        templates.forEach((template) => {
            const categoryId = template.category._id;
            if (!templatesByCategory[categoryId]) {
                templatesByCategory[categoryId] = [];
            }
            templatesByCategory[categoryId].push(template);
        });

        formattedTemplates = Object.entries(templatesByCategory).map(([categoryId, currTemplates]) => {
            const category = categories.find((currCategory) => currCategory._id === categoryId);

            return {
                ...category,
                children: currTemplates,
            };
        });
    }

    return (
        <SelectCheckbox
            title={title}
            img={title === i18next.t('entityTemplatesCheckboxLabel') ? <FilterList /> : undefined}
            options={formattedTemplates}
            selectedOptions={selectedTemplates.map(({ _id }) => _id)}
            setSelectedOptions={setSelectedTemplates}
            getOptionId={({ _id }) => _id}
            getOptionLabel={({ displayName }) => displayName}
            isDraggableDisabled={isDraggableDisabled}
            setOptions={setTemplates}
            size={size}
            toTopBar={toTopBar}
        />
    );
    // return (
    //     <SelectCheckbox
    //         title={title}
    //         img={title === i18next.t('entityTemplatesCheckboxLabel') ? <FilterList /> : undefined}
    //         options={templates}
    //         selectedOptions={selectedTemplates}
    //         setSelectedOptions={setSelectedTemplates}
    //         getOptionId={({ _id }) => _id}
    //         getOptionLabel={({ displayName }) => displayName}
    //         groupsProps={getCategoriesSelectCheckboxGroupProps(categories)}
    //         isDraggableDisabled={isDraggableDisabled}
    //         setOptions={setTemplates}
    //         size={size}
    //         toTopBar={toTopBar}
    //     />
    // );
};

export default TemplatesSelectCheckbox;
