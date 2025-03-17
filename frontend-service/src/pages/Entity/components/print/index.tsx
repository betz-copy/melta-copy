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
import { IConnection, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { lightTheme } from '../../../../theme';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { IMongoRelationshipTemplate, IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { IRelationship } from '../../../../interfaces/relationships';

export type IExpandedRelationship = { isMainEntityIsRelationshipSource: boolean } & IConnection;
export type IExpandedRelationshipObject = Record<string, IExpandedRelationship[]>;
export interface IExpandedRelationshipTemplateWithRelated extends IMongoRelationshipTemplate {
    relatedTemplate: Pick<IRelationship, 'properties' | 'templateId'>;
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

    const handleClose = () => setOpenModal(false);

    const componentRef = React.useRef(null);

    const [files, setFiles] = React.useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = React.useState(files);
    const [filesLoadingStatus, setFilesLoadingStatus] = React.useState({});

    const [selectedConnections, setSelectedConnections] = React.useState<IConnectionTemplateOfExpandedEntity[]>([]);
    const [expandedRelationships, setExpandedRelationships] = React.useState<IExpandedRelationshipObject>({});
    const [expandedRelationshipTemplates, setExpandedRelationshipTemplates] = React.useState<IExpandedRelationshipTemplateWithRelated[]>([]);

    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = React.useState(false);

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

                const relationshipMap: IExpandedRelationshipObject = {};
                const extendedRelationshipTemplates = new Set<IExpandedRelationshipTemplateWithRelated>();

                extendedRelationships.forEach((extendedRelationship) => {
                    const connectedRelationship = relatedEntities.find(
                        (relatedEntity) =>
                            relatedEntity.entityId === extendedRelationship.destinationEntity.properties._id ||
                            relatedEntity.entityId === extendedRelationship.sourceEntity.properties._id,
                    );
                    if (!connectedRelationship) return;

                    const relationshipTemplateId = connectedRelationship.relationshipTemplate.templateId ?? '';

                    if (!relationshipMap[relationshipTemplateId]) relationshipMap[relationshipTemplateId] = [];

                    relationshipMap[relationshipTemplateId].push({
                        ...extendedRelationship,
                        isMainEntityIsRelationshipSource: connectedRelationship.entityId === extendedRelationship.destinationEntity.properties._id,
                    });

                    const relationshipTemplate: IMongoRelationshipTemplate = relationshipTemplates[extendedRelationship.relationship.templateId];

                    const relatedWithRelationshipTemplate = {
                        relatedTemplate: connectedRelationship.relationshipTemplate,
                        ...relationshipTemplate,
                    };

                    if (relationshipTemplate && !extendedRelationshipTemplates.has(relatedWithRelationshipTemplate))
                        extendedRelationshipTemplates.add(relatedWithRelationshipTemplate);
                });

                const sortedRelationships = Object.keys(relationshipMap)
                    .sort()
                    .reduce((acc, key) => {
                        // eslint-disable-next-line no-param-reassign
                        acc[key] = relationshipMap[key];
                        return acc;
                    }, {} as typeof relationshipMap);

                setExpandedRelationships(sortedRelationships);
                setExpandedRelationshipTemplates(Array.from(extendedRelationshipTemplates));
            },
        },
    );

    const handleOpen = async () => {
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
                        filesToPrint={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        setFilesLoadingStatus={setFilesLoadingStatus}
                        expandedRelationships={expandedRelationships}
                        options={{ showDate, showDisabled, showEntityDates, showEntityFiles: selectedFiles.length !== 0, showPreviewPropertiesOnly }}
                    />
                </ThemeProvider>
            </div>
            {openModal && (
                <PrintOptionsDialog
                    open={openModal}
                    entityConnections={{
                        connectionsTemplates,
                        selectedConnections,
                        setSelectedConnections,
                        categoriesWithConnectionsTemplates,
                        expandedRelationshipTemplates,
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
