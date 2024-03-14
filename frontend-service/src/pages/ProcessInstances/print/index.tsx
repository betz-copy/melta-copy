import i18next from 'i18next';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { IFile } from '../../../interfaces/entities';
import { ComponentToPrint } from './ComponentToPrint';
import { PrintOptionsDialog } from './PrintOptionsDialog';
import { getFileName } from '../../../utils/getFileName';
import { getFileExtension, getPreviewContentType } from '../../../utils/getFileType';
import { isUnsupported, isVideoOrAudio } from '../../../common/FilePreview/PreviewDialog';
import { IMongoProcessTemplatePopulated } from '../../../interfaces/processes/processTemplate';
import { IMongoProcessInstanceWithSteps } from '../../../interfaces/processes/processInstance';

const Print: React.FC<{
    processTemplate: IMongoProcessTemplatePopulated;
    expandedProcess: IMongoProcessInstanceWithSteps;
}> = ({ processTemplate, expandedProcess }) => {
    const [openModal, setOpenModal] = React.useState(false);
    const handleOpen = () => setOpenModal(true);
    const handleClose = () => setOpenModal(false);

    const componentRef = React.useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${processTemplate.displayName}-${expandedProcess.name}-${new Date().toLocaleDateString('en-uk')}`,
    });

    const getProcessFiles = (): IFile[] => {
        return processTemplate.steps
            .map((propertyKey) => {
                const propertySchema = processTemplate.steps.details[propertyKey];
                const propertyValue = expandedProcess.steps.details[propertyKey];
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

    const files = getProcessFiles().filter(
        (file) => !isVideoOrAudio(file.type) && !isUnsupported(file.type) && file.extension !== 'pptx' && !file.name.includes('txt'),
    );

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
            <IconButtonWithPopover popoverText={i18next.t('entityPage.print.header')} iconButtonProps={{ onClick: handleOpen }}>
                <img src="/icons/print.svg" />
            </IconButtonWithPopover>
            <div style={{ display: 'none' }}>
                <style>{getPageMargins()}</style>

                <ComponentToPrint
                    ref={componentRef}
                    processTemplate={processTemplate}
                    expandedProcess={expandedProcess}
                    options={{ showSummary, showFiles }}
                    filesToPrint={files}
                    isFilesLoading={isFilesLoading}
                    setIsFilesLoading={setIsFilesLoading}
                    setIsFilesError={setIsFilesError}
                />
            </div>
            <PrintOptionsDialog
                open={openModal}
                handleClose={handleClose}
                files={files}
                isFilesLoading={isFilesLoading}
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
