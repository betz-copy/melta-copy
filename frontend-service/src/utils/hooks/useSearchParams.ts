import { useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';

// TODO switch to useSearchParams from wouter when it's released
// https://github.com/molefrog/wouter/issues/368
export const useSearchParams = <T extends Record<string, string>>(defaultValue?: T) => {
    const [location, navigate] = useLocation();
    const searchString = useSearch();

    const setSearchParams = (params: Partial<T> | Record<string, string>, isDefault = false) => {
        let navigationLocation = location === '/' ? '' : location;

        if (Object.keys(params).length !== 0) {
            navigationLocation += `?${new URLSearchParams(params as T).toString()}`;
        }

        navigate(navigationLocation, { replace: isDefault, state: window.history.state});
      };

    // biome-ignore lint/correctness/useExhaustiveDependencies: set will re-render every time
    useEffect(() => {
        if (!searchString && defaultValue) setSearchParams(defaultValue, true);
    }, [searchString, defaultValue]);

    return [new URLSearchParams((searchString || defaultValue) ?? {}), setSearchParams] as const;
};
