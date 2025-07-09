import i18next from 'i18next';
import React, { Dispatch } from 'react';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { SelectCheckbox } from './SelectCheckBox';
import { groupTemplatesByCategory } from '../utils/hooks/useTreeUtils';
import { IMongoCategory } from '../interfaces/categories';
import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';

const TemplatesSelectCheckbox: React.FC<{
    title: string;
    templates: (IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[];
    selectedTemplates: (IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<(IMongoChildTemplatePopulated | IMongoEntityTemplatePopulated)[]>>;
    categories: IMongoCategory[];
    isDraggableDisabled?: boolean;
    setTemplates?: Dispatch<React.SetStateAction<(IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[]>>;
    size?: 'small' | 'medium';
    toTopBar?: boolean;
    overrideSx?: object;
}> = ({ title, templates, selectedTemplates, setSelectedTemplates, categories, isDraggableDisabled, setTemplates, size, toTopBar, overrideSx }) => {
    return (
        <SelectCheckbox<IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated, IMongoCategory>
            treeFunc={categories?.length ? (groupTemplatesByCategory as any) : undefined}
            title={title}
            filterIcon={title === i18next.t('entityTemplatesCheckboxLabel')}
            options={templates}
            selectedOptions={selectedTemplates}
            setSelectedOptions={setSelectedTemplates}
            getOptionId={(option) => option?._id || ''}
            getOptionLabel={(option) => option?.displayName || ''}
            isDraggableDisabled={isDraggableDisabled}
            setOptions={setTemplates}
            size={size}
            toTopBar={toTopBar}
            groupsProps={{
                useGroups: true,
                groups: categories,
                getGroupId: ({ _id }) => _id,
                getGroupLabel: ({ displayName }) => displayName,
                getGroupOfOption: (entityTemplate, _categories) =>
                    'parentTemplateId' in entityTemplate ? entityTemplate.categories[0] : entityTemplate.category, // TODO: [0] is bad
            }}
            overrideSx={overrideSx}
        />
    );
};

export default TemplatesSelectCheckbox;
