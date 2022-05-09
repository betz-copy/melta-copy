import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { store } from './store';
import App from './App';
import { globalTheme } from './theme';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.render(
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={globalTheme}>
                <App />
                <ToastContainer theme="light" position="bottom-right" autoClose={5000} limit={5} pauseOnFocusLoss={false} rtl newestOnTop />
            </ThemeProvider>
            <ReactQueryDevtools />
        </QueryClientProvider>
    </Provider>,
    document.getElementById('root'),
);
