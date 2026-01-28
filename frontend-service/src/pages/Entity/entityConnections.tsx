import { Hive as HiveIcon } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Tab, Typography, useTheme } from '@mui/material';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IEntityExpanded } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { CustomIcon } from '../../common/CustomIcon';
import { ICategoryMap, IEntityTemplateMap, INestedRelationshipTemplates, IRelationshipTemplateMap } from '../../interfaces/template';
import { ConnectionsTable } from './ConnectionsTable';
import { RelationshipIcon } from './RelationshipIcon';

interface EntityConnectionsProps {
    currentEntityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    templateIds: string[];
    expandedEntity: IEntityExpanded;
    getButtonStateByRelatedTemplate: (relatedTemplate: IMongoEntityTemplateWithConstraintsPopulated) => {
        isEditButtonsDisabled: boolean;
        disabledButtonText: string;
        hasPermissionToRelatedTemplate: boolean;
    };
    connectionsTemplates?: INestedRelationshipTemplates[];
    groupChildTemplate: Record<string, IMongoChildTemplateWithConstraintsPopulated[]>;
}

export const EntityConnections: React.FC<EntityConnectionsProps> = ({
    currentEntityTemplate,
    templateIds,
    expandedEntity,
    connectionsTemplates,
    getButtonStateByRelatedTemplate,
    groupChildTemplate,
}) => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

    const categoriesWithConnectionsTemplates = useMemo(() => {
        if (!connectionsTemplates) return;

        return Array.from(categories.values(), (category) => {
            return {
                category,
                connectionsTemplates: connectionsTemplates
                    .filter(({ relationshipTemplate: { destinationEntity, sourceEntity }, isExpandedEntityRelationshipSource }) => {
                        const otherEntityTemplate = isExpandedEntityRelationshipSource ? destinationEntity : sourceEntity;
                        return otherEntityTemplate?.category._id === category._id;
                    })
                    .sort((a, b) => Number(b.hasInstances) - Number(a.hasInstances)),
                // calculate the amount of the related connections of each entity
                relationshipCount: expandedEntity?.connections.filter(({ relationship, sourceEntity, destinationEntity }) => {
                    const connectionRelationshipTemplate = relationshipTemplates.get(relationship.templateId)!;

                    if (
                        connectionRelationshipTemplate?.isProperty &&
                        currentEntityTemplate?.properties.properties[connectionRelationshipTemplate.name]?.relationshipReference
                            ?.relationshipTemplateId === connectionRelationshipTemplate._id
                    )
                        return false;

                    if (expandedEntity.entity.properties._id === destinationEntity.properties._id)
                        return (
                            (entityTemplates.get(sourceEntity.templateId) ?? groupChildTemplate[sourceEntity.templateId]?.[0])?.category._id ===
                            category._id
                        );

                    return (
                        (entityTemplates.get(destinationEntity.templateId) ?? groupChildTemplate[destinationEntity.templateId]?.[0])?.category._id ===
                        category._id
                    );
                }).length,
            };
        })
            .filter((currCategory) => currCategory.connectionsTemplates?.length > 0)
            .sort((a, b) => (b?.relationshipCount ?? 0) - (a?.relationshipCount ?? 0));
    }, [connectionsTemplates, expandedEntity, categories, entityTemplates, relationshipTemplates, groupChildTemplate, currentEntityTemplate]);

    useEffect(() => {
        if (categoriesWithConnectionsTemplates?.length && selectedTabId === null) {
            setSelectedTabId(categoriesWithConnectionsTemplates[0].category._id);
        }
    }, [categoriesWithConnectionsTemplates, selectedTabId]);

    return (
        <>
            {categoriesWithConnectionsTemplates && categoriesWithConnectionsTemplates.length > 0 && (
                <Grid data-tour="connected-entities" sx={{ mt: '2rem' }}>
                    <Grid
                        container
                        alignItems="center"
                        gap="10px"
                        sx={{
                            backgroundColor: '#CCCFE580',
                            borderRadius: '20px 20px 0px 0px',
                            px: 2,
                            py: 0.8,
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#1E2775',
                                fontWeight: 600,
                                fontSize: '18px',
                                paddingLeft: '55px',
                            }}
                        >
                            {i18next.t('entityPage.relationshipTitle')}
                        </Typography>
                    </Grid>
                    <Box
                        sx={{
                            backgroundColor: '#4752B6',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            mt: '-25px',
                            ml: 1.5,
                        }}
                    >
                        <RelationshipIcon color="white" />
                    </Box>
                    <Grid>
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
                                        {connectionsTemplatesOfCategory.map((connectionTemplate) => {
                                            const relationship = connectionTemplate.relationshipTemplate;
                                            const relatedTemplate =
                                                relationship.destinationEntity._id !== currentEntityTemplate?._id
                                                    ? relationship.destinationEntity
                                                    : relationship.sourceEntity;

                                            const { isEditButtonsDisabled, disabledButtonText, hasPermissionToRelatedTemplate } =
                                                getButtonStateByRelatedTemplate(relatedTemplate);

                                            return (
                                                <ConnectionsTable
                                                    key={connectionTemplate.relationshipTemplate._id}
                                                    expandedEntity={expandedEntity}
                                                    templateIds={templateIds}
                                                    connectionTemplate={connectionTemplate}
                                                    isEditButtonsDisabled={isEditButtonsDisabled}
                                                    disabledButtonText={disabledButtonText}
                                                    hasPermissionToTemplate={hasPermissionToRelatedTemplate}
                                                    groupChildTemplate={groupChildTemplate}
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
        </>
    );
};
