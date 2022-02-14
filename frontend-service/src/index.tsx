import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import { QueryClient, QueryClientProvider } from 'react-query';
import { StoreWrapper } from './store/StoreWrapper';
import App from './App';

const queryClient = new QueryClient();

ReactDOM.render(
    <StoreWrapper>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </StoreWrapper>,
    document.getElementById('root'),
);
