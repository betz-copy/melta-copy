import { CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import React, { isValidElement } from 'react';
import { useQuery } from 'react-query';
import { Redirect, useLocation, useParams } from 'wouter';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { IPermissionsOfUser } from '../../services/permissionsService';

export const protectedRoute = (children: React.ReactNode, isAllowed: boolean) => {
    if (isAllowed) {
        return <Redirect href="/" replace />;
    }

    if (isValidElement(children)) {
        return children;
    }

    return <div />;
};

export const CategoryProtectedRoute: React.FC<{ permissions: IPermissionsOfUser }> = ({ children, permissions }) => {
    const params = useParams<{ categoryId: string }>();
    const { categoryId } = params;

    return protectedRoute(children, !permissions.instancesPermissions.find((instance) => instance.category === categoryId));
};

export const EntityProtectedRoute: React.FC<{ permissions: IPermissionsOfUser; entityTemplates: IEntityTemplateMap }> = ({
    children,
    permissions,
    entityTemplates,
}) => {
    const params = useParams<{ entityId: string }>();
    const { entityId } = params;

    const [_, navigate] = useLocation();

    const templateIds = Array.from(entityTemplates.keys());

    const { data: expandedEntity, isLoading } = useQuery(
        ['getExpandedEntity', entityId, { templateIds, numberOfConnections: 0 }],
        () => getExpandedEntityByIdRequest(entityId!, { templateIds }),
        {
            onError: (error: AxiosError) => {
                if (error.response?.status === 404) {
                    navigate('/404');
                }
            },
        },
    );

    if (isLoading) return <CircularProgress />;

    const currentEntityTemplate = entityTemplates.get(expandedEntity!.entity.templateId);

    return protectedRoute(children, !permissions.instancesPermissions.find((instance) => instance.category === currentEntityTemplate?.category._id));
};

export const SystemManagementProtectedRoute: React.FC<{ permissions: IPermissionsOfUser }> = ({ children, permissions }) => {
    return protectedRoute(children, !permissions.templatesManagementId && !permissions.processesManagementId);
};

export const PermissionsManagementProtectedRoute: React.FC<{ permissions: IPermissionsOfUser }> = ({ children, permissions }) => {
    return protectedRoute(children, !permissions.permissionsManagementId);
};
