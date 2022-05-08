import { GridReadyEvent, GridApi } from 'ag-grid-community';

const checkIfBlocksLoaded = (api: GridApi) => {
    const status = api.getCacheBlockState()?.[0]?.pageStatus;
    return status === 'loaded';
};

// firstDataRendered bug with SSRM. https://github.com/ag-grid/ag-grid/issues/2662#issuecomment-526591093
export const onCacheBlockLoaded = (event: GridReadyEvent, cb: () => void) => {
    const interval = setInterval(() => {
        if (checkIfBlocksLoaded(event.api)) {
            clearInterval(interval);
            cb();
        }
    }, 50);
};
