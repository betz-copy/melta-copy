import { CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import React, { isValidElement } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Redirect, useLocation, useParams } from 'wouter';
import { StatusCodes } from 'http-status-codes';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { PermissionScope } from '../interfaces/permissions';
import { getExpandedEntityByIdRequest } from '../services/entitiesService';
import { DashboardItemType } from '../interfaces/dashboard';
import { ISubCompactPermissions } from '../interfaces/permissions/permissions';

export const protectedRoute = (children: React.ReactNode, isAllowed: boolean) => {
    if (!isAllowed) {
        return <Redirect href="/" replace />;
    }

    if (isValidElement(children)) {
        return children;
    }

    return <div />;
};

export const CategoryProtectedRoute: React.FC<{ permissions: ISubCompactPermissions }> = ({ children, permissions }) => {
    const params = useParams<{ categoryId: string }>();
    const { categoryId } = params;

    return protectedRoute(children, permissions.admin?.scope === PermissionScope.write || Boolean(permissions.instances?.categories[categoryId]));
};

export const EntityProtectedRoute: React.FC<{ permissions: ISubCompactPermissions; entityTemplates: IEntityTemplateMap }> = ({
    children,
    permissions,
    entityTemplates,
}) => {
    const params = useParams<{ entityId: string }>();
    const { entityId } = params;

    const [_, navigate] = useLocation();

    const templateIds = Array.from(entityTemplates.keys());

    const expanded = entityId ? { [entityId]: 1 } : {};
    const { data: expandedEntity, isLoading } = useQuery(
        ['getExpandedEntity', entityId, expanded, { templateIds }],
        () => getExpandedEntityByIdRequest(entityId!, expanded, { templateIds }),
        {
            onError: (error: AxiosError) => {
                if (error.response?.status === StatusCodes.NOT_FOUND) {
                    navigate('/404');
                }
            },
        },
    );

    if (isLoading) return <CircularProgress />;

    const currentEntityTemplate = entityTemplates.get(expandedEntity!.entity.templateId);

    return protectedRoute(
        children,
        permissions.admin?.scope === PermissionScope.write || Boolean(permissions.instances?.categories[currentEntityTemplate?.category._id ?? '']),
    );
};

export const DashboardProtectedRoute: React.FC<{
    permissions: ISubCompactPermissions;
    dashboardType: DashboardItemType;
}> = ({ permissions, dashboardType, children }) => {
    const { templateId } = useParams<{ templateId: string }>();
    const queryClient = useQueryClient();

    if (permissions.admin?.scope) return protectedRoute(children, true);

    if (dashboardType === DashboardItemType.Chart) {
        const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
        const template = templateId ? (entityTemplates?.get(templateId) as IMongoEntityTemplatePopulated) : null;

        const category = template?.category;
        const categoryId = category?._id;

        const categoryPermissions = categoryId ? permissions.instances?.categories?.[categoryId] : undefined;

        const hasAccess = categoryPermissions?.scope || categoryPermissions?.entityTemplates?.[templateId]?.scope;

        return protectedRoute(children, Boolean(hasAccess));
    }

    return protectedRoute(children, false);
};

export const SystemManagementProtectedRoute: React.FC<{ permissions: ISubCompactPermissions }> = ({ children, permissions }) => {
    return protectedRoute(
        children,
        permissions.admin?.scope === PermissionScope.write ||
            permissions.templates?.scope === PermissionScope.write ||
            permissions.processes?.scope === PermissionScope.write,
    );
};

export const PermissionsManagementProtectedRoute: React.FC<{ permissions: ISubCompactPermissions }> = ({ children, permissions }) => {
    return protectedRoute(children, permissions.admin?.scope === PermissionScope.write || permissions.permissions?.scope === PermissionScope.write);
};
