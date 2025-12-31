import { Grid } from '@mui/material';
import type { Property } from 'csstype';
import i18next from 'i18next';
import { ColoredEnumChip } from '../common/ColoredEnumChip';
import { IEntityPropertiesProps } from '../common/EntityProperties';
import OpenPreview from '../common/FilePreview/OpenPreview';
import { CoordinateSystem, LocationData } from '../common/inputs/JSONSchemaFormik/Widgets/RjsfLocationWidget';
import RelationshipReferenceView from '../common/RelationshipReferenceView';
import UserAvatar from '../common/UserAvatar';
import { environment } from '../globals';
import { IEntity } from '../interfaces/entities';
import { IEntitySingleProperty } from '../interfaces/entityTemplates';
import { IGetUnits } from '../interfaces/units';
import OverflowWrapper from './agGrid/OverflowWrapper';
import { extractUtmLocation, locationConverterToString } from './map/convert';

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

export const getUserAvatar = (
    entityTemplate: IEntityPropertiesProps['entityTemplate'],
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

export const formatToString = (data: {
    value: any;
    property: IEntitySingleProperty;
    units: IGetUnits;
    key?: string;
    preview?: boolean;
    color?: string;
    options?: FormatOptions;
    hideProps?: string[];
    entityTemplate?: IEntityPropertiesProps['entityTemplate'];
    properties?: IEntityPropertiesProps['properties'];
    darkMode: boolean;
}) => {
    const { value, property, units, key, preview, color, options = {}, hideProps = [], entityTemplate, properties, darkMode } = data;

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
