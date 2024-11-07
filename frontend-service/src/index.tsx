import { ThemeProvider } from '@mui/material';
import { AxiosError } from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ToastContainer } from 'react-toastify';
import App from './App';
import { TourWrapper } from './TourWrapper';
import './aggrid';
import './i18n';
import './initWindowGlobal';
import { useDarkModeStore } from './stores/darkMode';
import { darkTheme, lightTheme } from './theme';

if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => console.clear()); // eslint-disable-line no-console
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: (count, error) => {
                if ((error as AxiosError).response?.status === 403) {
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
            <ReactQueryDevtools />
        </QueryClientProvider>
    );
};

ReactDOM.render(<Index />, document.getElementById('root'));
