import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import i18next from 'i18next';
import { Typography } from '@mui/material';
import pickBy from 'lodash.pickby';
import { useSelector } from 'react-redux';
import { IUpdateEntityMetadataPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { formatToString } from '../EntityProperties';
import { getFileName } from '../../utils/getFileName';
import { RootState } from '../../store';

const getEntityPropertyString = (value: any, type: 'string' | 'number' | 'boolean', format: string | undefined, oldValue: any) => {
    if (value === null || value === undefined) {
        return '-';
    }

    if (format !== 'fileId') {
        return formatToString(value, type, format);
    }

    const oldFileName = oldValue ? getFileName(oldValue) : undefined;
    const fileName = value instanceof File ? value.name : getFileName(value);

    const fileContentChanged = value instanceof File || value !== oldValue;

    if (oldFileName === fileName && fileContentChanged) {
        return `${fileName} (${i18next.t('ruleBreachInfo.updateEntityActionInfo.fileContentUpdated')})`;
    }
    return fileName;
};

const getEntityPropertiesString = (
    entityProperties: Record<string, any>,
    entityTemplate: IMongoEntityTemplatePopulated,
    oldEntityProperties?: Record<string, any>,
) => {
    const fieldPropertiesStrings = Object.entries(entityTemplate.properties.properties).map(([propertyKey, propertyTemplate]) => {
        const oldValue = oldEntityProperties?.[propertyKey];
        const value = entityProperties[propertyKey];
        const valueFormatted = getEntityPropertyString(value, propertyTemplate.type, propertyTemplate.format, oldValue);

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
