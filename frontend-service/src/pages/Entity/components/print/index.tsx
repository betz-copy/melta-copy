import { PrintOutlined } from '@mui/icons-material';
import { Button, ThemeProvider } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useReactToPrint } from 'react-to-print';
import { IConnectionTemplateOfExpandedEntity } from '../..';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import { PrintOptionsDialog } from '../../../../common/print/PrintOptionsDialog';
import { IConnection, IEntity, IEntityExpanded } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../../../services/entitiesService';
import { useUserStore } from '../../../../stores/user';
import { lightTheme } from '../../../../theme';
import { sortTemplatesChildrenToParents } from '../../../../utils/expandedRelationships';
import { getAllAllowedEntities } from '../../../../utils/permissions/templatePermissions';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';

// TODO: delete all these types
export interface ConnectionWithExtendedRelationship extends IConnection {
    extendedRelationships?: IConnection[];
}
export interface IEntityExpandedWithRelatedRelationships {
    entity: IEntity;
    connections: ConnectionWithExtendedRelationship[];
}

export interface IConnectionTemplateExpanded extends IConnectionTemplateOfExpandedEntity {
    parentRelationship?: IConnectionTemplateOfExpandedEntity;
}

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
}> = ({ entityTemplate, expandedEntity, connectionsTemplates }) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const allowedEntityTemplates: IMongoEntityTemplatePopulated[] = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const allowedEntityTemplatesIds = allowedEntityTemplates.map((entity) => entity._id);
    const allRelationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const [openModal, setOpenModal] = useState(false);

    const componentRef = React.useRef(null);

    const [files, setFiles] = useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState(files);
    const [filesLoadingStatus, setFilesLoadingStatus] = useState({});

    const [selectedConnections, setSelectedConnections] = React.useState<IConnectionTemplateOfExpandedEntity[]>([]);
    const [connections, setConnections] = React.useState(connectionsTemplates);

    const [showDate, setShowDate] = useState(true);
    const [showDisabled, setShowDisabled] = useState(true);
    const [showEntityDates, setShowEntityDates] = useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = useState(false);

    const handleClose = () => {
        setSelectedConnections([]);
        setOpenModal(false);
    };

    const templateIds = Object.keys(entityTemplates);
    const { refetch: getExpandedData } = useQuery<IEntityExpanded>(
        ['getExpandedEntity', expandedEntity.entity.properties._id, { templateIds }],
        () =>
            getExpandedEntityByIdRequest(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: { maxLevel: 2, minLevel: 2 } },
                { disabled: false, templateIds: allowedEntityTemplatesIds },
            ),
        {
            enabled: false,
            onSuccess: (data) => {
                const newConnections = sortTemplatesChildrenToParents(2, connectionsTemplates, data, allRelationshipTemplates, entityTemplates);
                console.log({ connectionsTemplates, newConnections });
                setConnections(newConnections);
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
                    instance={expandedEntity}
                    template={entityTemplate}
                    connections={connections}
                    setConnections={setConnections}
                    selectedConnections={selectedConnections}
                    setSelectedConnections={setSelectedConnections}
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
