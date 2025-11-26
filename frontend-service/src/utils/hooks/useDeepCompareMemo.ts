import { isEqual } from 'lodash';
import { useMemo, useRef } from 'react';

const useDeepCompareMemo = (value: () => any, dependencies: any[]) => {
    const ref = useRef(dependencies);
    if (!isEqual(dependencies, ref.current)) {
        ref.current = dependencies;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(value, ref.current);
};
export default useDeepCompareMemo;
