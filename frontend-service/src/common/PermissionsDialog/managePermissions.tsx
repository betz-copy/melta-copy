import { Box } from '@mui/material';
import { PermissionData, PermissionScope, PermissionType } from '@packages/permission';
import { IMetadata, IWorkspace } from '@packages/workspace';
import { FormikProps } from 'formik';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { PermissionDialogMode } from '../../interfaces/inputs';
import { ICategoryMap } from '../../interfaces/template';
import {
    checkUserCategoryPermission,
    getChangedCategoryPermissions,
    getUserPermissionScopeOfCategory,
} from '../../utils/permissions/instancePermissions';
import { CategoryWithTemplates } from '../../utils/permissions/permissionOfUserDialog';
import InstancesPermissionsCard from './instancesPermissionsCard';
import ManagementPermissionsCard, { managementTypes } from './managementPermissionsCard';

const ManagePermissions: React.FC<{
    mode: PermissionDialogMode;
    workspace: IWorkspace & {
        metadata: IMetadata;
    };
    formikProps: FormikProps<PermissionData>;
    dialogPermissionData: Map<string, CategoryWithTemplates>;
    disableCheckboxes?: boolean;
    searchText?: { value: string; set: (text: string) => void };
}> = ({ mode, workspace, formikProps, dialogPermissionData, disableCheckboxes, searchText }) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    const currentPermissions = formikProps.values.permissions[workspace._id];
    const permissionsPath = useMemo(() => `permissions.${workspace._id}`, [workspace]);

    const categoriesPermissions = currentPermissions?.instances?.categories ?? {};

    const handleManagementPermissionCheck = (path: string, checked: boolean, permissionsManagement?: boolean) => {
        formikProps.setFieldValue(path, checked ? { scope: PermissionScope.write } : null);
        if (!permissionsManagement) return;
        formikProps.setFieldValue(
            `${permissionsPath}.instances.categories`,
            Object.fromEntries(checked ? Array.from(categories.keys()).map((categoryId) => [categoryId, { scope: PermissionScope.write }]) : []),
        );
    };

    const isAdmin = currentPermissions?.admin?.scope === PermissionScope.write;
    const isPropertyChecked = (property: managementTypes) => currentPermissions?.[property]?.scope === PermissionScope.write || isAdmin;

    return (
        <>
            {(!(
                mode === PermissionDialogMode.View &&
                Object.entries(currentPermissions).reduce(
                    (hasWrite, [key, perm]) =>
                        ![PermissionType.admin, PermissionType.instances].includes(key as PermissionType)
                            ? hasWrite || perm?.scope === PermissionScope.write
                            : hasWrite,
                    false,
                )
            ) ||
                isAdmin) && (
                <Box>
                    <ManagementPermissionsCard
                        viewMode={mode === PermissionDialogMode.View}
                        isChecked={isPropertyChecked}
                        onChange={
                            mode === PermissionDialogMode.View
                                ? () => {}
                                : (checked, property, permissionsManagement) =>
                                      handleManagementPermissionCheck(`${permissionsPath}.${property}`, checked, permissionsManagement)
                        }
                        disabled={disableCheckboxes || formikProps.isSubmitting || isAdmin}
                    />
                </Box>
            )}
            <Box marginTop="25px">
                <InstancesPermissionsCard
                    key={`${workspace._id}-instances-permissions`}
                    searchText={searchText}
                    viewMode={mode === PermissionDialogMode.View}
                    formikProps={formikProps}
                    workspaceId={workspace._id}
                    permissionsPath={permissionsPath}
                    categoriesCheckboxProps={Array.from(dialogPermissionData.values(), (currCategory) => ({
                        categoryId: currCategory._id,
                        categoryDisplayName: currCategory.displayName,
                        disabled: disableCheckboxes || formikProps.isSubmitting || isAdmin,
                        scope: getUserPermissionScopeOfCategory(categoriesPermissions, currCategory._id),
                        entityTemplates: currCategory.entityTemplates,
                        permissionType: {
                            read: {
                                checked: checkUserCategoryPermission(currentPermissions, currCategory, PermissionScope.read),
                                onChange:
                                    mode === PermissionDialogMode.View
                                        ? () => {}
                                        : (_e, checked: boolean) => {
                                              const newPermission = getChangedCategoryPermissions(
                                                  categoriesPermissions,
                                                  checked,
                                                  PermissionScope.read,
                                                  currCategory._id,
                                              );

                                              if (!newPermission.scope && !Object.keys(newPermission.entityTemplates).length) {
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
                                    mode === PermissionDialogMode.View
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
                        mode === PermissionDialogMode.View
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
                                              isAdmin,
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
                                              isAdmin,
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
