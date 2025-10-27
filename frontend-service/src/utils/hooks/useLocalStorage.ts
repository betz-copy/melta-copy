import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { LocalStorage } from '../localStorage';

export const useLocalStorage = <T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] => {
    const [value, setValue] = useState<T>(LocalStorage.get(key) ?? defaultValue);

    useEffect(() => {
        LocalStorage.set(key, value);
    }, [value, key]);

    return [value, setValue];
};
