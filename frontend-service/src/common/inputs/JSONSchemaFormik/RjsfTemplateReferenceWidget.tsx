import { IChildTemplateMap, IEntity, IEntityTemplateMap } from '@microservices/shared';
import { WidgetProps } from '@rjsf/utils';
import { useFormikContext } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { EntityWizardValues } from '../../dialogs/entity';
import TemplateEntitiesAutocomplete from '../TemplateEntitiesAutocomplete';

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
    ...widgetProps
}: WidgetProps) => {
    const [inputValue, setInputValue] = useState<string>('');

    const { values } = useFormikContext();

    const handleEntityChange = (_event: React.SyntheticEvent, chosenEntity: IEntity | null) => {
        onChange(chosenEntity);
        setInputValue('');
    };
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const handleEntityInputChange = (_event: React.SyntheticEvent, newDisplayValue: string) => setInputValue(newDisplayValue);

    const handleBlur = () => onBlur(id, inputValue);

    const { relatedTemplateId, filters } = schema.relationshipReference;

    const relatedEntityTemplate = entityTemplates.get(relatedTemplateId);

    const childTemplatesOfRelatedTemplate =
        Array.from(childTemplates.values()).filter((child) => child.parentTemplate._id === relatedTemplateId) ?? [];

    const noRelationPermission = !relatedEntityTemplate && !childTemplatesOfRelatedTemplate.length;

    return (
        <TemplateEntitiesAutocomplete
            {...widgetProps}
            template={
                childTemplatesOfRelatedTemplate.length
                    ? entityTemplates.get(childTemplatesOfRelatedTemplate[0].parentTemplate._id)
                    : relatedEntityTemplate
            }
            showField={schema.relationshipReference.relatedTemplateField}
            value={value || null}
            label={label}
            onChange={handleEntityChange}
            onDisplayValueChange={handleEntityInputChange}
            displayValue={inputValue}
            isError={!!rawErrors.length}
            onBlur={handleBlur}
            disabled={disabled || (required && noRelationPermission)}
            noRelationPermission={noRelationPermission}
            relationFilters={filters}
            required={required}
            isChildTemplate={!relatedEntityTemplate}
            currentEntity={(values as EntityWizardValues).properties}
            helperText={required && noRelationPermission ? i18next.t('templateEntitiesAutocomplete.noWritePermissions') : undefined}
        />
    );
};

export default RjsfTemplateReferenceWidget;
