import { isEqual } from 'lodash';
import { useMemo, useRef } from 'react';

const useDeepCompareMemo = (value: () => any, dependencies: any[]) => {
    const ref = useRef(dependencies);
    if (!isEqual(dependencies, ref.current)) ref.current = dependencies;

    // biome-ignore lint/correctness/useExhaustiveDependencies: idk what to do here
    return useMemo(value, ref.current);
};
export default useDeepCompareMemo;
