import { IMongoGantt } from '@microservices/shared';
import { Card, CardHeader } from '@mui/material';
import React from 'react';
import { useLocation } from 'wouter';
import { environment } from '../../globals';

interface IGanttCardProps {
    gantt: IMongoGantt;
}
const {
    searchParams: { heatmapModeKey },
} = environment.ganttSettings;

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
