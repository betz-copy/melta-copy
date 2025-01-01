import { FilterList } from '@mui/icons-material';
import i18next from 'i18next';
import React, { Dispatch } from 'react';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { SelectCheckbox } from './SelectCheckBox';
import { TreeType } from '../interfaces/Tree';

const formatTemplates = (categories: any[], templates: IMongoEntityTemplatePopulated[]): TreeType<IMongoEntityTemplatePopulated>[] => {
    const templatesByCategory = {};

    templates.forEach((template) => {
        const categoryId = template.category._id;
        if (!templatesByCategory[categoryId]) {
            templatesByCategory[categoryId] = [];
        }
        templatesByCategory[categoryId].push(template);
    });

    return Object.entries(templatesByCategory).map(([categoryId, currTemplates]) => {
        const category = categories.find((currCategory) => currCategory._id === categoryId);

        return {
            ...category,
            children: currTemplates,
        };
    });
};

const TemplatesSelectCheckbox: React.FC<{
    title: string;
    templates: IMongoEntityTemplatePopulated[];
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    categories: any[];
    isDraggableDisabled?: boolean;
    setTemplates?: Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    size?: 'small' | 'medium';
    toTopBar?: boolean;
}> = ({ title, templates, selectedTemplates, setSelectedTemplates, categories, isDraggableDisabled, setTemplates, size, toTopBar }) => {
    return (
        <SelectCheckbox
            title={title}
            img={title === i18next.t('entityTemplatesCheckboxLabel') ? <FilterList /> : undefined}
            options={formatTemplates(categories, templates)}
            selectedOptions={selectedTemplates}
            setSelectedOptions={setSelectedTemplates}
            getOptionId={({ _id }) => _id}
            getOptionLabel={({ displayName }) => displayName}
            isDraggableDisabled={isDraggableDisabled}
            setOptions={setTemplates}
            size={size}
            toTopBar={toTopBar}
        />
    );
};

export default TemplatesSelectCheckbox;
