import { UseTreeItemStatus } from '@mui/x-tree-view-pro';
import { colors } from '../../../../theme';

const LIGHT_GRAY_COLOR = '#b5b5c3';

const DISABLED_COLOR_LIGHT = 'rgba(0, 0, 0, 0.08)';
const DISABLED_COLOR_DARK = 'rgba(255, 255, 255, 0.06)';

export const treeNodeContent = (status: UseTreeItemStatus, disabled: boolean, itemDepth: number, darkMode: boolean) => {
    const DISABLED_COLOR = darkMode ? DISABLED_COLOR_DARK : DISABLED_COLOR_LIGHT;

    const backgroundColor = disabled ? DISABLED_COLOR : darkMode ? '#2e2e2e' : '#fcfeff';

    const borderBottomColor = status.expandable || itemDepth === 0 ? colors.main.dark : LIGHT_GRAY_COLOR;

    return {
        position: 'relative',
        backgroundColor: `${backgroundColor} !important`,
        borderLeft: `4px solid ${darkMode ? colors.main.dark : colors.main.light}`,
        opacity: disabled ? 0.5 : 1,
        height: '48px',
        margin: '0.4rem 0.4rem 0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: '10px',

        '&:after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: -51,
            width: 47,
            height: '50%',
            borderBottom: `1px solid ${borderBottomColor}`,
        },
    };
};

export const treeNodeGroupTransition = {
    marginLeft: 1,
    paddingLeft: '40px',
    borderLeft: `1px solid ${LIGHT_GRAY_COLOR}`,
    maxHeight: '70%',
    position: 'relative',
};
