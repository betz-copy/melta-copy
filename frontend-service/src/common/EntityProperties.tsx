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

    if (valueType === 'number') {
        return value >= 0 ? value : `${(value * -1).toString()}-`;
    }
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
    textWrap?: boolean;
}

export const EntityPropertiesInternal: React.FC<IEntityPropertiesProps & { darkMode?: boolean }> = ({
    entityTemplate,
    properties,
    hideFields = false,
    showPreviewPropertiesOnly = false,
    style,
    innerStyle,
    darkMode,
    textWrap = false,
}) => {
    const propertiesOrderedToShow = showPreviewPropertiesOnly
        ? entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.propertiesPreview!.includes(propertyKey))
        : entityTemplate.propertiesOrder;

    const [hideFieldsToDisplay, setHideFieldsToDisplay] = React.useState(entityTemplate.properties.hide);

    return (
        <Grid container style={{ ...style, alignItems: textWrap ? 'flex-start' : '' }}>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = properties[propertyKey];
                const hideField = entityTemplate.properties.hide.includes(propertyKey);
                const stringFormatValue = formatToString(
                    propertyValue,
                    propertySchema.type,
                    propertySchema.format,
                    propertySchema.enum && entityTemplate.enumPropertiesColors?.[propertyKey]?.[propertyValue],
                );
                return (
                    <Grid id="2" key={propertyKey} item container flexDirection="row" style={innerStyle}>
                        <Grid id="3" item container flexWrap="nowrap">
                            <Grid item width="30%" style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'right' }}>
                                <Typography
                                    display="inline"
                                    fontSize="14px"
                                    color={showPreviewPropertiesOnly ? 'white' : '#9398C2'}
                                    fontWeight={showPreviewPropertiesOnly ? '800' : ''}
                                >
                                    {propertySchema.title}:
                                </Typography>
                            </Grid>
                            <Grid
                                id="4"
                                item
                                container
                                width="70%"
                                flexDirection="row"
                                alignItems="center"
                                flexWrap="nowrap"
                                justifyContent="space-between"
                                style={{
                                    direction: 'rtl',
                                    textAlign: 'right',
                                }}
                            >
                                <MeltaTooltip
                                    disableHoverListener={textWrap}
                                    placement="bottom"
                                    title={hideFieldsToDisplay.includes(propertyKey) || propertySchema.format === 'fileId' ? '' : stringFormatValue}
                                >
                                    <Typography
                                        display="inline"
                                        fontSize="14px"
                                        color={showPreviewPropertiesOnly ? 'white' : '#53566E'}
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: textWrap ? undefined : 'nowrap',
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
