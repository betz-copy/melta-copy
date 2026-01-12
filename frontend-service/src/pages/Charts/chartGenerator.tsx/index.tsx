import { CircularProgress } from '@mui/material';
import { IAxisField, IChartType } from '@packages/chart';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { ChartForm } from '../../../interfaces/dashboard';
import { getChartOfTemplate } from '../../../services/entitiesService';
import { getChartAxes } from '../../../utils/charts/getChartAxes';
import { useDebouncedFilter } from '../../../utils/dashboard/useDebouncedFilter';
import { isChildTemplate } from '../../../utils/templates';
import { HighchartGenerator } from './HighchartGenerator';
import { NumberChartGenerator } from './NumberChartGenerator';

interface IChartGeneratorProps {
    formikValues: ChartForm;
    template: IMongoChildTemplateWithConstraintsPopulated | IMongoEntityTemplateWithConstraintsPopulated;
}

const ChartGenerator: React.FC<IChartGeneratorProps> = ({ template, formikValues }) => {
    const { type, metaData } = formikValues;

    const queryClient = useQueryClient();

    const isAggregationValid = (field: IAxisField): boolean => {
        if (typeof field === 'string') return Boolean(field);
        if (field.type === 'countAll') return true;
        return Boolean(field.byField);
    };

    const { xAxis, yAxis } = getChartAxes(type, metaData);
    const xAxisField = xAxis as IAxisField;
    const yAxisField = yAxis as IAxisField | undefined;

    const isQueryEnabled =
        type === IChartType.Number ? isAggregationValid(xAxisField) : isAggregationValid(xAxisField) && isAggregationValid(yAxisField as IAxisField);

    const memoizedFilter = useDebouncedFilter(formikValues, queryClient, 500);

    const parentTemplateId = isChildTemplate(template) ? template.parentTemplate._id : template._id;
    const { data, isLoading, refetch } = useQuery(
        ['chart', parentTemplateId, xAxisField, yAxisField, memoizedFilter],
        () => getChartOfTemplate(xAxisField, yAxisField, parentTemplateId, memoizedFilter, isChildTemplate(template) ? template._id : undefined),
        {
            enabled: false,
        },
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-render
    useEffect(() => {
        if (isQueryEnabled) refetch();
    }, [memoizedFilter, xAxisField, yAxisField, metaData]);

    if (isLoading) return <CircularProgress />;

    if (!data) return <img src="/icons/notFoundChart.svg" alt="notFoundChart" />;

    if (type === IChartType.Number) return <NumberChartGenerator data={data[0]} chartDetails={formikValues} />;
    return <HighchartGenerator generatedChart={data[0]} isLoading={isLoading} isQueryEnabled={isQueryEnabled} chartDetails={formikValues} />;
};

export { ChartGenerator };
