import React, { CSSProperties } from 'react';
import { Grid, IconButton, Typography } from '@mui/material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { pdfjs } from 'react-pdf';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEntity } from '../interfaces/entities';
import { OpenPreviewButton } from './OpenPreviewButton';
import { RootState } from '../store';
import { ColoredEnumChip } from './ColoredEnumChip';
import { MeltaTooltip } from './MeltaTooltip';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const formatToString = (value: any, valueType: 'string' | 'number' | 'boolean', format?: string, enumColor?: string) => {
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
    innerStyle?: CSSProperties;
    isPreview?: boolean;
}

export const EntityPropertiesInternal: React.FC<IEntityPropertiesProps & { darkMode?: boolean }> = ({
    entityTemplate,
    properties,
    hideFields = false,
    showPreviewPropertiesOnly = false,
    style,
    innerStyle,
    darkMode,
    isPreview = false,
}) => {
    const propertiesOrderedToShow = showPreviewPropertiesOnly
        ? entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.propertiesPreview!.includes(propertyKey))
        : entityTemplate.propertiesOrder;

    const [hideFieldsToDisplay, setHideFieldsToDisplay] = React.useState(entityTemplate.properties.hide);

    return (
        <Grid container style={style}>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = properties[propertyKey];
                const hideField = entityTemplate.properties.hide.includes(propertyKey);
                const isLTR = propertySchema.type === 'number' || Boolean(propertySchema.pattern);
                const stringFormatValue = formatToString(
                    propertyValue,
                    propertySchema.type,
                    propertySchema.format,
                    propertySchema.enum && entityTemplate.enumPropertiesColors?.[propertyKey]?.[propertyValue],
                );
                return (
                    <Grid key={propertyKey} item flexDirection="row" style={innerStyle} alignItems="center">
                        <Grid container alignItems="center" flexWrap="nowrap">
                            <Grid item width="30%" style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'right' }}>
                                <Typography
                                    display="inline"
                                    fontSize="14px"
                                    color={isPreview ? 'white' : '#9398C2'}
                                    fontWeight={isPreview ? '800' : ''}
                                >
                                    {propertySchema.title}:
                                </Typography>
                            </Grid>
                            <Grid
                                item
                                container
                                width="70%"
                                flexDirection="row"
                                alignItems="center"
                                flexWrap="nowrap"
                                justifyContent="space-between"
                                style={{
                                    direction: isLTR ? 'ltr' : 'rtl',
                                    textAlign: 'right',
                                }}
                            >
                                <MeltaTooltip
                                    placement="bottom"
                                    title={hideFieldsToDisplay.includes(propertyKey) || propertySchema.format === 'fileId' ? '' : stringFormatValue}
                                >
                                    <Typography
                                        display="inline"
                                        fontSize="14px"
                                        color={isPreview ? 'white' : '#53566E'}
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {hideFieldsToDisplay.includes(propertyKey) ? <>••••••••</> : stringFormatValue}
                                    </Typography>
                                </MeltaTooltip>
                                {hideField && (
                                    <IconButton
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setHideFieldsToDisplay(() => {
                                                if (hideFieldsToDisplay.includes(propertyKey))
                                                    return hideFieldsToDisplay.filter((hiddenProperty) => hiddenProperty !== propertyKey);
                                                return [...hideFieldsToDisplay, propertyKey];
                                            });
                                        }}
                                        size="small"
                                    >
                                        {hideFieldsToDisplay.includes(propertyKey) ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                )}
                            </Grid>
                        </Grid>
                    </Grid>
                );
            })}
        </Grid>
    );
};

export const EntityProperties: React.FC<IEntityPropertiesProps> = (props) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return <EntityPropertiesInternal {...props} darkMode={darkMode} />;
};
