import React, { useState } from 'react';
import { Collapse, Divider, Grid, Typography } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useQueryClient } from 'react-query';
import { environment } from '../../../globals';
import { RelationshipTitle } from '../../RelationshipTitle';
import { IMongoRelationshipTemplatePopulated } from '../../../interfaces/relationshipTemplates';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { EntityPropertiesInternal } from '../../EntityProperties';
import { EntityTemplateColor } from '../../EntityTemplateColor';
import { getEntityTemplateColor } from '../../../utils/colors';

interface RelationshipInfoProps {
    relationship: IMongoRelationshipTemplatePopulated | null;
    failedProperties: string[];
}

export const RelationshipInfo: React.FC<RelationshipInfoProps> = ({ relationship, failedProperties }) => {
    const [open, setOpen] = useState(false);

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const header = relationship ? <RelationshipTitle relationshipTemplate={relationship} /> : <Grid />;

    const entityHeader = (templateId: string) => {
        const entityTemplate = templateId ? entityTemplates.get(templateId) : null;

        if (!entityTemplate) return <Grid />;

        const entityTemplateColor = entityTemplate ? getEntityTemplateColor(entityTemplate) : '';
        return (
            <Grid item container gap="20px">
                <Grid item>
                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} style={{ height: '20px' }} />
                </Grid>
                <Grid item>
                    <Typography
                        style={{
                            fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                            color: '#101440',
                            fontWeight: '400',
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
            <Grid item paddingTop="8px">
                {open ? (
                    <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                ) : (
                    <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                )}
            </Grid>
            <Grid
                item
                container
                alignItems="center"
                paddingLeft="20px"
                paddingTop="10px"
                paddingBottom="10px"
                gap="5px"
                style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', width: '460px' }}
            >
                {header}
                <Collapse in={open} timeout="auto" unmountOnExit style={{ width: '100%' }}>
                    <Grid container item gap="20px" flexDirection="column" width="100%">
                        <Divider orientation="horizontal" style={{ width: '95%', alignSelf: 'center' }} />
                        <Grid item container flexDirection="column" width="100%">
                            <Grid item>{entityHeader(relationship?.sourceEntity?._id || '')}</Grid>
                            <Grid item width="100%">
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
                        <Grid item container flexDirection="column">
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
        </Grid>
    ) : (
        <Grid />
    );
};
