import { PrintOutlined } from '@mui/icons-material';
import { Backdrop, Button, CircularProgress, ThemeProvider } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { UseReactToPrintOptions, useReactToPrint } from 'react-to-print';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import PrintOptionsDialog, { PrintType } from '../../../../common/print/PrintOptionsDialog';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFile } from '../../../../interfaces/preview';
import { lightTheme } from '../../../../theme';
import { INestedRelationshipTemplates } from '../..';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';
import html2pdf from 'html2pdf.js';
import { useQuery } from 'react-query';
import { getEntitiesTreeForPrint } from '../../../../services/entitiesService';

export async function generateAndSavePDF(printIframe: HTMLIFrameElement, filename?: string) {
    const iframeDoc = printIframe.contentDocument;
    if (!iframeDoc) return;

    const content = iframeDoc.body;

    // Wait for content to fully generate
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });

    const options = {
        margin: 10,
        filename: `${filename || 'document'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
            scale: 0.85, // Controls quality
            useCORS: true,
            logging: true,
            windowWidth: 1920,
            windowHeight: 1080,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait' as const,
        },
    };

    await html2pdf().set(options).from(content).save();
}

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
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = useState<boolean>(false);

    const [selectedRelationShipIds, setSelectedRelationShipIds] = useState<string[]>([]);
    const [shouldPrint, setShouldPrint] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const { data, refetch, isFetching } = useQuery({
        queryKey: ['getEntitiesTreeForPrint', selectedRelationShipIds.join(',')],
        queryFn: () => getEntitiesTreeForPrint(expandedEntity.entity.properties._id, selectedRelationShipIds),
        enabled: false,
    });

    const handleClose = () => {
        setOpenModal(false);
    };

    const handleOpen = async () => {
        setSelectedRelationShipIds([]);
        setOpenModal(true);
    };

    const documentTitle = `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`;

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle,
        bodyClass: 'print-body',
        print: async (iframe) => {
            try {
                setIsGeneratingPdf(true);
                await generateAndSavePDF(iframe, documentTitle);
            } finally {
                setIsGeneratingPdf(false);
            }
        },
        removeAfterPrint: true,
    } as UseReactToPrintOptions);

    useEffect(() => {
        if (shouldPrint) refetch();
    }, [shouldPrint, refetch]);

    useEffect(() => {
        if (shouldPrint && data && !isFetching) {
            handlePrint();
            setShouldPrint(false);
        }
    }, [shouldPrint, data, isFetching, handlePrint]);

    const getPageMargins = '@page { margin: 15px 10px 15px 10px !important; }';

    const options = {
        disabled: { show: isShowDisabled, set: setIsShowDisabled, label: 'entityPage.print.showDisabled' },
        previewPropertiesOnly: {
            show: showPreviewPropertiesOnly,
            set: setShowPreviewPropertiesOnly,
            label: 'entityPage.print.showOnlyPreviewProperties',
        },
        entityDates: { show: showEntityDates, set: setShowEntityDates, label: 'entityPage.print.showEntityDates' },
    };

    return (
        <>
            <MeltaTooltip title={i18next.t('entityPage.print.header')}>
                <Button variant="contained" startIcon={<PrintOutlined />} onClick={handleOpen} sx={{ color: 'white' }}>
                    {i18next.t('actions.print')}
                </Button>
            </MeltaTooltip>

            <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
                <style>{getPageMargins}</style>
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
                            addEntityCheckbox: true,
                        }}
                        printTitle={title}
                    />
                </ThemeProvider>
            </div>
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
                    onClick={() => setShouldPrint(true)}
                    title={title}
                    setTitle={setTitle}
                    setSelectedRelationShipIds={setSelectedRelationShipIds}
                />
            )}
            <Backdrop open={isGeneratingPdf} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </>
    );
};

export { Print };
