import React, { Fragment } from 'react';
import { TopBarGrid } from '../../common/TopBar';
import { BlueTitle } from '../../common/BlueTitle';
import { Box, CircularProgress, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Check as SaveIcon, Close as CancelIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useQueryClient } from 'react-query';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { Swap } from '../../common/Swap';
import { FormikProps } from 'formik';
import { IBasicGantt } from '../../interfaces/gantts';
import { CopyUrlButton } from '../../common/CopyUrlButton';
import { environment } from '../../globals';

const { ganttSettings } = environment;

interface IGanttTopBar {
    title: string;
    formik: FormikProps<IBasicGantt>;
    onEdit: () => void;
    onDelete: () => void;
    edit: boolean;
    isLoading: boolean;
}

export const GanttsTopBar: React.FC<IGanttTopBar> = ({ title, formik, onEdit, onDelete, edit, isLoading }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const titleError = formik.touched.name && formik.errors.name;

    return (
        <TopBarGrid container alignItems='center' wrap='nowrap' sx={{ marginBottom: 0, paddingRight: '1.6rem' }}>
            <Swap
                condition={edit}
                isFalse={
                    <Box>
                        <BlueTitle title={title} component="h4" variant="h4" />
                    </Box>
                }
                isTrue={
                    <TextField
                        id='name'
                        name='name'
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        error={Boolean(titleError)}
                        label={titleError}
                        placeholder={i18next.t('gantts.actions.name')}
                        size='small'
                        disabled={isLoading}
                        sx={{ width: '30rem' }}
                    />
                }
            />

            {myPermissions.templatesManagementId && (
                <Grid item container wrap='nowrap' flexDirection='row-reverse' marginLeft='auto'>
                    <Swap
                        condition={edit}
                        isFalse={
                            <Grid container width='fit-content'>
                                <Tooltip title={<>
                                    {Object.values(ganttSettings.separators).map((separator, index) => (<Fragment key={index}>
                                        <Typography display="inline" fontWeight="bold">{separator}</Typography>
                                        <Typography display="inline">{`- ${i18next.t(`gantts.separators.${separator}`)}`}</Typography>
                                        <br />
                                    </Fragment>))}
                                </>}>

                                    <IconButton disableRipple>
                                        <InfoIcon />
                                    </IconButton>
                                </Tooltip>

                                <CopyUrlButton />

                                <Tooltip title={i18next.t('gantts.actions.edit')}>
                                    <IconButton onClick={onEdit}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        }
                        isTrue={
                            <Grid
                                container
                                justifyContent='space-between'
                                width='fit-content'
                                wrap='nowrap'
                                bgcolor={`rgb(220, 220, 220, ${darkMode ? 0.15 : 0.5})`}
                                borderRadius='10px'
                                padding='0.1rem'
                            >
                                {isLoading ? (
                                    <Grid item container alignItems='center' justifyContent='space-around' width='8rem'>
                                        <CircularProgress size={30} />
                                    </Grid>

                                ) : (
                                    <>
                                        <Grid item container wrap='nowrap'>
                                            <Tooltip title={i18next.t('gantts.actions.delete')}>
                                                <IconButton onClick={onDelete}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Grid>

                                        <Grid
                                            item
                                            container
                                            wrap='nowrap'
                                            bgcolor={`rgb(220, 220, 220, ${darkMode ? 0.12 : 0.7})`}
                                            borderRadius='10px'
                                            margin='0.2rem'
                                        >
                                            <Tooltip title={i18next.t('gantts.actions.cancel')}>
                                                <IconButton type='reset'>
                                                    <CancelIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={i18next.t('gantts.actions.save')}>
                                                <IconButton type='submit'>
                                                    <SaveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        }
                    />
                </Grid>
            )}
        </TopBarGrid >
    )
};
