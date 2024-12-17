import { Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import EntitiesTableOfTemplate from '../../../common/EntitiesTableOfTemplate';
import { TopBar } from '../../../common/TopBar';
import { environment } from '../../../globals';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ChartType } from '../chartsType';
import { ChartDetails } from './ChartDetails';

const data = {
    xAxis: 'name',
    yAxis: 'score',
    aggregation: 'average',
    data: [
        { x: 'Lorem ipsum', y: 40 },
        { x: 'Lorem minim', y: 30 },
        { x: 'Ut fugiat incididunt in sunt', y: 10 },
        { x: 'Ut quis et commodo', y: 20 },
    ],
};

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

const ChartPage: React.FC = () => {
    const { templateId } = useParams();
    const theme = useTheme();
    const bgColor: CSSProperties['backgroundColor'] = theme.palette.mode === 'dark' ? '#131313' : '#fcfeff';

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;
    const {
        properties: { properties },
        propertiesOrder,
    } = template;

    const defaultAggregationFunctions = ['כמות רשומות', 'ממוצע', 'מינימום', 'מקסימום'];
    const xProperties = [...defaultAggregationFunctions, ...propertiesOrder];
    const numericProperties = Object.entries(properties)
        .filter(([_, value]) => value.type === 'number' && !value.serialStarter)
        .map(([name]) => name);

    const yProperties = [...defaultAggregationFunctions, ...numericProperties];

    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');
    const [title, setTitle] = useState<string>('try');

    return (
        <Grid>
            <TopBar title={i18next.t('charts.chart')} />
            <Grid container style={{ height: '65vh' }} spacing={4}>
                <Grid item xs={9}>
                    <Grid
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '66%',
                        }}
                    >
                        <ChartType xAxis={xAxis} yAxis={yAxis} name={title} res={data} chartType="pie" />
                    </Grid>
                    <Grid sx={{ height: '30vh', borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#dddddd'}` }}>
                        <EntitiesTableOfTemplate
                            template={template}
                            getRowId={(currentEntity) => currentEntity.properties._id}
                            getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                            rowModelType="infinite"
                            rowHeight={defaultRowHeight}
                            fontSize={`${defaultFontSize}px`}
                            saveStorageProps={{
                                shouldSaveFilter: false,
                                shouldSaveWidth: false,
                                shouldSaveVisibleColumns: false,
                                shouldSaveSorting: false,
                                shouldSaveColumnOrder: false,
                                shouldSavePagination: false,
                                shouldSaveScrollPosition: false,
                            }}
                            showNavigateToRowButton={false}
                            withoutResizeBox
                        />
                    </Grid>
                </Grid>
                <Grid
                    item
                    xs={3}
                    height="95vh"
                    sx={{
                        borderLeft: `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#dddddd'}`,
                        background: bgColor,
                    }}
                >
                    <ChartDetails xAxis={xAxis} setXAxis={setXAxis} yAxis={yAxis} setYAxis={setYAxis} />
                </Grid>
            </Grid>
        </Grid>
    );
};

export default ChartPage;
