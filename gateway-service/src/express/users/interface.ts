export interface IUser {
    id: string;
    displayName: string; // custom displayName, not of kartoffel: `${fullName} - ${hierarchy}/${jobTitle}`
    digitalIdentities: { uniqueId: string }[];
}
