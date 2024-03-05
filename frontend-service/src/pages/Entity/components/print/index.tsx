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

const Print: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    categoriesWithConnectionsTemplates: {
        category: IMongoCategory;
        connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    }[];
}> = ({ entityTemplate, expandedEntity, categoriesWithConnectionsTemplates, connectionsTemplates }) => {
    console.log({ entityTemplate });
    console.log({ expandedEntity });

    const [openModal, setOpenModal] = React.useState(false);
    const handleOpen = () => setOpenModal(true);
    const handleClose = () => setOpenModal(false);

    const componentRef = React.useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${entityTemplate.category.displayName}-${entityTemplate.displayName}-${new Date().toLocaleDateString('en-uk')}`,
    });

    const [selected, setSelected] = React.useState(connectionsTemplates);
    const [showDate, setShowDate] = React.useState(true);
    const [showDisabled, setShowDisabled] = React.useState(true);
    const [showEntityDates, setShowEntityDates] = React.useState(true);
    const [showEntityFiles, setShowEntityFiles] = React.useState(true);

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
                    options={{ showDate, showDisabled, showEntityDates, showEntityFiles }}
                />
            </div>
            <PrintOptionsDialog
                open={openModal}
                expandedEntity={expandedEntity}
                connectionsTemplates={connectionsTemplates}
                handleClose={handleClose}
                selected={selected}
                setSelected={setSelected}
                categoriesWithConnectionsTemplates={categoriesWithConnectionsTemplates}
                onClick={handlePrint}
                options={{
                    setShowDate,
                    showDate,
                    showDisabled,
                    setShowDisabled,
                    showEntityDates,
                    setShowEntityDates,
                    showEntityFiles,
                    setShowEntityFiles,
                }}
            />
        </>
    );
};

export { Print };
