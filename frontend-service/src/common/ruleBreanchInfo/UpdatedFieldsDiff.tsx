import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import pickBy from 'lodash.pickby';
import i18next from 'i18next';
import { Typography } from '@mui/material';
import { IUpdateEntityMetadataPopulated } from '../../interfaces/ruleBreaches/actionMetadata';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { formatToString } from '../EntityProperties';

const getEntityPropertiesString = (entityProperties: Record<string, any>, entityTemplate: IMongoEntityTemplatePopulated) => {
    // todo: show file changed too (w/ fileName and fileId)
    const fieldProperties = pickBy(entityTemplate.properties.properties, (propertyTemplate) => propertyTemplate.format !== 'fileId');
    const fieldPropertiesStrings = Object.entries(fieldProperties).map(([propertyKey, propertyTemplate]) => {
        const value = entityProperties[propertyKey];
        const valueFormatted = formatToString(value, propertyTemplate.type, propertyTemplate.format);

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
    const newProperties = { ...oldProperties, ...updatedFields };
    return (
        <ReactDiffViewer
            oldValue={
                oldProperties
                    ? getEntityPropertiesString(oldProperties, entityTemplate!)
                    : i18next.t('ruleBreachInfo.updateEntityActionInfo.entityBeforeUnknown')
            }
            newValue={
                entityTemplate
                    ? getEntityPropertiesString(newProperties, entityTemplate)
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
        />
    );
};
