import { PrintOutlined } from '@mui/icons-material';
import { Button, ThemeProvider } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { INestedRelationshipTemplates } from '../..';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import { PrintOptionsDialog } from '../../../../common/print/PrintOptionsDialog';
import { IConnection, IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { lightTheme } from '../../../../theme';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    connections: INestedRelationshipTemplates[];
}> = ({ entityTemplate, expandedEntity, connections }) => {
    const [openModal, setOpenModal] = useState(false);

    const componentRef = React.useRef(null);

    const [files, setFiles] = useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState(files);
    const [filesLoadingStatus, setFilesLoadingStatus] = useState({});

    const [selectedConnections, setSelectedConnections] = React.useState<INestedRelationshipTemplates[]>([]);
    const [connectionsTemplates, setConnectionsTemplates] = React.useState(connections);
    const [connectionsInstances, setConnectionsInstances] = React.useState<IConnection[]>([]);

    const [showDate, setShowDate] = useState(true);
    const [showDisabled, setShowDisabled] = useState(true);
    const [showEntityDates, setShowEntityDates] = useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = useState(false);

    const handleClose = () => {
        setSelectedConnections([]);
        setOpenModal(false);
    };

    const handleOpen = async () => {
        setSelectedConnections([]);
        setOpenModal(true);
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
                <Button variant="contained" startIcon={<PrintOutlined />} onClick={handleOpen} sx={{ color: 'white' }}>
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
                        connectionsTemplates={selectedConnections}
                        connectionsInstances={connectionsInstances}
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
                    entityConnections={{
                        connectionsTemplates,
                        setConnectionsTemplates,
                        setConnectionsInstances,
                        selectedConnections,
                        setSelectedConnections,
                    }}
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
