/* eslint-disable no-promise-executor-return */
import axios from '../axios';
import { environment } from '../globals';

const { users } = environment.api;

export interface IUser {
    id: string;
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
    digitalIdentities: { uniqueId: string }[];
    firstName: string;
    lastName: string;
    fullName: string;
}

const getUserByIdRequest = async (userId: string) => {
    const { data } = await axios.get<IUser>(`${users}/${userId}`);
    return data;
};
const searchUsersRequest = async (search: string) => {
    if (search.length >= 2) {
        const { data } = await axios.get<IUser[]>(`${users}/search`, { params: { search } });
        return data;
    }
    return [];
};

export { searchUsersRequest, getUserByIdRequest };
