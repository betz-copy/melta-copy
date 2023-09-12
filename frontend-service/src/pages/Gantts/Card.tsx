import React from 'react';
import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IGantt } from '../../interfaces/gantts';

interface IGanttCardProps {
    gantt: IGantt;
}

export const GanttsCard: React.FC<IGanttCardProps> = ({ gantt }) => {
    const navigate = useNavigate();

    return (
        <Card
            onClick={() => {
                navigate(`./${gantt._id}`);
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
