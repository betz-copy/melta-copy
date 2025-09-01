import React from 'react';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { IErrorResponse } from '../interfaces/error';

const ErrorToast: React.FC<{ axiosError: AxiosError; defaultErrorMessage: string }> = ({ axiosError, defaultErrorMessage }) => {
    const errorIdentifier = (axiosError.response?.data as IErrorResponse)?.metadata?.errorCode;

    if (!errorIdentifier) {
        return <div>{defaultErrorMessage}</div>;
    }

    const extraErrorText = i18next.t(`errorCodes.${errorIdentifier}`);

    return (
        <>
            <div>{defaultErrorMessage}</div>
            <div>{extraErrorText}</div>
        </>
    );
};

export { ErrorToast };
