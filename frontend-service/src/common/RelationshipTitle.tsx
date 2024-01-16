import React, { CSSProperties } from 'react';
import { Grid, Tooltip, Typography, tooltipClasses } from '@mui/material';
import '../css/realtionshipTitle.css';
import { getEntityTemplateColor } from '../utils/colors';
import { IMongoRelationshipTemplatePopulated } from '../interfaces/relationshipTemplates';
import { MeltaTooltip } from './MeltaTooltip';
import { EntityTemplateColor } from './EntityTemplateColor';

const TextComponent: React.FC<{ title: string; style?: CSSProperties }> = ({ title, style }) => {
    return (
        <MeltaTooltip title={title}>
            <Typography
                variant="h6"
                marginLeft="10px"
                fontSize="16px"
                noWrap
                style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    width: '80px',
                    fontWeight: '400',
                    ...style,
                }}
            >
                {title}
            </Typography>
        </MeltaTooltip>
    );
};

const RelationshipTitle: React.FC<{
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    style?: React.CSSProperties;
}> = ({ relationshipTemplate, style }) => {
    const srcEntityTemplateColor = getEntityTemplateColor(relationshipTemplate.sourceEntity);
    const destEntityTemplateColor = getEntityTemplateColor(relationshipTemplate.destinationEntity);

    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            flexWrap="nowrap"
            style={{ ...style, borderRadius: '10px', backgroundColor: '#FFF' }}
        >
            <Grid item container flexWrap="nowrap" alignItems="center">
                <Grid item>
                    <EntityTemplateColor entityTemplateColor={srcEntityTemplateColor} style={{ height: '18px' }} />
                </Grid>
                <TextComponent title={relationshipTemplate.sourceEntity.displayName} />
            </Grid>
            <Grid item container flexWrap="nowrap">
                <img src="\icons\arrow-tail.svg" />
                <TextComponent
                    title={relationshipTemplate.displayName}
                    style={{
                        margin: '0px 10px',
                        width: '100px',
                        textAlign: 'center',
                        fontWeight: '500',
                    }}
                />

                <img src="\icons\arrow-head.svg" />
            </Grid>
            <Grid item container marginLeft="20px" flexWrap="nowrap" alignItems="center">
                <Grid item>
                    <EntityTemplateColor entityTemplateColor={destEntityTemplateColor} style={{ height: '18px' }} />
                </Grid>
                <TextComponent title={relationshipTemplate.destinationEntity.displayName} />
            </Grid>
        </Grid>
    );
};

export { RelationshipTitle };
