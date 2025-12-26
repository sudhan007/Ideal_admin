import { create } from "zustand";

type QuestionStoreType = {
    modelOpen: boolean;
    //   editEnabled: boolean;
    setModelOpen: (modelOpen: boolean) => void;
    //   setEditEnabled: (editEnabled: boolean) => void;
};

export const useQuestionsStore = create<QuestionStoreType>((set) => ({
    modelOpen: false,
    editEnabled: false,
    setModelOpen: (modelOpen) => set({ modelOpen }),
    //   setEditEnabled: (editEnabled) => set({ editEnabled }),
}));
