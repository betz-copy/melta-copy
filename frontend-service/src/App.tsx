import { MatomoProvider } from '@datapunt/matomo-tracker-react';
import Bowser from 'bowser';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation } from 'wouter';
import { LoadingAnimation } from './common/LoadingAnimation';
import './css/index.css';
import './css/loading.css';
import { environment } from './globals';
import Main from './Main';
import matomoInstance from './matomo';
import ErrorPage from './pages/ErrorPage';
import { AuthService } from './services/authService';
import { BackendConfigState, getBackendConfigRequest } from './services/backendConfigService';
import { getMyUserRequest } from './services/userService';
import { getById } from './services/workspacesService';
import { useUserStore } from './stores/user';

const App: React.FC = () => {
    const [isErrorMyUser, setIsErrorMyUser] = useState(true);

    const [_, navigate] = useLocation();

    useEffect(() => {
        const browser = Bowser.getParser(window.navigator.userAgent);
        const isValidBrowser = browser.satisfies({
            chrome: `>=${environment.minimumSupportedChromeVersion}`,
        });

        if (!isValidBrowser) {
            toast.error(i18next.t('error.unsupportedChromeVersion'), { autoClose: false, theme: 'colored', style: { fontSize: 'large' } });
        }
    }, []);

    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);

    const { isError: isErrorBackendConfig } = useQuery<BackendConfigState>('getBackendConfig', getBackendConfigRequest, {
        onError: () => {
            toast.error(i18next.t('error.config'));
        },
        enabled: !isErrorMyUser,
    });

    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        const initUser = async () => {
            const user = AuthService.getUser();

            if (!user || user.id === environment.unauthorizedId) return;

            try {
                const userFromDb = await getMyUserRequest();
                setUser({ ...user, ...userFromDb });

                const workspaceIds = Object.keys(userFromDb.permissions);
                if (workspaceIds.length === 1) {
                    const workspace = await getById(workspaceIds[0]);
                    navigate(`${workspace.path}/${workspace.name}${workspace.type}`);
                }

                setIsErrorMyUser(false);
            } finally {
                setIsLoadingUser(false);
            }
        };

        initUser();
    }, [setUser, navigate]);

    if (isLoadingUser) <LoadingAnimation />;

    if (!currentUser) return <span>unauthorized</span>;

    if (isErrorMyUser) return <ErrorPage errorText={i18next.t('errorPage.noPermissions')} />;

    if (isErrorBackendConfig) return <ErrorPage errorText={i18next.t('errorPage.systemUnavailable')} />;

    return (
        <MatomoProvider value={matomoInstance}>
            <Main />;
        </MatomoProvider>
    );
};

export default App;
