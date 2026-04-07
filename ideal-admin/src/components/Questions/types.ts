export type QuestionType = 'MCQ' | 'FILL_BLANK';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type OptionType = 'NORMAL' | 'LATEX' | 'IMAGE'
export type QuestionModel = 'PRE' | 'POST';
export type QuestionSet = 'SET_1' | 'SET_2' | 'SET_3' | 'SET_4' | 'SET_5'
    | 'SET_6' | 'SET_7' | 'SET_8' | 'SET_9' | 'SET_10';
export type SolutionType = "TEXT" | "IMAGE" | "VIDEO"
export interface Question {
    text: string;
    latex: string;
    image?: string;
}

export interface Option {
    id: string;
    answer: string;
    type?: OptionType;
    imageFile?: File | null; // transient — never sent to backend directly
}

export interface CreateQuestionSchema {
    courseId: string;
    chapterId: string;
    lessonId: string;
    type: QuestionType;
    difficulty: Difficulty;
    questionModel: QuestionModel;
    questionSet: QuestionSet;
    solutionType?: SolutionType;
    solution?: string;
    question: Question;
    options: Option[];
    correctAnswer: string;
}

export interface QuestionResponse {
    success: boolean;
    message: string;
    data?: {
        id: string;
        [key: string]: any;
    };
}