import { WidgetProps } from '@rjsf/utils';
import { useFormikContext } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { IChildTemplateMap } from '../../../../interfaces/childTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { EntityWizardValues } from '../../../dialogs/entity';
import TemplateEntitiesAutocomplete from '../../TemplateEntitiesAutocomplete';
import { CleanViewRow, isCleanView } from './CleanView';

const RjsfTemplateReferenceWidget = ({
    id,
    required,
    disabled,
    readonly,
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
    const properties = template.properties.properties;
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { twinTemplates } = workspace.metadata;

    const [inputValue, setInputValue] = useState<string>('');
    const fieldName = Object.keys(properties).find((key) => properties[key].title === label);

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

    const sourceTransfer = properties[template.walletTransfer?.from];
    const destTransfer = properties[template.walletTransfer?.to];

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

    if (isCleanView(readonly, formContext)) {
        const relatedField = schema.relationshipReference?.relatedTemplateField;
        const cleanValue = relatedField ? value?.properties?.[relatedField] : (value?.name ?? value?._id);
        return <CleanViewRow label={label || schema.title} value={cleanValue} />;
    }

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
            disabled={disabled || (required && noRelationPermission)}
            readOnly={readonly}
            noRelationPermission={noRelationPermission}
            relationFilters={filters}
            required={required}
            isChildTemplate={!relatedEntityTemplate}
            isSourceTransferKey={Boolean(template.walletTransfer?.from === fieldName)}
            isTwinTransfer={Boolean(shouldLinkWallets && fieldName === template.walletTransfer.to)}
            currentEntity={(values as EntityWizardValues).properties}
            helperText={required && noRelationPermission ? i18next.t('templateEntitiesAutocomplete.noWritePermissions') : undefined}
        />
    );
};

export default RjsfTemplateReferenceWidget;
