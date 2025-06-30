import React, { useState } from 'react';
import { FormControl } from '@mui/material';
import { useQueryClient } from 'react-query';
import TemplateEntitiesAutocomplete from '../../common/inputs/TemplateEntitiesAutocomplete';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IEntity } from '../../interfaces/entities';

interface RelationshipRefCellEditorProps {
    value?: IEntity | null;
    onValueChange: (newValue: IEntity | null) => void;
    relatedTemplateId: string;
    template: Partial<IEntitySingleProperty>;
    stopEditing: (cancel?: boolean) => void;
}

const RelationshipRefCellEditor: React.FC<RelationshipRefCellEditorProps> = ({ value, onValueChange, relatedTemplateId, template }) => {
    const [inputValue, setInputValue] = useState('');

    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const handleEntityInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const handleEntityChange = (_event: React.SyntheticEvent, chosenEntity: IEntity | null) => {
        onValueChange(chosenEntity);
        setInputValue('');
    };

    return (
        <FormControl style={{ width: '100%', height: '100%' }}>
            <TemplateEntitiesAutocomplete
                template={entityTemplates.get(relatedTemplateId)!}
                showField={template.relationshipReference!.relatedTemplateField}
                value={value || null}
                onChange={handleEntityChange}
                onDisplayValueChange={handleEntityInputChange}
                displayValue={inputValue}
                isError={false}
                label={template.title}
                style={{ width: '100%' }}
            />
        </FormControl>
    );
};

export default RelationshipRefCellEditor;
