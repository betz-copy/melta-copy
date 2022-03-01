import React from 'react';
import ReactDOM from 'react-dom';
import './i18n';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

const queryClient = new QueryClient();

ReactDOM.render(
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </Provider>,
    document.getElementById('root'),
);
