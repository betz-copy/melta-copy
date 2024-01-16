import React, { CSSProperties } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { pdfjs } from 'react-pdf';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEntity } from '../interfaces/entities';
import { OpenPreviewButton } from './OpenPreviewButton';
import { RootState } from '../store';
import { ColoredEnumChip } from './ColoredEnumChip';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const formatToString = (value: any, valueType: 'string' | 'number' | 'boolean' | 'array', format?: string, enumColor?: string) => {
    if (value === null || value === undefined) return '-';

    if (valueType === 'boolean') return value ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no');
    if (valueType === 'string') {
        if (format === 'date') return new Date(value).toLocaleDateString('en-uk');
        if (format === 'date-time') return new Date(value).toLocaleString('en-uk');
        if (format === 'fileId') return <OpenPreviewButton fileId={value} />;
    }
    if (enumColor) return <ColoredEnumChip label={value} color={enumColor} />;

    return value;
};

type Template = Pick<IMongoEntityTemplatePopulated, 'properties' | 'propertiesOrder' | 'enumPropertiesColors'> &
    Partial<Pick<IMongoEntityTemplatePopulated, 'propertiesPreview'>>;
interface IEntityPropertiesProps {
    entityTemplate: Template;
    properties: IEntity['properties'];
    hideFields?: boolean;
    showPreviewPropertiesOnly?: boolean;
    style?: CSSProperties;
}

export const EntityPropertiesInternal: React.FC<IEntityPropertiesProps & { darkMode?: boolean }> = ({
    entityTemplate,
    properties,
    hideFields = false,
    showPreviewPropertiesOnly = false,
    style,
    darkMode,
}) => {
    const propertiesOrderedToShow = showPreviewPropertiesOnly
        ? entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.propertiesPreview!.includes(propertyKey))
        : entityTemplate.propertiesOrder;

    return (
        <Box style={style}>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = properties[propertyKey];
                const hideField = entityTemplate.properties.hide.includes(propertyKey);
                const isLTR = propertySchema.type === 'number' || Boolean(propertySchema.pattern);
                return (
                    <Grid key={propertyKey} item>
                        <Grid container spacing={1}>
                            <Grid item>
                                <Typography display="inline" variant="h6" color={darkMode ? '#cecece' : '#B1B1B1'}>
                                    {propertySchema.title}:
                                </Typography>
                            </Grid>
                            <Grid item style={{ direction: isLTR ? 'ltr' : 'rtl' }}>
                                <Typography display="inline" variant="h6">
                                    {hideFields && hideField ? (
                                        <>••••••••</>
                                    ) : (
                                        formatToString(
                                            propertyValue,
                                            propertySchema.type,
                                            propertySchema.format,
                                            propertySchema.enum && entityTemplate.enumPropertiesColors?.[propertyKey]?.[propertyValue],
                                        )
                                    )}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                );
            })}
        </Box>
    );
};

export const EntityProperties: React.FC<IEntityPropertiesProps> = (props) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return <EntityPropertiesInternal {...props} darkMode={darkMode} />;
};
