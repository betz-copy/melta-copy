import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { Grid, IconButton, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { pdfjs } from 'react-pdf';
import { useSelector } from 'react-redux';
import { IEntity } from '../interfaces/entities';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { RootState } from '../store';
import { ColoredEnumChip } from './ColoredEnumChip';
import OpenPreview from './FilePreview/OpenPreview';
import { MeltaTooltip } from './MeltaTooltip';
import { VerifyLink } from './VerifyLink';
import { getFirstLine, getNumLines, containsHTMLTags, renderHTML } from '../utils/HtmlTagsStringValue';
import { CalculateDateDifference } from '../utils/agGrid/CalculateDateDifference';
import { environment } from '../globals';
import { getTextDirection } from './inputs/JSONSchemaFormik/RjsfStringWidget';

const { maxNumOfCharactersNotInFullWidth } = environment.entitiesProperties;

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const formatToString = (
    value: any,
    valueType: 'string' | 'number' | 'boolean' | 'array',
    format?: string,
    keyEnumColors?: Record<string, string>,
    isPrintingMode?: boolean,
    propertySchema?: IEntitySingleProperty,
) => {
    if (value === null || value === undefined) return '-';

    if (valueType === 'number') {
        return value >= 0 ? value : `${(value * -1).toString()}-`;
    }
    if (valueType === 'boolean') return value ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no');
    if (valueType === 'string') {
        if (format === 'date') return new Date(value).toLocaleDateString('en-uk');
        if (format === 'date-time') return new Date(value).toLocaleString('en-uk');
        if (format === 'fileId') return <OpenPreview fileId={value} download={isPrintingMode} />;
    }
    if (keyEnumColors?.[value] && valueType === 'string') return <ColoredEnumChip label={value} color={keyEnumColors[value]} />;
    if (valueType === 'array') {
        if (propertySchema?.items?.format === 'fileId') {
            return value.map((val) => <OpenPreview fileId={val} key={val} />);
        }
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
    removeFiles?: boolean;
    style?: CSSProperties;
    innerStyle?: CSSProperties;
    textWrap?: boolean;
    viewFirstLineOfLongText?: boolean;
    isPrintingMode?: boolean;
}

export const EntityPropertiesInternal: React.FC<IEntityPropertiesProps & { darkMode?: boolean }> = ({
    entityTemplate,
    properties,
    mode,
    showPreviewPropertiesOnly = false,
    overridePropertiesToShow,
    removeFiles = false,
    style,
    innerStyle,
    textWrap = false,
    viewFirstLineOfLongText = false,
    isPrintingMode = false,
}) => {
    let propertiesOrderedToShow: string[];
    if (overridePropertiesToShow) propertiesOrderedToShow = overridePropertiesToShow;
    else if (showPreviewPropertiesOnly) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter(
            (propertyKey) =>
                entityTemplate.propertiesPreview!.includes(propertyKey) || entityTemplate.properties.properties[propertyKey].format === 'fileId',
        );
    } else if (removeFiles) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter(
            (propertyKey) =>
                entityTemplate.properties.properties[propertyKey].format !== 'fileId' &&
                entityTemplate.properties.properties[propertyKey].items?.format !== 'fileId',
        );
    } else propertiesOrderedToShow = entityTemplate.propertiesOrder;

    const [hideFieldsToDisplay, setHideFieldsToDisplay] = React.useState(entityTemplate.properties.hide);
    return (
        <Grid container style={{ ...style, alignItems: textWrap ? 'flex-start' : 'center', alignContent: 'center' }}>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = properties[propertyKey];
                const hideField = entityTemplate.properties.hide.includes(propertyKey);
                const containsHtmlTags = containsHTMLTags(propertyValue);
                const stringFormatValue = formatToString(
                    propertyValue,
                    propertySchema.type,
                    propertySchema.format,
                    (propertySchema.enum || propertySchema.items?.enum) && entityTemplate.enumPropertiesColors?.[propertyKey],
                    isPrintingMode,
                    propertySchema,
                );

                let innerContent;
                if (hideFieldsToDisplay.includes(propertyKey)) innerContent = <>••••••••</>;
                else if (containsHtmlTags)
                    innerContent = viewFirstLineOfLongText
                        ? `${getFirstLine(stringFormatValue)}${getNumLines(stringFormatValue) > 1 ? '...' : ''}`
                        : renderHTML(stringFormatValue);
                else if (propertyValue && propertySchema.calculateTime) innerContent = <CalculateDateDifference date={stringFormatValue} />;
                else innerContent = stringFormatValue;

                let titleContent;
                if (hideFieldsToDisplay.includes(propertyKey) || propertySchema.format === 'fileId') titleContent = '';
                else if (containsHtmlTags) titleContent = renderHTML(stringFormatValue);
                else titleContent = innerContent;

                const overrideStyleInLongText =
                    containsHtmlTags &&
                    !viewFirstLineOfLongText &&
                    propertyValue &&
                    getNumLines(stringFormatValue) > 1 &&
                    stringFormatValue.length >= maxNumOfCharactersNotInFullWidth;
                const textDirection =
                    propertySchema.format !== 'text-area'
                        ? getTextDirection(propertyValue, {
                              type: propertySchema.type,
                              serialCurrent: propertySchema.serialCurrent,
                          })
                        : 'rtl';
                return (
                    <Grid
                        key={propertyKey}
                        item
                        container
                        flexDirection="row"
                        style={overrideStyleInLongText ? { width: '100%' } : innerStyle}
                        alignItems={textWrap ? 'flex-start' : 'center'}
                    >
                        <Grid item container width="100%" flexWrap="nowrap" alignItems={textWrap ? 'flex-start' : 'center'}>
                            <Grid
                                item
                                style={{
                                    width: overrideStyleInLongText ? '10%' : '30%',
                                }}
                            >
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
                                flexDirection="row"
                                alignItems={textWrap ? 'flex-start' : 'center'}
                                flexWrap="nowrap"
                                style={{
                                    direction: 'rtl',
                                    textAlign: 'right',
                                    width: overrideStyleInLongText ? '90%' : '70%',
                                }}
                            >
                                <MeltaTooltip
                                    disableHoverListener={textWrap}
                                    placement="bottom"
                                    title={<Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>{titleContent}</Grid>}
                                >
                                    <Typography
                                        fontSize="14px"
                                        color={mode === 'white' ? 'white' : '#53566E'}
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: textWrap ? undefined : 'nowrap',
                                            overflow: 'auto',
                                            paddingLeft: '1rem',
                                            maxHeight: isPrintingMode ? undefined : '350px',
                                            direction: propertySchema.type === 'number' ? 'rtl' : textDirection,
                                        }}
                                    >
                                        <VerifyLink>{innerContent}</VerifyLink>
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
