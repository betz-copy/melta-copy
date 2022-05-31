import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { AxiosError } from 'axios';
import { store } from './store';
import App from './App';
import { globalTheme } from './theme';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: (_count, error) => {
                if ((error as AxiosError).response?.status === 403) {
                    return false;
                }

                return true;
            },
        },
    },
});

ReactDOM.render(
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={globalTheme}>
                <Router>
                    <App />
                    <ToastContainer theme="light" position="bottom-right" autoClose={5000} limit={5} pauseOnFocusLoss={false} rtl newestOnTop />
                </Router>
            </ThemeProvider>
            <ReactQueryDevtools />
        </QueryClientProvider>
    </Provider>,
    document.getElementById('root'),
);
