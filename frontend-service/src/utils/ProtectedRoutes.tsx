import { CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import React, { isValidElement, ReactNode } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Redirect, useLocation, useParams, useSearchParams } from 'wouter';
import { IChildTemplateMap } from '../interfaces/childTemplates';
import { DashboardItemType } from '../interfaces/dashboard';
import { IEntityTemplateMap } from '../interfaces/entityTemplates';
import { PermissionScope } from '../interfaces/permissions';
import { ISubCompactPermissions } from '../interfaces/permissions/permissions';
import { getExpandedEntityByIdRequest } from '../services/entitiesService';

export const protectedRoute = (children: React.ReactNode, isAllowed: boolean) => {
    if (!isAllowed) {
        return <Redirect href="/" replace />;
    }

    if (isValidElement(children)) {
        return children;
    }

    return <div />;
};

export const CategoryProtectedRoute: React.FC<{ permissions: ISubCompactPermissions; children?: ReactNode }> = ({ children, permissions }) => {
    const params = useParams<{ categoryId: string }>();
    const { categoryId } = params;

    return protectedRoute(children, permissions.admin?.scope === PermissionScope.write || Boolean(permissions.instances?.categories[categoryId]));
};

export const EntityProtectedRoute: React.FC<{
    permissions: ISubCompactPermissions;
    entityTemplates: IEntityTemplateMap;
    childTemplates: IChildTemplateMap;
    children?: ReactNode;
}> = ({ children, permissions, entityTemplates, childTemplates }) => {
    const params = useParams<{ entityId: string }>();
    const { entityId } = params;

    const [searchParams, _setSearchParams] = useSearchParams();
    const childTemplateId = searchParams.get('childTemplateId') ?? undefined;

    const [_, navigate] = useLocation();

    const childTemplatesArray = [...childTemplates.values()];
    const templates = [...entityTemplates.values(), ...childTemplatesArray];
    const templateIds = templates.map(({ _id }) => _id);

    const expanded = entityId ? { [entityId]: { maxLevel: 1 } } : {};
    const { data: expandedEntity, isLoading } = useQuery(
        ['getExpandedEntity', entityId, expanded, { templateIds }],
        () => getExpandedEntityByIdRequest(entityId!, expanded, { templateIds, childTemplateId }),
        {
            onError: (error: AxiosError) => {
                if (error.response?.status === StatusCodes.NOT_FOUND) {
                    navigate('/404');
                }
            },
        },
    );

    if (isLoading) return <CircularProgress />;

    const currentEntityTemplate =
        entityTemplates.get(expandedEntity!.entity.templateId) ||
        childTemplatesArray.find(({ parentTemplate }) => parentTemplate._id === expandedEntity!.entity.templateId);

    return protectedRoute(
        children,
        permissions.admin?.scope === PermissionScope.write || Boolean(permissions.instances?.categories[currentEntityTemplate?.category._id ?? '']),
    );
};

export const DashboardProtectedRoute: React.FC<{
    permissions: ISubCompactPermissions;
    dashboardType: DashboardItemType;
    children?: ReactNode;
}> = ({ permissions, dashboardType, children }) => {
    const { templateId } = useParams<{ templateId: string }>();
    const queryClient = useQueryClient();

    if (permissions.admin?.scope) return protectedRoute(children, true);

    if (dashboardType === DashboardItemType.Chart) {
        const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
        const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates');

        const entityTemplate = entityTemplates?.get(templateId);
        const childTemplate = childTemplates?.get(templateId);

        const template = entityTemplate || childTemplate || null;

        const category = template?.category;
        const categoryId = category?._id;

        const categoryPermissions = categoryId ? permissions.instances?.categories?.[categoryId] : undefined;

        const hasAccess = categoryPermissions?.scope || categoryPermissions?.entityTemplates?.[templateId]?.scope;

        return protectedRoute(children, Boolean(hasAccess));
    }

    return protectedRoute(children, false);
};

export const SystemManagementProtectedRoute: React.FC<{ permissions: ISubCompactPermissions; children?: ReactNode }> = ({
    children,
    permissions,
}) => {
    return protectedRoute(
        children,
        permissions.admin?.scope === PermissionScope.write ||
            permissions.templates?.scope === PermissionScope.write ||
            permissions.processes?.scope === PermissionScope.write ||
            permissions.units?.scope === PermissionScope.write,
    );
};

export const PermissionsManagementProtectedRoute: React.FC<{ permissions: ISubCompactPermissions; children?: ReactNode }> = ({
    children,
    permissions,
}) => {
    return protectedRoute(children, permissions.admin?.scope === PermissionScope.write || permissions.permissions?.scope === PermissionScope.write);
};
