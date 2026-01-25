import { PrintOutlined } from '@mui/icons-material';
import { Backdrop, Button, CircularProgress, ThemeProvider } from '@mui/material';
import { IEntityExpanded } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoPrintingTemplate } from '@packages/printing-template';
import i18next from 'i18next';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useReactToPrint } from 'react-to-print';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import PrintOptionsDialog, { IEntityPrint, IPrintOptions, PrintType } from '../../../../common/print/PrintOptionsDialog';
import { IFile } from '../../../../interfaces/preview';
import { INestedRelationshipTemplates } from '../../../../interfaces/template';
import { getEntitiesTreeForPrint } from '../../../../services/entitiesService';
import { lightTheme } from '../../../../theme';
import { ComponentToPrint } from './ComponentToPrint';
import './print.css';

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    expandedEntity: IEntityExpanded;
    connections: INestedRelationshipTemplates[];
}> = ({ entityTemplate, expandedEntity }) => {
    const componentRef = useRef(null);

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [files, setFiles] = useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<(IFile & { isLoading: boolean })[]>([]);
    const [title, setTitle] = useState<string | undefined>(undefined);

    const [printOptions, setPrintOptions] = useState<IPrintOptions>({
        isShowDisabled: true,
        showEntitiesDates: true,
        showPreviewPropertiesOnly: false,
    });

    const [selectedRelationShipIds, setSelectedRelationShipIds] = useState<string[]>([]);
    const [isPreparingPdf, setIsPreparingPdf] = useState<boolean>(false);
    const [selectedPrintingTemplate, setSelectedPrintingTemplate] = useState<IMongoPrintingTemplate>();

    const { refetch, isFetching, data } = useQuery({
        queryKey: ['getEntitiesTreeForPrint', expandedEntity.entity.properties._id, selectedRelationShipIds.join(',')],
        queryFn: () => getEntitiesTreeForPrint(expandedEntity.entity.properties._id, selectedRelationShipIds, printOptions.isShowDisabled),
        enabled: false,
        onSuccess: () => {
            setIsPreparingPdf(true);
        },
    });

    const handleClose = () => {
        setOpenModal(false);
    };

    const handleOpen = () => {
        setTitle(undefined);
        setSelectedPrintingTemplate(undefined);
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

    useEffect(() => {
        if (isPreparingPdf && selectedFiles.every(({ isLoading }) => !isLoading)) handlePrint();
    }, [isPreparingPdf, handlePrint, selectedFiles]);

    const dialogOptions = useMemo(() => {
        const final = {} as IEntityPrint['options'];

        for (const [key, value] of Object.entries(printOptions)) {
            final[key] = {
                show: value,
                set: () => setPrintOptions((prev) => ({ ...prev, [key]: !value })),
                label: `entityPage.print.${key}`,
            };
        }

        return final;
    }, [printOptions]);

    return (
        <>
            <MeltaTooltip title={i18next.t('entityPage.print.header')}>
                <Button variant="contained" startIcon={<PrintOutlined />} onClick={handleOpen} sx={{ color: 'white' }}>
                    {i18next.t('actions.print')}
                </Button>
            </MeltaTooltip>

            {isPreparingPdf && (
                <div style={{ display: 'none' }}>
                    <style>{'@page { margin: 15px 10px 15px 10px !important; }'}</style>
                    <ThemeProvider theme={lightTheme}>
                        <ComponentToPrint
                            ref={componentRef}
                            entityTemplate={entityTemplate}
                            entity={
                                data ?? {
                                    ...expandedEntity.entity,
                                    relationshipId: '',
                                    children: [],
                                }
                            }
                            filesToPrint={selectedFiles}
                            setSelectedFiles={setSelectedFiles}
                            options={{
                                ...printOptions,
                                showEntityFiles: !!selectedFiles.length,
                                appendSignatureField: selectedPrintingTemplate?.appendSignatureField,
                                addEntityCheckbox: selectedPrintingTemplate?.addEntityCheckbox,
                            }}
                            printTitle={title}
                            printingTemplate={selectedPrintingTemplate}
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
                        options: dialogOptions,
                    }}
                    handleClose={handleClose}
                    files={files}
                    setFiles={setFiles}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    onClick={() => {
                        handleClose();
                        selectedRelationShipIds.length ? refetch() : setIsPreparingPdf(true);
                    }}
                    title={title}
                    setTitle={setTitle}
                    setSelectedRelationShipIds={setSelectedRelationShipIds}
                    selectedPrintingTemplate={selectedPrintingTemplate}
                    setSelectedPrintingTemplate={setSelectedPrintingTemplate}
                    isPrintEntities={true}
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
