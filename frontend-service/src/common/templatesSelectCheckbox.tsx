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
    horizontalOrigin?: number;
}> = ({
    title,
    templates,
    selectedTemplates,
    setSelectedTemplates,
    categories,
    isDraggableDisabled,
    setTemplates,
    size,
    toTopBar,
    horizontalOrigin,
}) => {
    return (
        <SelectCheckbox
            title={title}
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
            horizontalOrigin={horizontalOrigin}
        />
    );
};

export default TemplatesSelectCheckbox;
