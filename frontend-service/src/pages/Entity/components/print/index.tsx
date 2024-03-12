import i18next from 'i18next';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
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
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`,
    });

    const getEntityFiles = (): IFile[] => {
        return entityTemplate.propertiesOrder
            .map((propertyKey) => {
                const propertySchema = entityTemplate.properties.properties[propertyKey];
                const propertyValue = expandedEntity.entity.properties[propertyKey];
                if (propertySchema.format === 'fileId') {
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

    const files = getEntityFiles().filter(
        (file) => !isVideoOrAudio(file.type) && !isUnsupported(file.type) && file.extension !== 'pptx' && !file.name.includes('txt'),
    );

    const [selected, setSelected] = React.useState(connectionsTemplates);
    const [selectedFiles, setSelectedFiles] = React.useState(files);
    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = React.useState(false);

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
