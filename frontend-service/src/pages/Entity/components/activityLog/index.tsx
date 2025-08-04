import { History } from '@mui/icons-material';
import { Button, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import PopperSidebar from '../../../../common/PopperSidebar';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { ActivitiesContent } from './ActivitiesContent';

const ActivityLog: React.FC<{ expandedEntity?: IEntityExpanded; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    expandedEntity,
    entityTemplate,
}) => {
    const theme = useTheme();
    const [openPopper, setOpenPopper] = useState(false);
    const entityId = expandedEntity?.entity.properties._id || '';
    useEffect(() => {
        setOpenPopper(false);
    }, [entityId]);

    return (
        <>
            <MeltaTooltip title={i18next.t('entityPage.activityLog.header')}>
                <Button
                    variant="contained"
                    startIcon={<History />}
                    onClick={() => setOpenPopper((previousOpen) => !previousOpen)}
                    sx={{ marginLeft: '1rem', color: 'white' }}
                >
                    {i18next.t('entityPage.activityLog.header')}
                </Button>
            </MeltaTooltip>

            <PopperSidebar
                open={openPopper}
                setOpen={setOpenPopper}
                title={
                    <Typography color={theme.palette.primary.main} fontFamily="Rubik" component="h5" variant="h5" marginX="auto" fontWeight="bold">
                        {i18next.t('entityPage.activityLog.header')}
                    </Typography>
                }
                side="left"
            >
                <ActivitiesContent expandedEntity={expandedEntity} entityTemplate={entityTemplate} />
            </PopperSidebar>
        </>
    );
};

export { ActivityLog };
