import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from 'react-query';
import Bowser from 'bowser';
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
import ErrorPage from './pages/ErrorPage';
import { environment } from './globals';
import loadingAnimation from './assets/icons/Melta_Logo.svg';
import './css/loading.css';

const App: React.FC = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const browser = Bowser.getParser(window.navigator.userAgent);
        const isValidBrowser = browser.satisfies({
            chrome: `>=${environment.minimumSupportedChromeVersion}`,
        });

        if (!isValidBrowser) {
            toast.error(i18next.t('error.unsupportedChromeVersion'), { autoClose: false, theme: 'colored', style: { fontSize: 'large' } });
        }
    }, []);

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
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }}>
                <img className="ld ld-bounce" src={loadingAnimation} width="300px" />
            </div>
        );
    }

    if (!currentUser) {
        return <span>unauthorized</span>;
    }

    if (isErrorMyPermissions) {
        return <ErrorPage errorText={i18next.t('errorPage.noPermissions')} />;
    }

    if (isErrorAllTemplates) {
        return <ErrorPage errorText={i18next.t('errorPage.systemUnavailable')} />;
    }

    return <Main />;
};

export default App;
