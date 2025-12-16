import { Grid, Typography, useTheme } from '@mui/material';
import React, { CSSProperties } from 'react';
import '../css/realtionshipTitle.css';
import { IMongoEntityTemplateWithConstraintsPopulated, IMongoRelationshipTemplatePopulated } from '@microservices/shared';
import { useDarkModeStore } from '../stores/darkMode';
import { useWorkspaceStore } from '../stores/workspace';
import { getEntityTemplateColor } from '../utils/colors';
import { EntityTemplateColor } from './EntityTemplateColor';
import MeltaTooltip from './MeltaDesigns/MeltaTooltip';

const ArrowTail: React.FC = () => {
    const theme = useTheme();

    return (
        <svg width="42" height="2" viewBox="0 0 42 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M0.0677948 0C0.089447 0.23989 0.10051 0.482835 0.10051 0.728363C0.10051 1.16113 0.0661469 1.58587 0 2H40.1005C40.6528 2 41.1005 1.55228 41.1005 1C41.1005 0.447715 40.6528 0 40.1005 0H0.0677948Z"
                fill={theme.palette.primary.main}
            />
        </svg>
    );
};

const ArrowHead: React.FC = () => {
    const theme = useTheme();

    return (
        <svg width="47" height="16" viewBox="0 0 47 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M46.0327 7.00068C46.0111 7.24057 46 7.48351 46 7.72904C46 8.16181 46.0344 8.58655 46.1005 9.00068H3.41421L8.07107 13.6575C8.46159 14.0481 8.46159 14.6812 8.07107 15.0717C7.68054 15.4623 7.04737 15.4623 6.65686 15.0717L0.292889 8.70779C-0.0976295 8.31726 -0.0976295 7.6841 0.292889 7.29357L6.65686 0.929612C7.04737 0.539088 7.68054 0.539088 8.07107 0.929612C8.46159 1.32014 8.46159 1.9533 8.07107 2.34383L3.41421 7.00068H46.0327Z"
                fill={theme.palette.primary.main}
            />
        </svg>
    );
};

const TextComponent: React.FC<{ title: string; style?: CSSProperties }> = ({ title, style }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    return (
        <MeltaTooltip title={title}>
            <Typography
                variant="h6"
                marginLeft="10px"
                fontSize={workspace.metadata.mainFontSizes.headlineSubTitleFontSize}
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

export const EntityTemplateTextComponent: React.FC<{ entityTemplate: IMongoEntityTemplateWithConstraintsPopulated; style?: React.CSSProperties }> = ({
    entityTemplate,
    style,
}) => {
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    return (
        <Grid container flexWrap="nowrap" alignItems="center">
            <Grid>
                <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '18px' }} />
            </Grid>
            <TextComponent title={entityTemplate.displayName} style={style} />
        </Grid>
    );
};

const RelationshipTitle: React.FC<{
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    renderEntityTemplateText?: React.JSXElementConstructor<{
        entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
        isRelationshipSource: boolean;
    }>;
    style?: CSSProperties;
}> = ({ relationshipTemplate, renderEntityTemplateText: EntityTemplateTextComponentOverride, style }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            flexWrap="nowrap"
            style={{ ...style, borderRadius: '10px', backgroundColor: darkMode ? '#212121' : '#FFF' }}
            color={darkMode ? '#FFF' : '#000'}
        >
            <Grid marginRight="20px">
                {EntityTemplateTextComponentOverride ? (
                    <EntityTemplateTextComponentOverride entityTemplate={relationshipTemplate.sourceEntity} isRelationshipSource />
                ) : (
                    <EntityTemplateTextComponent entityTemplate={relationshipTemplate.sourceEntity} />
                )}
            </Grid>
            <Grid container flexWrap="nowrap" alignItems="center">
                <ArrowTail />

                <TextComponent
                    title={relationshipTemplate.displayName}
                    style={{
                        margin: '0px 10px',
                        width: '100px',
                        textAlign: 'center',
                        fontWeight: '500',
                    }}
                />

                <ArrowHead />
            </Grid>
            <Grid marginLeft="20px">
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
