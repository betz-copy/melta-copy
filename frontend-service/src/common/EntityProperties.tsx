import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import type { Property } from 'csstype';
import i18next from 'i18next';
import _ from 'lodash';
import React, { CSSProperties, JSX, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { useQueryClient } from 'react-query';
import { environment } from '../globals';
import { IEntity } from '../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IGetUnits } from '../interfaces/units';
import { useDarkModeStore } from '../stores/darkMode';
import { CalculateDateDifference } from '../utils/agGrid/CalculateDateDifference';
import OverflowWrapper from '../utils/agGrid/OverflowWrapper';
import { HighlightText } from '../utils/HighlightText';
import { containsHTMLTags, getFirstLine, getNumLines, renderHTML } from '../utils/HtmlTagsStringValue';
import { extractUtmLocation, locationConverterToString } from '../utils/map/convert';
import { getFixedNumber, getTextDirection } from '../utils/stringValues';
import { ColoredEnumChip } from './ColoredEnumChip';
import OpenPreview from './FilePreview/OpenPreview';
import { CoordinateSystem, LocationData } from './inputs/JSONSchemaFormik/Widgets/RjsfLocationWidget';
import BlueTitle from './MeltaDesigns/BlueTitle';
import MeltaTooltip from './MeltaDesigns/MeltaTooltip';
import RelationshipReferenceView from './RelationshipReferenceView';
import UserAvatar from './UserAvatar';

const { maxNumOfCharactersNotInFullWidth } = environment.entitiesProperties;

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

function formatDateToDDMMYYYY(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

interface FormatOptions {
    keyEnumColors?: Record<string, string>;
    isPrintingMode?: boolean;
    pureString?: boolean;
}

const getUserAvatar = (
    entityTemplate: Template,
    imageKey: string,
    properties: IEntityPropertiesProps['properties'],
    iconProps: { size: number; border: number },
) => {
    const relatedUserField = entityTemplate?.properties?.properties?.[imageKey]?.expandedUserField?.relatedUserField;
    const user = relatedUserField && properties?.[relatedUserField] ? JSON.parse(properties?.[relatedUserField]) : undefined;

    return (
        user && (
            <div style={{ marginLeft: '3rem' }}>
                <UserAvatar
                    user={user}
                    shouldRenderChip={false}
                    tooltip={{ displayUserImage: false }}
                    shouldGetKartoffelImage
                    userIcon={{ size: iconProps.size, overrideSx: { border: `${iconProps.border}px solid #FF006B`, boxShadow: '0px' } }}
                />
            </div>
        )
    );
};

export const formatToString = (
    value: any,
    property: IEntitySingleProperty,
    units: IGetUnits,
    key?: string,
    preview?: boolean,
    color?: string,
    options: FormatOptions = {},
    hideProps: string[] = [],
    entityTemplate?: Template,
    properties?: IEntityPropertiesProps['properties'],
) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const { format, type: valueType, title, expandedUserField } = property;
    const { keyEnumColors, isPrintingMode, pureString } = options;

    // If displaying an image from a kartoffel user
    if (format === 'kartoffelUserField' && expandedUserField?.kartoffelField === 'image' && entityTemplate && properties && key)
        return getUserAvatar(entityTemplate, key, properties, { size: 32, border: 1 });

    if (value === null || value === undefined) return '-';

    if (
        format === 'kartoffelUserField' &&
        expandedUserField?.kartoffelField &&
        ['birthDate', 'dischargeDay', 'enlistmentDay'].includes(expandedUserField.kartoffelField) &&
        value
    ) {
        return formatDateToDDMMYYYY(value);
    }

    if (valueType === 'number') {
        return value >= 0 ? value : `${(value * -1).toString()}-`;
    }
    if (valueType === 'boolean') return value ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no');
    if (valueType === 'string') {
        if (format === 'date') return new Date(value).toLocaleDateString('en-uk');
        if (format === 'comment') return property.hideFromDetailsPage || (key && hideProps.includes(key)) ? undefined : property.comment;
        if (format === 'date-time') return new Date(value).toLocaleString('en-uk');
        if (format === 'fileId' || format === 'signature') {
            return (
                <OpenPreview
                    fileId={value}
                    download={isPrintingMode}
                    defaultFileName={format === 'signature' ? `${title}.${environment.fileExtensions.defaultImage}` : undefined}
                    disabled={preview}
                    color={color}
                />
            );
        }
        if (format === 'relationshipReference') {
            return pureString ? (
                value.properties[property.relationshipReference!.relatedTemplateField!]
            ) : (
                <RelationshipReferenceView
                    entity={value}
                    relatedTemplateId={property.relationshipReference!.relatedTemplateId}
                    relatedTemplateField={property.relationshipReference!.relatedTemplateField}
                    color={color}
                />
            );
        }
        if (format === 'user') {
            const userObject = typeof value === 'string' ? JSON.parse(value) : value;
            return (
                <Grid container gap={1}>
                    <UserAvatar
                        user={userObject}
                        chip={{ sx: { background: darkMode ? '#1E1F2B' : '#EBEFFA', color: color ?? (darkMode ? '#D3D6E0' : '#53566E') } }}
                    />
                </Grid>
            );
        }
        if (format === 'unitField') {
            return units.find(({ _id }) => _id === value)?.name;
        }
    }
    if (format === 'location') {
        const convertLocation = (value: LocationData) =>
            value.coordinateSystem === CoordinateSystem.UTM && !extractUtmLocation(value.location)
                ? locationConverterToString(value.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
                : value.location;

        if (typeof value === 'string') {
            if (value.includes('location')) return convertLocation(JSON.parse(value));
            else return value;
        }
        return convertLocation(value);
    }
    if (keyEnumColors?.[value] && valueType === 'string')
        return pureString ? value : <ColoredEnumChip label={value} enumColor={keyEnumColors[value] || 'default'} color={color} />;

    if (valueType === 'array') {
        if (property.items?.format === 'fileId') return value.map((val: string) => <OpenPreview fileId={val} key={val} color={color} />);

        if (property.items?.format === 'user') {
            return (
                <Grid container>
                    <OverflowWrapper
                        items={value.map((val) => JSON.parse(val))}
                        getItemKey={(item: any) => item._id}
                        renderItem={(item) => (
                            <Grid>
                                <UserAvatar
                                    key={item.id}
                                    user={item}
                                    tooltip={{ title: `${item.fullName} - ${item.hierarchy}` }}
                                    chip={{
                                        sx: { background: darkMode ? '#1E1F2B' : '#EBEFFA', color: color ?? (darkMode ? '#D3D6E0' : '#53566E') },
                                    }}
                                />
                            </Grid>
                        )}
                        propertyToDisplayInTooltip="fullName"
                        minVisibleItems={1}
                    />
                </Grid>
            );
        }

        return pureString
            ? value.join(', ')
            : value.map((val: string) => (
                  <ColoredEnumChip
                      key={val}
                      label={val}
                      enumColor={keyEnumColors?.[val] || 'default'}
                      style={{ margin: '5px 0px 0px 5px' }}
                      color={color}
                  />
              ));
    }
    return value;
};

type Template = Pick<IMongoEntityTemplatePopulated, 'properties' | 'propertiesOrder' | 'enumPropertiesColors' | 'fieldGroups'> &
    Partial<Pick<IMongoEntityTemplatePopulated, 'propertiesPreview'>>;
interface IEntityPropertiesProps {
    entityTemplate: Template;
    properties: IEntity['properties'];
    coloredFields?: IEntity['coloredFields'];
    mode: 'normal' | 'white';
    showPreviewPropertiesOnly?: boolean;
    overridePropertiesToShow?: string[];
    propertiesToHighlight?: string[];
    propertiesToHighlightColor?: CSSProperties['color'];
    removeFiles?: boolean;
    style?: CSSProperties;
    innerStyle?: CSSProperties;
    textWrap?: boolean;
    viewFirstLineOfLongText?: boolean;
    isPrintingMode?: boolean;
    pureString?: boolean;
    searchedText?: string;
    displayArchiveProperties?: boolean;
    showDivider?: boolean;
    dividerTitle?: string;
    entityTemplates?: IEntityTemplateMap;
    preview?: boolean;
}

export const getPropertyColor = (
    propertyKey: string,
    propertiesToHighlight: string[] | undefined,
    highlightColor: Property.Color | undefined,
    mode: 'normal' | 'white',
    normalColor: Property.Color,
    coloredFields?: IEntity['coloredFields'],
) => {
    if (coloredFields?.[propertyKey]) return coloredFields?.[propertyKey];
    if (propertiesToHighlight?.includes(propertyKey)) {
        return highlightColor;
    }

    return mode === 'white' ? 'white' : normalColor;
};

type PropertiesDetailsProps = {
    propertiesOrderedToShow: string[];
    properties: IEntity['properties'];
    coloredFields: IEntity['coloredFields'];
    entityTemplate: Template;
    entityTemplates?: IEntityTemplateMap;
    mode: 'normal' | 'white';
    propertiesToHighlight?: string[];
    propertiesToHighlightColor?: CSSProperties['color'];
    innerStyle?: CSSProperties;
    textWrap?: boolean;
    viewFirstLineOfLongText?: boolean;
    isPrintingMode?: boolean;
    pureString?: boolean;
    searchedText?: string;
    darkMode?: boolean;
    preview?: boolean;
};

const PropertiesDetails: React.FC<PropertiesDetailsProps> = ({
    propertiesOrderedToShow,
    properties,
    coloredFields = {},
    entityTemplate,
    entityTemplates,
    isPrintingMode,
    pureString,
    propertiesToHighlight,
    propertiesToHighlightColor,
    mode,
    darkMode,
    viewFirstLineOfLongText,
    searchedText,
    innerStyle,
    textWrap,
    preview,
}) => {
    const queryClient = useQueryClient();
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

    const [hideFieldsToDisplay, setHideFieldsToDisplay] = useState(entityTemplate.properties.hide);

    return (
        <>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const { format, type, serialCurrent, calculateTime, title, color, comment, relationshipReference } = propertySchema;
                const propertyValue = comment ?? properties[propertyKey];
                const hideField = entityTemplate.properties.hide.includes(propertyKey);
                const containsHtmlTags = containsHTMLTags(propertyValue);
                let relatedEntityAllowed: IMongoEntityTemplatePopulated | undefined;
                if (format === 'relationshipReference') {
                    const relatedTemplateId = relationshipReference?.relatedTemplateId!;
                    relatedEntityAllowed = entityTemplates?.get(relatedTemplateId);
                }

                const stringFormatValue = formatToString(
                    propertyValue,
                    propertySchema,
                    units,
                    propertyKey,
                    preview,
                    coloredFields?.[propertyKey],
                    {
                        keyEnumColors: (propertySchema.enum || propertySchema.items?.enum) && entityTemplate.enumPropertiesColors?.[propertyKey],
                        isPrintingMode,
                        pureString,
                    },
                    entityTemplate.properties.hide,
                    entityTemplate,
                    properties,
                );

                if (stringFormatValue === null || stringFormatValue === undefined) return undefined;

                const propertyValueColor = getPropertyColor(
                    propertyKey,
                    propertiesToHighlight,
                    propertiesToHighlightColor,
                    mode,
                    darkMode ? '#dcdde2' : '#53566E',
                    coloredFields,
                );

                const propertyTitleColor = getPropertyColor(propertyKey, propertiesToHighlight, propertiesToHighlightColor, mode, '#9398C2', {});

                let innerContent: string | JSX.Element | undefined;
                if (hideFieldsToDisplay.includes(propertyKey)) innerContent = <>••••••••</>;
                else if (containsHtmlTags)
                    innerContent = viewFirstLineOfLongText
                        ? `${getFirstLine(stringFormatValue)}${getNumLines(stringFormatValue) > 1 ? '...' : ''}`
                        : renderHTML(stringFormatValue);
                else if (propertyValue && calculateTime)
                    innerContent = <CalculateDateDifference date={stringFormatValue} searchValue={searchedText} />;
                else if (propertyValue && type === 'number') innerContent = getFixedNumber(propertyValue);
                else if (format === 'relationshipReference' && entityTemplates && !relatedEntityAllowed) innerContent = '-';
                else innerContent = stringFormatValue;

                let titleContent: string | JSX.Element | undefined;
                if (hideFieldsToDisplay.includes(propertyKey) || format === 'fileId') titleContent = '';
                else if (containsHtmlTags) titleContent = renderHTML(stringFormatValue);
                else titleContent = innerContent;

                const overrideStyleInLongText =
                    containsHtmlTags &&
                    !viewFirstLineOfLongText &&
                    propertyValue &&
                    getNumLines(stringFormatValue) > 1 &&
                    stringFormatValue.length >= maxNumOfCharactersNotInFullWidth;

                const excludedFormats = ['text-area', 'fileId', 'relationshipReference', 'user', 'location', 'signature', 'comment'];

                const textDirection =
                    format && !excludedFormats.includes(format)
                        ? getTextDirection(propertyValue, {
                              type,
                              serialCurrent,
                          })
                        : 'rtl';

                return (
                    <Grid
                        key={propertyKey}
                        container
                        flexDirection="row"
                        style={{
                            ...(overrideStyleInLongText ? { width: '100%' } : innerStyle),
                            marginBottom: '10px',
                        }}
                        alignItems={textWrap ? 'flex-start' : 'center'}
                        size={{ xs: 12 }}
                    >
                        <Grid container width="100%" flexWrap="nowrap" alignItems={textWrap ? 'flex-start' : 'center'}>
                            {!comment && (
                                <Grid
                                    style={{
                                        width: overrideStyleInLongText ? '10%' : '30%',
                                    }}
                                >
                                    <MeltaTooltip disableHoverListener={textWrap} placement="bottom" title={title}>
                                        <Typography
                                            style={{
                                                textOverflow: 'ellipsis',
                                                whiteSpace: textWrap ? undefined : 'nowrap',
                                                overflow: 'hidden',
                                                textAlign: 'right',
                                            }}
                                            fontSize="14px"
                                            color={propertyTitleColor}
                                            fontWeight={mode === 'white' ? '800' : ''}
                                        >
                                            {title}:
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                            )}
                            <Grid
                                container
                                flexDirection="row"
                                alignItems={textWrap ? 'flex-start' : 'center'}
                                flexWrap="nowrap"
                                style={{
                                    direction: 'rtl',
                                    textAlign: 'right',
                                    width: comment ? '100%' : overrideStyleInLongText ? '90%' : '70%',
                                }}
                            >
                                <MeltaTooltip
                                    disableHoverListener={format === 'relationshipReference' ? true : textWrap}
                                    placement="bottom"
                                    title={<Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>{titleContent}</Grid>}
                                >
                                    <Typography
                                        fontSize="14px"
                                        color={color ?? propertyValueColor}
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: textWrap ? undefined : 'nowrap',
                                            overflowX: 'hidden',
                                            paddingLeft: '1rem',
                                            maxHeight: isPrintingMode ? undefined : '350px',
                                            direction: type === 'number' ? 'ltr' : textDirection,
                                        }}
                                    >
                                        <HighlightText text={innerContent} searchedText={searchedText} isLink />
                                    </Typography>
                                </MeltaTooltip>
                                <Grid>
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
        </>
    );
};

export const EntityPropertiesInternal: React.FC<IEntityPropertiesProps & { darkMode?: boolean; showByGroups?: boolean }> = ({
    entityTemplate,
    properties,
    coloredFields = {},
    mode,
    showPreviewPropertiesOnly = false,
    overridePropertiesToShow,
    propertiesToHighlight,
    propertiesToHighlightColor,
    removeFiles = false,
    style,
    innerStyle,
    darkMode,
    textWrap = false,
    viewFirstLineOfLongText = false,
    isPrintingMode = false,
    pureString = false,
    searchedText,
    displayArchiveProperties,
    showDivider,
    dividerTitle,
    entityTemplates,
    showByGroups = false,
    preview = false,
}) => {
    const getCurrProperty = (propertyKey: string) => entityTemplate.properties.properties[propertyKey];

    let propertiesOrderedToShow: string[];
    if (overridePropertiesToShow) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter((propertyKey) => overridePropertiesToShow.includes(propertyKey));
    } else if (showPreviewPropertiesOnly) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.propertiesPreview!.includes(propertyKey));
    } else if (removeFiles) {
        const formats = ['fileId', 'signature'];
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter(
            (propertyKey) => formats.includes(getCurrProperty(propertyKey).format ?? '') && getCurrProperty(propertyKey).items?.format !== 'fileId',
        );
    } else
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter((propertyKey) =>
            (getCurrProperty(propertyKey).comment && getCurrProperty(propertyKey).hideFromDetailsPage) || displayArchiveProperties
                ? getCurrProperty(propertyKey).archive
                : !getCurrProperty(propertyKey).archive,
        );

    propertiesOrderedToShow = propertiesOrderedToShow.filter((propertyKey) => getCurrProperty(propertyKey).display !== false);

    const alreadyRenderedGroups = new Set<string>();

    const imageOfKartoffelKeys = _.remove(propertiesOrderedToShow, (propertyKey) => {
        const propertyValue = entityTemplate.properties.properties[propertyKey];
        return propertyValue?.expandedUserField?.kartoffelField === 'image' && propertyValue.isProfileImage;
    });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            {/* Profile image */}
            {imageOfKartoffelKeys.map((key) => getUserAvatar(entityTemplate, key, properties, { size: 120, border: 4 }))}
            {showDivider && <Divider title={dividerTitle} sx={{ marginY: '1rem' }} />}
            <Box sx={{ marginY: '1rem' }}>{dividerTitle && <BlueTitle title={dividerTitle} component="p" variant="subtitle1" />}</Box>
            <Grid container width="100%" style={{ ...style, alignItems: textWrap ? 'flex-start' : 'center', alignContent: 'center' }}>
                {showByGroups && entityTemplate.fieldGroups ? (
                    propertiesOrderedToShow.map((propertyKey) => {
                        const group = entityTemplate.fieldGroups?.find((g) => g.fields.includes(propertyKey));

                        if (group && !alreadyRenderedGroups.has(group.name)) {
                            alreadyRenderedGroups.add(group.name);

                            const orderedGroupFields = propertiesOrderedToShow.filter((key) => group.fields.includes(key));

                            return (
                                <Grid
                                    container
                                    sx={{
                                        width: '100%',
                                        borderRadius: '10px',
                                        backgroundColor: darkMode ? '#4a4a5033' : 'rgba(240, 242, 247, 0.3)',
                                        padding: '12px',
                                        marginTop: '3px',
                                        marginBottom: '3px',
                                    }}
                                    key={group.name}
                                >
                                    <Box
                                        key={group.name}
                                        sx={{
                                            width: '100%',
                                        }}
                                    >
                                        <Typography fontWeight="bold" fontSize="16px" color="primary" paddingBottom={1} marginBottom="20px">
                                            {group.displayName}
                                        </Typography>
                                        <Grid container>
                                            <PropertiesDetails
                                                key={group.name}
                                                propertiesOrderedToShow={orderedGroupFields}
                                                properties={properties}
                                                coloredFields={coloredFields}
                                                entityTemplate={entityTemplate}
                                                entityTemplates={entityTemplates}
                                                isPrintingMode={isPrintingMode}
                                                pureString={pureString}
                                                propertiesToHighlight={propertiesToHighlight}
                                                propertiesToHighlightColor={propertiesToHighlightColor}
                                                mode={mode}
                                                darkMode={darkMode}
                                                viewFirstLineOfLongText={viewFirstLineOfLongText}
                                                searchedText={searchedText}
                                                innerStyle={innerStyle}
                                                textWrap={textWrap}
                                                preview={preview}
                                            />
                                        </Grid>
                                    </Box>
                                </Grid>
                            );
                        }

                        if (!group) {
                            return (
                                <PropertiesDetails
                                    key={propertyKey}
                                    propertiesOrderedToShow={[propertyKey]}
                                    properties={properties}
                                    coloredFields={coloredFields}
                                    entityTemplate={entityTemplate}
                                    entityTemplates={entityTemplates}
                                    isPrintingMode={isPrintingMode}
                                    pureString={pureString}
                                    propertiesToHighlight={propertiesToHighlight}
                                    propertiesToHighlightColor={propertiesToHighlightColor}
                                    mode={mode}
                                    darkMode={darkMode}
                                    viewFirstLineOfLongText={viewFirstLineOfLongText}
                                    searchedText={searchedText}
                                    innerStyle={innerStyle}
                                    textWrap={textWrap}
                                    preview={preview}
                                />
                            );
                        }

                        return null;
                    })
                ) : (
                    <PropertiesDetails
                        propertiesOrderedToShow={propertiesOrderedToShow}
                        coloredFields={coloredFields}
                        properties={properties}
                        entityTemplate={entityTemplate}
                        entityTemplates={entityTemplates}
                        isPrintingMode={isPrintingMode}
                        pureString={pureString}
                        propertiesToHighlight={propertiesToHighlight}
                        propertiesToHighlightColor={propertiesToHighlightColor}
                        mode={mode}
                        darkMode={darkMode}
                        viewFirstLineOfLongText={viewFirstLineOfLongText}
                        searchedText={searchedText}
                        innerStyle={innerStyle}
                        textWrap={textWrap}
                        preview={preview}
                    />
                )}
            </Grid>
        </Box>
    );
};

export const EntityProperties: React.FC<IEntityPropertiesProps> = (props) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return <EntityPropertiesInternal {...props} darkMode={darkMode} showByGroups />;
};
