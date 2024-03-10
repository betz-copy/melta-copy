export interface IKartoffelUser {
    id: string;
    fullName: string;
    hierarchy?: string;
    jobTitle?: string;
    firstName: string;
    lastName: string;
    digitalIdentities: { uniqueId: string; source: string }[];
}
