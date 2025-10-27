import { Masonry } from '@mui/lab';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useMemo } from 'react';
import { environment } from '../../../globals';
import { IScheduleComponentData, IScheduleComponentResourceData } from '../../../interfaces/syncfusion';
import { getGanttHeatmapData } from '../../../utils/gantts';
import { ViewingBox } from '../../SystemManagement/components/ViewingBox';
import { HeatmapBox } from './HeatmapBox';

const { heatmapColors } = environment.ganttSettings;

interface IHeatmapProps {
    ganttEvents: IScheduleComponentData[];
    groupByEntityResources?: IScheduleComponentResourceData[];
    onInit?: () => void;
}

export const Heatmap: React.FC<IHeatmapProps> = ({ ganttEvents, groupByEntityResources, onInit }) => {
    useEffect(() => {
        if (onInit) onInit();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const heatmapData = useMemo(
        () => groupByEntityResources && getGanttHeatmapData(ganttEvents, groupByEntityResources),
        [ganttEvents, groupByEntityResources],
    );

    if (!heatmapData) return null;

    return (
        <Grid
            container
            direction="column"
            spacing={3}
            wrap="nowrap"
            sx={{
                width: '100%',
                height: '100%',
                padding: '2rem',
            }}
        >
            <Grid container spacing={2}>
                {Object.values(heatmapColors).map((color) => (
                    <Grid key={color}>
                        <Typography fontSize={18} display="inline">
                            {`${i18next.t(`gantts.heatmapColors.${color}`)} - `}
                        </Typography>
                        <Typography fontSize={18} display="inline" color={color}>
                            ⬤
                        </Typography>
                    </Grid>
                ))}
            </Grid>

            <Grid>
                <ViewingBox minHeight="82vh">
                    <Masonry columns={5} spacing={2}>
                        {heatmapData.map((heatmapBox) => (
                            <Grid key={heatmapBox.id}>
                                <HeatmapBox heatmapBox={heatmapBox} />
                            </Grid>
                        ))}
                    </Masonry>
                </ViewingBox>
            </Grid>
        </Grid>
    );
};
