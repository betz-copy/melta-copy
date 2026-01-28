import { ThemeProvider } from '@mui/material';
import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ToastContainer } from 'react-toastify';
import App from './App';
import MuiXLicense from './common/MuiLicense';
import { TourWrapper } from './TourWrapper';
import './i18n';
import './initWindowGlobal';
import { useDarkModeStore } from './stores/darkMode';
import { darkTheme, lightTheme } from './theme';
import './utils/agGrid';
import './utils/cesiumLicense';
import { environment } from './globals';

if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => console.clear());
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: (count, error) => {
                if ((error as AxiosError).response?.status === StatusCodes.FORBIDDEN) {
                    return false;
                }

                return count < 2;
            },
        },
    },
});

const Index: React.FC = () => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
                <TourWrapper>
                    <App />
                </TourWrapper>
                <ToastContainer
                    theme={darkMode ? 'dark' : 'light'}
                    position="bottom-right"
                    autoClose={5000}
                    limit={5}
                    pauseOnFocusLoss={false}
                    rtl
                    newestOnTop
                />
            </ThemeProvider>
            {environment.isDev && <ReactQueryDevtools />}
            <MuiXLicense />
        </QueryClientProvider>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<Index />);
}
