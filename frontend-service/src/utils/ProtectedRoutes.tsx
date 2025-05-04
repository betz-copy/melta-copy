import { CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import React, { isValidElement } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Redirect, useLocation, useParams } from 'wouter';
import { StatusCodes } from 'http-status-codes';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
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

export const ChartsProtectedRoute: React.FC<{ permissions: ISubCompactPermissions }> = ({ children, permissions }) => {
    const queryClient = useQueryClient();
    const { templateId } = useParams<{ templateId: string }>();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const { category } = entityTemplates.get(templateId) as IMongoEntityTemplatePopulated;

    const categoryPermissions = permissions.instances?.categories?.[category?._id];

    return protectedRoute(
        children,
        Boolean(permissions.admin?.scope || categoryPermissions?.scope || categoryPermissions?.entityTemplates?.[templateId]?.scope),
    );
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
