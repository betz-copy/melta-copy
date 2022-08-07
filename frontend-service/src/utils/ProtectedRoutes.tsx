import React, { isValidElement } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { CircularProgress } from '@mui/material';
import { getExpandedEntityByIdRequest } from '../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IPermissionsOfUser } from '../services/permissionsService';

export const protectedRoute = (children: React.ReactNode, isAllowed: boolean) => {
    if (isAllowed) {
        return <Navigate to="/" replace />;
    }

    if (isValidElement(children)) {
        return children;
    }

    return <div />;
};

export const CategoryProtectedRoute: React.FC<{ permissions: IPermissionsOfUser }> = ({ children, permissions }) => {
    const params = useParams();
    const { categoryId } = params;

    return protectedRoute(children, !permissions.instancesPermissions.find((instance) => instance.category === categoryId));
};

export const EntityProtectedRoute: React.FC<{ permissions: IPermissionsOfUser; entityTemplates: IMongoEntityTemplatePopulated[] }> = ({
    children,
    permissions,
    entityTemplates,
}) => {
    const params = useParams();
    const { entityId } = params;
    const queryClient = useQueryClient();

    const templateIds = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!.map((entityTemplate) => entityTemplate._id);

    const { data: expandedEntity, isLoading } = useQuery(['getExpandedEntity', entityId], () =>
        getExpandedEntityByIdRequest(entityId!, { templateIds }),
    );

    if (isLoading) return <CircularProgress />;
    const currentEntityTemplate = entityTemplates.find((currTemplate) => currTemplate._id === expandedEntity?.entity.templateId);

    return protectedRoute(children, !permissions.instancesPermissions.find((instance) => instance.category === currentEntityTemplate?.category._id));
};

export const SystemManagementProtectedRoute: React.FC<{ permissions: IPermissionsOfUser }> = ({ children, permissions }) => {
    return protectedRoute(children, !permissions.templatesManagementId);
};

export const PermissionsManagementProtectedRoute: React.FC<{ permissions: IPermissionsOfUser }> = ({ children, permissions }) => {
    return protectedRoute(children, !permissions.permissionsManagementId);
};
