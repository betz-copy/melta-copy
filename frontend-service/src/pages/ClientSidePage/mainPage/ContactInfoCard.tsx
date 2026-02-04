import { Card, CardContent, Grid, IconButton, Link, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import hebrew from '../../../i18n/hebrew';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getPropertyColor } from '../../../utils/entityProperties';

const ContactInfoCard: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { clientSideWorkspaceName } = workspace.metadata?.clientSide || {};
    const contacts: { role: string; name: string; hichatLink: string; mailLink: string }[] =
        hebrew.clientSidePage[clientSideWorkspaceName].contactInfoCard.contacts;
    const propertyTitleColor = getPropertyColor('propertyKey', [], undefined, 'normal', '#9398C2');
    const propertyValueColor = getPropertyColor('propertyKey', [], undefined, 'normal', '#53566E');

    return (
        <>
            <Typography variant="h6" align="center" fontWeight={700} color="primary" gutterBottom sx={{ fontSize: '1.1rem' }}>
                {i18next.t(`clientSidePage.${clientSideWorkspaceName}.contactInfoCard.title`)}
            </Typography>
            <Card sx={{ mt: 1, borderRadius: '16px', boxShadow: '-2px 2px 6px 0px #1e27754d' }}>
                <CardContent>
                    <Grid container direction="column" spacing={1}>
                        {contacts.map((contact) => (
                            <Grid
                                key={contact.name}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 6,
                                    borderRadius: '8px',
                                    mb: 1,
                                    px: 2,
                                }}
                            >
                                <Grid container display="flex" direction="row" justifyContent="space-between" gap={1}>
                                    <Typography fontSize="14px" color={propertyTitleColor}>
                                        {contact.role}
                                    </Typography>
                                    <Grid justifyContent="start" alignItems="start" display="flex">
                                        <Typography fontSize="14px" color={propertyValueColor}>
                                            {contact.name}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Grid display="flex" gap={1}>
                                    <Link href={contact.hichatLink}>
                                        <IconButton>
                                            <img src="/icons/hi-chat-icon.svg" alt="hi-chat"></img>
                                        </IconButton>
                                    </Link>
                                    <Link href={contact.mailLink} style={{ textDecoration: 'none' }}>
                                        <IconButton>
                                            <img src="/icons/outlook-icon.svg" alt="outlook"></img>
                                        </IconButton>
                                    </Link>
                                </Grid>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        </>
    );
};

export default ContactInfoCard;
