import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { NodeObject } from 'react-force-graph-2d';

interface NodeLabelIconsDescriptionProps {
    node: NodeObject;
}

export const NodeLabelIconsDescription: React.FC<NodeLabelIconsDescriptionProps> = ({ node }) => {
    return (
        <Grid container direction="column" alignItems="center">
            {node.labelIcons.map((labelIcon) => (
                <Grid key={labelIcon.icon}>
                    <Typography display="inline" color={labelIcon.color}>
                        {labelIcon.icon}
                    </Typography>
                    <Typography display="inline">{` - ${
                        i18next.t('graph.labelIconDescriptions', { returnObjects: true })[labelIcon.icon]
                    }`}</Typography>
                </Grid>
            ))}
        </Grid>
    );
};
