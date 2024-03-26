import React, { CSSProperties } from 'react';
import { Grid, IconButton, Typography } from '@mui/material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { pdfjs } from 'react-pdf';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEntity } from '../interfaces/entities';
import { RootState } from '../store';
import { ColoredEnumChip } from './ColoredEnumChip';
import { MeltaTooltip } from './MeltaTooltip';
import { OpenPreviewButton } from './FilePreview/OpenPreviewButton';
import { CalculateDateDifference } from '../utils/agGrid/CalculateDateDifference';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const formatToString = (
    value: any,
    valueType: 'string' | 'number' | 'boolean' | 'array',
    format?: string,
    keyEnumColors?: Record<string, string>,
) => {
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
    if (keyEnumColors?.[value] && valueType === 'string') return <ColoredEnumChip label={value} color={keyEnumColors[value]} />;
    if (valueType === 'array') {
        return value.map((val) => (
            <ColoredEnumChip key={val} label={val} color={keyEnumColors?.[val] || 'default'} style={{ margin: '5px 0px 0px 5px' }} />
        ));
    }
    return value;
};

type Template = Pick<IMongoEntityTemplatePopulated, 'properties' | 'propertiesOrder' | 'enumPropertiesColors'> &
    Partial<Pick<IMongoEntityTemplatePopulated, 'propertiesPreview'>>;
interface IEntityPropertiesProps {
    entityTemplate: Template;
    properties: IEntity['properties'];
    mode: 'normal' | 'white';
    showPreviewPropertiesOnly?: boolean;
    overridePropertiesToShow?: string[];
    style?: CSSProperties;
    innerStyle?: CSSProperties;
    textWrap?: boolean;
}

export const EntityPropertiesInternal: React.FC<IEntityPropertiesProps & { darkMode?: boolean }> = ({
    entityTemplate,
    properties,
    mode,
    showPreviewPropertiesOnly = false,
    overridePropertiesToShow,
    style,
    innerStyle,
    textWrap = false,
}) => {
    let propertiesOrderedToShow: string[];
    if (overridePropertiesToShow) {
        propertiesOrderedToShow = overridePropertiesToShow;
    } else if (showPreviewPropertiesOnly) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.propertiesPreview!.includes(propertyKey));
    } else {
        propertiesOrderedToShow = entityTemplate.propertiesOrder;
    }

    const [hideFieldsToDisplay, setHideFieldsToDisplay] = React.useState(entityTemplate.properties.hide);

    return (
        <Grid container style={{ ...style, alignItems: textWrap ? 'flex-start' : 'center', alignContent: 'center' }}>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = properties[propertyKey];
                const hideField = entityTemplate.properties.hide.includes(propertyKey);
                const stringFormatValue = formatToString(
                    propertyValue,
                    propertySchema.type,
                    propertySchema.format,
                    (propertySchema.enum || propertySchema.items?.enum) && entityTemplate.enumPropertiesColors?.[propertyKey],
                );
                const calculateTime = 'calculateTime' in propertySchema && propertySchema.calculateTime;
                return (
                    <Grid key={propertyKey} item container flexDirection="row" style={innerStyle} alignItems={textWrap ? 'flex-start' : 'center'}>
                        <Grid item container width="100%" flexWrap="nowrap" gap="15px" alignItems={textWrap ? 'flex-start' : 'center'}>
                            <Grid item width="30%">
                                <MeltaTooltip disableHoverListener={textWrap} placement="bottom" title={propertySchema.title}>
                                    <Typography
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: textWrap ? undefined : 'nowrap',
                                            overflow: 'hidden',
                                            textAlign: 'right',
                                        }}
                                        fontSize="14px"
                                        color={mode === 'white' ? 'white' : '#9398C2'}
                                        fontWeight={mode === 'white' ? '800' : ''}
                                    >
                                        {propertySchema.title}:
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
                            <Grid
                                item
                                container
                                width="70%"
                                flexDirection="row"
                                alignItems={textWrap ? 'flex-start' : 'center'}
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
                                        fontSize="14px"
                                        color={mode === 'white' ? 'white' : '#53566E'}
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: textWrap ? undefined : 'nowrap',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* eslint-disable-next-line no-nested-ternary */}
                                        {hideFieldsToDisplay.includes(propertyKey) ? (
                                            <>••••••••</>
                                        ) : propertyValue && calculateTime ? (
                                            <CalculateDateDifference date={stringFormatValue} />
                                        ) : (
                                            stringFormatValue
                                        )}
                                    </Typography>
                                </MeltaTooltip>
                                <Grid item>
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
