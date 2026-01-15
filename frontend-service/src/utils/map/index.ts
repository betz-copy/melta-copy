import { MatrixSetLink } from '@camptocamp/ogc-client/dist/wmts/model';
import { SplitBy } from '@packages/common';
import { IEntity, IFilterOfField } from '@packages/entity';
import { IEntitySingleProperty, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { CoordinatesResult, MapItemType } from '@packages/utils';
import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import { XMLParser } from 'fast-xml-parser';
import { environment } from '../../globals';
import { ICoordinateSearchResult, IPolygonSearchResult } from '../../interfaces/location';
import { LayerProvider, LayerProviderType } from '../../pages/Map/BaseLayers';
import { convertECEFToWGS84, convertWGS94ToECEF, isValidWGS84 } from './convert';

const {
    polygon: { polygonPrefix, polygonSuffix },
    textValueOfLinkTag,
    tileMatrixSetIdentifiers,
    tilingSchemeId,
} = environment.map;

export const zoomNumber = 300000;

export const jerusalemCoordinates: Cartesian3 = Cartesian3.fromDegrees(35.2137, 31.7683, zoomNumber);

export const parsePolygon = (polygonStr: string, toECEF: boolean = true): Cartesian3[] | undefined => {
    if (!polygonStr.startsWith(polygonPrefix) || !polygonStr.endsWith(polygonSuffix)) {
        return undefined;
    }

    const coordsStr = polygonStr.slice(polygonPrefix.length, -polygonSuffix.length).trim();
    const coordPairs = coordsStr.split(SplitBy.comma).map((pair) => pair.trim());

    const coordinates: Cartesian3[] = coordPairs
        .map((pair) => {
            const [longitudeStr, latitudeStr] = pair.split(/\s+/);
            const longitude = parseFloat(longitudeStr);
            const latitude = parseFloat(latitudeStr);

            if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
                console.error(`Invalid coordinate pair: ${pair}`);
                return null;
            }

            return toECEF ? Cartesian3.fromDegrees(longitude, latitude) : { x: longitude, y: latitude };
        })
        .filter((coord): coord is Cartesian3 => coord !== null);

    return coordinates.length > 0 ? coordinates : undefined;
};

export const stringToCoordinates = (strCoords: string, toECEF?: boolean): CoordinatesResult => {
    const polygon = parsePolygon(strCoords, toECEF);
    if (polygon) return { type: MapItemType.Polygon, value: polygon };

    const formatted = strCoords.includes(SplitBy.comma) ? strCoords.split(SplitBy.comma).map(Number) : strCoords.split(SplitBy.space).map(Number);
    return { type: MapItemType.Coordinate, value: { x: formatted[0], y: formatted[1] } as Cartesian3 };

    // TODO: add validation to format
};

export const locationToWGS84String = (cartesian3: Cartesian3 | Cartesian3[], includePolygon = true): string => {
    if (!Array.isArray(cartesian3)) {
        const { longitude, latitude } = convertECEFToWGS84(cartesian3);
        return `${longitude}, ${latitude}`;
    }

    const points = cartesian3.map((point) => {
        const { longitude, latitude } = convertECEFToWGS84(point);
        return `${longitude} ${latitude}`;
    });
    return includePolygon ? `${polygonPrefix}${points.join(SplitBy.comma)}${polygonSuffix}` : points.join(SplitBy.comma);
};

export const calculateCenterOfPolygon = (coordinates: Cartesian3[]): Cartesian3 => {
    if (coordinates.length === 0) return jerusalemCoordinates;

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    coordinates.forEach((coordinate) => {
        const newCoordinate = isValidWGS84(coordinate) ? (convertWGS94ToECEF(coordinate) as Cartesian3) : coordinate;
        sumX += newCoordinate.x;
        sumY += newCoordinate.y;
        sumZ += newCoordinate.z;
    });

    const { length } = coordinates;
    return new Cartesian3(sumX / length, sumY / length, sumZ / length);
};

export const getPolygonFarthestPoint = (polygonCenter: Cartesian3, polygon: Cartesian3[]) => {
    let longestDistance = 0;

    polygon.forEach((point) => {
        const distance = Cartesian3.distance(polygonCenter, point);
        if (distance > longestDistance) longestDistance = distance;
    });

    return longestDistance;
};

export const isValidPolygonPoint = (polygonPoints: Cartesian3[], newPoint: Cartesian3) => {
    if (polygonPoints.length < 2) return true;

    const points = [...polygonPoints, newPoint];
    const numPoints = points.length;
    let isClockwise = false;

    for (let i = 0; i < numPoints; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % numPoints];
        const p3 = points[(i + 2) % numPoints];

        const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

        if (i === 0) {
            isClockwise = crossProduct > 0;
        } else if (crossProduct > 0 !== isClockwise) {
            return false;
        }
    }

    return true;
};

export const getLocationProperties = (entity: IEntity, selectedTemplates: IMongoEntityTemplateWithConstraintsPopulated[]) => {
    const template = selectedTemplates.find(({ _id }) => _id === entity.templateId);

    if (!template) return { template: undefined, locationTemplateProperties: undefined, locationProperties: undefined };

    const locationTemplateProperties = Object.entries(template.properties.properties)
        .filter(([_key, value]) => value.format === 'location')
        .reduce(
            (acc, [key, value]) => {
                acc[key] = value;
                return acc;
            },
            {} as { [x: string]: IEntitySingleProperty },
        );

    const locationProperties = Object.entries(entity.properties)
        .filter(([key, _value]) => key in locationTemplateProperties)
        .reduce(
            (acc, [key, value]) => {
                acc[key] = value;
                return acc;
            },
            {} as { [x: string]: IEntity['properties'] },
        );

    return { template, locationTemplateProperties, locationProperties };
};

export const valueAdjustToAutoSearch = (value: string | number | boolean | string[] | object, searchText: string): boolean => {
    if (value == null) return false;

    if (Array.isArray(value)) return value.some((item) => valueAdjustToAutoSearch(item, searchText));

    if (typeof value === 'object') return Object.values(value).some((value) => valueAdjustToAutoSearch(value, searchText));

    return String(value).includes(searchText);
};

const matchesAutoSearch = (item: IPolygonSearchResult | ICoordinateSearchResult, autoSearch: string): boolean => {
    if (autoSearch.trim() === '') return true;

    return Object.values(item.node.properties).some((value) => value != null && valueAdjustToAutoSearch(value, autoSearch));
};

const matchesListFilters = (
    { node: { templateId, properties } }: IPolygonSearchResult | ICoordinateSearchResult,
    listFields: Record<string, IFilterOfField['$in']>,
    sourceTemplateId: string,
): boolean => {
    const hasListFilters = Object.values(listFields).some((values) => !!values?.length);

    if (!hasListFilters) return true;

    if (templateId !== sourceTemplateId) return false;

    return Object.entries(listFields).every(([field, filteredValues]) => {
        if (!filteredValues?.length) return true;

        if (Array.isArray(properties[field])) return properties[field].some((option) => filteredValues.includes(option));

        return filteredValues.includes(properties[field]);
    });
};

export const getFilteredItems = (
    sourceTemplateId: string,
    autoSearch: string,
    listFields: Record<string, IFilterOfField['$in']>,
    polygons: IPolygonSearchResult[],
    coordinates: ICoordinateSearchResult[],
) => [...polygons, ...coordinates].filter((item) => matchesAutoSearch(item, autoSearch) && matchesListFilters(item, listFields, sourceTemplateId));

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    removeNSPrefix: true,
});

const emptyResult: LayerProvider = { url: '', cesiumUrl: '', id: '', type: LayerProviderType.map };

const findLinks = (
    paredXml: object,
    capabilitiesLinkSchema: string,
    cesiumLinkSchema: string,
    layerName: string,
    layerDisplayName: string,
    layerType: LayerProviderType,
    layerLinkTag: string,
): LayerProvider => {
    if (!paredXml || typeof paredXml !== 'object') return emptyResult;

    // If it's an array, search each element
    if (Array.isArray(paredXml)) {
        for (const item of paredXml) {
            const result = findLinks(item, capabilitiesLinkSchema, cesiumLinkSchema, layerName, layerDisplayName, layerType, layerLinkTag);
            if (result.url) return result;
        }
        return emptyResult;
    }

    // Check the current level
    if (paredXml[layerLinkTag]) {
        const linksList = Array.isArray(paredXml[layerLinkTag]) ? paredXml[layerLinkTag] : [paredXml[layerLinkTag]];

        const matchedLinkCapabilities = linksList.find((link) => link.scheme === capabilitiesLinkSchema && link.name?.startsWith(layerName));

        const matchedLinkCesium = linksList.find((link) => link.scheme === cesiumLinkSchema && link.name?.startsWith(layerName));

        if (!matchedLinkCesium || !matchedLinkCapabilities) return emptyResult;

        return {
            id: matchedLinkCesium.name,
            url: matchedLinkCapabilities[textValueOfLinkTag],
            cesiumUrl: matchedLinkCesium[textValueOfLinkTag],
            displayName: layerDisplayName,
            type: layerType,
        };
    }

    // Recurse deeper
    for (const key in paredXml)
        if (typeof paredXml[key] === 'object') {
            const result = findLinks(paredXml[key], capabilitiesLinkSchema, cesiumLinkSchema, layerName, layerDisplayName, layerType, layerLinkTag);
            if (result.url) return result;
        }

    return emptyResult;
};

export const extractImageryUrl = (
    xml: string,
    capabilitiesLinkSchema: string,
    cesiumLinkSchema: string,
    layerName: string,
    layerDisplayName: string,
    layerType: LayerProviderType,
    layerLinkTag: string,
): LayerProvider => {
    try {
        const json = xmlParser.parse(xml);

        return findLinks(json, capabilitiesLinkSchema, cesiumLinkSchema, layerName, layerDisplayName, layerType, layerLinkTag);
    } catch (e) {
        console.error('XML Parsing Error:', e);
        return emptyResult;
    }
};

export const getMatrixSet = (matrixSets: MatrixSetLink[]) => {
    const matrixSet = tileMatrixSetIdentifiers.map((id) => matrixSets.find((m) => m.identifier === id)).find(Boolean) ?? matrixSets[0];

    const tilingScheme = matrixSet.crs.includes(tilingSchemeId) ? new Cesium.WebMercatorTilingScheme() : new Cesium.GeographicTilingScheme();

    return { identifier: matrixSet.identifier, tilingScheme };
};
