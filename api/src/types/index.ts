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

export enum QuestionType {
    MCQ = "MCQ",
    FILL_BLANK = "FILL_BLANK",
    MATH_INPUT = "MATH_INPUT"
}
export enum Difficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}

export enum OptionType {
    A = "A",
    B = "B",
    C = "C",
    D = "D"
}