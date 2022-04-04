import axios from '../axios';
import { environment } from '../globals';

const { searchUsers } = environment.api;

export interface IUser {
    _id: string;
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
    digitalIdentities: { uniqueId: string }[];
}

const searchUsersRequest = async (fullName: string) => {
    const { data } = await axios.get<IUser[]>(searchUsers, { params: { fullName } });
    return data;
};

export { searchUsersRequest };
