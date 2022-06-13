import React, { CSSProperties } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEntity } from '../interfaces/entities';
import { DownloadButton } from './DownloadButton';

export const formatToString = (value: any, valueType: 'string' | 'number' | 'boolean', format?: string) => {
    if (value === null || value === undefined) {
        return '-';
    }

    if (valueType === 'boolean') {
        return value ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no');
    }

    if (valueType === 'string' && format === 'date') {
        return new Date(value).toLocaleDateString('en-uk');
    }

    if (valueType === 'string' && format === 'date-time') {
        return new Date(value).toLocaleString('en-uk');
    }

    if (valueType === 'string' && format === 'fileId') {
        return <DownloadButton fileId={value} />;
    }

    return value;
};

const EntityProperties: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    properties: IEntity['properties'];
    showPreviewPropertiesOnly?: boolean;
    style?: CSSProperties;
}> = ({ entityTemplate, properties, showPreviewPropertiesOnly = false, style }) => {
    const propertiesOrderedToShow = showPreviewPropertiesOnly
        ? entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.propertiesPreview.includes(propertyKey))
        : entityTemplate.propertiesOrder;

    return (
        <Box style={style}>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = properties[propertyKey];
                return (
                    <Grid key={propertyKey} item>
                        <Grid container spacing={1}>
                            <Grid item>
                                <Typography display="inline" variant="h6" color="#B1B1B1">
                                    {propertySchema.title}:
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Typography display="inline" variant="h6">
                                    {formatToString(propertyValue, propertySchema.type, propertySchema.format)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                );
            })}
        </Box>
    );
};

export { EntityProperties };
