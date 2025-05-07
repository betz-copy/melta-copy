import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { Box, Chip, Divider, Grid, IconButton, Typography } from '@mui/material';
import type { Property } from 'csstype';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { pdfjs } from 'react-pdf';
import { environment } from '../globals';
import { IEntity } from '../interfaces/entities';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { useDarkModeStore } from '../stores/darkMode';
import { CalculateDateDifference } from '../utils/agGrid/CalculateDateDifference';
import { containsHTMLTags, getFirstLine, getNumLines, renderHTML } from '../utils/HtmlTagsStringValue';
import { ColoredEnumChip } from './ColoredEnumChip';
import OpenPreview from './FilePreview/OpenPreview';
import { MeltaTooltip } from './MeltaTooltip';
import RelationshipReferenceView from './RelationshipReferenceView';
import { getFixedNumber, getTextDirection } from '../utils/stringValues';
import { HighlightText } from '../utils/HighlightText';
import { BlueTitle } from './BlueTitle';
import UserAvatar from './UserAvatar';
import OverflowWrapper from '../utils/agGrid/OverflowWrapper';
import { locationConverterToString } from '../utils/map/convert';
import { CoordinateSystem } from './inputs/JSONSchemaFormik/RjsfLocationWidget';

const { maxNumOfCharactersNotInFullWidth } = environment.entitiesProperties;

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface FormatOptions {
    keyEnumColors?: Record<string, string>;
    isPrintingMode?: boolean;
    pureString?: boolean;
}

export const formatToString = (value: any, property: IEntitySingleProperty, options: FormatOptions = {}) => {
    const { format, type: valueType } = property;
    const { keyEnumColors, isPrintingMode, pureString } = options;

    if (value === null || value === undefined) return '-';

    if (valueType === 'number') {
        return value >= 0 ? value : `${(value * -1).toString()}-`;
    }
    if (valueType === 'boolean') return value ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no');
    if (valueType === 'string') {
        if (format === 'date') return new Date(value).toLocaleDateString('en-uk');
        if (format === 'date-time') return new Date(value).toLocaleString('en-uk');
        if (format === 'fileId' || format === 'signature') return <OpenPreview fileId={value} download={isPrintingMode} />;
        if (format === 'relationshipReference') {
            return pureString ? (
                value.properties[property.relationshipReference!.relatedTemplateField!]
            ) : (
                <RelationshipReferenceView
                    entity={value}
                    relatedTemplateId={property.relationshipReference!.relatedTemplateId}
                    relatedTemplateField={property.relationshipReference!.relatedTemplateField}
                />
            );
        }
        if (format === 'user') {
            return (
                <Grid container gap={1}>
                    <MeltaTooltip title={JSON.parse(value).fullName}>
                        <Grid item>
                            <Chip avatar={<UserAvatar user={JSON.parse(value)} size={25} bgColor="1E2775" />} label={JSON.parse(value).fullName} />
                        </Grid>
                    </MeltaTooltip>
                </Grid>
            );
        }
    }
    if (format === 'location')
        return value.coordinateSystem === CoordinateSystem.UTM
            ? locationConverterToString(value.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
            : value.location;
    if (keyEnumColors?.[value] && valueType === 'string') return pureString ? value : <ColoredEnumChip label={value} color={keyEnumColors[value]} />;
    if (valueType === 'array') {
        if (property.items?.format === 'fileId') {
            return value.map((val: string) => <OpenPreview fileId={val} key={val} />);
        }
        if (property.items?.format === 'user') {
            return (
                <Grid container item>
                    <OverflowWrapper
                        items={value.map((val) => JSON.parse(val))}
                        getItemKey={(item: any) => item._id}
                        renderItem={(item) => (
                            <Grid item>
                                <MeltaTooltip title={`${item.fullName} - ${item.hierarchy}`} key={item._id}>
                                    <Grid item>
                                        <Chip avatar={<UserAvatar user={item} size={25} bgColor="1E2775" />} label={item.fullName} />
                                    </Grid>
                                </MeltaTooltip>
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
                  <ColoredEnumChip key={val} label={val} color={keyEnumColors?.[val] || 'default'} style={{ margin: '5px 0px 0px 5px' }} />
              ));
    }
    return value;
};

type Template = Pick<IMongoEntityTemplatePopulated, 'properties' | 'propertiesOrder' | 'enumPropertiesColors' | 'fieldGroups'> &
    Partial<Pick<IMongoEntityTemplatePopulated, 'propertiesPreview'>>;
interface IEntityPropertiesProps {
    entityTemplate: Template;
    properties: IEntity['properties'];
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
}

export const getPropertyColor = (
    propertyKey: string,
    propertiesToHighlight: string[] | undefined,
    highlightColor: Property.Color | undefined,
    mode: 'normal' | 'white',
    normalColor: Property.Color,
) => {
    if (propertiesToHighlight?.includes(propertyKey)) {
        return highlightColor;
    }

    return mode === 'white' ? 'white' : normalColor;
};

type PropertiesDetailsProps = {
    propertiesOrderedToShow: string[];
    properties: IEntity['properties'];
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
};

const PropertiesDetails: React.FC<PropertiesDetailsProps> = ({
    propertiesOrderedToShow,
    properties,
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
}) => {
    const [hideFieldsToDisplay, setHideFieldsToDisplay] = React.useState(entityTemplate.properties.hide);

    return (
        <>
            {propertiesOrderedToShow.map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = properties[propertyKey];
                const hideField = entityTemplate.properties.hide.includes(propertyKey);
                const containsHtmlTags = containsHTMLTags(propertyValue);
                let relatedEntityAllowed: IMongoEntityTemplatePopulated | undefined;
                if (propertySchema.format === 'relationshipReference') {
                    const relatedTemplateId = propertySchema.relationshipReference?.relatedTemplateId!;
                    relatedEntityAllowed = entityTemplates?.get(relatedTemplateId);
                }

                const stringFormatValue = formatToString(propertyValue, propertySchema, {
                    keyEnumColors: (propertySchema.enum || propertySchema.items?.enum) && entityTemplate.enumPropertiesColors?.[propertyKey],
                    isPrintingMode,
                    pureString,
                });
                const propertyValueColor = getPropertyColor(
                    propertyKey,
                    propertiesToHighlight,
                    propertiesToHighlightColor,
                    mode,
                    darkMode ? '#dcdde2' : '#53566E',
                );
                const propertyTitleColor = getPropertyColor(propertyKey, propertiesToHighlight, propertiesToHighlightColor, mode, '#9398C2');
                let innerContent;
                if (hideFieldsToDisplay.includes(propertyKey)) innerContent = <>••••••••</>;
                else if (containsHtmlTags)
                    innerContent = viewFirstLineOfLongText
                        ? `${getFirstLine(stringFormatValue)}${getNumLines(stringFormatValue) > 1 ? '...' : ''}`
                        : renderHTML(stringFormatValue);
                else if (propertyValue && propertySchema.calculateTime)
                    innerContent = <CalculateDateDifference date={stringFormatValue} searchValue={searchedText} />;
                else if (propertyValue && propertySchema.type === 'number') innerContent = getFixedNumber(propertyValue);
                else if (propertySchema.format === 'relationshipReference' && entityTemplates && !relatedEntityAllowed) innerContent = '-';
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
                    // todo: make getTextDirection handle all possible value and reuse everywhere
                    propertySchema.format !== 'text-area' &&
                    propertySchema.format !== 'fileId' &&
                    propertySchema.format !== 'relationshipReference' &&
                    propertySchema.format !== 'user' &&
                    propertySchema.format !== 'location' &&
                    propertySchema.format !== 'signature'
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
                                        color={propertyTitleColor}
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
                                    disableHoverListener={propertySchema.format === 'relationshipReference' ? true : textWrap}
                                    placement="bottom"
                                    title={<Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>{titleContent}</Grid>}
                                >
                                    <Typography
                                        fontSize="14px"
                                        color={propertyValueColor}
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: textWrap ? undefined : 'nowrap',
                                            overflowX: 'hidden',
                                            paddingLeft: '1rem',
                                            maxHeight: isPrintingMode ? undefined : '350px',
                                            direction: propertySchema.type === 'number' ? 'rtl' : textDirection,
                                        }}
                                    >
                                        <HighlightText text={innerContent} searchedText={searchedText} isLink />
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
        </>
    );
};

export const EntityPropertiesInternal: React.FC<IEntityPropertiesProps & { darkMode?: boolean; showByGroups?: boolean }> = ({
    entityTemplate,
    properties,
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
}) => {
    let propertiesOrderedToShow: string[];
    if (overridePropertiesToShow) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter((propertyKey) => overridePropertiesToShow.includes(propertyKey));
    } else if (showPreviewPropertiesOnly) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.propertiesPreview!.includes(propertyKey));
    } else if (removeFiles) {
        propertiesOrderedToShow = entityTemplate.propertiesOrder.filter(
            (propertyKey) =>
                entityTemplate.properties.properties[propertyKey].format !== 'fileId' &&
                entityTemplate.properties.properties[propertyKey].items?.format !== 'fileId' &&
                entityTemplate.properties.properties[propertyKey].format !== 'signature',
        );
    } else
        propertiesOrderedToShow = displayArchiveProperties
            ? entityTemplate.propertiesOrder.filter((propertyKey) => entityTemplate.properties.properties[propertyKey].archive)
            : entityTemplate.propertiesOrder.filter((propertyKey) => !entityTemplate.properties.properties[propertyKey].archive);

    // const [hideFieldsToDisplay, setHideFieldsToDisplay] = React.useState(entityTemplate.properties.hide);
    const alreadyRenderedGroups = new Set<string>();

    return (
        <>
            {showDivider && <Divider title={dividerTitle} sx={{ marginY: '1rem' }} />}
            <Box sx={{ marginY: '1rem' }}>{dividerTitle && <BlueTitle title={dividerTitle} component="p" variant="subtitle1" />}</Box>
            <Grid container style={{ ...style, alignItems: textWrap ? 'flex-start' : 'center', alignContent: 'center' }}>
                {showByGroups && entityTemplate.fieldGroups ? (
                    propertiesOrderedToShow.map((propertyKey, index) => {
                        const group = entityTemplate.fieldGroups!.find((g) => g.fields.includes(propertyKey));
                        const groupIndex = entityTemplate.fieldGroups!.findIndex((g) => g.name === group?.name);

                        if (group && !alreadyRenderedGroups.has(group.name)) {
                            alreadyRenderedGroups.add(group.name);

                            const orderedGroupFields = propertiesOrderedToShow.filter((key) => group.fields.includes(key));

                            return (
                                <Box
                                    key={group.name}
                                    sx={{
                                        // mb: 2,
                                        width: '100%',
                                        borderRadius: '40px',
                                        marginBottom: entityTemplate.fieldGroups?.length === groupIndex ? '0px' : '40px',
                                        marginTop: index === 0 ? '0px' : '40px',
                                    }}
                                >
                                    {/* <Grid container> */}
                                    {/* <Grid container item alignItems="center"> */}
                                    {/* <Grid item sx={{ width: '30%' }}> */}
                                    <Typography fontWeight="bold" fontSize="16px" color="#4752B6" paddingBottom={1} marginBottom="10px">
                                        {group.displayName}
                                    </Typography>
                                    {/* </Grid> */}
                                    {/* </Grid> */}
                                    <Grid container>
                                        <PropertiesDetails
                                            key={group.name}
                                            propertiesOrderedToShow={orderedGroupFields}
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
                                        />
                                    </Grid>
                                    {/* </Grid> */}
                                </Box>
                            );
                        }

                        if (!group) {
                            return (
                                <PropertiesDetails
                                    key={propertyKey}
                                    propertiesOrderedToShow={[propertyKey]}
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
                                />
                            );
                        }

                        return null;
                    })
                ) : (
                    <PropertiesDetails
                        propertiesOrderedToShow={propertiesOrderedToShow}
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
                    />
                )}
            </Grid>
        </>
    );
};

export const EntityProperties: React.FC<IEntityPropertiesProps> = (props) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return <EntityPropertiesInternal {...props} darkMode={darkMode} showByGroups />;
};
