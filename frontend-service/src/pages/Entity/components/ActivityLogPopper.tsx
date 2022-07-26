import React from 'react';
import { Box, Divider, IconButton, Popper, Typography, Grid } from '@mui/material';
import { CloseSharp } from '@mui/icons-material';
import i18next from 'i18next';
import Slide from '@mui/material/Slide';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { Activities } from './Activities';

const ActivityLogPopper: React.FC<{
    open: boolean;
    anchorEl: null | HTMLElement;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    entityId: string;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ open, anchorEl, setOpen, entityId, entityTemplate }) => {
    return (
        <Popper open={open} anchorEl={anchorEl} transition>
            {({ TransitionProps }) => (
                <Slide {...TransitionProps} direction="right">
                    <Box
                        minWidth="250px"
                        bgcolor="#fcfeff"
                        width="20vw"
                        marginTop="1vh"
                        marginRight="0.3vw"
                        height="93.5vh"
                        borderRadius="15px"
                        boxShadow="4px 4px 4px 7px #0000000D"
                    >
                        <Grid container alignItems="center">
                            <IconButton sx={{ marginLeft: '0.5rem' }} onClick={() => setOpen(false)}>
                                <CloseSharp />
                            </IconButton>
                            <Typography
                                style={{
                                    color: '#1976d2',
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
                </Slide>
            )}
        </Popper>
    );
};

export default ActivityLogPopper;
