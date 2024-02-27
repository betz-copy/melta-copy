import React, { CSSProperties } from 'react';
import { Grid, Typography } from '@mui/material';
import '../css/realtionshipTitle.css';
import { getEntityTemplateColor } from '../utils/colors';
import { IMongoRelationshipTemplatePopulated } from '../interfaces/relationshipTemplates';
import { MeltaTooltip } from './MeltaTooltip';
import { EntityTemplateColor } from './EntityTemplateColor';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

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

export const EntityTemplateTextComponent: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; style?: React.CSSProperties }> = ({
    entityTemplate,
    style,
}) => {
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    return (
        <Grid container flexWrap="nowrap" alignItems="center">
            <Grid item>
                <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '18px' }} />
            </Grid>
            <TextComponent title={entityTemplate.displayName} style={style} />
        </Grid>
    );
};

const RelationshipTitle: React.FC<{
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    renderEntityTemplateText?: React.JSXElementConstructor<{ entityTemplate: IMongoEntityTemplatePopulated; isRelationshipSource: boolean }>;
    style?: CSSProperties;
}> = ({ relationshipTemplate, renderEntityTemplateText: EntityTemplateTextComponentOverride, style }) => {
    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            flexWrap="nowrap"
            style={{ ...style, borderRadius: '10px', backgroundColor: '#FFF' }}
        >
            <Grid item marginRight="20px">
                {EntityTemplateTextComponentOverride ? (
                    <EntityTemplateTextComponentOverride entityTemplate={relationshipTemplate.sourceEntity} isRelationshipSource />
                ) : (
                    <EntityTemplateTextComponent entityTemplate={relationshipTemplate.sourceEntity} />
                )}
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
            <Grid item marginLeft="20px">
                {EntityTemplateTextComponentOverride ? (
                    <EntityTemplateTextComponentOverride entityTemplate={relationshipTemplate.destinationEntity} isRelationshipSource={false} />
                ) : (
                    <EntityTemplateTextComponent entityTemplate={relationshipTemplate.destinationEntity} />
                )}
            </Grid>
        </Grid>
    );
};

export { RelationshipTitle };
