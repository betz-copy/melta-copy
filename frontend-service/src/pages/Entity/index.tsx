import React, { useState } from 'react';
import { Box, CircularProgress, Grid, IconButton, Tab } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { AddCircle } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { EntityDetails } from './components/EntityDetails';
import { RelationshipTable } from './components/RelationshipTable';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import '../../css/components/templateTable.css';

import { IMongoCategory } from '../../interfaces/categories';
import { RelationshipTitle } from '../../common/RelationshipTitle';

const Entity: React.FC = () => {
    const params = useParams();
    const queryClient = useQueryClient();
    const { entityId } = params;

    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId], () => getExpandedEntityByIdRequest(entityId!));

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories');

    const [value, setValue] = useState('0');

    if (!expandedEntity) return <CircularProgress />;

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates');
    const currentEntityTemplate = entityTemplates?.find((currTemplate) => currTemplate._id === expandedEntity?.entity.templateId);
    const relevantRelationshipTemplates = queryClient
        .getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')
        ?.filter(
            (currTemplate) =>
                currTemplate.sourceEntityId === expandedEntity?.entity.templateId ||
                currTemplate.destinationEntityId === expandedEntity?.entity.templateId,
        );

    if (!entityTemplates || !currentEntityTemplate) return <div>error</div>;

    const categoriesWithRelationshipTemplates = categories
        ?.map((category) => {
            return {
                ...category,
                relationshipTemplates:
                    relevantRelationshipTemplates
                        ?.map((currRelationshipTemplate) => {
                            const src = entityTemplates.find(
                                (currEntityTemplate) => currEntityTemplate._id === currRelationshipTemplate.sourceEntityId,
                            )!;
                            const dest = entityTemplates.find(
                                (currEntityTemplate) => currEntityTemplate._id === currRelationshipTemplate.destinationEntityId,
                            )!;

                            const otherEntityTemplate = src._id === currentEntityTemplate._id ? dest : src;

                            return {
                                ...currRelationshipTemplate,
                                src,
                                dest,
                                otherEntityTemplate,
                            };
                        })
                        .filter((currRelationshipTemplate) => currRelationshipTemplate.otherEntityTemplate.category._id === category._id) || [],
            };
        })
        .filter((currCategory) => currCategory.relationshipTemplates?.length > 0);

    return (
        <Grid>
            <Grid item marginTop="20px">
                <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
            </Grid>
            <Grid item marginTop="20px">
                <TabContext value={value}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={(_event, newValue) => setValue(newValue)}>
                            {categoriesWithRelationshipTemplates?.map(({ _id, displayName }, index) => (
                                <Tab key={_id} label={displayName} value={String(index)} />
                            ))}
                        </TabList>
                    </Box>
                    {categoriesWithRelationshipTemplates?.map(({ _id, relationshipTemplates }, index) => (
                        <TabPanel key={_id} value={String(index)} sx={{ padding: 0 }}>
                            {relationshipTemplates?.map((currRelationshipTemplate) => {
                                return (
                                    <Grid key={currRelationshipTemplate._id}>
                                        <Grid container item justifyContent="space-between">
                                            <Grid xs={3.5}>
                                                <RelationshipTitle
                                                    sourceEntityTemplateDisplayName={currRelationshipTemplate.src.displayName}
                                                    relationshipTemplateDisplayName={currRelationshipTemplate.displayName}
                                                    destinationEntityTemplateDisplayName={currRelationshipTemplate.dest.displayName}
                                                />
                                            </Grid>
                                            <Grid>
                                                <IconButton>
                                                    <AddCircle color="primary" fontSize="large" />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <RelationshipTable
                                            connectedEntities={expandedEntity.connections
                                                .filter((connection) => connection.relationship.templateId === currRelationshipTemplate._id)
                                                .map((connection) => connection.entity)}
                                            entityTemplate={currRelationshipTemplate.otherEntityTemplate}
                                        />
                                    </Grid>
                                );
                            })}
                        </TabPanel>
                    ))}
                </TabContext>
            </Grid>
        </Grid>
    );
};

export default Entity;
