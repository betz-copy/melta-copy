import { FilterList } from '@mui/icons-material';
import i18next from 'i18next';
import React from 'react';
import { IMongoProcessTemplateReviewerPopulated } from '@microservices/shared-interfaces';
import { SelectCheckbox } from '../../common/SelectCheckbox';

const ProcessTemplatesSelectCheckbox: React.FC<{
    templates: IMongoProcessTemplateReviewerPopulated[];
    selectedTemplates: IMongoProcessTemplateReviewerPopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoProcessTemplateReviewerPopulated[]>>;
}> = ({ templates, selectedTemplates, setSelectedTemplates }) => {
    return (
        <SelectCheckbox
            title={i18next.t('entityTemplatesCheckboxLabel')}
            img={<FilterList />}
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
