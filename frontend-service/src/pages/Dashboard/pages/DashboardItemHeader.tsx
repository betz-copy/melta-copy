import React from 'react';
import { Grid, Typography, useTheme } from '@mui/material';
import { Link, useLocation } from 'wouter';
import { TopBarGrid } from '../../../common/TopBar';
import { BlueTitle } from '../../../common/BlueTitle';
import { useWorkspaceStore } from '../../../stores/workspace';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';

interface DashboardItemHeaderProps {
    title: string;
    readonly: boolean;
    edit: boolean;
    backPath: { title: string; path: string };
}

const DashboardItemHeader: React.FC<DashboardItemHeaderProps> = ({ title, readonly, edit, backPath }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const theme = useTheme();
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [currentLocation, navigate] = useLocation();
    const hasEditAndDeletePermission = true; // Replace with actual permission check

    return (
        <TopBarGrid
            container
            alignItems="center"
            wrap="nowrap"
            sx={{ marginBottom: 0, paddingRight: '1.6rem', boxShadow: '  -2px 2px 6px 0px #1E277533' }}
        >
            <Grid>
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
            </Grid>

            <Grid item container wrap="nowrap" flexDirection="row-reverse" marginLeft="auto">
                {readonly ? (
                    <IconButtonWithPopover
                        popoverText={hasEditAndDeletePermission ? 'Edit' : 'You do not have permission to edit'}
                        disabled={!hasEditAndDeletePermission}
                        iconButtonProps={{ onClick: () => navigate(`${currentLocation}/edit`) }}
                        buttonStyle={{ color: theme.palette.primary.main }}
                    >
                        Edit
                    </IconButtonWithPopover>
                ) : (
                    <IconButtonWithPopover
                        popoverText="Delete"
                        iconButtonProps={{ onClick: () => setDeleteDialogOpen(true) }}
                        buttonStyle={{ color: theme.palette.primary.main }}
                    >
                        Delete
                    </IconButtonWithPopover>
                )}
            </Grid>
            <AreYouSureDialog open={deleteDialogOpen} handleClose={() => setDeleteDialogOpen(false)} onYes={onDelete} />
        </TopBarGrid>
    );
};

export { DashboardItemHeader };
