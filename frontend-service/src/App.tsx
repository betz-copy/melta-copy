import React, { useEffect, useState } from 'react';
import { ThemeProvider, CircularProgress } from '@mui/material';
import i18next from 'i18next';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAxios } from './axios';

import { AuthService } from './services/authService';
import { globalTheme } from './theme';
import Main from './Main';
import { RootState } from './store';
import { setUser } from './store/user';
import { setConfig } from './store/backendConfig';
import { environment } from './globals';

const App = () => {
    const currentUser = useSelector((state: RootState) => state.user);
    const paletteMode = useSelector((state: RootState) => state.userPreferences.paletteMode);
    const dispatch = useDispatch();
    const [{ data: configData, error: configError }] = useAxios(environment.api.config);

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

    useEffect(() => {
        dispatch(setConfig(configData));
    }, [configData, dispatch]);

    useEffect(() => {
        if (configError) {
            toast.error(i18next.t('error.config'));
        }
    }, [configError]);

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
        <ThemeProvider theme={globalTheme(paletteMode)}>
            <Main />
            <ToastContainer theme={paletteMode} position="bottom-right" autoClose={5000} limit={5} pauseOnFocusLoss={false} rtl newestOnTop />
        </ThemeProvider>
    );
};

export default App;
