import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useQueryClient } from 'react-query';
import { FormikProps } from 'formik';
import ManagementPermissionsCard from './managementPermissionsCard';
import InstancesPermissionsCard from './instancesPermissionsCard';
import { PermissionScope } from '../../interfaces/permissions';
import {
    checkUserCategoryPermission,
    getChangedCategoryPermissions,
    getUserPermissionScopeOfCategory,
} from '../../utils/permissions/instancePermissions';
import { ICategoryMap } from '../../interfaces/categories';
import { IMetadata, IWorkspace } from '../../interfaces/workspaces';
import { CategoryWithTemplates } from '../../utils/permissions/permissionOfUserDialog';
import { PermissionData } from '../../interfaces/users';

const ManagePermissions: React.FC<{
    mode: 'create' | 'edit' | 'view';
    workspace: IWorkspace & {
        metadata: IMetadata;
    };
    formikProps: FormikProps<PermissionData>;
    dialogPermissionData: Map<string, CategoryWithTemplates>;
    disableCheckboxes?: boolean;
}> = ({ mode, workspace, formikProps, dialogPermissionData, disableCheckboxes }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const currentPermissions = formikProps.values.permissions[workspace._id];
    const permissionsPath = useMemo(() => `permissions.${workspace._id}`, [workspace]);

    const categoriesPermissions = currentPermissions?.instances?.categories ?? {};

    const handleManagementPermissionCheck = (path: string, checked: boolean, permissionsManagement?: boolean) => {
        formikProps.setFieldValue(path, checked ? { scope: PermissionScope.write } : undefined);
        if (!permissionsManagement) return;
        formikProps.setFieldValue(
            `${permissionsPath}.instances.categories`,
            Object.fromEntries(checked ? Array.from(categories.keys()).map((categoryId) => [categoryId, { scope: PermissionScope.write }]) : []),
        );
    };

    return (
        <>
            {(!(
                mode === 'view' &&
                currentPermissions?.permissions?.scope !== PermissionScope.write &&
                currentPermissions?.templates?.scope !== PermissionScope.write &&
                currentPermissions?.processes?.scope !== PermissionScope.write &&
                currentPermissions?.rules?.scope !== PermissionScope.write
            ) ||
                currentPermissions?.admin?.scope === PermissionScope.write) && (
                <Box>
                    <ManagementPermissionsCard
                        permissionsManagement={{
                            checked:
                                currentPermissions?.permissions?.scope === PermissionScope.write ||
                                currentPermissions?.admin?.scope === PermissionScope.write,
                            onChange:
                                mode === 'view'
                                    ? () => {}
                                    : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.permissions`, checked, true),
                            disabled: disableCheckboxes || formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                            viewMode: mode === 'view',
                        }}
                        templatesManagement={{
                            checked:
                                currentPermissions?.templates?.scope === PermissionScope.write ||
                                currentPermissions?.admin?.scope === PermissionScope.write,
                            onChange:
                                mode === 'view'
                                    ? () => {}
                                    : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.templates`, checked),
                            disabled: disableCheckboxes || formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                            viewMode: mode === 'view',
                        }}
                        rulesManagement={{
                            checked:
                                currentPermissions?.rules?.scope === PermissionScope.write ||
                                currentPermissions?.admin?.scope === PermissionScope.write,
                            onChange:
                                mode === 'view' ? () => {} : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.rules`, checked),
                            disabled: disableCheckboxes || formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                            viewMode: mode === 'view',
                        }}
                        processesManagement={{
                            checked:
                                currentPermissions?.processes?.scope === PermissionScope.write ||
                                currentPermissions?.admin?.scope === PermissionScope.write,
                            onChange:
                                mode === 'view'
                                    ? () => {}
                                    : (_e, checked) => handleManagementPermissionCheck(`${permissionsPath}.processes`, checked),
                            disabled: disableCheckboxes || formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                            viewMode: mode === 'view',
                        }}
                    />
                </Box>
            )}
            <Box marginTop="25px">
                <InstancesPermissionsCard
                    viewMode={mode === 'view'}
                    formikProps={formikProps}
                    workspaceId={workspace._id}
                    permissionsPath={permissionsPath}
                    categoriesCheckboxProps={Array.from(dialogPermissionData.values(), (currCategory) => ({
                        categoryId: currCategory._id,
                        categoryDisplayName: currCategory.displayName,
                        disabled: disableCheckboxes || formikProps.isSubmitting || currentPermissions?.admin?.scope === PermissionScope.write,
                        scope: getUserPermissionScopeOfCategory(categoriesPermissions, currCategory._id),
                        entityTemplates: currCategory.entityTemplates,
                        permissionType: {
                            read: {
                                checked: checkUserCategoryPermission(currentPermissions, currCategory, PermissionScope.read),
                                onChange:
                                    mode === 'view'
                                        ? () => {}
                                        : (_e, checked: boolean) => {
                                              const newPermission = getChangedCategoryPermissions(
                                                  categoriesPermissions,
                                                  checked,
                                                  PermissionScope.read,
                                                  currCategory._id,
                                              );

                                              if (!newPermission.scope && Object.keys(newPermission.entityTemplates).length === 0) {
                                                  delete categoriesPermissions[currCategory._id];
                                              } else {
                                                  categoriesPermissions[currCategory._id] = newPermission;
                                              }

                                              formikProps.setFieldValue(`${permissionsPath}.instances.categories`, categoriesPermissions);
                                          },
                            },
                            write: {
                                checked: checkUserCategoryPermission(currentPermissions, currCategory, PermissionScope.write),
                                onChange:
                                    mode === 'view'
                                        ? () => {}
                                        : (_e, checked: boolean) => {
                                              formikProps.setFieldValue(`${permissionsPath}.instances.categories`, {
                                                  ...categoriesPermissions,
                                                  [currCategory._id]: getChangedCategoryPermissions(
                                                      categoriesPermissions,
                                                      checked,
                                                      PermissionScope.write,
                                                      currCategory._id,
                                                  ),
                                              });
                                          },
                            },
                        },
                    }))}
                    checkboxAllProps={
                        mode === 'view'
                            ? undefined
                            : {
                                  disabled: disableCheckboxes,
                                  permissionType: {
                                      write: {
                                          checked:
                                              (Object.keys(categoriesPermissions).length === categories.size &&
                                                  Object.values(categoriesPermissions).every(
                                                      (categoryPermission) => categoryPermission?.scope === PermissionScope.write,
                                                  )) ||
                                              currentPermissions?.admin?.scope === PermissionScope.write,
                                          onChange: (_e, checked) => {
                                              formikProps.setFieldValue(
                                                  `${permissionsPath}.instances.categories`,
                                                  checked
                                                      ? Object.fromEntries(
                                                            Array.from(categories.keys()).map((categoryId) => [
                                                                categoryId,
                                                                { scope: PermissionScope.write },
                                                            ]),
                                                        )
                                                      : Object.fromEntries(
                                                            Array.from(categories.keys()).map((categoryId) => [
                                                                categoryId,
                                                                { scope: PermissionScope.read },
                                                            ]),
                                                        ),
                                              );
                                          },
                                      },
                                      read: {
                                          checked:
                                              (Object.keys(categoriesPermissions).length === categories.size &&
                                                  Object.values(categoriesPermissions).every((categoryPermission) => categoryPermission?.scope)) ||
                                              currentPermissions?.admin?.scope === PermissionScope.write,
                                          onChange: (_e, checked) => {
                                              Array.from(categories).forEach(([categoryId]) => {
                                                  const newPermission = getChangedCategoryPermissions(
                                                      categoriesPermissions,
                                                      checked,
                                                      PermissionScope.read,
                                                      categoryId,
                                                  );

                                                  if (!newPermission.scope && Object.keys(newPermission.entityTemplates).length === 0) {
                                                      delete categoriesPermissions[categoryId];
                                                  } else {
                                                      categoriesPermissions[categoryId] = newPermission;
                                                  }
                                              });
                                              formikProps.setFieldValue(`${permissionsPath}.instances.categories`, categoriesPermissions);
                                          },
                                      },
                                  },
                              }
                    }
                />
            </Box>
        </>
    );
};
export default ManagePermissions;
