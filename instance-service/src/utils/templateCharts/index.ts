import { IAggregation, IAggregationType, IAxisField } from '@packages/chart';
import { IMongoEntityTemplate } from '@packages/entity-template';
import { IGetUnits } from '@packages/unit';
import { CoordinateSystem, locationConverterToString } from '@packages/utils';
import { fromZonedTime } from 'date-fns-tz';
import neo4j from 'neo4j-driver';
import config from '../../config';
import EntityManager from '../../express/entities/manager';
import { getFileName, getFilesName } from '../../express/entities/validator.template';
import { formatDate } from '../neo4j/lib';

const {
    neo4j: { userFieldPropertySuffix, usersFieldsPropertySuffix, relationshipReferencePropertySuffix, locationCoordinateSystemSuffix },
    map: {
        polygon: { polygonPrefix, polygonSuffix },
    },
    timezone,
} = config;

export const handleChartPropertiesTemplate = (entityTemplate: IMongoEntityTemplate) => {
    const specialProperties: Record<string, string> = {};
    Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
        if (value.format === 'user') specialProperties[key] = `${key}.fullName${userFieldPropertySuffix}`;

        if (value.items?.format === 'user') specialProperties[key] = `${key}.fullNames${usersFieldsPropertySuffix}`;

        if (value.format === 'relationshipReference') specialProperties[key] = `${key}.properties._id${relationshipReferencePropertySuffix}`;
    });

    return specialProperties;
};

const getRelatedEntityName = async (workspaceId: string, id: string, relatedTemplateField?: string): Promise<string> => {
    if (!relatedTemplateField) return id;

    const entityManager = new EntityManager(workspaceId);

    const relatedEntity = await entityManager.getEntityById(id);
    return relatedEntity?.properties?.[relatedTemplateField] ?? id;
};

const getAggregation = (axis: IAxisField, specialProperties: Record<string, string>, coordinateSystemAgg?: boolean): IAggregation => {
    if (typeof axis === 'string') {
        const byField = specialProperties[axis] ?? axis;
        return { type: IAggregationType.None, byField: !coordinateSystemAgg ? `\`${byField}\`` : `\`${byField}${locationCoordinateSystemSuffix}\`` };
    }

    if (axis.type === IAggregationType.CountAll) {
        return { type: IAggregationType.CountAll, byField: '*' };
    }

    if (axis.type === IAggregationType.CountDistinct && specialProperties[axis.byField!]) {
        return { type: IAggregationType.CountDistinct, byField: `\`${specialProperties[axis.byField!]}\`` };
    }

    return axis;
};

const getEntityTemplateProperty = (entityTemplate: IMongoEntityTemplate, axis: IAxisField) => {
    if (typeof axis === 'string') {
        return entityTemplate.properties.properties[axis];
    }

    if (axis.byField) {
        return entityTemplate.properties.properties[axis.byField];
    }

    return undefined;
};

const generateAggregation = (agg: IAggregation, alias: string): string => {
    const { type, byField } = agg;

    switch (type) {
        case 'countAll':
            return `COUNT(${byField}) AS ${alias}`;
        case 'countDistinct':
            return `COUNT(DISTINCT node.${byField}) AS ${alias}`;
        case 'sum':
            return `SUM(node.${byField}) AS ${alias}`;
        case 'average':
            return `AVG(node.${byField}) AS ${alias}`;
        case 'maximum':
            return `MAX(node.${byField}) AS ${alias}`;
        case 'minimum':
            return `MIN(node.${byField}) AS ${alias}`;
        default:
            return `node.${byField} AS ${alias}`;
    }
};

export const buildChartAggregationQuery = (
    xAxis: IAxisField,
    yAxis: IAxisField | undefined,
    specialProperties: Record<string, string>,
    entityTemplate: IMongoEntityTemplate,
    filterQuery?: string,
) => {
    const xAgg = getAggregation(xAxis, specialProperties);
    const yAgg = yAxis ? getAggregation(yAxis, specialProperties) : undefined;
    const coordinateSystemAgg =
        getEntityTemplateProperty(entityTemplate, xAxis)?.format === 'location' ? getAggregation(xAxis, specialProperties, true) : undefined;

    const xAggregation = generateAggregation(xAgg, 'x');
    const yAggregation = yAgg ? generateAggregation(yAgg, 'y') : null;
    const coordinateSystemAggregation = coordinateSystemAgg ? generateAggregation(coordinateSystemAgg, 'coordinateSystem') : null;

    let query = `MATCH (node)
                WHERE ${filterQuery}
                `;

    if (yAggregation)
        query += `
          RETURN ${xAggregation}, ${yAggregation} ${coordinateSystemAggregation ? `, ${coordinateSystemAggregation}` : ''}
          ORDER BY y
        `;
    else
        query += `
          RETURN ${xAggregation}
        `;

    return query;
};

const getLocation = ({ x, y }: InstanceType<typeof neo4j.types.Point>, coordinateSystem?: string) =>
    coordinateSystem === CoordinateSystem.UTM ? locationConverterToString(`${x}, ${y}`, CoordinateSystem.WGS84, CoordinateSystem.UTM) : `${x}, ${y}`;

export const manipulateReturnedChart = async (
    xAxis: IAxisField,
    chart: { x: any; y: number; coordinateSystem?: string }[],
    entityTemplate: IMongoEntityTemplate,
    workspaceId: string,
    units: IGetUnits,
) => {
    if (typeof xAxis !== 'string') return chart;

    const { format, items, relationshipReference } = entityTemplate.properties.properties[xAxis];

    return Promise.all(
        chart.map(async ({ x, y, coordinateSystem }) => {
            if (!x) return { x, y };

            if (format === 'relationshipReference')
                return { x: await getRelatedEntityName(workspaceId, x, relationshipReference?.relatedTemplateField), y };

            if (format === 'fileId') return { x: getFileName(x), y };

            if (items?.format === 'fileId') return { x: getFilesName(x), y };

            if (format === 'unitField') return { x: units.find(({ _id }) => _id === x)?.name, y };

            if (x instanceof neo4j.types.LocalDateTime) return { x: fromZonedTime(new Date(x.toString()), timezone).toISOString(), y };

            if (x instanceof neo4j.types.Date) return { x: formatDate(x.toString()), y };

            if (x instanceof neo4j.types.Point) return { x: getLocation(x, coordinateSystem), y };

            if (Array.isArray(x) && x.every((item) => item instanceof neo4j.types.Point)) {
                const points = x.map((point) => getLocation(point, coordinateSystem)).join(',');
                return { x: `${polygonPrefix}${points}${polygonSuffix}`, y };
            }

            return { x, y };
        }),
    );
};
