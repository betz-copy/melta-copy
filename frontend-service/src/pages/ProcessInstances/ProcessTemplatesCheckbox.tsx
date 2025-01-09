import i18next from 'i18next';
import React from 'react';
import { SelectCheckbox } from '../../common/SelectCheckbox';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';

const ProcessTemplatesSelectCheckbox: React.FC<{
    templates: IMongoProcessTemplatePopulated[];
    selectedTemplates: IMongoProcessTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoProcessTemplatePopulated[]>>;
}> = ({ templates, selectedTemplates, setSelectedTemplates }) => {
    return (
        <SelectCheckbox
            title={i18next.t('entityTemplatesCheckboxLabel')}
            filterIcon
            options={templates}
            selectedOptions={selectedTemplates}
            setSelectedOptions={setSelectedTemplates}
            getOptionId={({ _id }) => _id}
            getOptionLabel={({ displayName }) => displayName}
            size="small"
            toTopBar
            isDraggableDisabled
        />
    );
};

export default ProcessTemplatesSelectCheckbox;
