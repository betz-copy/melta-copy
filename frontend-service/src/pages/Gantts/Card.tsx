import React from 'react';
import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IGantt } from '../../interfaces/gantts';
import { environment } from '../../globals';

interface IGanttCardProps {
    gantt: IGantt;
}
const {
    searchParams: { heatmapModeKey },
} = environment.ganttSettings;

export const GanttsCard: React.FC<IGanttCardProps> = ({ gantt }) => {
    const navigate = useNavigate();

    return (
        <Card
            onClick={() => {
                navigate(gantt.groupBy ? `./${gantt._id}?${heatmapModeKey}=true` : `./${gantt._id}`);
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
