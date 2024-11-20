import React from 'react';
import { AxiosError } from 'axios';
import i18next from 'i18next';

const ErrorToast: React.FC<{ axiosError: AxiosError<{ metadata: { errorCode: string } }>; defaultErrorMessage: string }> = ({
    axiosError,
    defaultErrorMessage,
}) => {
    const errorIdentifier = axiosError.response?.data?.metadata?.errorCode;

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
