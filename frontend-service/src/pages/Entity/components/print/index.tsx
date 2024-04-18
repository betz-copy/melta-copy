import i18next from 'i18next';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { IMongoCategory } from '../../../../interfaces/categories';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { ComponentToPrint } from './ComponentToPrint';
import { PrintOptionsDialog } from './PrintOptionsDialog';
import { IConnectionTemplateOfExpandedEntity } from '../..';
import { IFile } from '../../../../interfaces/preview';

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    categoriesWithConnectionsTemplates: {
        category: IMongoCategory;
        connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    }[];
}> = ({ entityTemplate, expandedEntity, categoriesWithConnectionsTemplates, connectionsTemplates }) => {
    console.log({ expandedEntity });

    const [openModal, setOpenModal] = React.useState(false);

    const handleOpen = () => setOpenModal(true);
    const handleClose = () => setOpenModal(false);

    const componentRef = React.useRef(null);

    const [files, setFiles] = React.useState<IFile[]>([]);
    const [selectedFiles, setSelectedFiles] = React.useState(files);
    console.log({ selectedFiles });

    const [selected, setSelected] = React.useState(connectionsTemplates);
    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = React.useState(false);

    const [isLoading, setIsLoading] = React.useState<Set<string>>();
    const [isError, setIsError] = React.useState(false);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
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
                    filesSettings={{ isLoading, setIsLoading, setIsError }}
                    options={{ showDate, showDisabled, showEntityDates, showEntityFiles: selectedFiles.length !== 0, showPreviewPropertiesOnly }}
                />
            </div>
            {openModal && (
                <PrintOptionsDialog
                    open={openModal}
                    expandedEntity={expandedEntity}
                    entityTemplate={entityTemplate}
                    connectionsTemplates={connectionsTemplates}
                    handleClose={handleClose}
                    selected={selected}
                    setSelected={setSelected}
                    files={files}
                    setFiles={setFiles}
                    selectedFiles={selectedFiles}
                    setSelectedFiles={setSelectedFiles}
                    filesSettings={{
                        isLoading: isLoading && isLoading.size > 0,
                        setIsLoading,
                        isError,
                        setIsError,
                    }}
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
            )}
        </>
    );
};

export { Print };
