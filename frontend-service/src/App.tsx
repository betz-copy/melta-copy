import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import i18next from 'i18next';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from 'react-query';
import 'react-toastify/dist/ReactToastify.css';
import { AuthService } from './services/authService';
import Main from './Main';
import { RootState } from './store';
import { setUser } from './store/user';
import { BackendConfigState, getBackendConfigRequest } from './services/backendConfigService';
import { getAllTemplates, GetAllTemplatesType } from './services/templates/getAllTemplates';
import { getMyPermissionsRequest, IPermissionsOfUser } from './services/permissionsService';
import './css/index.css';
import { IMongoCategory } from './interfaces/categories';
import { IMongoEntityTemplatePopulated } from './interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from './interfaces/relationshipTemplates';

const App: React.FC = () => {
    const queryClient = useQueryClient();

    const currentUser = useSelector((state: RootState) => state.user);
    useQuery<BackendConfigState>('getBackendConfig', getBackendConfigRequest, {
        onError: () => {
            toast.error(i18next.t('error.config'));
        },
    });

    // use queries enabled false, setting query data by hand "queryClient.setQueryData" (setting from getAllTemplates)
    useQuery('getCategories', () => undefined, { enabled: false });
    useQuery('getEntityTemplates', () => undefined, { enabled: false });
    useQuery('getRelationshipTemplates', () => undefined, { enabled: false });

    const { isLoading: isLoadingAllTemplates, isError: isErrorAllTemplates } = useQuery<GetAllTemplatesType>('getAllTemplates', getAllTemplates, {
        onError: (error) => {
            toast.error(i18next.t('failedToGetTemplates'));
            console.log('failed to get templates error:', error);
        },
        onSuccess: ({ categories, entityTemplates, relationshipTemplates }) => {
            queryClient.setQueryData<IMongoCategory[]>('getCategories', categories);
            queryClient.setQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates', entityTemplates);
            queryClient.setQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates', relationshipTemplates);
        },
    });

    const { isLoading: isLoadingMyPermissions, isError: isErrorMyPermissions } = useQuery<IPermissionsOfUser>(
        'getMyPermissions',
        getMyPermissionsRequest,
        {
            onError: (error) => {
                console.log('failed loading my permissions:', error);
                toast.error(i18next.t('permissions.failedToLoadMyPermissions'));
            },
        },
    );

    const dispatch = useDispatch();

    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        const initUser = async () => {
            const user = AuthService.getUser();
            if (user) {
                dispatch(setUser(user));
                setIsLoadingUser(false);
            }
        };

        initUser();
    }, [dispatch]);

    const isLoading = isLoadingUser || isLoadingAllTemplates || isLoadingMyPermissions;
    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30vh' }}>
                <CircularProgress size={80} />
            </div>
        );
    }

    if (!currentUser) {
        return <span>unauthorized</span>;
    }

    const isError = isErrorAllTemplates || isErrorMyPermissions;
    if (isError) {
        return <span>error occurred</span>;
    }

    return <Main />;
};

export default App;
