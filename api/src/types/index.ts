export enum RoleType {
    ADMIN = "ADMIN",
    STUDENT = "STUDENT",
}
export enum LoginMethod {
    MOBILE = "MOBILE",
    EMAIL = "EMAIL"
}

export type StoreType = {
    id: string;
    role: RoleType
};