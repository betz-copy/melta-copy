import React from 'react';
import { Box, Typography } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { BlueTitle } from '../../../../common/BlueTitle';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated } from '../../../../interfaces/relationshipTemplates';
import { EntityComponentToPrint } from './EntityComponentToPrint';

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        entityTemplate: IMongoEntityTemplatePopulated;
        expandedEntity: IEntityExpanded;
        relationshipTemplatesToPrint: IMongoRelationshipTemplatePopulated[];
        options: {
            showDate: boolean;
            showDisabled: boolean;
            showEntityDates: boolean;
        };
    }
>(({ entityTemplate, expandedEntity, relationshipTemplatesToPrint, options }, ref) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;

    return (
        <Box ref={ref} margin="20px" style={{ direction: 'rtl' }}>
            <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center">
                    <Typography component="h4" variant="h4" color="#225AA7" fontWeight="800">
                        {entityTemplate.category.displayName}
                    </Typography>

                    <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                        /
                    </Typography>

                    <Typography paddingBottom="2px" variant="h4" fontSize="28px" color="#225AA7">
                        {entityTemplate.displayName}
                    </Typography>
                </Box>
                {options.showDate && <Box> {new Date().toLocaleDateString('en-uk')}</Box>}
            </Box>
            <EntityComponentToPrint entityTemplate={entityTemplate} entity={expandedEntity.entity} />
            {relationshipTemplatesToPrint.length !== 0 && (
                <>
                    <BlueTitle title={i18next.t('entityPage.relationshipTitle')} component="h4" variant="h4" style={{ marginTop: '2rem' }} />

                    {relationshipTemplatesToPrint.map(({ _id, destinationEntity, sourceEntity, displayName }) => {
                        const relevantConnections = expandedEntity.connections.filter((connection) => connection.relationship.templateId === _id);
                        let entities =
                            destinationEntity._id === entityTemplate._id
                                ? relevantConnections.map((connection) => connection.sourceEntity)
                                : relevantConnections.map((connection) => connection.destinationEntity);

                        if (!options.showDisabled) entities = entities.filter((entity) => !entity.properties.disabled);

                        if (entities.length !== 0)
                            return (
                                <div key={_id}>
                                    <Box display="flex" alignItems="center" marginTop="2rem" marginBottom="0.5rem">
                                        <Typography variant="h4" fontSize="26px" color="gray">
                                            {sourceEntity.displayName}
                                        </Typography>

                                        <Typography paddingRight="7px" paddingLeft="7px" fontWeight="800" color="#225AA7" component="h5" variant="h5">
                                            {displayName}
                                        </Typography>

                                        <Typography variant="h4" fontSize="26px" color="gray">
                                            {destinationEntity.displayName}
                                        </Typography>
                                    </Box>

                                    {entities.map((entity) => (
                                        <div key={entity.properties._id} style={{ marginBottom: '0.5rem' }}>
                                            <EntityComponentToPrint
                                                entityTemplate={entityTemplates.find((currTemplate) => currTemplate._id === entity.templateId)!}
                                                entity={entity}
                                                options={{ showDates: options.showEntityDates }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        return <div key={_id}> </div>;
                    })}
                </>
            )}
        </Box>
    );
});

export { ComponentToPrint };
