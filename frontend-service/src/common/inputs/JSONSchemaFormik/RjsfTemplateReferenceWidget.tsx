import React, { useState } from 'react';
import { WidgetProps } from '@rjsf/utils';
import { useQueryClient } from 'react-query';
import { TextField } from '@mui/material';
import i18next from 'i18next';
import TemplateEntitiesAutocomplete from '../TemplateEntitiesAutocomplete';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { IChildTemplateMap } from '../../../interfaces/childTemplates';

const RjsfTemplateReferenceWidget = ({
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
    placeholder,
    options,
    ...widgetProps
}: WidgetProps) => {
    const { template } = options;

    const [inputValue, setInputValue] = useState('');
    const fieldName = Object.keys(template.properties.properties).find((key) => template.properties.properties[key].title === label);

    const handleEntityChange = (_event: React.SyntheticEvent, chosenEntity: IEntity | null) => {
        onChange(chosenEntity);
        setInputValue('');
    };
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;

    const handleEntityInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const handleBlur = () => onBlur(id, inputValue);

    const { relatedTemplateId, filters } = schema.relationshipReference;

    const relatedEntityTemplate = entityTemplates.get(relatedTemplateId);

    const childTemplatesOfRelatedTemplate =
        Array.from(childTemplates.values()).filter((child) => child.parentTemplate._id === relatedTemplateId) ?? [];

    if (!relatedEntityTemplate && !childTemplatesOfRelatedTemplate.length)
        return (
            <TextField
                color="primary"
                fullWidth
                id={id}
                placeholder={placeholder}
                label={schema.title}
                required={required}
                disabled
                value={i18next.t('templateEntitiesAutocomplete.noWritePermissions')}
                error={rawErrors.length > 0}
            />
        );

    return (
        <TemplateEntitiesAutocomplete
            {...widgetProps}
            template={childTemplatesOfRelatedTemplate.length ? childTemplatesOfRelatedTemplate[0].parentTemplate : relatedEntityTemplate!}
            showField={schema.relationshipReference.relatedTemplateField}
            value={value || null}
            label={label}
            onChange={handleEntityChange}
            onDisplayValueChange={handleEntityInputChange}
            displayValue={inputValue}
            isError={rawErrors.length > 0}
            onBlur={handleBlur}
            disabled={disabled}
            relationFilters={filters}
            required={required}
            isChildTemplate={!relatedEntityTemplate}
            sourceTransferKey={template.walletTransfer?.from}
            fieldName={fieldName}
        />
    );
};

export default RjsfTemplateReferenceWidget;
