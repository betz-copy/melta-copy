import { CircularProgress, Grid } from '@mui/material';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import { ChartsAndGenerator } from '../../interfaces/charts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getChartByTemplateId } from '../../services/chartsService';
import { ChartHeader } from './ChartHeader';
import { TemplateTableCharts } from './templateTableCharts';

interface IChartsPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const ChartsPage: React.FC<IChartsPageProps> = () => {
    const { templateId } = useParams();
    const queryClient = useQueryClient();
    const [textSearch, setTextSearch] = useState<string>();

    const { data: charts, isLoading } = useQuery({
        queryKey: ['getCharts', templateId, textSearch],
        queryFn: () => getChartByTemplateId(templateId as string, textSearch),
        initialData: [],
    });

    if (isLoading) return <CircularProgress />;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;

    return (
        <Grid>
            <ChartHeader template={template} setTextSearch={setTextSearch} />
            <TemplateTableCharts templatesChart={charts as ChartsAndGenerator[]} textSearch={textSearch} />
        </Grid>
    );
};

export default ChartsPage;
