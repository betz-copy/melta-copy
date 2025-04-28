import React from 'react';
import { WidgetProps } from '@rjsf/utils';
import { useQueryClient } from 'react-query';
import { IEntity, IEntityTemplateMap } from '@microservices/shared-interfaces';
import { TextField } from '@mui/material';
import i18next from 'i18next';
import TemplateEntitiesAutocomplete from '../TemplateEntitiesAutocomplete';

const RjfsTemplateReferenceWidget = ({
    id,
    _required,
    disabled,
    label,
    value,
    onChange,
    onBlur,
    _onFocus,
    rawErrors = [],
    schema,
    uiSchema,
    formContext,
    placeholder,
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
    const relatedEntityTemplate = entityTemplates.get(schema.relationshipReference.relatedTemplateId);

    if (!relatedEntityTemplate)
        return (
            <TextField
                color="primary"
                fullWidth
                id={id}
                placeholder={placeholder}
                label={schema.title}
                required={_required}
                disabled
                value={i18next.t('templateEntitiesAutocomplete.noWritePermissions')}
                error={rawErrors.length > 0}
            />
        );

    return (
        <TemplateEntitiesAutocomplete
            {...widgetProps}
            template={relatedEntityTemplate}
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
    );
};

export default RjfsTemplateReferenceWidget;
