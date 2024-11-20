import { PrintOutlined } from '@mui/icons-material';
import { Button, ThemeProvider } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { IEntityExpanded, IMongoCategory, IMongoEntityTemplateWithConstraintsPopulated } from '@microservices/shared';
import { IConnectionTemplateOfExpandedEntity } from '../..';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import { PrintOptionsDialog } from '../../../../common/print/PrintOptionsDialog';
import { IFile } from '../../../../interfaces/preview';
import { lightTheme } from '../../../../theme';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    categoriesWithConnectionsTemplates: {
        category: IMongoCategory;
        connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    }[];
}> = ({ entityTemplate, expandedEntity, categoriesWithConnectionsTemplates, connectionsTemplates }) => {
    const [openModal, setOpenModal] = React.useState(false);

    const handleOpen = () => setOpenModal(true);
    const handleClose = () => setOpenModal(false);

    const componentRef = React.useRef(null);

    const [files, setFiles] = React.useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = React.useState(files);

    const [selectedConnections, setSelectedConnections] = React.useState<IConnectionTemplateOfExpandedEntity[]>([]);
    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = React.useState(false);
    const [filesLoadingStatus, setFilesLoadingStatus] = React.useState({});

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`,
        bodyClass: 'print-body',
    });

    const getPageMargins = () => {
        // eslint-disable-next-line quotes
        return `@page { margin: 15px 10px 15px 10px !important; }`;
    };

    return (
        <>
            <MeltaTooltip title={i18next.t('entityPage.print.header')}>
                <Button variant="contained" startIcon={<PrintOutlined />} onClick={handleOpen}>
                    {i18next.t('actions.print')}
                </Button>
            </MeltaTooltip>

            <div style={{ display: 'none' }}>
                <style>{getPageMargins()}</style>
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
                    entityConnections={{
                        connectionsTemplates,
                        selectedConnections,
                        setSelectedConnections,
                        categoriesWithConnectionsTemplates,
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
