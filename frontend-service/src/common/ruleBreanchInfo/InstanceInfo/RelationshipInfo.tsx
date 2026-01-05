import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Collapse, Divider, Grid, Paper, Typography, useTheme } from '@mui/material';
import { IEntityTemplateMap } from '@packages/entity-template';
import { IMongoRelationshipTemplatePopulated } from '@packages/relationship-template';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { EntityPropertiesInternal } from '../../EntityProperties';
import { EntityTemplateColor } from '../../EntityTemplateColor';
import { RelationshipTitle } from '../../RelationshipTitle';

interface RelationshipInfoProps {
    relationship: IMongoRelationshipTemplatePopulated | null;
    failedProperties: string[];
}

export const RelationshipInfo: React.FC<RelationshipInfoProps> = ({ relationship, failedProperties }) => {
    const theme = useTheme();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { headlineSubTitleFontSize } = workspace.metadata.mainFontSizes;

    const [open, setOpen] = useState(false);

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const header = relationship ? <RelationshipTitle relationshipTemplate={relationship} /> : <Grid />;

    const entityHeader = (templateId: string) => {
        const entityTemplate = templateId ? entityTemplates.get(templateId) : null;

        if (!entityTemplate) return <Grid />;

        const entityTemplateColor = entityTemplate ? getEntityTemplateColor(entityTemplate) : '';
        return (
            <Grid container gap="20px">
                <Grid>
                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '20px' }} />
                </Grid>
                <Grid>
                    <Typography
                        style={{
                            fontSize: headlineSubTitleFontSize,
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            width: '130px',
                        }}
                    >
                        {entityTemplate?.displayName || ''}
                    </Typography>
                </Grid>
            </Grid>
        );
    };

    return relationship ? (
        <Grid container onClick={() => setOpen((prev) => !prev)}>
            <Grid paddingTop="8px">
                {open ? (
                    <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                ) : (
                    <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                )}
            </Grid>
            <Paper
                sx={{
                    paddingLeft: '20px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '10px',
                    width: '460px',
                }}
            >
                <Grid container alignItems="center" gap="5px">
                    {header}
                    <Collapse in={open} timeout="auto" unmountOnExit style={{ width: '100%' }}>
                        <Grid container gap="20px" flexDirection="column" width="100%">
                            <Divider orientation="horizontal" style={{ width: '95%', alignSelf: 'center' }} />
                            <Grid container flexDirection="column" width="100%">
                                <Grid>{entityHeader(relationship?.sourceEntity?._id || '')}</Grid>
                                <Grid width="100%">
                                    {relationship?.sourceEntity && entityTemplates.get(relationship?.sourceEntity._id) && (
                                        <EntityPropertiesInternal
                                            properties={{
                                                ...relationship?.sourceEntity.properties.properties,
                                                _id: relationship?.sourceEntity._id || '',
                                                createdAt: new Date().toISOString(),
                                                updatedAt: new Date().toISOString(),
                                                disabled: false,
                                            }}
                                            entityTemplate={entityTemplates.get(relationship?.sourceEntity._id)!}
                                            style={{
                                                flexDirection: 'row',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                            innerStyle={{ width: '30%' }}
                                            showPreviewPropertiesOnly
                                            textWrap
                                            mode="normal"
                                            propertiesToHighlight={failedProperties}
                                            propertiesToHighlightColor="red"
                                        />
                                    )}
                                </Grid>
                            </Grid>
                            <Grid container flexDirection="column">
                                {entityHeader(relationship?.destinationEntity?._id || '')}
                                {relationship?.destinationEntity && entityTemplates.get(relationship?.destinationEntity._id) && (
                                    <EntityPropertiesInternal
                                        properties={{
                                            ...relationship?.destinationEntity.properties.properties,
                                            _id: relationship?.destinationEntity._id,
                                            createdAt: new Date().toISOString(),
                                            updatedAt: new Date().toISOString(),
                                            disabled: false,
                                        }}
                                        entityTemplate={entityTemplates.get(relationship?.destinationEntity._id)!}
                                        style={{
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                        innerStyle={{ width: '30%' }}
                                        showPreviewPropertiesOnly
                                        textWrap
                                        mode="normal"
                                        propertiesToHighlight={failedProperties}
                                        propertiesToHighlightColor="red"
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </Collapse>
                </Grid>
            </Paper>
        </Grid>
    ) : (
        <Grid />
    );
};
