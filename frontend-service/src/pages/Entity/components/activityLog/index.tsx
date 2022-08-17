import React, { useEffect } from 'react';
import { HistoryRounded } from '@mui/icons-material';
import i18next from 'i18next';
import IconButtonWithPopoverText from '../../../../common/IconButtonWithPopover';
import ActivityLogPopper from './ActivityLogPopper';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

const ActivityLog: React.FC<{ expandedEntity: IEntityExpanded; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    expandedEntity,
    entityTemplate,
}) => {
    const [openPopper, setOpenPopper] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setOpenPopper((previousOpen) => !previousOpen);
    };
    useEffect(() => {
        setOpenPopper(false);
    }, [expandedEntity.entity.properties._id]);

    return (
        <>
            <IconButtonWithPopoverText popoverText={i18next.t('entityPage.activityLog.header')} iconButtonProps={{ onClick: handleClick }}>
                <HistoryRounded color="primary" fontSize="inherit" />
            </IconButtonWithPopoverText>
            <ActivityLogPopper
                open={openPopper}
                anchorEl={anchorEl}
                setOpen={setOpenPopper}
                entityId={expandedEntity.entity.properties._id}
                entityTemplate={entityTemplate}
            />
        </>
    );
};

export { ActivityLog };
