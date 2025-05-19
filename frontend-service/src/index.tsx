import './initWindowGlobal';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import './utils/agGrid';
import './utils/cesiumLicense';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ThemeProvider } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import App from './App';
import { TourWrapper } from './TourWrapper';
import { darkTheme, lightTheme } from './theme';
import { useDarkModeStore } from './stores/darkMode';
import MuiXLicense from './common/MuiLicense';

if (import.meta.hot) {
    // eslint-disable-next-line no-console
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
                <StrictMode>
                    <TourWrapper>
                        <App />
                    </TourWrapper>
                </StrictMode>
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
            <ReactQueryDevtools />
            <MuiXLicense />
        </QueryClientProvider>
    );
};

ReactDOM.render(<Index />, document.getElementById('root'));
