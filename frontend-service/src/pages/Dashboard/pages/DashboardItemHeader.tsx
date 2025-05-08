import { Check, Close, Delete, Edit } from '@mui/icons-material';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Link } from 'wouter';
import { FormikProps } from 'formik';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { useDarkModeStore } from '../../../stores/darkMode';
import { CardMenu } from '../../SystemManagement/components/CardMenu';

interface DashboardItemHeaderProps {
    title: string;
    readonly: boolean;
    edit: boolean;
    backPath: { title: string; path: string };
    onDelete: () => void;
    formikRef?: React.RefObject<FormikProps<any>>;
}

const DashboardItemHeader: React.FC<DashboardItemHeaderProps> = ({ title, readonly, edit, backPath, onDelete, formikRef }) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    return (
        <Box
            bgcolor={darkMode ? '#131313' : '#fcfeff'}
            height="3.6rem"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2rem"
            paddingBottom="0.4rem"
            boxShadow="-2px 2px 6px 0px #1E277533"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="sticky"
            style={{ top: 0, right: 0, zIndex: 1 }}
        >
            <Box display="flex" alignItems="center" gap="15px">
                <Grid item>
                    <Link href={backPath.path} style={{ textDecoration: 'none' }}>
                        <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="14px">
                            {backPath.title}
                        </Typography>
                    </Link>
                </Grid>
                <Grid item>
                    <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="14px">
                        {'>'}
                    </Typography>
                </Grid>
                <Grid item>
                    <Typography color={theme.palette.primary.main} fontWeight="600" component="h4" variant="h4" fontSize="24px">
                        {title}
                    </Typography>
                </Grid>
            </Box>

            <Box display="flex" alignItems="center" gap="10px">
                {readonly ? (
                    <IconButtonWithPopover
                        popoverText="הוספת כרטיסייה"
                        iconButtonProps={{
                            onClick: () => console.log('hi'),
                        }}
                        style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '100px', height: '35px' }}
                    >
                        <Edit htmlColor="white" />
                        <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                            עריכה
                        </Typography>
                    </IconButtonWithPopover>
                ) : (
                    <>
                        <IconButtonWithPopover
                            popoverText="ביטול"
                            iconButtonProps={{
                                // onClick: () => {
                                //     if (formikRef?.current) formikRef.current.resetForm();
                                // },
                                type: 'reset',
                            }}
                            style={{
                                background: '#fcfeff',
                                borderRadius: '7px',
                                border: `1px solid ${theme.palette.primary.main}`,
                                width: '100px',
                                height: '35px',
                            }}
                        >
                            <Close htmlColor={theme.palette.primary.main} />
                            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: theme.palette.primary.main }}>
                                ביטול
                            </Typography>
                        </IconButtonWithPopover>
                        <IconButtonWithPopover
                            popoverText="שמירה"
                            iconButtonProps={{
                                // onClick: () => {
                                //     if (formikRef?.current) formikRef.current.submitForm();
                                // },
                                type: 'submit',
                            }}
                            style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '100px', height: '35px' }}
                        >
                            <Check htmlColor="white" />
                            <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                                שמירה
                            </Typography>
                        </IconButtonWithPopover>
                    </>
                )}

                {edit && (
                    <Box
                        style={{
                            color: theme.palette.primary.main,
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <CardMenu onDeleteClick={() => setDeleteDialogOpen(true)} optionsIconStyle={{ color: theme.palette.primary.main }} />
                    </Box>
                )}
            </Box>
            <AreYouSureDialog
                open={deleteDialogOpen}
                title="בחרת למחוק את התרשים"
                body="התרשים ימחק מהמסך הראשי עבורך ועבור כל מי שמורשה לצפות בו. למחוק את התרשים?"
                handleClose={() => setDeleteDialogOpen(false)}
                noTitle="חזרה לעריכה"
                yesTitle={
                    <Grid container alignItems="center" justifyContent="center" style={{ gap: '5px' }}>
                        <Delete />
                        מחיקה
                    </Grid>
                }
                onYes={onDelete}
            />
        </Box>
    );
};

export { DashboardItemHeader };
