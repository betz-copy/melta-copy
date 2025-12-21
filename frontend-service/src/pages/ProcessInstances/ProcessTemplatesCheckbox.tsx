import { IMongoProcessTemplateReviewerPopulated } from '@packages/process';
import i18next from 'i18next';
import React from 'react';
import { SelectCheckbox } from '../../common/SelectCheckBox';

const ProcessTemplatesSelectCheckbox: React.FC<{
    templates: IMongoProcessTemplateReviewerPopulated[];
    selectedTemplates: IMongoProcessTemplateReviewerPopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoProcessTemplateReviewerPopulated[]>>;
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
            toTopBar={false}
            isDraggableDisabled
            overrideSx={{ width: '230px' }}
        />
    );
};

export default ProcessTemplatesSelectCheckbox;
