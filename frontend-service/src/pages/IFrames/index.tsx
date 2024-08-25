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

    const [iFramesOrder, setIFramesOrder] = useState<string[]>([]);
    const queryKey = ['searchIFrames', searchInput, iFramesOrder];
    const allIFrames = queryClient.getQueryData<IMongoIFrame[]>('allIFrames');

    const localStorageKey = 'iFramesOrder';

    useEffect(() => {
        console.log('lioraaa', { allIFrames });

        const iFramesIds = allIFrames?.map(({ _id }) => _id) || [];
        localStorage.setItem(localStorageKey, JSON.stringify(iFramesIds));
        setIFramesOrder(iFramesIds);
    }, [allIFrames, queryClient]);

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

                            if (searchInput) {
                                const currentOrder = iFramesOrder.slice(index, index + 4);
                                return searchIFrames({
                                    search: searchInput,
                                    ids: currentOrder.map((iFrameId) => iFrameId),
                                });
                            }
                            return allIFrames!.slice(index, index + 4);
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
                setIFramesOrder={() => {}}
            />
        </Grid>
    );
};

export default IFramesPage;
