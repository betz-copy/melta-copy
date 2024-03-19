import i18next from 'i18next';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import { IconButton } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { AxiosError } from 'axios';
import { UseMutateAsyncFunction } from 'react-query';
import { IFile } from '../../../interfaces/entities';
import { ComponentToPrint } from './ComponentToPrint';
import { PrintOptionsDialog } from './PrintOptionsDialog';
import { getFileName } from '../../../utils/getFileName';
import { getFileExtension, getPreviewContentType } from '../../../utils/getFileType';
import { isUnsupported, isVideoOrAudio } from '../../../common/FilePreview/PreviewDialog';
import { IMongoProcessInstancePopulated } from '../../../interfaces/processes/processInstance';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { ProcessDetailsValues } from '../../../common/wizards/processInstance/ProcessDetails';

window.addEventListener('beforeprint', (event) => {
    console.log('Before print', event.target);
});

const Print: React.FC<{
    processTemplate: IMongoProcessTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError<any, any>, ProcessDetailsValues, unknown>;
    setCurrProcessInstance: React.Dispatch<React.SetStateAction<IMongoProcessInstancePopulated>>;
    setIsProcessChanged: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
}> = ({ processTemplate, processInstance, mutateAsync, setCurrProcessInstance, setIsProcessChanged, isLoading }) => {
    const [openModal, setOpenModal] = React.useState(false);
    const handleOpen = () => setOpenModal(true);
    const handleClose = () => setOpenModal(false);

    const componentRef = React.useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${processTemplate.displayName}-${processInstance.name}-${new Date().toLocaleDateString('en-uk')}`,
    });

    console.log({ processTemplate });
    console.log({ processInstance });

    const getProcessPropertiesFiles = (): IFile[] => {
        return processTemplate.details.propertiesOrder
            .map((propertyKey) => {
                const propertySchema = processTemplate.details.properties.properties[propertyKey];
                const propertyValue = processInstance.details[propertyKey];
                if (propertyValue && propertySchema.format === 'fileId') {
                    const name = getFileName(propertyValue);
                    return {
                        id: propertyValue,
                        name,
                        type: getPreviewContentType(name),
                        key: propertyKey,
                        extension: getFileExtension(name),
                    } as IFile;
                }
                return undefined;
            })
            .filter((file) => file !== undefined) as IFile[];
    };

    const getProcessStepsFiles = (): IFile[] => {
        const files: IFile[] = [];
        processTemplate.steps.forEach((stepTemplate) => {
            processInstance.steps.forEach((step) => {
                stepTemplate.propertiesOrder.forEach((propertyKey) => {
                    if (step.properties) {
                        const propertySchema = stepTemplate.properties.properties[propertyKey];
                        const propertyValue = step.properties[propertyKey];
                        if (propertyValue && propertySchema.format === 'fileId') {
                            const name = getFileName(propertyValue);
                            files.push({
                                id: propertyValue,
                                name,
                                type: getPreviewContentType(name),
                                extension: getFileExtension(name),
                            });
                        }
                    }
                });
            });
        });
        return files;
    };

    const files = getProcessPropertiesFiles()
        .filter((file) => !isVideoOrAudio(file.type) && !isUnsupported(file.type) && file.extension !== 'pptx' && !file.name.includes('txt'))
        .concat(
            getProcessStepsFiles().filter(
                (file) => !isVideoOrAudio(file.type) && !isUnsupported(file.type) && file.extension !== 'pptx' && !file.name.includes('txt'),
            ),
        );

    console.log({ files });

    const [showSummary, setShowSummary] = React.useState(true);
    const [showFiles, setShowFiles] = React.useState(false);

    const [isFilesLoading, setIsFilesLoading] = React.useState<Set<number>>();
    const [isFilesError, setIsFilesError] = React.useState(false);

    const getPageMargins = () => {
        // eslint-disable-next-line quotes
        return `@page { margin: 15px 10px 15px 10px !important; }`;
    };

    return (
        <>
            <MeltaTooltip title={i18next.t('actions.print')}>
                <IconButton onClick={() => handleOpen()}>
                    <PrintIcon color="primary" />
                </IconButton>
            </MeltaTooltip>
            <div style={{ display: 'none' }}>
                <style>{getPageMargins()}</style>
                <ComponentToPrint
                    ref={componentRef}
                    processTemplate={processTemplate}
                    processInstance={processInstance}
                    options={{ showSummary, showFiles }}
                    filesToPrint={files}
                    isFilesLoading={isFilesLoading}
                    setIsFilesLoading={setIsFilesLoading}
                    setIsFilesError={setIsFilesError}
                    mutateAsync={mutateAsync}
                    setCurrProcessInstance={setCurrProcessInstance}
                    setIsProcessChanged={setIsProcessChanged}
                />
            </div>
            <PrintOptionsDialog
                open={openModal}
                handleClose={handleClose}
                files={files}
                isLoading={(isFilesLoading && isFilesLoading.size > 0) || isLoading}
                isFilesError={isFilesError}
                onClick={handlePrint}
                options={{
                    showSummary,
                    setShowSummary,
                    showFiles,
                    setShowFiles,
                }}
            />
        </>
    );
};

export { Print };
