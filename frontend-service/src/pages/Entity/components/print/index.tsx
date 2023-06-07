import { FileDownloadOutlined } from '@mui/icons-material';
import i18next from 'i18next';
import React from 'react';
import { useReactToPrint } from 'react-to-print';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { IMongoCategory } from '../../../../interfaces/categories';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated } from '../../../../interfaces/relationshipTemplates';
import { ComponentToPrint } from './ComponentToPrint';
import { PrintOptionsDialog } from './PrintOptionsDialog';

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    relevantRelationshipTemplates: IMongoRelationshipTemplatePopulated[];
    categoriesWithRelationshipTemplates: (IMongoCategory & {
        relationshipTemplates: IMongoRelationshipTemplatePopulated[];
    })[];
}> = ({ entityTemplate, expandedEntity, categoriesWithRelationshipTemplates, relevantRelationshipTemplates }) => {
    const [openModal, setOpenModal] = React.useState(false);
    const handleOpen = () => setOpenModal(true);
    const handleClose = () => setOpenModal(false);

    const componentRef = React.useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`,
    });

    const [selected, setSelected] = React.useState(relevantRelationshipTemplates);
    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);

    const getPageMargins = () => {
        // eslint-disable-next-line quotes
        return `@page { margin: 15px 10px 15px 10px !important; }`;
    };

    return (
        <>
            <IconButtonWithPopover popoverText={i18next.t('entityPage.print.header')} iconButtonProps={{ onClick: handleOpen }}>
                <FileDownloadOutlined color="primary" fontSize="inherit" />
            </IconButtonWithPopover>
            <div style={{ display: 'none' }}>
                <style>{getPageMargins()}</style>

                <ComponentToPrint
                    ref={componentRef}
                    entityTemplate={entityTemplate}
                    expandedEntity={expandedEntity}
                    relationshipTemplatesToPrint={selected}
                    options={{ showDate, showDisabled, showEntityDates }}
                />
            </div>
            <PrintOptionsDialog
                open={openModal}
                relevantRelationshipTemplates={relevantRelationshipTemplates}
                handleClose={handleClose}
                selected={selected}
                setSelected={setSelected}
                categoriesWithRelationshipTemplates={categoriesWithRelationshipTemplates}
                onClick={handlePrint}
                options={{ setShowDate, showDate, showDisabled, setShowDisabled, showEntityDates, setShowEntityDates }}
            />
        </>
    );
};

export { Print };
