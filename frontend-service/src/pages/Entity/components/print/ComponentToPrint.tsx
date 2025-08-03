import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { INestedRelationshipTemplates } from '../..';
import { BlueTitle } from '../../../../common/BlueTitle';
import { FileToPrint } from '../../../../common/print/FileToPrint';
import { IConnection, IEntity, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { EntityComponentToPrint, RelationshipPrintTitle } from './EntityComponentToPrint';

export const renderConnectionTree = (
    entity: IEntity,
    connectionsTemplates: INestedRelationshipTemplates[],
    connectionsInstances: IConnection[],
    options: {
        showEntityDates: boolean;
        showDisabled: boolean;
    },
): JSX.Element[] => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    return connectionsTemplates.flatMap(({ relationshipTemplate, isExpandedEntityRelationshipSource, children }) => {
        const entityType = isExpandedEntityRelationshipSource ? 'sourceEntity' : 'destinationEntity';

        const connectedEntities: Map<string, IEntity> = new Map();

        for (const connection of connectionsInstances) {
            if (connection.relationship.templateId === relationshipTemplate._id && connection[entityType].properties._id === entity.properties._id) {
                const connectedEntity =
                    connection.sourceEntity.properties._id === entity.properties._id ? connection.destinationEntity : connection.sourceEntity;

                if (options.showDisabled || !connectedEntity.properties.disabled)
                    connectedEntities.set(connectedEntity.properties._id, connectedEntity);
            }
        }

        if (!connectedEntities.size) return [];

        return (
            <div key={relationshipTemplate._id}>
                <RelationshipPrintTitle
                    relationshipTemplate={relationshipTemplate}
                    isExpandedEntityRelationshipSource={isExpandedEntityRelationshipSource}
                    sxOverride={{ marginTop: '2rem', marginBottom: '0.5rem' }}
                />

                {[...connectedEntities.values()].map((connectedEntity) => (
                    <div key={connectedEntity.properties._id} style={{ marginBottom: '0.5rem' }}>
                        <EntityComponentToPrint
                            entityTemplate={entityTemplates.get(connectedEntity.templateId)!}
                            entity={connectedEntity}
                            options={options}
                            showPreviewPropertiesOnly
                            expandedRelationships={{
                                instances: connectionsInstances,
                                templates: children,
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    });
};

const ComponentToPrint = React.forwardRef<
    HTMLDivElement,
    {
        entityTemplate: IMongoEntityTemplatePopulated;
        expandedEntity: IEntityExpanded;
        connectionsTemplates: INestedRelationshipTemplates[];
        connectionsInstances: IConnection[];
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
>(
    (
        {
            entityTemplate,
            expandedEntity,
            connectionsTemplates,
            connectionsInstances,
            options,
            filesToPrint,
            setSelectedFiles,
            setFilesLoadingStatus,
        },
        ref,
    ) => {
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
                    <EntityComponentToPrint entityTemplate={entityTemplate} entity={expandedEntity.entity} options={options} />
                </Grid>
                {connectionsTemplates.length > 0 && (
                    <>
                        <BlueTitle title={i18next.t('entityPage.relationshipTitle')} component="h4" variant="h4" style={{ marginTop: '2rem' }} />
                        {renderConnectionTree(expandedEntity.entity, connectionsTemplates, connectionsInstances, options)}
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
    },
);

export { ComponentToPrint };
