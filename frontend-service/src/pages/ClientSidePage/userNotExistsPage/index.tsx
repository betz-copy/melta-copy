import React from 'react';
import { Grid, IconButton, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import hebrew from '../../../i18n/hebrew';
import i18next from 'i18next';
import { useWorkspaceStore } from '../../../stores/workspace';

const UserNotExistsPage: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { clientSideWorkspaceName } = workspace.metadata?.clientSide || {};
    const { contacts } = hebrew.clientSidePage[clientSideWorkspaceName].contactInfoCard;

    return (
        <Grid container flexDirection="column" height="100vh" width="100%" padding="50px" sx={{ backgroundColor: 'white' }} flexWrap="nowrap">
            <Grid item container height="100%">
                <Grid
                    item
                    container
                    flexDirection="column"
                    height="100%"
                    width="60%"
                    paddingTop="150px"
                    paddingX="70px"
                    sx={{ backgroundColor: '#F0F2F7', borderRadius: '15px 0 0 15px' }}
                >
                    <Grid item>
                        <Typography fontSize="24px" color="#1E2775" fontWeight="300">
                            {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.title`)}
                        </Typography>
                        <Typography fontSize="40px" color="#1E2775" fontWeight="600">
                            {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.subTitle`)}
                        </Typography>
                        <Typography sx={{ marginTop: '40px' }} fontWeight="500" fontSize="20px" color="#1E2775">
                            {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.texts.whatWouldYouLikeToDo`)}
                        </Typography>
                        <Grid item container marginTop="20px" flexWrap="nowrap" gap="25px">
                            <Grid item marginTop="4px">
                                <img src="/icons/car-key.svg"></img>
                            </Grid>
                            <Grid item container flexDirection="column">
                                <Grid item>
                                    <Typography fontWeight="400" fontSize="20px" color="#1E2775">
                                        {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.texts.userHaveUnactiveLicense.title`)}
                                    </Typography>
                                </Grid>
                                <Grid item marginTop="7px">
                                    <Typography fontWeight="400" fontSize="16px" color="#53566E">
                                        {i18next.t(
                                            `clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.texts.userHaveUnactiveLicense.description`,
                                        )}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item container flexWrap="nowrap" gap="25px" marginTop="15px">
                            <Grid item marginTop="4px">
                                <img src="/icons/car-key.svg"></img>
                            </Grid>
                            <Grid item container flexDirection="column">
                                <Grid item>
                                    <Typography fontWeight="400" fontSize="20px" color="#1E2775">
                                        {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.texts.userDontHaveLicense.title`)}
                                    </Typography>
                                </Grid>
                                <Grid item marginTop="7px">
                                    <Typography fontWeight="400" fontSize="16px" color="#53566E">
                                        {i18next.t(
                                            `clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.texts.userDontHaveLicense.description`,
                                        )}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid container item gap="20px" flexWrap="nowrap" paddingTop="20px" marginLeft="45px">
                            <Grid item width="fit-content">
                                <Typography width="fit-content" fontWeight="500" fontSize="16px" color="#1E2775" sx={{ textWrap: 'nowrap' }}>
                                    {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.recieveLicenseRequest`)}
                                </Typography>
                            </Grid>
                            <Grid item container>
                                <a href="/files/temp-try2.pdf" download="מכתב-נחיצות.pdf">
                                    <Grid container item alignItems="center">
                                        <Typography fontWeight="400" fontSize="16px" color="#1E2775">
                                            {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.neededLetter`)}
                                        </Typography>
                                        <FileDownloadOutlinedIcon sx={{ width: '20px', height: '20px', fontWeight: '400' }} color="primary" />
                                    </Grid>
                                </a>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid
                    item
                    height="100%"
                    width="40%"
                    sx={{
                        backgroundColor: '#4752B6',
                        borderRadius: '0 15px 15px 0',
                        backgroundImage: `url(/clientSide/${clientSideWorkspaceName}/logo-ltr.svg)`,
                        backgroundSize: '95% 95%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPositionX: 'center',
                        backgroundPositionY: 'center',
                    }}
                    alignContent="center"
                />
            </Grid>
            <Grid item container alignItems="center" height="80px" flexWrap="nowrap" justifyContent="space-between" paddingX="150px" marginTop="20px">
                <Grid item>
                    <img height="60px" src={`/clientSide/${clientSideWorkspaceName}/small-logo.svg`} style={{ marginBottom: '25px' }} />
                </Grid>
                <Grid item>
                    <Typography fontWeight="500" fontSize="14px" color="#1E2775" sx={{ textWrap: 'nowrap' }}>
                        {i18next.t(`clientSidePage.${clientSideWorkspaceName}.userNotExistsPage.forMoreInfo`)}
                    </Typography>
                </Grid>
                {contacts.map((contact) => (
                    <Grid key={contact.name} item container alignItems="center" width="fit-content" gap="10px">
                        <Grid item>
                            <Typography fontWeight="400" fontSize="14px" color="#787C9E">
                                {contact.role}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography fontWeight="400" fontSize="14px" color="#1E2775">
                                {contact.name}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <IconButton>
                                <img src="/icons/hi-chat-icon.svg"></img>
                            </IconButton>
                            <IconButton>
                                <img src="/icons/outlook-icon.svg"></img>
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}
            </Grid>
        </Grid>
    );
};

export default UserNotExistsPage;
