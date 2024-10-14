import React from 'react';
import '../css/loading.css';
import { environment } from '../globals';
import { useWorkspaceStore } from '../stores/workspace';
import { CustomImage } from './CustomIcon';

interface ILoadingAnimationProps {
    isLoading?: boolean;
}

export const LoadingAnimation: React.FC<ILoadingAnimationProps> = ({ isLoading }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40vh' }}>
            {isLoading && (
                <CustomImage
                    className="ld ld-bounce"
                    imageUrl={workspace.logoFileId ? `/api${environment.staticConfigs.api.storage}/${workspace.logoFileId}` : '/icons/Melta_Logo.svg'}
                    width="300px"
                    preserveColor
                />
            )}
        </div>
    );
};
