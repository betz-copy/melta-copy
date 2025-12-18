import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import type { Property } from 'csstype';
import _ from 'lodash';
import React, { CSSProperties, JSX, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { useQueryClient } from 'react-query';
import { environment } from '../globals';
import { IEntity } from '../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IGetUnits } from '../interfaces/units';
import { useDarkModeStore } from '../stores/darkMode';
import { CalculateDateDifference } from '../utils/agGrid/CalculateDateDifference';
import { formatToString, getPropertyColor, getUserAvatar } from '../utils/entityProperties';
import { HighlightText } from '../utils/HighlightText';
import { containsHTMLTags, getFirstLine, getNumLines, renderHTML } from '../utils/HtmlTagsStringValue';
import { getFixedNumber, getTextDirection } from '../utils/stringValues';
import BlueTitle from './MeltaDesigns/BlueTitle';
import MeltaTooltip from './MeltaDesigns/MeltaTooltip';

const { maxNumOfCharactersNotInFullWidth } = environment.entitiesProperties;

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

type Template = Pick<IMongoEntityTemplatePopulated, 'properties' | 'propertiesOrder' | 'enumPropertiesColors' | 'fieldGroups'> &
    Partial<Pick<IMongoEntityTemplatePopulated, 'propertiesPreview'>>;

export interface IEntityPropertiesProps {
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

const excludedFormats = ['text-area', 'fileId', 'relationshipReference', 'user', 'location', 'signature', 'comment'];

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

                const stringFormatValue = formatToString({
                    value: propertyValue,
                    property: propertySchema,
                    units,
                    key: propertyKey,
                    preview,
                    color: coloredFields?.[propertyKey],
                    options: {
                        keyEnumColors: (propertySchema.enum || propertySchema.items?.enum) && entityTemplate.enumPropertiesColors?.[propertyKey],
                        isPrintingMode,
                        pureString,
                    },
                    hideProps: entityTemplate.properties.hide,
                    entityTemplate,
                    properties,
                    darkMode: !!darkMode,
                });

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
                if (hideFieldsToDisplay.includes(propertyKey) && !isPrintingMode) innerContent = <>••••••••</>;
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

                const textDirection =
                    format && !excludedFormats.includes(format)
                        ? getTextDirection(propertyValue, {
                              type,
                              serialCurrent,
                          })
                        : 'rtl';

                const titleTypography = (
                    <Typography
                        style={{
                            ...(!isPrintingMode && {
                                textOverflow: 'ellipsis',
                                whiteSpace: textWrap ? undefined : 'nowrap',
                                overflow: 'hidden',
                            }),
                            textAlign: 'right',
                        }}
                        fontSize="14px"
                        color={propertyTitleColor}
                        fontWeight={mode === 'white' ? '800' : ''}
                    >
                        {title}:
                    </Typography>
                );

                const valueTypography = (
                    <Typography
                        fontSize="14px"
                        color={color ?? propertyValueColor}
                        style={{
                            // When printing a long word, go to next line
                            ...(isPrintingMode
                                ? {
                                      overflowWrap: 'anywhere',
                                      wordBreak: 'break-word',
                                  }
                                : {
                                      textOverflow: 'ellipsis',
                                      whiteSpace: textWrap ? undefined : 'nowrap',
                                      overflowX: 'hidden',
                                  }),
                            paddingLeft: '1rem',
                            maxHeight: isPrintingMode ? undefined : '350px',
                            direction: type === 'number' ? 'ltr' : textDirection,
                        }}
                    >
                        <HighlightText text={innerContent} searchedText={searchedText} isLink />
                    </Typography>
                );

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
                                    {isPrintingMode ? (
                                        titleTypography
                                    ) : (
                                        <MeltaTooltip disableHoverListener={textWrap} placement="bottom" title={title}>
                                            {titleTypography}
                                        </MeltaTooltip>
                                    )}
                                </Grid>
                            )}
                            <Grid
                                container
                                flexDirection="row"
                                alignItems={textWrap ? 'flex-start' : 'center'}
                                flexWrap={isPrintingMode ? 'wrap' : 'nowrap'}
                                style={{
                                    direction: 'rtl',
                                    textAlign: 'right',
                                    width: comment ? '100%' : overrideStyleInLongText ? '90%' : '70%',
                                }}
                            >
                                {isPrintingMode ? (
                                    valueTypography
                                ) : (
                                    <MeltaTooltip
                                        disableHoverListener={format === 'relationshipReference' ? true : textWrap}
                                        placement="bottom"
                                        title={<Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>{titleContent}</Grid>}
                                    >
                                        {valueTypography}
                                    </MeltaTooltip>
                                )}
                                {hideField && !isPrintingMode && (
                                    <Grid>
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
                                    </Grid>
                                )}
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
