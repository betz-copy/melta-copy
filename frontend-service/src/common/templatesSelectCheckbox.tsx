import { FilterList } from '@mui/icons-material';
import i18next from 'i18next';
import React, { Dispatch } from 'react';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { SelectCheckbox } from './SelectCheckBox';

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
            categories={categories}
            title={title}
            img={title === i18next.t('entityTemplatesCheckboxLabel') ? <FilterList /> : undefined}
            options={templates}
            selectedOptions={selectedTemplates}
            setSelectedOptions={setSelectedTemplates}
            getOptionId={({ _id }) => _id}
            getOptionLabel={({ displayName }) => displayName}
            isDraggableDisabled={isDraggableDisabled}
            setOptions={setTemplates}
            size={size}
            toTopBar={toTopBar}
            groupsProps={{
                useGroups: true,
                groups: categories,
                getGroupId: ({ _id }) => _id,
                getGroupLabel: ({ displayName }) => displayName,
                getGroupOfOption: (entityTemplate, _categories) => entityTemplate.category,
            }}
        />
    );
};

export default TemplatesSelectCheckbox;
