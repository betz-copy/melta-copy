import React from 'react';
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
        groups: categories.sort((categoryA, categoryB) => categoryA.displayName.localeCompare(categoryB.displayName)),
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
    size?: 'small' | 'medium';
}> = ({ title, templates, selectedTemplates, setSelectedTemplates, categories, size }) => {
    return (
        <SelectCheckbox
            title={title}
            options={templates.sort((templateA, templateB) => templateA.displayName.localeCompare(templateB.displayName))}
            selectedOptions={selectedTemplates}
            setSelectedOptions={setSelectedTemplates}
            getOptionId={({ _id }) => _id}
            getOptionLabel={({ displayName }) => displayName}
            groupsProps={getCategoriesSelectCheckboxGroupProps(categories)}
            size={size}
        />
    );
};

export default TemplatesSelectCheckbox;
