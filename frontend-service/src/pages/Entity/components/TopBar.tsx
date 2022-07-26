import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { HistoryRounded } from '@mui/icons-material';
import i18next from 'i18next';
import IconButtonWithPopoverText from '../../../common/IconButtonWithPopover';
import ActivityLogPopper from './ActivityLogPopper';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const EntityTopBar: React.FC<{ entityId: string; entityTemplate: IMongoEntityTemplatePopulated }> = ({ entityId, entityTemplate }) => {
    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setOpen((previousOpen) => !previousOpen);
    };

    useEffect(() => {
        setOpen(false);
    }, [entityId]);

    return (
        <Box
            bgcolor="#fcfeff"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2.5rem"
            paddingBottom="0.4rem"
            boxShadow="0px 4px 4px #0000000D"
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                    style={{
                        color: '#1976d2',
                        fontWeight: '800',
                    }}
                    component="h4"
                    variant="h4"
                >
                    {entityTemplate.category.displayName}
                </Typography>

                <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                    /
                </Typography>

                <Typography style={{ paddingBottom: '2px' }} variant="h4" fontSize="28px" color="rgb(25, 118, 210)">
                    {entityTemplate.displayName}
                </Typography>
            </Box>
            <IconButtonWithPopoverText popoverText={i18next.t('entityPage.activityLog.header')} iconButtonProps={{ onClick: handleClick }}>
                <HistoryRounded color="primary" fontSize="inherit" />
            </IconButtonWithPopoverText>
            <ActivityLogPopper open={open} anchorEl={anchorEl} setOpen={setOpen} entityId={entityId} entityTemplate={entityTemplate} />
        </Box>
    );
};

export { EntityTopBar };
