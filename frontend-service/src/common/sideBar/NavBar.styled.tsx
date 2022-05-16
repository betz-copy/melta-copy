import { styled, ListItemText } from '@mui/material';
import { NavLink } from 'react-router-dom';

const StyledListItemText = styled(ListItemText)({
    marginLeft: '20px',
});

const StyledLink = styled(NavLink)<{ disabled: boolean }>(({ disabled }) => ({
    textDecoration: 'none',
    color: 'inherit',
    pointerEvents: disabled ? 'none' : 'auto',
}));

export { StyledListItemText, StyledLink };
