import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { AxiosError } from 'axios';
import { RootState, store } from './store';
import App from './App';
import { TourWrapper } from './TourWrapper';
import { darkTheme, lightTheme } from './theme';

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
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
                <Router>
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
                </Router>
            </ThemeProvider>
            <ReactQueryDevtools />
        </QueryClientProvider>
    );
};

ReactDOM.render(
    <Provider store={store}>
        <Index />
    </Provider>,
    document.getElementById('root'),
);
