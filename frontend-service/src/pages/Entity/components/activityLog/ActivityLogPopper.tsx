import React from 'react';
import { Box, Divider, IconButton, Popper, Typography, Grid, ClickAwayListener } from '@mui/material';
import { CloseSharp } from '@mui/icons-material';
import i18next from 'i18next';
import Slide from '@mui/material/Slide';
import { Activities } from './Activities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

const ActivityLogPopper: React.FC<{
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    entityId: string;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ open, setOpen, entityId, entityTemplate }) => {
    return (
        <Popper open={open} transition>
            {({ TransitionProps }) => (
                <Slide {...TransitionProps} direction="right">
                    <div style={{ paddingTop: '3.8rem', paddingLeft: '1.1rem' }}>
                        <ClickAwayListener onClickAway={() => setOpen(false)}>
                            <Box
                                minWidth="250px"
                                bgcolor="#fcfeff"
                                width="20vw"
                                height="93.5vh"
                                borderRadius="15px"
                                boxShadow="4px 4px 4px 7px #0000000D"
                                position="sticky"
                            >
                                <Grid container alignItems="center">
                                    <IconButton sx={{ marginLeft: '0.5rem' }} onClick={() => setOpen(false)}>
                                        <CloseSharp />
                                    </IconButton>
                                    <Typography
                                        style={{
                                            color: '#225AA7',
                                            fontWeight: 400,
                                            fontFamily: 'Rubik',
                                        }}
                                        component="h6"
                                        variant="h6"
                                        paddingLeft="0.7rem"
                                    >
                                        {i18next.t('entityPage.activityLog.header')}
                                    </Typography>
                                </Grid>

                                <Divider sx={{ marginLeft: '10px', marginRight: '10px' }} />

                                <Activities entityId={entityId} entityTemplate={entityTemplate} />
                            </Box>
                        </ClickAwayListener>
                    </div>
                </Slide>
            )}
        </Popper>
    );
};

export default ActivityLogPopper;
