import { History } from '@mui/icons-material';
import { Button } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { IEntityExpanded, IMongoEntityTemplatePopulated } from '@microservices/shared-interfaces';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import PopperSidebar from '../../../../common/PopperSidebar';
import { ActivitiesContent } from './ActivitiesContent';

const ActivityLog: React.FC<{ expandedEntity?: IEntityExpanded; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    expandedEntity,
    entityTemplate,
}) => {
    const [openPopper, setOpenPopper] = React.useState(false);
    const entityId = expandedEntity?.entity.properties._id || '';
    useEffect(() => {
        setOpenPopper(false);
    }, [entityId]);

    return (
        <>
            <MeltaTooltip title={String(i18next.t('entityPage.activityLog.header'))}>
                <Button
                    variant="contained"
                    startIcon={<History />}
                    onClick={() => setOpenPopper((previousOpen) => !previousOpen)}
                    sx={{ marginLeft: '1rem' }}
                >
                    {String(i18next.t('entityPage.activityLog.header'))}
                </Button>
            </MeltaTooltip>

            <PopperSidebar open={openPopper} setOpen={setOpenPopper} title={i18next.t('entityPage.activityLog.header')} side="left">
                <ActivitiesContent expandedEntity={expandedEntity} entityTemplate={entityTemplate} />
            </PopperSidebar>
        </>
    );
};

export { ActivityLog };
