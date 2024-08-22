/* eslint-disable react/no-array-index-key */
import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { Grid } from '@mui/material';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { iFrameObjectToIFrameForm, searchIFrames } from '../../services/iFramesService';
import IFramesPageHeadline from './IFramesHeadline';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { IFrameWizard } from '../../common/wizards/iFrame';
import IFramePage from './IFramePage';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { Resizable } from './ResizableBox';

const IFramesPage: React.FC = () => {
    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    const [searchInput, setSearchInput] = useState<string>();
    const queryClient = useQueryClient();

    const [iFramesOrder, setIFramesOrder] = useState<{ name: string; id: string }[]>([]);
    const queryKey = ['searchIFrames', searchInput, iFramesOrder];
    const allIFrames = queryClient.getQueryData<IMongoIFrame[]>(['allIFrames', iFramesOrder]);
    const localStorageKey = 'iFramesOrder';

    useEffect(() => {
        console.log('wwwww');

        const storedOrder = localStorage.getItem(localStorageKey);
        if (storedOrder) {
            setIFramesOrder(JSON.parse(storedOrder));
        } else {
            const iFramesData = allIFrames?.map(({ name, _id }) => ({ name, id: _id })) || [];
            localStorage.setItem(localStorageKey, JSON.stringify(iFramesData));
            setIFramesOrder(iFramesData);
        }
    }, [allIFrames, queryClient]);
    useEffect(() => {
        console.log('kkkk', { iFramesOrder });
    }, [iFramesOrder]);
    return (
        <Grid dir="ltr" style={{ maxHeight: '1000px', display: 'flex', flexWrap: 'wrap' }}>
            <Grid container>
                <IFramesPageHeadline
                    onSearch={(searchValue) => setSearchInput(searchValue || undefined)}
                    setIFrameWizardDialogState={() => {
                        setIFrameWizardDialogState({ isWizardOpen: true, iFrame: null });
                    }}
                    iFramesOrder={iFramesOrder}
                    setIFramesOrder={setIFramesOrder}
                />
            </Grid>

            <Grid
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    paddingLeft: 20,
                    width: '100%',
                }}
            >
                {iFramesOrder && (
                    <InfiniteScroll<IMongoIFrame>
                        queryKey={queryKey}
                        queryFunction={async ({ pageParam }) => {
                            const index = pageParam ?? 0;
                            console.log({ index });

                            const currentOrder = iFramesOrder.slice(index, index + 4);
                            const iFramesIdsOrder = currentOrder.map((iFrame) => iFrame.id);

                            return searchIFrames({
                                search: searchInput,
                                ids: iFramesIdsOrder,
                            });
                        }}
                        onQueryError={(error) => {
                            console.log('Failed loading data:', error);
                            toast.error(i18next.t('iFrames.searchFailed'));
                        }}
                        getNextPageParam={(lastPage, allPages) => {
                            const nextPage = allPages.length * 4;
                            return lastPage.length ? nextPage : undefined;
                        }}
                        emptyText={i18next.t('iFrames.noIFramesFound')}
                        useContainer={false}
                    >
                        {(iFrame) => {
                            return (
                                <Resizable minHeight={500} minWidth={900} maxHeight={800} maxWidth={1800} id={iFrame._id}>
                                    <Grid padding={2} height="100%" width="100%">
                                        <IFramePage iFrame={iFrame} isIFramePage={false} setIFramesOrder={setIFramesOrder} />
                                    </Grid>
                                </Resizable>
                            );
                        }}
                    </InfiniteScroll>
                )}
            </Grid>
            <IFrameWizard
                open={iFrameWizardDialogState.isWizardOpen}
                handleClose={() => setIFrameWizardDialogState({ isWizardOpen: false, iFrame: null })}
                initialValues={iFrameObjectToIFrameForm(iFrameWizardDialogState.iFrame)}
                isEditMode={Boolean(iFrameWizardDialogState.iFrame)}
                setIFramesOrder={(value) => {
                    console.log({ value });
                    // setIFramesOrder(value);
                }}
            />
        </Grid>
    );
};

export default IFramesPage;
