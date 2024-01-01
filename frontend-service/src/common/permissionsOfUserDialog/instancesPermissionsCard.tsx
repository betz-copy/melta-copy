import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useSelector } from 'react-redux';
import i18next from 'i18next';
import { CheckboxProps } from '@mui/material/Checkbox';
import { RootState } from '../../store';
import { PermissionCheckboxes } from './PermissionCheckboxes'; // Assuming PermissionCheckboxes is a separate component

const InstancesPermissionsCard: React.FC<{
    categoriesCheckboxProps: {
        categoryId: string;
        categoryDisplayName: string;
        disabled: boolean;
        checkedRead: boolean;
        checkedWrite: boolean;
        onChangeRead: CheckboxProps['onChange'];
        onChangeWrite: CheckboxProps['onChange'];
    }[];
}> = ({ categoriesCheckboxProps }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Card variant="outlined" sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
            <CardContent>
                <Typography style={{ fontWeight: 'bold', cursor: 'default', marginBottom: '16px' }}>
                    {i18next.t('permissions.permissionsOfUserDialog.instancesPermissions')}
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{i18next.t('Category')}</TableCell>
                                <TableCell>{i18next.t('Read')}</TableCell>
                                <TableCell>{i18next.t('Write')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categoriesCheckboxProps.map(
                                ({ categoryId, categoryDisplayName, disabled, checkedRead, checkedWrite, onChangeRead, onChangeWrite }) => (
                                    <TableRow key={categoryId}>
                                        <TableCell>{categoryDisplayName}</TableCell>
                                        <TableCell>
                                            <PermissionCheckboxes
                                                checkedRead={checkedRead}
                                                checkedWrite={checkedWrite}
                                                disabled={disabled}
                                                onChangeRead={onChangeRead}
                                                onChangeWrite={onChangeWrite}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ),
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default InstancesPermissionsCard;
