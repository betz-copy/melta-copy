import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { BlueTitle } from '../../../../common/BlueTitle';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { EntityComponentToPrint, RelationshipPrintTitle } from './EntityComponentToPrint';
import { IFile } from '../../../../interfaces/preview';
import { FileToPrint } from '../../../../common/print/FileToPrint';
import { IEntityExpandedWithRelatedRelationships, ISelectRelationshipTemplates } from '.';

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        entityTemplate: IMongoEntityTemplatePopulated;
        expandedEntity: IEntityExpandedWithRelatedRelationships;
        connectionsTemplatesToPrint: ISelectRelationshipTemplates[];
        filesToPrint: IFile[];
        setSelectedFiles: React.Dispatch<React.SetStateAction<IFile[]>>;
        setFilesLoadingStatus: React.Dispatch<React.SetStateAction<{}>>;
        options: {
            showDate: boolean;
            showDisabled: boolean;
            showEntityDates: boolean;
            showEntityFiles: boolean;
            showPreviewPropertiesOnly: boolean;
        };
    }
>(({ entityTemplate, expandedEntity, connectionsTemplatesToPrint, options, filesToPrint, setSelectedFiles, setFilesLoadingStatus }, ref) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    return (
        <Box ref={ref} margin="20px" style={{ direction: 'rtl', color: '#000' }}>
            <Grid style={{ pageBreakInside: 'avoid' }}>
                <Box paddingBottom="0.4rem" display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                        <Typography component="h4" variant="h4" color="primary" fontWeight="800">
                            {entityTemplate.category.displayName}
                        </Typography>

                        <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                            /
                        </Typography>

                        <Typography paddingBottom="2px" variant="h4" fontSize="28px" color="primary">
                            {entityTemplate.displayName}
                        </Typography>
                    </Box>
                    {options.showDate && <Box>{new Date().toLocaleDateString('en-uk')}</Box>}
                </Box>
                <EntityComponentToPrint
                    entityTemplate={entityTemplate}
                    entity={expandedEntity.entity}
                    showPreviewPropertiesOnly={options.showPreviewPropertiesOnly}
                />
            </Grid>
            {connectionsTemplatesToPrint.length && (
                <>
                    <BlueTitle title={i18next.t('entityPage.relationshipTitle')} component="h4" variant="h4" style={{ marginTop: '2rem' }} />

                    {connectionsTemplatesToPrint.map(({ relationshipTemplate, isExpandedEntityRelationshipSource }) => {
                        const { _id, destinationEntity, sourceEntity } = relationshipTemplate;

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

                        const expandedSelectedConnections = connectionsTemplatesToPrint
                            .map((selectedConnection) => expandedRelationships?.[selectedConnection.relationshipTemplate._id])
                            .flat();

                        let entities = relevantConnections.map((connection) => {
                            return connection.sourceEntity.properties._id === expandedEntity.entity.properties._id
                                ? connection.destinationEntity
                                : connection.sourceEntity;
                        });

                        // .concat(expandedSelectedConnections);

                        if (!options.showDisabled) entities = entities.filter((entity) => !entity.properties.disabled);

                        if (entities.length !== 0)
                            return (
                                <div key={_id}>
                                    <RelationshipPrintTitle
                                        relationshipTemplate={relationshipTemplate}
                                        isExpandedEntityRelationshipSource={isExpandedEntityRelationshipSource}
                                    />

                                    {entities.map((entity) => (
                                        <div key={entity.properties._id} style={{ marginBottom: '0.5rem' }}>
                                            <EntityComponentToPrint
                                                entityTemplate={entityTemplates.get(entity.templateId)!}
                                                entity={entity}
                                                options={{ showDates: options.showEntityDates }}
                                                showPreviewPropertiesOnly
                                                expandedRelationships={expandedRelationships?.[_id].filter((expandedRelationship) =>
                                                    expandedRelationship.isMainEntityIsRelationshipSource
                                                        ? expandedRelationship.sourceEntity.properties._id === sourceEntity._id
                                                        : expandedRelationship.destinationEntity.properties._id === destinationEntity._id,
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        return <div key={_id}> </div>;
                    })}
                </>
            )}
            {options.showEntityFiles && (
                <>
                    <Grid sx={{ width: '100%', height: '100%', paddingY: '55%', paddingX: '27%' }}>
                        <BlueTitle
                            title={i18next.t('entityPage.print.accompanyingFiles')}
                            component="h2"
                            variant="h2"
                            style={{ marginTop: '2rem' }}
                        />
                    </Grid>
                    {filesToPrint.map((file) => {
                        return (
                            <FileToPrint
                                file={file}
                                key={`${file.id}-${file.contentType}`}
                                onPreviewLoadingFinished={(error?: boolean) => {
                                    setFilesLoadingStatus((prev) => ({ ...prev, [file.id]: false }));
                                    if (error) {
                                        toast.error(i18next.t('entityPage.previewRefetch'));
                                        setSelectedFiles((prevSelectedFiles) =>
                                            prevSelectedFiles.filter((selectedFile) => selectedFile.id !== file.id),
                                        );
                                    }
                                }}
                            />
                        );
                    })}
                </>
            )}
        </Box>
    );
});

export { ComponentToPrint };
