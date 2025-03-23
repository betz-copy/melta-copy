import { PrintOutlined } from '@mui/icons-material';
import { Button, ThemeProvider } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { useQuery, useQueryClient } from 'react-query';
import { IConnectionTemplateOfExpandedEntity } from '../..';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import { PrintOptionsDialog } from '../../../../common/print/PrintOptionsDialog';
import { IMongoCategory } from '../../../../interfaces/categories';
import { IConnection, IEntity, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { lightTheme } from '../../../../theme';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';

export interface ISelectRelationshipTemplates extends IConnectionTemplateOfExpandedEntity {
    children?: IConnectionTemplateExpanded[];
}
export interface ConnectionWithExtendedRelationship extends IConnection {
    extendedRelationships?: IConnection[];
}
export interface IEntityExpandedWithRelatedRelationships {
    entity: IEntity;
    connections: ConnectionWithExtendedRelationship[];
}

export interface IConnectionExpanded extends IConnection {
    parentRelationship: IConnection;
}

export interface IConnectionTemplateExpanded extends IConnectionTemplateOfExpandedEntity {
    parentRelationship?: IConnectionTemplateOfExpandedEntity;
}

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    categoriesWithConnectionsTemplates: {
        category: IMongoCategory;
        connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    }[];
}> = ({ entityTemplate, expandedEntity, categoriesWithConnectionsTemplates, connectionsTemplates }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const [openModal, setOpenModal] = React.useState(false);

    const componentRef = React.useRef(null);

    const [files, setFiles] = React.useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = React.useState(files);
    const [filesLoadingStatus, setFilesLoadingStatus] = React.useState({});

    const [selectedConnections, setSelectedConnections] = React.useState<ISelectRelationshipTemplates[]>([]);
    const [expandedRelationshipsTemplates, setExpandedRelationshipsTemplates] = React.useState<IConnectionTemplateExpanded[]>([]);
    const [expandedRelationships, setExpandedRelationships] = React.useState<IConnectionExpanded[]>([]);

    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = React.useState(false);

    const handleClose = () => {
        setOpenModal(false);
    };

    const { refetch: getExpandedData } = useQuery<IEntityExpanded>(
        ['getExpandedEntity', expandedEntity.entity.properties._id, { templateIds: Object.keys(entityTemplates) }],
        () =>
            getExpandedEntityByIdRequest(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: 2 },
                { disabled: false, templateIds: Object.keys(entityTemplates) },
            ),
        {
            enabled: false,
            onSuccess: (data) => {
                const extendedRelationships = data?.connections.filter(
                    (connection) =>
                        !expandedEntity.connections.some(
                            (currentConnection) => currentConnection.relationship.properties._id === connection.relationship.properties._id,
                        ),
                );

                const relatedEntities = expandedEntity.connections.map((connection) => {
                    const relationshipTemplate = connectionsTemplates.find(
                        (connectionsTemplate) => connectionsTemplate.relationshipTemplate._id === connection.relationship.templateId,
                    );
                    return {
                        relationshipId: connection.relationship.properties._id,
                        relationshipTemplate: connection.relationship,
                        entityId: relationshipTemplate?.isExpandedEntityRelationshipSource
                            ? connection.destinationEntity.properties._id
                            : connection.sourceEntity.properties._id,
                    };
                });

                const extendedRelationshipsTemplates: IConnectionTemplateExpanded[] = [];
                const currentExtendedRelationships: IConnectionExpanded[] = [];

                extendedRelationships.forEach((extendedRelationship) => {
                    const connectedRelationship = relatedEntities.find(
                        (relatedEntity) =>
                            relatedEntity.entityId === extendedRelationship.destinationEntity.properties._id ||
                            relatedEntity.entityId === extendedRelationship.sourceEntity.properties._id,
                    );
                    if (!connectedRelationship) return;

                    const parentRelationshipInstance = expandedEntity.connections.find(
                        (connection) => connection.relationship.properties._id === connectedRelationship?.relationshipId,
                    )!;

                    const fullParentRelationshipTemplate = connectionsTemplates.find(
                        (connectionsTemplate) =>
                            connectedRelationship?.relationshipTemplate.templateId === connectionsTemplate.relationshipTemplate._id,
                    )!;

                    const parentTemplate = relationshipTemplates.get(extendedRelationship.relationship.templateId)!;
                    const { sourceEntityId, destinationEntityId, ...parentTemplateProperties } = parentTemplate;
                    const parentTemplatePopulated: IMongoRelationshipTemplatePopulated = {
                        ...parentTemplateProperties,
                        sourceEntity: entityTemplates.get(sourceEntityId)!,
                        destinationEntity: entityTemplates.get(destinationEntityId)!,
                    };

                    const relationshipTemplate: IConnectionTemplateOfExpandedEntity = {
                        relationshipTemplate: parentTemplatePopulated,
                        isExpandedEntityRelationshipSource: connectedRelationship.entityId === extendedRelationship.destinationEntity.properties._id,
                    };
                    if (
                        !extendedRelationshipsTemplates.some(
                            (extendedRelationshipsTemplate) =>
                                relationshipTemplate.relationshipTemplate._id === extendedRelationshipsTemplate.relationshipTemplate._id,
                        )
                    )
                        extendedRelationshipsTemplates.push({ ...relationshipTemplate, parentRelationship: fullParentRelationshipTemplate });
                    currentExtendedRelationships.push({ ...extendedRelationship, parentRelationship: parentRelationshipInstance });
                });

                setExpandedRelationshipsTemplates(extendedRelationshipsTemplates);
                setExpandedRelationships(currentExtendedRelationships);
            },
        },
    );

    const handleOpen = async () => {
        setSelectedConnections([]);
        setOpenModal(true);
        await getExpandedData();
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`,
        bodyClass: 'print-body',
    });

    const getPageMargins = '@page { margin: 15px 10px 15px 10px !important; }';

    return (
        <>
            <MeltaTooltip title={i18next.t('entityPage.print.header')}>
                <Button variant="contained" startIcon={<PrintOutlined />} onClick={handleOpen}>
                    {i18next.t('actions.print')}
                </Button>
            </MeltaTooltip>

            <div style={{ display: 'none' }}>
                <style>{getPageMargins}</style>
                <ThemeProvider theme={lightTheme}>
                    <ComponentToPrint
                        ref={componentRef}
                        entityTemplate={entityTemplate}
                        expandedEntity={expandedEntity}
                        connectionsTemplatesToPrint={selectedConnections}
                        expandedRelationships={expandedRelationships}
                        filesToPrint={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        setFilesLoadingStatus={setFilesLoadingStatus}
                        options={{ showDate, showDisabled, showEntityDates, showEntityFiles: selectedFiles.length !== 0, showPreviewPropertiesOnly }}
                    />
                </ThemeProvider>
            </div>
            {openModal && (
                <PrintOptionsDialog
                    open={openModal}
                    entityConnections={{
                        connectionsTemplates,
                        expandedRelationshipsTemplates,
                        expandedRelationships,
                        selectedConnections,
                        setSelectedConnections,
                    }}
                    instance={expandedEntity}
                    template={entityTemplate}
                    handleClose={handleClose}
                    files={files}
                    setFiles={setFiles}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    filesLoadingStatus={filesLoadingStatus}
                    setFilesLoadingStatus={setFilesLoadingStatus}
                    onClick={handlePrint}
                    options={{
                        date: { show: showDate, set: setShowDate, label: 'entityPage.print.showDate' },
                        disabled: { show: showDisabled, set: setShowDisabled, label: 'entityPage.print.showDisabled' },
                        entityDates: { show: showEntityDates, set: setShowEntityDates, label: 'entityPage.print.showEntityDates' },
                        previewPropertiesOnly: {
                            show: showPreviewPropertiesOnly,
                            set: setShowPreviewPropertiesOnly,
                            label: 'entityPage.print.showOnlyPreviewProperties',
                        },
                    }}
                />
            )}
        </>
    );
};

export { Print };
