import { LinkOutlined as CopyUrlIcon } from '@mui/icons-material';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { toast } from 'react-toastify';
import IconButtonWithPopover from './IconButtonWithPopover';

interface ICopyUrlButtonProps {
    style?: CSSProperties;
}

export const CopyUrlButton: React.FC<ICopyUrlButtonProps> = ({ style }) => {
    return (
        <IconButtonWithPopover
            popoverText={i18next.t('copyUrl')}
            iconButtonProps={{
                onClick: () => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success(i18next.t('successfullyCopied'));
                },
            }}
        >
            <CopyUrlIcon style={style} />
        </IconButtonWithPopover>
    );
};
