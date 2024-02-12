import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { BlueTitle } from '../../../../common/BlueTitle';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { EntityComponentToPrint } from './EntityComponentToPrint';
import { IConnectionTemplateOfExpandedEntity } from '../..';

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        entityTemplate: IMongoEntityTemplatePopulated;
        expandedEntity: IEntityExpanded;
        connectionsTemplatesToPrint: IConnectionTemplateOfExpandedEntity[];
        options: {
            showDate: boolean;
            showDisabled: boolean;
            showEntityDates: boolean;
        };
    }
>(({ entityTemplate, expandedEntity, connectionsTemplatesToPrint, options }, ref) => {
    const theme = useTheme();

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    return (
        <Box ref={ref} margin="20px" style={{ direction: 'rtl' }}>
            <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center">
                    <Typography component="h4" variant="h4" color={theme.palette.primary.main} fontWeight="800">
                        {entityTemplate.category.displayName}
                    </Typography>

                    <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                        /
                    </Typography>

                    <Typography paddingBottom="2px" variant="h4" fontSize="28px" color={theme.palette.primary.main}>
                        {entityTemplate.displayName}
                    </Typography>
                </Box>
                {options.showDate && <Box> {new Date().toLocaleDateString('en-uk')}</Box>}
            </Box>
            <EntityComponentToPrint entityTemplate={entityTemplate} entity={expandedEntity.entity} />
            {connectionsTemplatesToPrint.length !== 0 && (
                <>
                    <BlueTitle title={i18next.t('entityPage.relationshipTitle')} component="h4" variant="h4" style={{ marginTop: '2rem' }} />

                    {connectionsTemplatesToPrint.map(
                        ({ relationshipTemplate: { _id, destinationEntity, sourceEntity, displayName }, isExpandedEntityRelationshipSource }) => {
                            const relevantConnections = expandedEntity.connections.filter((connection) => {
                                if (isExpandedEntityRelationshipSource) {
                                    return (
                                        connection.relationship.templateId === _id &&
                                        connection.sourceEntity.properties._id === expandedEntity.entity.properties._id
                                    );
                                }

                                return (
                                    connection.relationship.templateId === _id &&
                                    connection.destinationEntity.properties._id === expandedEntity.entity.properties._id
                                );
                            });
                            let entities = relevantConnections.map((connection) => {
                                return connection.sourceEntity.properties._id === expandedEntity.entity.properties._id
                                    ? connection.destinationEntity
                                    : connection.sourceEntity;
                            });

                            if (!options.showDisabled) entities = entities.filter((entity) => !entity.properties.disabled);

                            if (entities.length !== 0)
                                return (
                                    <div key={_id}>
                                        <Box display="flex" alignItems="center" marginTop="2rem" marginBottom="0.5rem">
                                            <Typography
                                                variant="h4"
                                                fontSize="26px"
                                                color="gray"
                                                fontWeight={isExpandedEntityRelationshipSource ? '900' : undefined}
                                            >
                                                {sourceEntity.displayName}
                                            </Typography>

                                            <Typography
                                                paddingRight="7px"
                                                paddingLeft="7px"
                                                fontWeight="800"
                                                color={theme.palette.primary.main}
                                                component="h5"
                                                variant="h5"
                                            >
                                                {displayName}
                                            </Typography>

                                            <Typography
                                                variant="h4"
                                                fontSize="26px"
                                                color="gray"
                                                fontWeight={!isExpandedEntityRelationshipSource ? '900' : undefined}
                                            >
                                                {destinationEntity.displayName}
                                            </Typography>
                                        </Box>

                                        {entities.map((entity) => (
                                            <div key={entity.properties._id} style={{ marginBottom: '0.5rem' }}>
                                                <EntityComponentToPrint
                                                    entityTemplate={entityTemplates.get(entity.templateId)!}
                                                    entity={entity}
                                                    options={{ showDates: options.showEntityDates }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            return <div key={_id}> </div>;
                        },
                    )}
                </>
            )}
        </Box>
    );
});

export { ComponentToPrint };
