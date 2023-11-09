import React from 'react';
import { Card, CardHeader, Grid, IconButton } from '@mui/material';
import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import { BlueTitle } from '../../BlueTitle';
import IconButtonWithPopover from '../../IconButtonWithPopover';

interface EntityCardProps {
    customActionButton?: {
        icon: React.ReactNode;
        onClick: () => void;
        popoverText?: string;
    };
    customCardStyle?: React.CSSProperties;
    variant?: 'outlined' | 'elevation';
}
const UnknownEntityCard: React.FC<EntityCardProps> = ({ customActionButton, customCardStyle, variant = 'outlined' }) => {
    return (
        <Card raised variant={variant} sx={{ overflowX: 'auto', borderRadius: '15px', ...customCardStyle }}>
            <CardHeader
                avatar={
                    <Grid>
                        <AppRegistrationIcon sx={{ fontSize: '40px' }} />
                    </Grid>
                }
                action={
                    <Grid container>
                        {customActionButton &&
                            (customActionButton.popoverText ? (
                                <IconButtonWithPopover
                                    popoverText={customActionButton.popoverText!}
                                    iconButtonProps={{
                                        size: 'large',
                                        onClick: (event) => {
                                            event.stopPropagation();
                                            customActionButton.onClick();
                                        },
                                    }}
                                >
                                    {customActionButton.icon}
                                </IconButtonWithPopover>
                            ) : (
                                <IconButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        customActionButton.onClick();
                                    }}
                                    size="large"
                                >
                                    {customActionButton.icon}
                                </IconButton>
                            ))}
                    </Grid>
                }
                title={<BlueTitle title="לא ידוע" component="h5" variant="h5" />}
                subheader="ישות זו נמחקה"
                sx={{ '& .MuiCardHeader-action': { marginRight: '0px' } }} // default is -8px
            />
        </Card>
    );
};

export default UnknownEntityCard;
