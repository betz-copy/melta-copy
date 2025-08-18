import {
    Category as AddGroupByIcon,
    CalendarMonth as CalendarModeIcon,
    Close as CancelIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    GridView as HeatmapModeIcon,
    InfoOutlined as InfoIcon,
    Check as SaveIcon,
} from '@mui/icons-material';
import { Box, Button, CircularProgress, Grid, IconButton, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { Fragment, useState } from 'react';
import { CopyUrlButton } from '../../common/CopyUrlButton';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import { Swap } from '../../common/Swap';
import { TopBarGrid } from '../../common/TopBar';
import { environment } from '../../globals';
import { IBasicGantt } from '../../interfaces/gantts';
import { PermissionScope } from '../../interfaces/permissions';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { useSearchParams } from '../../utils/hooks/useSearchParams';

const {
    separators,
    searchParams: { heatmapModeKey },
} = environment.ganttSettings;

interface IGanttTopBar {
    title: string;
    formik: FormikProps<IBasicGantt>;
    onEdit: () => void;
    onDelete: () => void;
    onAddGroupBy: () => void;
    edit: boolean;
    isGroupBy?: boolean;
    isLoading?: boolean;
}

export const GanttsTopBar: React.FC<IGanttTopBar> = ({ title, formik, onEdit, onDelete, onAddGroupBy, edit, isGroupBy, isLoading }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [searchParams, setSearchParams] = useSearchParams();
    const heatmapMode = Boolean(searchParams.get(heatmapModeKey));

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const currentUser = useUserStore((state) => state.user);

    const titleError = formik.touched.name && formik.errors.name;

    return (
        <>
            <TopBarGrid container alignItems="center" wrap="nowrap" sx={{ marginBottom: 0, paddingRight: '1.6rem' }}>
                <Swap
                    condition={edit}
                    isFalse={
                        <Box>
                            <BlueTitle title={title} component="h4" variant="h4" style={{ whiteSpace: 'nowrap' }} />
                        </Box>
                    }
                    isTrue={
                        <TextField
                            id="name"
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            error={Boolean(titleError)}
                            label={titleError}
                            placeholder={i18next.t('gantts.actions.name')}
                            size="small"
                            disabled={isLoading}
                            sx={{ width: '30rem' }}
                        />
                    }
                />

                {(currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
                    currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write) && (
                    <Grid item container wrap="nowrap" flexDirection="row-reverse" marginLeft="auto">
                        <Swap
                            condition={edit}
                            isFalse={
                                <Grid container width="fit-content" wrap="nowrap">
                                    {isGroupBy && (
                                        <Grid item>
                                            <ToggleButtonGroup
                                                value={heatmapMode}
                                                exclusive
                                                color="primary"
                                                size="small"
                                                sx={{ paddingX: '0.4rem', height: '2.5rem', marginX: '0.8rem' }}
                                            >
                                                <ToggleButton value onClick={() => setSearchParams({ [heatmapModeKey]: 'true' })}>
                                                    <MeltaTooltip title={i18next.t('gantts.heatmapMode')!}>
                                                        <Grid>
                                                            <HeatmapModeIcon />
                                                        </Grid>
                                                    </MeltaTooltip>
                                                </ToggleButton>
                                                <ToggleButton value={false} onClick={() => setSearchParams({})}>
                                                    <MeltaTooltip title={i18next.t('gantts.calendarMode')!}>
                                                        <Grid>
                                                            <CalendarModeIcon />
                                                        </Grid>
                                                    </MeltaTooltip>
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </Grid>
                                    )}

                                    <MeltaTooltip
                                        title={
                                            <>
                                                {Object.values(separators).map((separator) => (
                                                    <Fragment key={separator}>
                                                        <Typography display="inline" fontWeight="bold">
                                                            {separator}
                                                        </Typography>
                                                        <Typography display="inline">{`- ${i18next.t(`gantts.separators.${separator}`)}`}</Typography>
                                                        <br />
                                                    </Fragment>
                                                ))}
                                            </>
                                        }
                                    >
                                        <IconButton disableRipple>
                                            <InfoIcon />
                                        </IconButton>
                                    </MeltaTooltip>

                                    <CopyUrlButton />

                                    <MeltaTooltip title={i18next.t('gantts.actions.edit')}>
                                        <IconButton onClick={onEdit}>
                                            <EditIcon />
                                        </IconButton>
                                    </MeltaTooltip>
                                </Grid>
                            }
                            isTrue={
                                <Grid container justifyContent="space-between" alignItems="center" width="fit-content" wrap="nowrap">
                                    <Grid item>
                                        <Button
                                            onClick={onAddGroupBy}
                                            variant="outlined"
                                            disabled={isGroupBy}
                                            sx={{ paddingX: '0.4rem', height: '2.5rem', marginX: '1rem' }}
                                        >
                                            {i18next.t('gantts.actions.addGroupBy')}
                                            <AddGroupByIcon />
                                        </Button>
                                    </Grid>

                                    <Grid
                                        container
                                        justifyContent="space-between"
                                        width="fit-content"
                                        wrap="nowrap"
                                        bgcolor={`rgb(220, 220, 220, ${darkMode ? 0.15 : 0.5})`}
                                        borderRadius="10px"
                                        padding="0.1rem"
                                    >
                                        {isLoading ? (
                                            <Grid item container alignItems="center" justifyContent="space-around" width="8rem">
                                                <CircularProgress size={30} />
                                            </Grid>
                                        ) : (
                                            <>
                                                <Grid item container wrap="nowrap">
                                                    <MeltaTooltip title={i18next.t('gantts.actions.delete')}>
                                                        <IconButton onClick={() => setDeleteDialogOpen(true)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </MeltaTooltip>
                                                </Grid>

                                                <Grid
                                                    item
                                                    container
                                                    wrap="nowrap"
                                                    bgcolor={`rgb(220, 220, 220, ${darkMode ? 0.12 : 0.7})`}
                                                    borderRadius="10px"
                                                    margin="0.2rem"
                                                >
                                                    <MeltaTooltip title={i18next.t('gantts.actions.cancel')}>
                                                        <IconButton type="reset">
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </MeltaTooltip>
                                                    <MeltaTooltip title={i18next.t('gantts.actions.save')}>
                                                        <IconButton type="submit">
                                                            <SaveIcon />
                                                        </IconButton>
                                                    </MeltaTooltip>
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </Grid>
                            }
                        />
                    </Grid>
                )}
            </TopBarGrid>

            <AreYouSureDialog open={deleteDialogOpen} handleClose={() => setDeleteDialogOpen(false)} onYes={() => onDelete()} />
        </>
    );
};
