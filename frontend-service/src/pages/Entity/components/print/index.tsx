import i18next from 'i18next';
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Box } from '@mui/material';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { IMongoCategory } from '../../../../interfaces/categories';
import { IEntityExpanded, IFile } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { ComponentToPrint } from './ComponentToPrint';
import { PrintOptionsDialog } from './PrintOptionsDialog';
import { IConnectionTemplateOfExpandedEntity } from '../..';
import { getFileName } from '../../../../utils/getFileName';
import { getFileExtension, getPreviewContentType } from '../../../../utils/getFileType';
import { isUnsupported, isVideoOrAudio } from '../../../../common/FilePreview/PreviewDialog';
import { useFilePreview } from '../../../../utils/useFilePreview';

const FileData: React.FC<{
    file: IFile;
    isFilesLoading: Set<number> | undefined;
    setIsFilesLoading: React.Dispatch<React.SetStateAction<Set<number> | undefined>>;
    index: number;
    setIsFilesError: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ file, isFilesLoading, setIsFilesLoading, index, setIsFilesError }) => {
    const filePreview = useFilePreview(file.id, file.type);
    const { data, refetch, isLoading, isError } = filePreview;
    if (!data) {
        refetch();
    }

    if (isError) {
        setIsFilesError(true);
    }

    if (isLoading && !isFilesLoading?.has(index)) {
        const newLoadingSet = new Set(isFilesLoading);
        newLoadingSet.add(index);
        setIsFilesLoading(newLoadingSet);
    }
    if (!isLoading && isFilesLoading?.has(index)) {
        const newLoadingSet = new Set(isFilesLoading);
        newLoadingSet.delete(index);
        setIsFilesLoading(newLoadingSet);
    }
    // return <FileToPrint file={file} key={`${file.id}${file.name}`} filePreview={filePreview} />;
    return <Box key={`${file.id}${file.name}`}>{data}</Box>; // Render the file content inside a <div>
};

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
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

    const getEntityFiles = (): IFile[] => {
        return entityTemplate.propertiesOrder
            .map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = expandedEntity.entity.properties[propertyKey];
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

    const files = getEntityFiles().filter((file) => !isVideoOrAudio(file.type) && !isUnsupported(file.type) && !file.name.includes('txt'));

    const [selected, setSelected] = React.useState(connectionsTemplates);
    const [selectedFiles, setSelectedFiles] = React.useState(files);
    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = React.useState(false);

    const [isFilesLoading, setIsFilesLoading] = React.useState<Set<number>>();
    const [isFilesError, setIsFilesError] = React.useState(false);

    const documentToPrint = async () => {
        if (selectedFiles.length === 0) {
            return componentRef.current;
        }
        const currentComponent = componentRef.current;
        const document: React.ReactNode[] = [];

        if (currentComponent) {
            document.push(currentComponent);
        }

        selectedFiles.forEach((file, index) => {
            document.push(
                <FileData
                    file={file}
                    isFilesLoading={isFilesLoading}
                    setIsFilesLoading={setIsFilesLoading}
                    index={index}
                    setIsFilesError={setIsFilesError}
                />,
            );
        });
        console.log({ document });

        componentRef.current = document;

        return document;
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onBeforePrint: documentToPrint,
        documentTitle: `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`,
    });

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
                    entityTemplate={entityTemplate}
                    expandedEntity={expandedEntity}
                    connectionsTemplatesToPrint={selected}
                    filesToPrint={selectedFiles}
                    isFilesLoading={isFilesLoading}
                    setIsFilesLoading={setIsFilesLoading}
                    setIsFilesError={setIsFilesError}
                    options={{ showDate, showDisabled, showEntityDates, showEntityFiles: selectedFiles.length !== 0, showPreviewPropertiesOnly }}
                />
            </div>
            <PrintOptionsDialog
                open={openModal}
                expandedEntity={expandedEntity}
                connectionsTemplates={connectionsTemplates}
                handleClose={handleClose}
                selected={selected}
                setSelected={setSelected}
                files={files}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                isFilesLoading={isFilesLoading}
                isFilesError={isFilesError}
                categoriesWithConnectionsTemplates={categoriesWithConnectionsTemplates}
                onClick={handlePrint}
                options={{
                    setShowDate,
                    showDate,
                    showDisabled,
                    setShowDisabled,
                    showEntityDates,
                    setShowEntityDates,
                    showPreviewPropertiesOnly,
                    setShowPreviewPropertiesOnly,
                }}
            />
        </>
    );
};

export { Print };
