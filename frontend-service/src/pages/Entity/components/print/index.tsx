import { PrintOutlined } from '@mui/icons-material';
import { Button, ThemeProvider } from '@mui/material';
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
import { useQuery } from 'react-query';
import { getTreeForPrintById } from '../../../../services/entitiesService';

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

    const [showDisabled, setShowDisabled] = useState<boolean>(true);
    const [showEntityDates, setShowEntityDates] = useState<boolean>(true);
    const [showPreviewPropertiesOnly, setShowPreviewPropertiesOnly] = useState<boolean>(false);

    const [selectedRelationShipIds, setSelectedRelationShipIds] = useState<string[]>([]);
    const [shouldPrint, setShouldPrint] = useState<boolean>(false);

    const { data, refetch, isLoading } = useQuery({
        queryKey: ['getExpandedEntityPrint', expandedEntity.entity.properties._id, selectedRelationShipIds.join(',')],
        queryFn: () => {
            const templateIds: Set<string> = new Set();
            const relIds: Set<string> = new Set();
            let maxDepth: number = 0;

            selectedRelationShipIds.forEach((selected) => {
                const [relMongoId, _rel, depth, source, dest] = selected.split('&');
                templateIds.add(source);
                templateIds.add(dest);
                relIds.add(relMongoId);

                if (+depth > maxDepth) maxDepth = +depth;
            });
            return getTreeForPrintById(
                expandedEntity.entity.properties._id,
                { [expandedEntity.entity.properties._id]: { maxLevel: maxDepth + 1 } },
                {
                    disabled: false, // TODO
                    templateIds: [...templateIds.values()],
                    relationshipIds: [...relIds.values()],
                },
            );
        },
        enabled: false,
    });

    const handleClose = () => {
        setOpenModal(false);
    };

    const handleOpen = async () => {
        setSelectedRelationShipIds([]);
        setOpenModal(true);
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`,
        bodyClass: 'print-body',
    } as UseReactToPrintOptions);

    useEffect(() => {
        if (shouldPrint) refetch();
    }, [shouldPrint, refetch]);

    useEffect(() => {
        if (data && !isLoading) {
            handlePrint();
            setShouldPrint(false);
        }
    }, [data, isLoading, handlePrint]);

    const getPageMargins = '@page { margin: 15px 10px 15px 10px !important; }';

    const options = {
        disabled: { show: showDisabled, set: setShowDisabled, label: 'entityPage.print.showDisabled' },
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

            <div style={{ display: 'none' }}>
                <style>{getPageMargins}</style>
                <ThemeProvider theme={lightTheme}>
                    <ComponentToPrint
                        ref={componentRef}
                        entityTemplate={entityTemplate}
                        entity={data}
                        filesToPrint={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        setFilesLoadingStatus={setFilesLoadingStatus}
                        options={{ showDisabled, showEntityDates, showEntityFiles: !!selectedFiles.length, showPreviewPropertiesOnly }}
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
                    selectedRelationShipIds={selectedRelationShipIds}
                />
            )}
        </>
    );
};

export { Print };
