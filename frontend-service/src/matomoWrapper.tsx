import { createInstance, MatomoProvider } from '@datapunt/matomo-tracker-react';
import React from 'react';

export type MatomoTracker = ReturnType<typeof createInstance>;

interface Props {
    children: React.ReactElement;
    matomoInstance: MatomoTracker;
}

const MatomoWrapper: React.FC<Props> = ({ children, matomoInstance }) => {
    return <MatomoProvider value={matomoInstance} {...{ children }} />;
};

export default MatomoWrapper;
