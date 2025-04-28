import i18next from 'i18next';
import React, { Dispatch } from 'react';
import { IMongoEntityTemplateWithConstraintsPopulated, IMongoCategory } from '@microservices/shared-interfaces';
import { SelectCheckbox } from './SelectCheckBox';
import { groupTemplatesByCategory } from '../utils/hooks/useTreeUtils';

const TemplatesSelectCheckbox: React.FC<{
    title: string;
    templates: IMongoEntityTemplateWithConstraintsPopulated[];
    selectedTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>>;
    categories?: IMongoCategory[];
    isDraggableDisabled?: boolean;
    setTemplates?: Dispatch<React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>>;
    size?: 'small' | 'medium';
    toTopBar?: boolean;
    overrideSx?: object;
}> = ({ title, templates, selectedTemplates, setSelectedTemplates, categories, isDraggableDisabled, setTemplates, size, toTopBar, overrideSx }) => {
    return (
        <SelectCheckbox<IMongoEntityTemplateWithConstraintsPopulated, IMongoCategory>
            treeFunc={categories?.length ? (groupTemplatesByCategory as any) : undefined}
            title={title}
            filterIcon={title === i18next.t('entityTemplatesCheckboxLabel')}
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
                groups: categories || [],
                getGroupId: ({ _id }) => _id,
                getGroupLabel: ({ displayName }) => displayName,
                getGroupOfOption: (entityTemplate, _categories) => entityTemplate.category,
            }}
            overrideSx={overrideSx}
        />
    );
};

export default TemplatesSelectCheckbox;
