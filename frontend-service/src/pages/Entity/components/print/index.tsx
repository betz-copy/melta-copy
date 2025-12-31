import { PrintOutlined } from '@mui/icons-material';
import { Backdrop, Button, CircularProgress, ThemeProvider } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useReactToPrint } from 'react-to-print';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import PrintOptionsDialog, { PrintType } from '../../../../common/print/PrintOptionsDialog';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { getEntitiesTreeForPrint } from '../../../../services/entitiesService';
import { lightTheme } from '../../../../theme';
import { INestedRelationshipTemplates } from '../..';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    connections: INestedRelationshipTemplates[];
}> = ({ entityTemplate, expandedEntity }) => {
    const componentRef = useRef(null);

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [files, setFiles] = useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<IFile[]>(files);
    const [filesLoadingStatus, setFilesLoadingStatus] = useState<Record<string, boolean>>({});
    const [title, setTitle] = useState<string | undefined>(undefined);

    const [isShowDisabled, setIsShowDisabled] = useState<boolean>(true);
    const [showEntityDates, setShowEntityDates] = useState<boolean>(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = useState<boolean>(true);
    const [showEntityPrintCheckbox, setShowEntityPrintCheckbox] = useState<boolean>(false);
    const [appendSignatureField, setAppendSignatureField] = useState<boolean>(false);

    const [selectedRelationShipIds, setSelectedRelationShipIds] = useState<string[]>([]);

    const [isPreparingPdf, setIsPreparingPdf] = useState<boolean>(false);

    const { data, refetch, isFetching } = useQuery({
        queryKey: ['getEntitiesTreeForPrint', expandedEntity.entity.properties._id, selectedRelationShipIds.join(',')],
        queryFn: () => getEntitiesTreeForPrint(expandedEntity.entity.properties._id, selectedRelationShipIds, isShowDisabled),
        enabled: false,
        onSuccess: () => {
            setIsPreparingPdf(true);
        },
    });

    const handleClose = () => {
        setOpenModal(false);
    };

    const handleOpen = () => {
        setSelectedRelationShipIds([]);
        setOpenModal(true);
    };

    const documentTitle = `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`;

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle,
        bodyClass: 'print-body',
        onAfterPrint: () => setIsPreparingPdf(false),
        onBeforePrint: async () => {
            setIsPreparingPdf(true);
        },
    });

    const options = {
        disabled: { show: isShowDisabled, set: setIsShowDisabled, label: 'entityPage.print.showDisabled' },
        previewPropertiesOnly: {
            show: showPreviewPropertiesOnly,
            set: setShowPreviewPropertiesOnly,
            label: 'entityPage.print.showOnlyPreviewProperties',
        },
        entityDates: { show: showEntityDates, set: setShowEntityDates, label: 'entityPage.print.showEntityDates' },
        entityCheckbox: { show: showEntityPrintCheckbox, set: setShowEntityPrintCheckbox, label: 'entityPage.print.showEntityCheckbox' },
        appendSignatureField: { show: appendSignatureField, set: setAppendSignatureField, label: 'entityPage.print.appendSignatureField' },
    };

    useEffect(() => {
        if (data && isPreparingPdf) {
            handlePrint();
        }
    }, [data, isPreparingPdf, handlePrint]);

    return (
        <>
            <MeltaTooltip title={i18next.t('entityPage.print.header')}>
                <Button variant="contained" startIcon={<PrintOutlined />} onClick={handleOpen} sx={{ color: 'white' }}>
                    {i18next.t('actions.print')}
                </Button>
            </MeltaTooltip>

            {(data || isPreparingPdf) && (
                <div style={{ display: 'none' }}>
                    <style>{'@page { margin: 15px 10px 15px 10px !important; }'}</style>
                    <ThemeProvider theme={lightTheme}>
                        <ComponentToPrint
                            ref={componentRef}
                            entityTemplate={entityTemplate}
                            entity={data}
                            filesToPrint={selectedFiles}
                            setSelectedFiles={setSelectedFiles}
                            setFilesLoadingStatus={setFilesLoadingStatus}
                            options={{
                                showDisabled: isShowDisabled,
                                showEntityDates,
                                showEntityFiles: !!selectedFiles.length,
                                showPreviewPropertiesOnly,
                                addEntityCheckbox: showEntityPrintCheckbox,
                                appendSignatureField,
                            }}
                            printTitle={title}
                        />
                    </ThemeProvider>
                </div>
            )}

            {openModal && (
                <PrintOptionsDialog
                    open={openModal}
                    printItem={{
                        type: PrintType.Entity,
                        instance: expandedEntity,
                        template: entityTemplate,
                        options,
                    }}
                    handleClose={handleClose}
                    files={files}
                    setFiles={setFiles}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    filesLoadingStatus={filesLoadingStatus}
                    setFilesLoadingStatus={setFilesLoadingStatus}
                    onClick={() => {
                        handleClose();
                        refetch();
                    }}
                    title={title}
                    setTitle={setTitle}
                    setSelectedRelationShipIds={setSelectedRelationShipIds}
                    isPrintButtonEnabled={!!selectedRelationShipIds.length}
                />
            )}

            <Backdrop open={isFetching || isPreparingPdf} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <CircularProgress color="inherit" />
                    <span style={{ fontWeight: 'bold' }}>{i18next.t(`entityPage.print.${isFetching ? 'fetchingData' : 'generatingPdf'}`)}</span>
                </div>
            </Backdrop>
        </>
    );
};

export { Print };
