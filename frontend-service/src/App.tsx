import React, { useEffect, useState } from 'react';
import { ThemeProvider, CircularProgress } from '@mui/material';
import i18next from 'i18next';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { useQuery } from 'react-query';
import 'react-toastify/dist/ReactToastify.css';
import { AuthService } from './services/authService';
import { globalTheme } from './theme';
import Main from './Main';
import { RootState } from './store';
import { setUser } from './store/user';
import { BackendConfigState, getBackendConfigRequest } from './services/backendConfigService';
import './css/index.css';

const App: React.FC = () => {
    const currentUser = useSelector((state: RootState) => state.user);
    useQuery<BackendConfigState>('getBackendConfig', getBackendConfigRequest, {
        onError: () => {
            toast.error(i18next.t('error.config'));
        },
    });

    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initUser = async () => {
            const user = AuthService.getUser();
            if (user) {
                dispatch(setUser(user));
                setIsLoading(false);
            }
        };

        initUser();
    }, [dispatch]);

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

    return (
        <ThemeProvider theme={globalTheme}>
            <Main />
            <ToastContainer theme="light" position="bottom-right" autoClose={5000} limit={5} pauseOnFocusLoss={false} rtl newestOnTop />
        </ThemeProvider>
    );
};

export default App;
