import { Typography } from '@mui/material';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import { useQueryClient } from 'react-query';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IUpdateEntityMetadataPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IGetUnits } from '../../interfaces/units';
import { useDarkModeStore } from '../../stores/darkMode';
import { getFileName } from '../../utils/getFileName';
import { containsHTMLTags } from '../../utils/HtmlTagsStringValue';
import { formatToString } from '../EntityProperties';

const getEntityPropertyString = (
    value: any,
    propertyTemplate: IEntitySingleProperty,
    oldValue: any,
    entityTemplates: IEntityTemplateMap,
    units: IGetUnits,
    items?: any,
) => {
    const { format } = propertyTemplate;

    if (value === null || value === undefined) {
        return '-';
    }

    if (containsHTMLTags(value)) {
        return new DOMParser().parseFromString(value, 'text/html').body.innerText;
    }

    if (format === 'relationshipReference') {
        const isRelatedEntityAllowed = entityTemplates.get(propertyTemplate.relationshipReference!.relatedTemplateId);
        if (!isRelatedEntityAllowed) return '-';
        const isDiff = oldValue?.properties._id !== value.properties._id;
        const displayValue = value.properties[propertyTemplate.relationshipReference!.relatedTemplateField];
        const oldDisplayValue = oldValue?.properties[propertyTemplate.relationshipReference!.relatedTemplateField];

        if (isDiff && displayValue === oldDisplayValue) {
            return `${displayValue} (${i18next.t('ruleBreachInfo.updateEntityActionInfo.contentUpdated')})`;
        }

        return displayValue;
    }

    if (format !== 'fileId' && !items) {
        return formatToString(value, propertyTemplate, units);
    }

    // single
    if (format === 'fileId') {
        const oldFileName = oldValue ? getFileName(oldValue) : undefined;
        const fileName = value instanceof File ? value.name : getFileName(value);
        const fileContentChanged = value instanceof File || value !== oldValue;
        if (oldFileName === fileName && fileContentChanged) {
            return `${fileName} (${i18next.t('ruleBreachInfo.updateEntityActionInfo.fileContentUpdated')})`;
        }
        return fileName;
    }

    // multiple
    const updatedFiles = value.map((file, index: number) => {
        const oldFile = oldValue ? oldValue[index] : undefined;
        const oldFileName = oldFile ? getFileName(oldFile) : undefined;
        const fileName = file instanceof File ? file.name : getFileName(file);
        const fileContentChanged = file instanceof File || !oldValue || !oldValue.includes(file);
        if (oldFileName === fileName && fileContentChanged) {
            return `${fileName} (${i18next.t('ruleBreachInfo.updateEntityActionInfo.fileContentUpdated')})`;
        }
        return fileName;
    });

    return updatedFiles.join('\n');
};

const getEntityPropertiesString = (
    entityProperties: Record<string, any>,
    entityTemplates: IEntityTemplateMap,
    entityTemplate: IMongoEntityTemplatePopulated,
    units: IGetUnits,
    oldEntityProperties?: Record<string, any>,
) => {
    const fieldPropertiesStrings = Object.entries(entityTemplate?.properties?.properties || []).map(([propertyKey, propertyTemplate]) => {
        const oldValue = oldEntityProperties?.[propertyKey];
        const value = entityProperties[propertyKey];
        const valueFormatted = getEntityPropertyString(value, propertyTemplate, oldValue, entityTemplates, units, propertyTemplate.items);
        return `${propertyTemplate.title}: ${valueFormatted}`;
    });
    return fieldPropertiesStrings.join('\n');
};

export const UpdatedFieldsDiff: React.FC<{
    actionMetadata: IUpdateEntityMetadataPopulated;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ actionMetadata, entityTemplate }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

    const { entity, before, updatedFields } = actionMetadata;
    const oldProperties = before ?? entity?.properties;

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const newPropertiesWithNulls = { ...oldProperties, ...updatedFields };
    // updatedFields specifies fields to remove w/ nulls. but shouldn't be in the IEntity properties
    const newProperties = pickBy(newPropertiesWithNulls, (property) => property !== null);
    return (
        <ReactDiffViewer
            oldValue={
                oldProperties
                    ? getEntityPropertiesString(oldProperties, entityTemplates, entityTemplate!, units)
                    : i18next.t('ruleBreachInfo.updateEntityActionInfo.entityBeforeUnknown')
            }
            newValue={
                entityTemplate
                    ? getEntityPropertiesString(newProperties, entityTemplates, entityTemplate, units, oldProperties)
                    : i18next.t('ruleBreachInfo.updateEntityActionInfo.entityAfterUnknown')
            }
            hideLineNumbers
            leftTitle={
                <Typography variant="body1" fontWeight="bold">
                    {i18next.t('ruleBreachInfo.updateEntityActionInfo.entityBefore')}
                </Typography>
            }
            rightTitle={
                <Typography variant="body1" fontWeight="bold">
                    {i18next.t('ruleBreachInfo.updateEntityActionInfo.entityAfter')}
                </Typography>
            }
            useDarkTheme={darkMode}
            disableWordDiff
        />
    );
};
