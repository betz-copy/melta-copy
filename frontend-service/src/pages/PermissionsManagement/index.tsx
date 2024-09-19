import { AddCircle } from '@mui/icons-material';
import { Divider, Grid, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import _debounce from 'lodash.debounce';
import PermissionsOfUserDialog from '../../common/permissionsOfUserDialog';
import '../../css/pages.css';
import { ICategoryMap } from '../../interfaces/categories';
import { IUser } from '../../interfaces/users';
import DeletePermissionsOfUserDialog from './deleteDialog';
import Table from './table';

const PermissionsManagement: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const [isCreatePermissionDialogOpen, setIsCreatePermissionDialogOpen] = useState<boolean>(false);
    const [deletePermissionDialogState, setDeletePermissionDialogState] = useState<{
        isDialogOpen: boolean;
        user: IUser | null;
    }>({
        isDialogOpen: false,
        user: null,
    });
    const [editPermissionDialogState, setEditPermissionDialogState] = useState<{
        isDialogOpen: boolean;
        user: IUser | null;
    }>({
        isDialogOpen: false,
        user: null,
    });

    const [quickFilterText, setQuickFilterText] = useState('');

    const [search, setSearch] = useState('');
    const theme = useTheme();

    useEffect(() => setTitle(i18next.t('permissions.permissionsManagmentPageTitle')), [setTitle]);

    return (
        <Grid container className="pageMargin" spacing={3}>
            <Grid item container xs={12} spacing={1}>
                <Grid item xs={12} container justifyContent="space-between" alignItems="center">
                    <Grid item flex={1} />
                    <Grid item flex={1}>
                        <TextField
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') setQuickFilterText(search);
                            }}
                            placeholder={i18next.t('permissions.searchUser')}
                            fullWidth
                            size="medium"
                            sx={{
                                background: '#FFFFFF',
                                boxShadow: '-2px 2px 6px 0px #1E27754D',
                                borderRadius: '7px',
                                width: '575px',
                                height: '40px',
                                display: 'flex',
                                justifyContent: 'center',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                },
                            }}
                            InputProps={{
                                style: {
                                    fontFamily: 'Rubik',
                                    fontSize: '12px',
                                    color: '#8D8D8E',
                                    textAlign: 'right',
                                    borderRadius: '7px',
                                },
                                endAdornment: (
                                    <InputAdornment
                                        position="end"
                                        sx={{
                                            fontWeight: '400',
                                            letterSpacing: '0em',
                                            lineHeight: '16px',
                                            gap: '10px',
                                        }}
                                    >
                                        <Divider
                                            orientation="vertical"
                                            style={{
                                                width: '1px',
                                                height: '20px',
                                                borderRadius: '1.5px',
                                                backgroundColor: theme.palette.primary.main,
                                            }}
                                        />
                                        <img color="#1E2775" width="14px" height="14px" style={{}} src="/icons/search-blue.svg" />
                                    </InputAdornment>
                                ),
                                startAdornment: <InputAdornment position="start" />,
                            }}
                        />
                    </Grid>
                    <Grid item container flex={1} justifyContent="flex-end">
                        <IconButton onClick={() => setIsCreatePermissionDialogOpen(true)}>
                            <AddCircle color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    {Boolean(categories) && (
                        <Table
                            categories={Array.from(categories.values())}
                            onDeletePermissionsOfUser={(existingUser) => setDeletePermissionDialogState({ isDialogOpen: true, user: existingUser })}
                            onEditPermissionsOfUser={(existingUser) => setEditPermissionDialogState({ isDialogOpen: true, user: existingUser })}
                            quickFilterText={quickFilterText}
                            datasourceOnFail={(error) => {
                                console.log('failed loading all users:', error);
                                toast.error(i18next.t('permissions.failedToLoadAllPermissions'));
                            }}
                        />
                    )}
                </Grid>
            </Grid>
            <DeletePermissionsOfUserDialog
                isOpen={deletePermissionDialogState.isDialogOpen}
                user={deletePermissionDialogState.user}
                handleClose={() => setDeletePermissionDialogState({ isDialogOpen: false, user: null })}
            />
            <PermissionsOfUserDialog mode="create" isOpen={isCreatePermissionDialogOpen} handleClose={() => setIsCreatePermissionDialogOpen(false)} />
            <PermissionsOfUserDialog
                mode="edit"
                isOpen={editPermissionDialogState.isDialogOpen}
                handleClose={() => setEditPermissionDialogState({ isDialogOpen: false, user: null })}
                existingUser={editPermissionDialogState.user || undefined}
            />
        </Grid>
    );
};

export default PermissionsManagement;
