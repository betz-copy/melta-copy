import { FormControl } from '@mui/material';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import TemplateEntitiesAutocomplete from '../../common/inputs/TemplateEntitiesAutocomplete';
import { IChildTemplateMap } from '../../interfaces/childTemplates';
import { IEntity } from '../../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../interfaces/entityTemplates';

interface RelationshipRefCellEditorProps {
    value?: IEntity | null;
    onValueChange: (newValue: IEntity | null) => void;
    relatedTemplateId: string;
    template: Partial<IEntitySingleProperty>;
    stopEditing: (cancel?: boolean) => void;
    filters?: string;
}

const RelationshipRefCellEditor: React.FC<RelationshipRefCellEditorProps> = ({ value, onValueChange, relatedTemplateId, template, filters }) => {
    const [inputValue, setInputValue] = useState('');

    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
    const childTemplatesOfRelatedTemplate = Array.from(childTemplates.values()).filter((child) => child.parentTemplate._id === relatedTemplateId);

    const relatedTemplate = entityTemplates.get(relatedTemplateId);

    const handleEntityInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const handleEntityChange = (_event: React.SyntheticEvent, chosenEntity: IEntity | null) => {
        onValueChange(chosenEntity);
        setInputValue('');
    };

    return (
        <FormControl style={{ width: '100%', height: '100%' }}>
            <TemplateEntitiesAutocomplete
                template={childTemplatesOfRelatedTemplate ? childTemplatesOfRelatedTemplate[0].parentTemplate : relatedTemplate!}
                showField={template.relationshipReference!.relatedTemplateField}
                value={value || null}
                onChange={handleEntityChange}
                onDisplayValueChange={handleEntityInputChange}
                displayValue={inputValue}
                isError={false}
                label={template.title}
                style={{ width: '100%' }}
                relationFilters={filters}
                isChildTemplate={!relatedTemplate}
            />
        </FormControl>
    );
};

export default RelationshipRefCellEditor;
