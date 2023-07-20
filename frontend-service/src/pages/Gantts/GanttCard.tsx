import React from 'react';
import { IGantt } from '../../interfaces/gantts';
import { Card, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface IGanttCard {
    gantt: IGantt;
}

export const GanttsCard: React.FC<IGanttCard> = ({ gantt }) => {
    const navigate = useNavigate();

    return <Card onClick={() => { navigate(`./${gantt._id}`) }} sx={{
        ':hover': { transform: 'scale(1.05)' },
        cursor: 'pointer',
        borderRadius: '17px',
    }}>
        <CardHeader title={gantt.name} />
    </Card>;
};
