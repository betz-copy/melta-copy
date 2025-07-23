import { Hive as HiveIcon } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, CircularProgress, Grid, Tab, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import { BlueTitle } from '../../../common/BlueTitle';
import { CustomIcon } from '../../../common/CustomIcon';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { getClientSideExpandedEntityByIdRequest } from '../../../services/clientSideService';
import { populateRelationshipTemplate } from '../../../utils/templates';
import { ConnectionsTable, IConnectionTemplateOfExpandedEntity } from '../../Entity';
import { EntityDetails } from '../../Entity/components/EntityDetails';
import { RelationshipIcon } from '../../Entity/RelationshipIcon';

const ClientSideEntityPage: React.FC = () => {
    const theme = useTheme();

    const { entityId } = useParams();
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getClientSideCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getClientSideEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getClientSideRelationshipTemplates')!;

    const allowedRelationships: IMongoRelationshipTemplate[] = Array.from(relationshipTemplates.values());

    const expanded = entityId ? { [entityId]: 1 } : {};
    const { data: expandedEntity } = useQuery({
        queryKey: ['expandedEntity', entityId],
        queryFn: () => getClientSideExpandedEntityByIdRequest(entityId!, expanded, { templateIds: Array.from(entityTemplates.keys()) }),
    });

    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

    useEffect(() => {
        if (!expandedEntity) return;
    }, [expandedEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!expandedEntity) return <CircularProgress />;

    const currentEntityTemplate = entityTemplates.get(expandedEntity?.entity.templateId ?? '')!;

    const populatedRelationshipTemplates = allowedRelationships.map((currRelationshipTemplate) =>
        populateRelationshipTemplate(currRelationshipTemplate, entityTemplates),
    );
    const connectionsTemplates: IConnectionTemplateOfExpandedEntity[] = [];

    populatedRelationshipTemplates.forEach((relationshipTemplate) => {
        const hasInstances = !!expandedEntity?.connections.some(
            (connection) => 'relationship' in connection && connection.relationship.templateId === relationshipTemplate._id,
        );

        if (
            !(
                relationshipTemplate.isProperty &&
                currentEntityTemplate.properties.properties[relationshipTemplate.name]?.relationshipReference?.relationshipTemplateId ===
                    relationshipTemplate._id
            )
        ) {
            if (relationshipTemplate.sourceEntity._id === currentEntityTemplate._id) {
                connectionsTemplates.push({
                    relationshipTemplate,
                    isExpandedEntityRelationshipSource: true,
                    hasInstances,
                    depth: 1,
                    children: [],
                });
            }
            if (relationshipTemplate.destinationEntity._id === currentEntityTemplate._id) {
                connectionsTemplates.push({
                    relationshipTemplate,
                    isExpandedEntityRelationshipSource: false,
                    hasInstances,
                    depth: 1,
                    children: [],
                });
            }
        }
    });

    const categoriesWithConnectionsTemplates = Array.from(categories.values(), (category) => {
        return {
            category,
            connectionsTemplates: connectionsTemplates
                .filter(({ relationshipTemplate, isExpandedEntityRelationshipSource }) => {
                    const otherEntityTemplate = isExpandedEntityRelationshipSource
                        ? relationshipTemplate.destinationEntity
                        : relationshipTemplate.sourceEntity;
                    return otherEntityTemplate.category._id === category._id;
                })
                .sort((a, b) => Number(b.hasInstances) - Number(a.hasInstances)),
            relationshipCount: expandedEntity?.connections.filter((connection) => {
                const connectionRelationshipTemplate = relationshipTemplates.get(connection.relationship.templateId)!;

                if (
                    connectionRelationshipTemplate.isProperty &&
                    currentEntityTemplate.properties.properties[connectionRelationshipTemplate.name]?.relationshipReference
                        ?.relationshipTemplateId === connectionRelationshipTemplate._id
                )
                    return false;

                if (expandedEntity.entity.properties._id === connection.destinationEntity.properties._id)
                    return entityTemplates.get(connection.sourceEntity.templateId)!.category._id === category._id;

                return entityTemplates.get(connection.destinationEntity.templateId)!.category._id === category._id;
            }).length,
        };
    })
        .filter((currCategory) => currCategory.connectionsTemplates?.length > 0)
        .sort((a, b) => (b?.relationshipCount ?? 0) - (a?.relationshipCount ?? 0));

    return (
        <Grid padding="40px">
            <Grid item marginTop="20px" data-tour="entity-details">
                <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
            </Grid>
            {categoriesWithConnectionsTemplates.length > 0 && (
                <Grid data-tour="connected-entities" style={{ marginTop: '2rem' }}>
                    <Grid item container xs={5} alignItems="center" gap="20px">
                        <Grid item alignContent="center">
                            <RelationshipIcon />
                        </Grid>
                        <Grid item>
                            <BlueTitle
                                title={i18next.t('entityPage.relationshipTitle')}
                                component="h5"
                                variant="h5"
                                style={{ fontSize: '20px', fontWeight: 'semi-bold' }}
                            />
                        </Grid>
                    </Grid>
                    <Grid item>
                        <TabContext value={selectedTabId ?? categoriesWithConnectionsTemplates[0]?.category._id}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList variant="scrollable" scrollButtons="auto" onChange={(_event, newValue) => setSelectedTabId(newValue)}>
                                    {categoriesWithConnectionsTemplates.map(({ category: { _id, displayName, iconFileId }, relationshipCount }) => (
                                        <Tab
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: '15px',
                                                height: '20px',
                                                alignItems: 'center',
                                            }}
                                            key={_id}
                                            label={
                                                <Grid container flexDirection="row" alignItems="center" flexWrap="nowrap" gap="10px">
                                                    <Typography
                                                        color={selectedTabId === _id ? theme.palette.primary.main : '#787C9E'}
                                                        style={{ fontWeight: '500', fontSize: '16px' }}
                                                    >
                                                        {displayName}
                                                    </Typography>
                                                    <Typography color="#787C9E">{relationshipCount}</Typography>
                                                </Grid>
                                            }
                                            value={_id}
                                            icon={
                                                iconFileId ? (
                                                    <CustomIcon
                                                        iconUrl={iconFileId}
                                                        height="24px"
                                                        width="24px"
                                                        color={selectedTabId === _id ? theme.palette.primary.main : '#787C9E'}
                                                    />
                                                ) : (
                                                    <HiveIcon
                                                        fontSize="medium"
                                                        sx={{
                                                            color: selectedTabId === _id ? theme.palette.primary.main : '#787C9E',
                                                        }}
                                                    />
                                                )
                                            }
                                        />
                                    ))}
                                </TabList>
                            </Box>
                            {categoriesWithConnectionsTemplates.map(({ category: { _id }, connectionsTemplates: connectionsTemplatesOfCategory }) => {
                                return (
                                    <TabPanel key={_id} value={_id}>
                                        {connectionsTemplatesOfCategory.map((connectionTemplate, connectedRelationshipTemplateIndex) => {
                                            return (
                                                <ConnectionsTable
                                                    key={connectedRelationshipTemplateIndex}
                                                    expandedEntity={expandedEntity}
                                                    templateIds={Array.from(entityTemplates.keys())}
                                                    connectionTemplate={connectionTemplate}
                                                    isEditButtonsDisabled
                                                    disabledButtonText={i18next.t('ruleManagement.create-relationship')}
                                                    hasPermissionToTemplate={false}
                                                />
                                            );
                                        })}
                                    </TabPanel>
                                );
                            })}
                        </TabContext>
                    </Grid>
                </Grid>
            )}
        </Grid>
    );
};

export default ClientSideEntityPage;
