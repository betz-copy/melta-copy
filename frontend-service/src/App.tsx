import Bowser from 'bowser';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoadingAnimation } from './common/LoadingAnimation';
import './css/index.css';
import { environment } from './globals';
import Main from './Main';
import ErrorPage from './pages/ErrorPage';
import { AuthService } from './services/authService';
import { BackendConfigState, getBackendConfigRequest } from './services/backendConfigService';
import { getMyPermissionsRequest, IPermissionsOfUser } from './services/permissionsService';
import { RootState } from './store';
import { setUser } from './store/reducers/user';

const App: React.FC = () => {
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
    const { isError: isErrorBackendConfig } = useQuery<BackendConfigState>('getBackendConfig', getBackendConfigRequest, {
        onError: () => {
            toast.error(i18next.t('error.config'));
        },
    });

    const { isLoading: isLoadingMyPermissions, isError: isErrorMyPermissions } = useQuery<IPermissionsOfUser>(
        'getMyPermissions',
        getMyPermissionsRequest,
        {
            onError: (error) => {
                // eslint-disable-next-line no-console
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

    if (isLoadingUser || isLoadingMyPermissions) <LoadingAnimation />;

    if (!currentUser) return <span>unauthorized</span>;

    if (isErrorMyPermissions) return <ErrorPage errorText={i18next.t('errorPage.noPermissions')} />;

    if (isErrorBackendConfig) return <ErrorPage errorText={i18next.t('errorPage.systemUnavailable')} />;

    return <Main />;
};

export default App;
