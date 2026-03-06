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
export enum QuestionModel {
    POST = "POST",
    PRE = "PRE"
}

export enum OptionType {
    A = "A",
    B = "B",
    C = "C",
    D = "D"
}
export enum OptionsFormat {
    NORMAL = "NORMAL",
    LATEX = "LATEX"
}

export const passPercentage = 80

export enum TaskStatus {
    SUBMITTED = "SUBMITTED",
    RE_SUBMITTED = "RE_SUBMITTED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED"
}
export enum SubmissionType {
    IMAGES = "IMAGES",
    PDF = "PDF",
    GOOGLE_DRIVE_LINK = "GOOGLE_DRIVE_LINK"
}

export enum SolutionType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    TEXT = "TEXT"
}

export enum StudentType {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE"
}

export enum SessionType {
    CLASS = "CLASS",
    HOLIDAY = "HOLIDAY",
    CANCELLED = "CANCELLED"
}
export enum AttendanceStatus {
    PRESENT = "PRESENT",
    ABSENT = "ABSENT",
    LATE = "LATE"
}