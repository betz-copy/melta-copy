import React, { CSSProperties } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEntity } from '../interfaces/entities';

export const formatToString = (value: any, valueType: 'string' | 'number' | 'boolean', format?: string) => {
    if (valueType === 'boolean') {
        return value ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no');
    }

    if (valueType === 'string' && format === 'date') {
        return new Date(value).toLocaleDateString('en-uk');
    }

    if (valueType === 'string' && format === 'date-time') {
        return new Date(value).toLocaleString('en-uk');
    }

    if (!value) {
        return '-';
    }

    return value;
};

const EntityProperties: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; properties: IEntity['properties']; style?: CSSProperties }> = ({
    entityTemplate,
    properties,
    style,
}) => {
    return (
        <Box style={style}>
            {Object.entries(entityTemplate.properties.properties).map(([key, value]) => {
                return (
                    <Grid key={key} item>
                        <Typography display="inline" variant="h6" color="#B1B1B1" marginRight="10px">
                            {value.title}:
                        </Typography>
                        <Typography display="inline" variant="h6">
                            {formatToString(properties[key], value.type, value.format)}
                        </Typography>
                    </Grid>
                );
            })}
        </Box>
    );
};

export { EntityProperties };
