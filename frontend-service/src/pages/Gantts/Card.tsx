import { Card, CardHeader } from '@mui/material';
import { IMongoGantt } from '@packages/gantt';
import React from 'react';
import { useLocation } from 'wouter';
import { environment } from '../../globals';

const { heatmapModeKey } = environment.ganttSettings.searchParams;
interface IGanttCardProps {
    gantt: IMongoGantt;
}

export const GanttsCard: React.FC<IGanttCardProps> = ({ gantt }) => {
    const [_, navigate] = useLocation();

    return (
        <Card
            onClick={() => {
                navigate(gantt.groupBy ? `/gantts/${gantt._id}?${heatmapModeKey}=true` : `/gantts/${gantt._id}`);
            }}
            sx={{
                ':hover': { transform: 'scale(1.05)' },
                cursor: 'pointer',
                borderRadius: '17px',
            }}
        >
            <CardHeader title={gantt.name} />
        </Card>
    );
};
