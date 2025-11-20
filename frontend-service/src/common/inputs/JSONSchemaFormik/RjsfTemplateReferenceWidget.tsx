import { TextField } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { IChildTemplateMap } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import TemplateEntitiesAutocomplete from '../TemplateEntitiesAutocomplete';
import { useWorkspaceStore } from '../../../stores/workspace';

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
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { twinTemplates } = workspace.metadata;

    const [inputValue, setInputValue] = useState('');
    const fieldName = Object.keys(template.properties.properties).find((key) => template.properties.properties[key].title === label);

    const handleEntityChange = (_event: React.SyntheticEvent, chosenEntity: IEntity | null | string) => {
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
                error={!!rawErrors.length}
            />
        );

    const sourceTransfer = template.properties.properties[template.walletTransfer?.from];
    const destTransfer = template.properties.properties[template.walletTransfer?.to];

    const isSourceWallet = sourceTransfer?.format === 'relationshipReference';
    const isDestWallet = destTransfer?.format === 'relationshipReference';

    const sourceWalletTemplateId = sourceTransfer?.relationshipReference?.relatedTemplateId;
    const destWalletTemplateId = destTransfer?.relationshipReference?.relatedTemplateId;

    const shouldLinkWallets =
        template.walletTransfer &&
        isSourceWallet &&
        isDestWallet &&
        twinTemplates.includes(sourceWalletTemplateId) &&
        twinTemplates.includes(destWalletTemplateId);

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
            isError={!!rawErrors.length}
            onBlur={handleBlur}
            disabled={disabled}
            relationFilters={filters}
            required={required}
            isChildTemplate={!relatedEntityTemplate}
            isSourceTransferKey={Boolean(template.walletTransfer?.from === fieldName)}
            isTwinTransfer={Boolean(shouldLinkWallets && fieldName === template.walletTransfer.to)}
        />
    );
};

export default RjsfTemplateReferenceWidget;
