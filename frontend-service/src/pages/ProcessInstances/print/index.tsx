import i18next from 'i18next';
import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { IconButton, ThemeProvider } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { AxiosError } from 'axios';
import { UseMutateAsyncFunction } from 'react-query';
import { ComponentToPrint } from './ComponentToPrint';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { ProcessDetailsValues } from '../../../common/wizards/processInstance/ProcessDetails';
import { IFile } from '../../../interfaces/preview';
import { MenuButton } from '../../../common/MenuButton';
import { PrintOptionsDialog, PrintType } from '../../../common/print/PrintOptionsDialog';
import '../../Entity/components/print/print.css';
import { lightTheme } from '../../../theme';

const Print: React.FC<{
    processTemplate: IMongoProcessTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError<any, any>, ProcessDetailsValues, unknown>;
    setCurrProcessInstance: React.Dispatch<React.SetStateAction<IMongoProcessInstancePopulated>>;
    setIsProcessChanged: React.Dispatch<React.SetStateAction<boolean>>;
    isProcessCard?: boolean;
}> = ({ processTemplate, processInstance, mutateAsync, setCurrProcessInstance, setIsProcessChanged, isProcessCard }) => {
    const componentRef = useRef(null);

    const [openModal, setOpenModal] = useState<boolean>(false);

    const [files, setFiles] = useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<IFile[]>(files);
    const [filesLoadingStatus, setFilesLoadingStatus] = useState<Record<string, boolean>>({});

    const [showSummary, setShowSummary] = useState<boolean>(true);

    const handleOpen = () => setOpenModal(true);
    const handleClose = () => setOpenModal(false);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${processTemplate.displayName}-${processInstance.name}-${new Date().toLocaleDateString('en-uk')}`,
        bodyClass: 'print-body',
    });

    const getPageMargins = () => {
        // eslint-disable-next-line quotes
        return `@page { margin: 15px 10px 15px 10px !important; }`;
    };

    const options = { processSummary: { show: showSummary, set: setShowSummary, label: 'wizard.processInstance.print.showSummary' } };

    return (
        <>
            {isProcessCard ? (
                <MenuButton
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleOpen();
                    }}
                    text={i18next.t('actions.print')}
                    icon={<PrintIcon color="action" />}
                />
            ) : (
                <MeltaTooltip title={i18next.t('actions.print')}>
                    <IconButton onClick={() => handleOpen()}>
                        <PrintIcon color="primary" />
                    </IconButton>
                </MeltaTooltip>
            )}

            <div style={{ display: 'none' }}>
                <style>{getPageMargins()}</style>
                <ThemeProvider theme={lightTheme}>
                    <ComponentToPrint
                        ref={componentRef}
                        processTemplate={processTemplate}
                        processInstance={processInstance}
                        options={{ showSummary, showFiles: !!selectedFiles.length }}
                        filesToPrint={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        mutateAsync={mutateAsync}
                        setFilesLoadingStatus={setFilesLoadingStatus}
                        setCurrProcessInstance={setCurrProcessInstance}
                        setIsProcessChanged={setIsProcessChanged}
                    />
                </ThemeProvider>
            </div>
            {openModal && (
                <PrintOptionsDialog
                    open={openModal}
                    handleClose={handleClose}
                    printItem={{ type: PrintType.Process, instance: processInstance, template: processTemplate, options }}
                    files={files}
                    setFiles={setFiles}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    filesLoadingStatus={filesLoadingStatus}
                    setFilesLoadingStatus={setFilesLoadingStatus}
                    onClick={handlePrint}
                />
            )}
        </>
    );
};

export { Print };
