import { FormControl } from '@mui/material';
import { IEntity } from '@packages/entity';
import { IEntitySingleProperty } from '@packages/entity-template';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { EntityWizardValues } from '../../common/dialogs/entity';
import TemplateEntitiesAutocomplete from '../../common/inputs/TemplateEntitiesAutocomplete';
import { IChildTemplateMap, IEntityTemplateMap } from '../../interfaces/template';

interface RelationshipRefCellEditorProps {
    value?: IEntity | null;
    onValueChange: (newValue: IEntity | null) => void;
    relatedTemplateId: string;
    template: Partial<IEntitySingleProperty>;
    stopEditing: (cancel?: boolean) => void;
    filters?: string;
    currentEntity: EntityWizardValues['properties'];
}

const RelationshipRefCellEditor: React.FC<RelationshipRefCellEditorProps> = ({
    value,
    onValueChange,
    relatedTemplateId,
    template,
    filters,
    currentEntity,
}) => {
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
    const noRelationPermission = !relatedTemplate && !childTemplatesOfRelatedTemplate.length;

    return (
        <FormControl style={{ width: '100%', height: '100%' }}>
            <TemplateEntitiesAutocomplete
                template={childTemplatesOfRelatedTemplate.length ? childTemplatesOfRelatedTemplate[0]?.parentTemplate : relatedTemplate!}
                showField={template.relationshipReference!.relatedTemplateField}
                noRelationPermission={noRelationPermission}
                value={value || null}
                onChange={handleEntityChange}
                onDisplayValueChange={handleEntityInputChange}
                displayValue={inputValue}
                isError={false}
                label={template.title}
                style={{ width: '100%' }}
                relationFilters={filters}
                isChildTemplate={!relatedTemplate}
                currentEntity={currentEntity}
            />
        </FormControl>
    );
};

export default RelationshipRefCellEditor;
