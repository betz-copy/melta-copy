import { CircularProgress } from '@mui/material';
import React from 'react';
import { useQuery } from 'react-query';
import { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { IAxisField, IBasicChart, IChartType } from '../../../interfaces/charts';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getChartOfTemplate } from '../../../services/entitiesService';
import { getChartAxes } from '../../../utils/charts/getChartAxes';
import { filterModelToFilterOfGraph } from '../../Graph/GraphFilterToBackend';
import { NumberChartGenerator } from './NumberChartGenerator';
import { HiighchartGenerator } from './highChartgenerator';

interface IChartGeneratorProps {
    formikValues: IBasicChart;
    template: IMongoEntityTemplatePopulated;
    entityTemplate: IMongoEntityTemplatePopulated;
    entitiesTableRef: React.RefObject<EntitiesTableOfTemplateRef<IEntity> | undefined>;
}

const ChartGenerator: React.FC<IChartGeneratorProps> = ({ template, formikValues, entityTemplate, entitiesTableRef }) => {
    const { type, metaData } = formikValues;

    const isAggregationValid = (field: IAxisField): boolean => {
        if (typeof field === 'string') return Boolean(field);
        if (field.type === 'countAll') return true;
        return Boolean(field.byField);
    };

    const { xAxis, yAxis } = getChartAxes(type, metaData);

    const isQueryEnabled = type === IChartType.Number ? isAggregationValid(xAxis) : isAggregationValid(xAxis) && isAggregationValid(yAxis);

    const { data, isLoading } = useQuery(
        ['chart', template._id, xAxis, yAxis, formikValues.filter],
        () => {
            const yAxisField = type === IChartType.Number ? undefined : yAxis;
            const filter = formikValues.filter ? filterModelToFilterOfGraph(formikValues.filter)[entityTemplate._id].filter : undefined;

            return getChartOfTemplate(xAxis, yAxisField, template._id, filter);
        },
        {
            enabled: Boolean(isQueryEnabled),
        },
    );

    if (isLoading) return <CircularProgress />;

    if (!data) return <img src="/icons/notFoundChart.svg" />;

    if (type === IChartType.Number) return <NumberChartGenerator data={data[0]} name={formikValues.name} description={formikValues.description} />;
    return (
        <HiighchartGenerator
            data={data[0]}
            isLoading={isLoading}
            isQueryEnabled={isQueryEnabled}
            name={formikValues.name}
            description={formikValues.description}
            metaData={formikValues.metaData}
            type={type}
        />
    );
};

export { ChartGenerator };
