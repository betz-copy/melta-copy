import { fromZonedTime } from 'date-fns-tz';
import neo4j from 'neo4j-driver';
import config from '../../config';
import { IAggregation, IAxisField } from '../../express/entities/interface';
import { getFileName, getFilesName } from '../../express/entities/validator.template';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';
import { formatDate } from '../neo4j/lib';
import { EntityManager } from '../../express/entities/manager';

const {
    neo4j: { userFieldPropertySuffix, usersFieldsPropertySuffix, relationshipReferencePropertySuffix },
    map: { polygonPrefix, polygonSuffix },
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

const getAggregation = (axis: IAxisField, specialProperties: Record<string, string>): IAggregation => {
    if (typeof axis === 'string') {
        const byField = specialProperties[axis] ?? axis;
        return { type: 'none', byField: `\`${byField}\`` };
    }

    if (axis.type === 'countAll') {
        return { type: 'countAll', byField: '*' };
    }

    if (axis.type === 'countDistinct' && specialProperties[axis.byField!]) {
        return { type: 'countDistinct', byField: `\`${specialProperties[axis.byField!]}\`` };
    }

    return axis;
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
    filterQuery?: string,
) => {
    const xAgg = getAggregation(xAxis, specialProperties);
    const yAgg = yAxis ? getAggregation(yAxis, specialProperties) : undefined;

    const xAggregation = generateAggregation(xAgg, 'x');
    const yAggregation = yAgg ? generateAggregation(yAgg, 'y') : null;

    let query = `MATCH (node)
                WHERE ${filterQuery}
                `;

    if (yAggregation)
        query += `
          RETURN ${xAggregation}, ${yAggregation}
          ORDER BY y
        `;
    else
        query += `
          RETURN ${xAggregation}
        `;

    return query;
};

export const manipulateReturnedChart = async (
    xAxis: IAxisField,
    chart: { x: any; y: number }[],
    entityTemplate: IMongoEntityTemplate,
    workspaceId: string,
) => {
    if (typeof xAxis !== 'string') return chart;

    const { format, items, relationshipReference } = entityTemplate.properties.properties[xAxis];

    return Promise.all(
        chart.map(async ({ x, y }) => {
            if (!x) return { x, y };

            if (format === 'relationshipReference')
                return { x: await getRelatedEntityName(workspaceId, x, relationshipReference?.relatedTemplateField), y };

            if (format === 'fileId') return { x: getFileName(x), y };

            if (items?.format === 'fileId') return { x: getFilesName(x), y };

            if (x instanceof neo4j.types.LocalDateTime) return { x: fromZonedTime(new Date(x.toString()), 'Asia/Jerusalem').toISOString(), y };

            if (x instanceof neo4j.types.Date) return { x: formatDate(x.toString()), y };

            if (x instanceof neo4j.types.Point) return { x: `${x.x}, ${x.y}`, y };

            if (Array.isArray(x) && x.every((item) => item instanceof neo4j.types.Point)) {
                const points = x.map((point) => `${point.x} ${point.y}`).join(',');
                return { x: `${polygonPrefix}${points}${polygonSuffix}`, y };
            }

            return { x, y };
        }),
    );
};
