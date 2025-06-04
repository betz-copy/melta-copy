import React from 'react';
import { Card, CardContent, Typography, Grid, Link } from '@mui/material';
import i18next from 'i18next';
import hebrew from '../../../i18n/hebrew';
import { getPropertyColor } from '../../../common/EntityProperties';
import { Chat as ChatIcon, Mail as MailIcon } from '@mui/icons-material';

const ContactInfoCard: React.FC = () => {
    const contacts = hebrew.simbaClientPage.contactInfoCard.contacts;
    const propertyTitleColor = getPropertyColor('propertyKey', [], undefined, 'normal', '#9398C2');
    const propertyValueColor = getPropertyColor('propertyKey', [], undefined, 'normal', '#53566E');

    return (
        <>
            <Typography variant="h6" align="center" fontWeight={700} color="primary" gutterBottom sx={{ fontSize: '1.1rem' }}>
                {i18next.t('simbaClientPage.contactInfoCard.title')}
            </Typography>
            <Card sx={{ mt: 1, borderRadius: '16px', boxShadow: '-2px 2px 6px 0px #1e27754d' }}>
                <CardContent>
                    <Grid container direction="column" spacing={1}>
                        {contacts.map((contact, idx) => (
                            <Grid
                                item
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 6,
                                    borderRadius: '8px',
                                    mb: 1,
                                    px: 2,
                                    py: 1,
                                }}
                            >
                                <Grid item container display="flex" direction="row" justifyContent="space-between" gap={1}>
                                    <Typography color={propertyTitleColor}>{contact.role}</Typography>
                                    <Grid item justifyContent="start" alignItems="start" display="flex">
                                        <Typography color={propertyValueColor}>{contact.name}</Typography>
                                    </Grid>
                                </Grid>
                                <Grid item display="flex" direction="row" gap={1}>
                                    <Link href={contact.hichatLink}>
                                        <ChatIcon />
                                    </Link>
                                    <Link href={contact.mailLink} style={{ textDecoration: 'none' }}>
                                        <MailIcon />
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
