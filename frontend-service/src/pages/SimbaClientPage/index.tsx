import React from 'react';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { AuthService } from '../../services/authService';

const SimbaClientPage: React.FC = () => {
    const [location, navigate] = useLocation();
    const queryClient = useQueryClient();

    const user = AuthService.getUser();

    console.log(user);

    return <div>SimbaClientPage</div>;
};

export default SimbaClientPage;
