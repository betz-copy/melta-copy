import { styled, ListItemText } from '@mui/material';
import { NavLink } from 'react-router-dom';

const StyledListItemText = styled(ListItemText)({
    marginLeft: '20px',
});

const StyledLink = styled(NavLink)({
    textDecoration: 'none',
    color: 'inherit',
});

export { StyledListItemText, StyledLink };
