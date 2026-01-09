import { create } from "zustand";

export interface ICourse {
    _id: string
    courseName: string
    mentor: Mentor
    strikePrice: string
    actualPrice: string
    board: string
    grade: string
    bannerImage: string
    createdAt: string
    chapterCount: number
    lessonCount: number
}

export interface Mentor {
    id: string
    staffName: string
    phoneNumber: string
    role: string
    image: string
}

type CourseStore = {
    currentCourse: ICourse | null;
    setCurrentCourse: (course: ICourse) => void;
    clearCurrentCourse: () => void;
};

export const useCourseStore = create<CourseStore>((set) => ({
    currentCourse: null,
    setCurrentCourse: (course) => set({ currentCourse: course }),
    clearCurrentCourse: () => set({ currentCourse: null }),
}));