import React from 'react';
import { Grid, Tooltip, Typography, tooltipClasses } from '@mui/material';
import '../css/realtionshipTitle.css';
import { getEntityTemplateColor } from '../utils/colors';
import { IMongoRelationshipTemplatePopulated } from '../interfaces/relationshipTemplates';

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
                    <div
                        style={{
                            height: '18px',
                            width: '3px',
                            backgroundColor: srcEntityTemplateColor,
                            borderRadius: '20px',
                        }}
                    />
                </Grid>
                <Tooltip
                    PopperProps={{
                        sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
                    }}
                    title={relationshipTemplate.sourceEntity.displayName}
                >
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
                        }}
                    >
                        {relationshipTemplate.sourceEntity.displayName}
                    </Typography>
                </Tooltip>
            </Grid>
            <Grid item container flexWrap="nowrap">
                <img src="\icons\arrow-tail.svg" />
                <Tooltip
                    PopperProps={{
                        sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
                    }}
                    title={relationshipTemplate.displayName}
                >
                    <Typography
                        variant="h6"
                        fontSize="16px"
                        noWrap
                        style={{
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            margin: '0px 10px',
                            width: '100px',
                            textAlign: 'center',
                            fontWeight: '500',
                        }}
                    >
                        {relationshipTemplate.displayName}
                    </Typography>
                </Tooltip>

                <img src="\icons\arrow-head.svg" />
            </Grid>
            <Grid item container marginLeft="20px" flexWrap="nowrap" alignItems="center">
                <Grid item>
                    <div
                        style={{
                            height: '18px',
                            width: '3px',
                            backgroundColor: destEntityTemplateColor,
                            borderRadius: '20px',
                        }}
                    />
                </Grid>
                <Tooltip
                    PopperProps={{
                        sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
                    }}
                    title={relationshipTemplate.destinationEntity.displayName}
                >
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
                        }}
                    >
                        {relationshipTemplate.destinationEntity.displayName}
                    </Typography>
                </Tooltip>
            </Grid>
        </Grid>
    );
};

export { RelationshipTitle };
