import i18next from 'i18next';
import React, { Dispatch } from 'react';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { SelectCheckbox } from './SelectCheckBox';
import { groupTemplatesByCategory } from '../utils/hooks/useTreeUtils';
import { IMongoCategory } from '../interfaces/categories';
import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';

type TemplatesSelectCheckboxProps<T extends IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated> = {
    title: string;
    templates: T[];
    selectedTemplates: T[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<T[]>>;
    categories: IMongoCategory[];
    isDraggableDisabled?: boolean;
    setTemplates?: Dispatch<React.SetStateAction<T[]>>;
    size?: 'small' | 'medium';
    toTopBar?: boolean;
    overrideSx?: object;
};

const TemplatesSelectCheckbox = <T extends IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated>({
    title,
    templates,
    selectedTemplates,
    setSelectedTemplates,
    categories,
    isDraggableDisabled,
    setTemplates,
    size,
    toTopBar,
    overrideSx,
}: TemplatesSelectCheckboxProps<T>) => {
    return (
        <SelectCheckbox<T, IMongoCategory>
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
                getGroupOfOption: (entityTemplate, _categories) => entityTemplate?.category,
            }}
            overrideSx={overrideSx}
        />
    );
};

export default TemplatesSelectCheckbox;
