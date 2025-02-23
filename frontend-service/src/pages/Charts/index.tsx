import { CircularProgress, Grid } from '@mui/material';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import i18next from 'i18next';
import { LayoutItem } from '../../common/GridLayout/interface';
import { ChartsAndGenerator } from '../../interfaces/charts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getChartByTemplateId } from '../../services/chartsService';
import { generateLayoutDetails } from '../../utils/charts/defaultChartSizes';
import { ChartHeader } from './ChartHeader';
import { TemplateTableCharts } from './templateTableCharts';

interface IChartsPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const ChartsPage: React.FC<IChartsPageProps> = () => {
    const { templateId } = useParams();
    const queryClient = useQueryClient();
    const [textSearch, setTextSearch] = useState<string>();
    const [layout, setLayout] = useState<LayoutItem[]>([]);

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
            <ChartHeader template={template} setTextSearch={setTextSearch} resetLayout={() => setLayout(generateLayoutDetails(charts ?? []).lg)} />
            {charts?.length === 0 && !isLoading && (
                <Grid container justifyContent="center" marginTop="2rem">
                    {i18next.t('charts.noChartsFound')}
                </Grid>
            )}
            <TemplateTableCharts templatesChart={charts as ChartsAndGenerator[]} layout={layout} setLayout={setLayout} textSearch={textSearch} />
        </Grid>
    );
};

export default ChartsPage;
