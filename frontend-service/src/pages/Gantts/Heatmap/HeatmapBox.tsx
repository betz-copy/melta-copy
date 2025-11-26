import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Box, Card, CardContent, CardHeader, Collapse, Divider, IconButton, Typography } from '@mui/material';
import React, { useState } from 'react';
import { NavButton } from '../../../common/NavButton';
import { environment } from '../../../globals';
import { IGanttHeatmapBox } from '../../../interfaces/gantts';
import { GanttEvent } from '../GanttEvent';

const { heatmapColors } = environment.ganttSettings;

interface IHeatmapBoxProps {
    heatmapBox: IGanttHeatmapBox;
}

export const HeatmapBox: React.FC<IHeatmapBoxProps> = ({ heatmapBox }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <Card
            sx={{
                bgcolor: heatmapBox.ganttEvents.length ? heatmapColors.now : heatmapColors.idle,
                minWidth: '10rem',
                display: 'block',
            }}
        >
            <CardHeader
                title={
                    <NavButton to={`/entity/${heatmapBox.id}`}>
                        <Typography color="white" fontWeight="bold" fontSize={18}>
                            {heatmapBox.title}
                        </Typography>
                    </NavButton>
                }
                sx={{ textAlign: 'center', padding: '0.5rem' }}
            />
            <CardContent sx={{ textAlign: 'center', '&:last-child': { padding: 0 } }}>
                <Collapse in={expanded} sx={{ paddingTop: 0 }}>
                    {heatmapBox.ganttEvents.map((ganttEvent) => (
                        <Box key={ganttEvent.Id} padding="1.3rem" paddingTop={0}>
                            <Divider sx={{ borderColor: 'white', opacity: 0.5, marginY: '1rem' }} />
                            <GanttEvent {...ganttEvent} expanded />
                        </Box>
                    ))}
                </Collapse>

                {Boolean(heatmapBox.ganttEvents.length) && (
                    <>
                        <Divider sx={{ borderColor: 'white', opacity: 0.5 }} />
                        <IconButton onClick={() => setExpanded(!expanded)} sx={{ color: 'white' }}>
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
