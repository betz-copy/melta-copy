import i18next from 'i18next';
import React, { Dispatch } from 'react';
import { IMongoEntityTemplateWithConstraintsPopulated, IMongoCategory } from '@microservices/shared-interfaces';
import { SelectCheckbox, SelectCheckboxProps } from './SelectCheckbox';

const getCategoriesSelectCheckboxGroupProps = (
    categories: IMongoCategory[] | undefined,
): SelectCheckboxProps<IMongoEntityTemplateWithConstraintsPopulated, IMongoCategory>['groupsProps'] => {
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
    templates: IMongoEntityTemplateWithConstraintsPopulated[];
    selectedTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>>;
    categories?: any[];
    isDraggableDisabled?: boolean;
    setTemplates?: Dispatch<React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>>;
    size?: 'small' | 'medium';
    toTopBar?: boolean;
}> = ({ title, templates, selectedTemplates, setSelectedTemplates, categories, isDraggableDisabled, setTemplates, size, toTopBar }) => {
    return (
        <SelectCheckbox
            title={title}
            filterIcon={title === i18next.t('entityTemplatesCheckboxLabel')}
            options={templates}
            selectedOptions={selectedTemplates}
            setSelectedOptions={setSelectedTemplates}
            getOptionId={({ _id }) => _id}
            getOptionLabel={({ displayName }) => displayName}
            groupsProps={getCategoriesSelectCheckboxGroupProps(categories)}
            isDraggableDisabled={isDraggableDisabled}
            setOptions={setTemplates}
            size={size}
            toTopBar={toTopBar}
        />
    );
};

export default TemplatesSelectCheckbox;
