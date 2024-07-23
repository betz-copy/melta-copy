import React from 'react';
import { Box } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import { useQueryClient } from 'react-query';
import TemplateEntitiesAutocomplete from '../TemplateEntitiesAutocomplete';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';

const RjfsTemplateReferenceWidget = ({
    id,
    required,
    disabled,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    rawErrors = [],
    schema,
    uiSchema,
    formContext,
    ...widgetProps
}: WidgetProps) => {
    const [inputValue, setInputValue] = React.useState('');

    const handleEntityChange = (_event: React.SyntheticEvent, chosenEntity: IEntity | null) => {
        onChange(chosenEntity);
        setInputValue('');
    };
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const handleEntityInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const handleBlur = () => onBlur(id, inputValue);

    return (
        <Box minWidth="800px">
            <TemplateEntitiesAutocomplete
                {...widgetProps}
                template={entityTemplates.get(schema.relationshipReference.relatedTemplateId)!}
                showField={schema.relationshipReference.relatedTemplateField}
                value={value || null}
                label={label}
                onChange={handleEntityChange}
                onDisplayValueChange={handleEntityInputChange}
                displayValue={inputValue}
                isError={rawErrors.length > 0}
                onBlur={handleBlur}
                disabled={disabled}
            />
        </Box>
    );
};

export default RjfsTemplateReferenceWidget;
