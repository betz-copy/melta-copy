import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import i18next from 'i18next';
import { Typography } from '@mui/material';
import pickBy from 'lodash.pickby';
import { useSelector } from 'react-redux';
import { IUpdateEntityMetadataPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { formatToString } from '../EntityProperties';
import { getFileName } from '../../utils/getFileName';
import { RootState } from '../../store';
import { containsHTMLTags } from '../../utils/HtmlTagsStringValue';

const getEntityPropertyString = (value: any, propertyTemplate: IEntitySingleProperty, oldValue: any, items?: any) => {
    const { format } = propertyTemplate;
    if (value === null || value === undefined) {
        return '-';
    }

    if (containsHTMLTags(value)) {
        return new DOMParser().parseFromString(value, 'text/html').body.innerText;
    }

    if (format === 'relationshipReference') {
        const isDiff = oldValue?.properties._id !== value.properties._id;
        const displayValue = value.properties[propertyTemplate.relationshipReference!.relatedTemplateField];
        const oldDisplayValue = oldValue?.properties[propertyTemplate.relationshipReference!.relatedTemplateField];

        if (isDiff && displayValue === oldDisplayValue) {
            return `${displayValue} (${i18next.t('ruleBreachInfo.updateEntityActionInfo.contentUpdated')})`;
        }

        return displayValue;
    }

    if (format !== 'fileId' && !items) {
        return formatToString(value, propertyTemplate);
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
    const updatedFiles = value.map((file, index) => {
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
    entityTemplate: IMongoEntityTemplatePopulated,
    oldEntityProperties?: Record<string, any>,
) => {
    const fieldPropertiesStrings = Object.entries(entityTemplate.properties.properties).map(([propertyKey, propertyTemplate]) => {
        const oldValue = oldEntityProperties?.[propertyKey];
        const value = entityProperties[propertyKey];
        const valueFormatted = getEntityPropertyString(value, propertyTemplate, oldValue, propertyTemplate.items);
        return `${propertyTemplate.title}: ${valueFormatted}`;
    });
    return fieldPropertiesStrings.join('\n');
};

export const UpdatedFieldsDiff: React.FC<{
    actionMetadata: IUpdateEntityMetadataPopulated;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}> = ({ actionMetadata, entityTemplate }) => {
    const { entity, before, updatedFields } = actionMetadata;
    const oldProperties = before ?? entity?.properties;

    const darkMode = useSelector((state: RootState) => state.darkMode);
    const newPropertiesWithNulls = { ...oldProperties, ...updatedFields };
    // updatedFields specifies fields to remove w/ nulls. but shouldn't be in the IEntity properties
    const newProperties = pickBy(newPropertiesWithNulls, (property) => property !== null);
    return (
        <ReactDiffViewer
            oldValue={
                oldProperties
                    ? getEntityPropertiesString(oldProperties, entityTemplate!)
                    : i18next.t('ruleBreachInfo.updateEntityActionInfo.entityBeforeUnknown')
            }
            newValue={
                entityTemplate
                    ? getEntityPropertiesString(newProperties, entityTemplate, oldProperties)
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
