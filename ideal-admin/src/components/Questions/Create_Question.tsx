// import { useState, useEffect, useRef } from 'react';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { useNavigate } from '@tanstack/react-router';
// import { ArrowLeft, FileText, Video, Image, Upload, X } from 'lucide-react';
// import 'katex/dist/katex.min.css';
// import type {
//   CreateQuestionSchema,
//   Difficulty,
//   OptionType,
//   QuestionModel,
//   QuestionSet,
//   QuestionType,
// } from './types';
// import OptionInput from './Optioninput';
// import MathPreview from './MathPreview';
// import { _axios } from '@/lib/axios';

// export enum SolutionType {
//   IMAGE = 'IMAGE',
//   VIDEO = 'VIDEO',
//   TEXT = 'TEXT',
// }

// interface CreateQuestionProps {
//   courseId: string;
//   lessonId: string;
//   chapterId: string;
//   questionId?: string;
//   isEditMode?: boolean;
// }

// const CreateMathsQuiz = ({
//   courseId,
//   lessonId,
//   chapterId,
//   questionId,
//   isEditMode = false,
// }: CreateQuestionProps) => {
//   const navigate = useNavigate();
//   const imageInputRef = useRef<HTMLInputElement>(null);

//   const [formData, setFormData] = useState<CreateQuestionSchema>({
//     courseId: courseId || '',
//     chapterId: chapterId || '',
//     lessonId: lessonId || '',
//     type: 'MCQ',
//     difficulty: 'MEDIUM',
//     questionModel: 'PRE',
//     questionSet: 'SET_1',
//     question: {
//       text: '',
//       latex: '',
//     },
//     options: [
//       { id: 'A', answer: '', type: 'LATEX' },
//       { id: 'B', answer: '', type: 'LATEX' },
//       { id: 'C', answer: '', type: 'LATEX' },
//       { id: 'D', answer: '', type: 'LATEX' },
//     ],
//     correctAnswer: '',
//     solutionType: SolutionType.TEXT,
//     solution: '',
//   });

//   const [questionInputType, setQuestionInputType] = useState<
//     'NORMAL' | 'LATEX'
//   >('LATEX');
//   const [showPreview, setShowPreview] = useState(false);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [imageFile, setImageFile] = useState<File | null>(null);

//   const { data: existingQuestion, isLoading: isLoadingQuestion } = useQuery({
//     queryKey: ['question-Id', questionId],
//     queryFn: async () => {
//       const response = await _axios.get(`/question/${questionId}`);
//       return response.data.question;
//     },
//     enabled: isEditMode && !!questionId,
//   });

//   useEffect(() => {
//     if (existingQuestion && isEditMode) {
//       setFormData({
//         courseId: existingQuestion.courseId,
//         chapterId: existingQuestion.chapterId,
//         lessonId: existingQuestion.lessonId,
//         type: existingQuestion.type,
//         difficulty: existingQuestion.difficulty,
//         questionModel: existingQuestion.questionModel,
//         questionSet: existingQuestion.questionSet || 'SET_1',
//         question: existingQuestion.question,
//         options: existingQuestion.options || [
//           { id: 'A', answer: '', type: 'LATEX' },
//           { id: 'B', answer: '', type: 'LATEX' },
//           { id: 'C', answer: '', type: 'LATEX' },
//           { id: 'D', answer: '', type: 'LATEX' },
//         ],
//         correctAnswer: existingQuestion.correctAnswer,
//         solutionType: existingQuestion.solutionType || SolutionType.TEXT,
//         solution: existingQuestion.solution || '',
//       });

//       if (existingQuestion.question.latex) {
//         setQuestionInputType('LATEX');
//       }

//       // If existing solution is an image URL, show preview
//       if (
//         existingQuestion.solutionType === SolutionType.IMAGE &&
//         existingQuestion.solution
//       ) {
//         setImagePreview(existingQuestion.solution);
//       }
//     }
//   }, [existingQuestion, isEditMode]);

//   const mutation = useMutation({
//     mutationFn: async (data: CreateQuestionSchema & { imageFile?: File }) => {
//       const formData = new FormData();

//       // Always add the JSON part as a string field
//       formData.append(
//         'json',
//         JSON.stringify({
//           ...data,
//           // Remove imageFile from json (we send it separately)
//           solution:
//             data.solutionType === SolutionType.IMAGE ? '' : data.solution,
//           // Keep other fields intact
//         }),
//       );

//       // If we have a real file → add it
//       if (data.imageFile) {
//         formData.append('solutionImage', data.imageFile);
//       }

//       const isEdit = isEditMode && !!questionId;
//       const url = isEdit ? `/question/${questionId}` : '/question';
//       const method = isEdit ? 'PATCH' : 'POST';

//       const response = await _axios({
//         url,
//         method,
//         data: formData,
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       return response.data;
//     },
//     onSuccess: (data) => {
//       console.log('Question saved successfully:', data);
//       navigate({
//         to: '/courses/quizes',
//         search: {
//           page: 1,
//           limit: 10,
//           lessonId,
//           courseId,
//           chapterId,
//           mode: 'list',
//         },
//       });
//     },
//     onError: (error) => {
//       console.error('Error saving question:', error);
//     },
//   });

//   const handleQuestionChange = (value: string) => {
//     if (questionInputType === 'LATEX') {
//       setFormData((prev) => ({
//         ...prev,
//         question: { ...prev.question, latex: value },
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         question: { ...prev.question, text: value },
//       }));
//     }
//   };

//   const handleOptionChange = (
//     index: number,
//     value: string,
//     type: OptionType,
//   ) => {
//     const newOptions = [...formData.options];
//     newOptions[index] = { ...newOptions[index], answer: value, type };
//     setFormData((prev) => ({ ...prev, options: newOptions }));
//   };

//   const handleSolutionTypeChange = (type: SolutionType) => {
//     setFormData((prev) => ({ ...prev, solutionType: type, solution: '' }));
//     setImagePreview(null);
//     setImageFile(null);
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setImageFile(file);
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImagePreview(reader.result as string);
//     };

//     reader.readAsDataURL(file);
//     // Store a placeholder so validation passes; actual URL set during submit
//     setFormData((prev) => ({ ...prev, solution: file.name }));
//   };

//   const handleRemoveImage = () => {
//     setImagePreview(null);
//     setImageFile(null);
//     setFormData((prev) => ({ ...prev, solution: '' }));
//     if (imageInputRef.current) imageInputRef.current.value = '';
//   };

//   const handleBack = () => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page: 1,
//         limit: 10,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'list',
//       },
//     });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!formData.courseId || !formData.chapterId || !formData.lessonId) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     if (formData.type === 'MCQ' && !formData.correctAnswer) {
//       alert('Please select the correct answer');
//       return;
//     }

//     if (formData.type === 'FILL_BLANK' && !formData.correctAnswer.trim()) {
//       alert('Please enter the correct answer for Fill in the Blank');
//       return;
//     }

//     if (!formData.solution.trim()) {
//       alert('Please provide a solution');
//       return;
//     }

//     const submitData = {
//       ...formData,
//       options: formData.type === 'MCQ' ? formData.options : [],
//       imageFile:
//         formData.solutionType === SolutionType.IMAGE ? imageFile : undefined,
//     };

//     mutation.mutate(submitData);
//   };

//   if (isLoadingQuestion) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="spinner mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading question...</p>
//         </div>
//       </div>
//     );
//   }

//   const solutionTypeOptions = [
//     {
//       value: SolutionType.TEXT,
//       label: 'Text',
//       icon: FileText,
//       color: 'indigo',
//     },
//     {
//       value: SolutionType.VIDEO,
//       label: 'Video',
//       icon: Video,
//       color: 'rose',
//     },
//     {
//       value: SolutionType.IMAGE,
//       label: 'Image',
//       icon: Image,
//       color: 'emerald',
//     },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={handleBack}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 title="Back to Questions">
//                 <ArrowLeft className="w-6 h-6 text-gray-600" />
//               </button>
//               <div>
//                 <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                   {isEditMode ? 'Edit' : 'Create'} Math Quiz
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                   {isEditMode
//                     ? 'Update your math question'
//                     : 'Design engaging math questions with LaTeX support'}
//                 </p>
//               </div>
//             </div>
//             <button
//               type="button"
//               onClick={() => setShowPreview(!showPreview)}
//               className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-all duration-200 shadow-sm">
//               {showPreview ? 'Hide' : 'Show'} Preview
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Form Section */}
//           <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Basic Info */}
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
//                   <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">
//                     1
//                   </span>
//                   Basic Information
//                 </h2>

//                 <div className="grid grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Type
//                     </label>
//                     <select
//                       value={formData.type}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           type: e.target.value as QuestionType,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
//                       <option value="MCQ">MCQ</option>
//                       <option value="FILL_BLANK">Fill in the Blank</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Difficulty
//                     </label>
//                     <select
//                       value={formData.difficulty}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           difficulty: e.target.value as Difficulty,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
//                       <option value="EASY">Easy</option>
//                       <option value="MEDIUM">Medium</option>
//                       <option value="HARD">Hard</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Question Type
//                     </label>
//                     <select
//                       value={formData.questionModel}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           questionModel: e.target.value as QuestionModel,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
//                       <option value="PRE">Pre Question</option>
//                       <option value="POST">Post Question</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Question Set
//                     </label>
//                     <select
//                       value={formData.questionSet}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           questionSet: e.target.value as QuestionSet,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
//                       required>
//                       {Array.from({ length: 10 }, (_, i) => i + 1).map(
//                         (num) => (
//                           <option key={num} value={`SET_${num}`}>
//                             SET {num}
//                           </option>
//                         ),
//                       )}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Question */}
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
//                   <span className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm">
//                     2
//                   </span>
//                   Question
//                 </h2>

//                 <div className="flex gap-2 mb-3">
//                   <button
//                     type="button"
//                     onClick={() => setQuestionInputType('LATEX')}
//                     className={`px-4 py-2 rounded-lg font-medium transition-all ${
//                       questionInputType === 'LATEX'
//                         ? 'bg-purple-600 text-white shadow-md'
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}>
//                     LaTeX
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setQuestionInputType('NORMAL')}
//                     className={`px-4 py-2 rounded-lg font-medium transition-all ${
//                       questionInputType === 'NORMAL'
//                         ? 'bg-purple-600 text-white shadow-md'
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}>
//                     Normal Text
//                   </button>
//                 </div>

//                 {questionInputType === 'NORMAL' ? (
//                   <textarea
//                     value={formData.question.text}
//                     onChange={(e) => handleQuestionChange(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none"
//                     rows={4}
//                     placeholder="Enter your question here..."
//                     required
//                   />
//                 ) : (
//                   <textarea
//                     value={formData.question.latex}
//                     onChange={(e) => handleQuestionChange(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none font-mono text-sm"
//                     rows={4}
//                     placeholder="Enter LaTeX formula... e.g., $\\alpha + \\beta = \\frac{1}{2}$"
//                     required
//                   />
//                 )}
//               </div>

//               {/* MCQ Options */}
//               {formData.type === 'MCQ' && (
//                 <div className="space-y-4">
//                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                     <span className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center text-sm">
//                       3
//                     </span>
//                     Options (A–D)
//                   </h2>

//                   <div className="space-y-3">
//                     {formData.options.map((option, index) => (
//                       <OptionInput
//                         key={option.id}
//                         option={option}
//                         index={index}
//                         isCorrect={formData.correctAnswer === option.id}
//                         onCorrectChange={(id) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             correctAnswer: id,
//                           }))
//                         }
//                         onChange={handleOptionChange}
//                         onRemove={() => {}}
//                         canRemove={false}
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Fill in the Blank - Correct Answer */}
//               {formData.type === 'FILL_BLANK' && (
//                 <div className="space-y-4">
//                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                     <span className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center text-sm">
//                       3
//                     </span>
//                     Correct Answer
//                   </h2>

//                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
//                     <input
//                       type="text"
//                       value={formData.correctAnswer}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           correctAnswer: e.target.value.trim(),
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
//                       placeholder="Enter the exact correct answer (case sensitive)"
//                       required
//                     />
//                     <p className="mt-2 text-sm text-gray-500">
//                       Students must type this exact text to get it correct.
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {/* ───────────────── SOLUTION SECTION ───────────────── */}
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                   <span className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center text-sm">
//                     4
//                   </span>
//                   Solution
//                 </h2>

//                 {/* Solution type selector */}
//                 <div className="flex gap-3">
//                   {solutionTypeOptions.map(
//                     ({ value, label, icon: Icon, color }) => {
//                       const isActive = formData.solutionType === value;
//                       const colorMap: Record<string, string> = {
//                         indigo: isActive
//                           ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
//                           : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border-gray-200',
//                         rose: isActive
//                           ? 'bg-rose-600 text-white shadow-md border-rose-600'
//                           : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border-gray-200',
//                         emerald: isActive
//                           ? 'bg-emerald-600 text-white shadow-md border-emerald-600'
//                           : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border-gray-200',
//                       };
//                       return (
//                         <button
//                           key={value}
//                           type="button"
//                           onClick={() => handleSolutionTypeChange(value)}
//                           className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${colorMap[color]}`}>
//                           <Icon className="w-4 h-4" />
//                           {label}
//                         </button>
//                       );
//                     },
//                   )}
//                 </div>

//                 {/* TEXT solution */}
//                 {formData.solutionType === SolutionType.TEXT && (
//                   <div>
//                     <textarea
//                       value={formData.solution}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           solution: e.target.value,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none resize-none"
//                       rows={5}
//                       placeholder="Write the step-by-step solution here..."
//                       required
//                     />
//                   </div>
//                 )}

//                 {/* VIDEO solution */}
//                 {formData.solutionType === SolutionType.VIDEO && (
//                   <div>
//                     <div className="relative">
//                       <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                       <input
//                         type="url"
//                         value={formData.solution}
//                         onChange={(e) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             solution: e.target.value,
//                           }))
//                         }
//                         className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all outline-none"
//                         placeholder="https://youtube.com/watch?v=... or video URL"
//                         required
//                       />
//                     </div>
//                     <p className="mt-2 text-sm text-gray-500">
//                       Paste a YouTube, or any video link as the solution.
//                     </p>
//                   </div>
//                 )}

//                 {/* IMAGE solution */}
//                 {formData.solutionType === SolutionType.IMAGE && (
//                   <div>
//                     {!imagePreview ? (
//                       <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors">
//                         <div className="flex flex-col items-center gap-2 text-emerald-600">
//                           <Upload className="w-8 h-8" />
//                           <span className="font-semibold text-sm">
//                             Click to upload solution image
//                           </span>
//                           <span className="text-xs text-gray-400">
//                             PNG, JPG, WEBP up to 5MB
//                           </span>
//                         </div>
//                         <input
//                           ref={imageInputRef}
//                           type="file"
//                           accept="image/*"
//                           className="hidden"
//                           onChange={handleImageChange}
//                           required={!imagePreview}
//                         />
//                       </label>
//                     ) : (
//                       <div className="relative rounded-xl overflow-hidden border border-emerald-200">
//                         <img
//                           src={imagePreview}
//                           alt="Solution preview"
//                           className="w-full max-h-64 object-contain bg-gray-50"
//                         />
//                         <button
//                           type="button"
//                           onClick={handleRemoveImage}
//                           className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md">
//                           <X className="w-4 h-4" />
//                         </button>
//                         <div className="px-3 py-2 bg-white border-t border-emerald-100">
//                           <p className="text-xs text-gray-500 truncate">
//                             {imageFile?.name ?? 'Existing image'}
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//               {/* ──────────────────────────────────────────────────── */}

//               {/* Submit */}
//               <div className="pt-6 flex gap-3">
//                 <button
//                   type="button"
//                   onClick={handleBack}
//                   className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-200">
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={mutation.isPending}
//                   className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
//                   {mutation.isPending
//                     ? isEditMode
//                       ? 'Updating...'
//                       : 'Creating...'
//                     : isEditMode
//                       ? 'Update Question'
//                       : 'Create Question'}
//                 </button>
//               </div>

//               {mutation.isError && (
//                 <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
//                   Error: {mutation.error.message}
//                 </div>
//               )}
//             </form>
//           </div>

//           {/* Preview Section */}
//           {showPreview && (
//             <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100 sticky top-6 h-fit">
//               <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//                 <svg
//                   className="w-6 h-6 text-indigo-600"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                   />
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//                   />
//                 </svg>
//                 Live Preview
//               </h2>

//               <div className="space-y-6">
//                 <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
//                   <div className="flex items-start gap-2 mb-3 flex-wrap">
//                     <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">
//                       {formData.type}
//                     </span>
//                     <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
//                       {formData.difficulty}
//                     </span>
//                     <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
//                       {formData.questionModel}
//                     </span>
//                     <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg">
//                       {formData.questionSet.replace('_', ' ')}
//                     </span>
//                   </div>

//                   <div className="text-gray-800 text-lg leading-relaxed">
//                     <MathPreview
//                       text={formData.question.text}
//                       latex={formData.question.latex}
//                     />
//                   </div>
//                 </div>

//                 {/* MCQ Preview */}
//                 {formData.type === 'MCQ' && formData.options.length > 0 && (
//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-gray-700">Options:</h3>
//                     {formData.options.map((option) => (
//                       <div
//                         key={option.id}
//                         className={`p-4 rounded-xl border-2 transition-all ${
//                           formData.correctAnswer === option.id
//                             ? 'bg-green-50 border-green-400'
//                             : 'bg-gray-50 border-gray-200'
//                         }`}>
//                         <div className="flex items-start gap-3">
//                           <span
//                             className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
//                               formData.correctAnswer === option.id
//                                 ? 'bg-green-500 text-white'
//                                 : 'bg-gray-300 text-gray-700'
//                             }`}>
//                             {option.id}
//                           </span>
//                           <div className="flex-1 pt-1">
//                             {option.type === 'LATEX' ? (
//                               <MathPreview text="" latex={option.answer} />
//                             ) : (
//                               <span className="text-gray-800">
//                                 {option.answer || '(Empty)'}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {/* Fill in the Blank Preview */}
//                 {formData.type === 'FILL_BLANK' && (
//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-gray-700">
//                       Correct Answer:
//                     </h3>
//                     <div className="p-4 bg-green-50 border-2 border-green-400 rounded-xl">
//                       <p className="text-gray-800 font-medium">
//                         {formData.correctAnswer || '(not set)'}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Solution Preview */}
//                 {formData.solution && (
//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-gray-700 flex items-center gap-2">
//                       Solution
//                       <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-md">
//                         {formData.solutionType}
//                       </span>
//                     </h3>
//                     <div className="p-4 bg-teal-50 border-2 border-teal-200 rounded-xl">
//                       {formData.solutionType === SolutionType.TEXT && (
//                         <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
//                           {formData.solution}
//                         </p>
//                       )}
//                       {formData.solutionType === SolutionType.VIDEO && (
//                         <a
//                           href={formData.solution}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm underline underline-offset-2 break-all">
//                           <Video className="w-4 h-4 flex-shrink-0" />
//                           {formData.solution}
//                         </a>
//                       )}
//                       {formData.solutionType === SolutionType.IMAGE &&
//                         imagePreview && (
//                           <img
//                             src={imagePreview}
//                             alt="Solution"
//                             className="w-full rounded-lg object-contain max-h-48"
//                           />
//                         )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateMathsQuiz;

// import { useState, useEffect, useRef } from 'react';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { useNavigate } from '@tanstack/react-router';
// import { ArrowLeft, FileText, Video, Image, Upload, X } from 'lucide-react';
// import 'katex/dist/katex.min.css';
// import type {
//   CreateQuestionSchema,
//   Difficulty,
//   OptionType,
//   QuestionModel,
//   QuestionSet,
//   QuestionType,
// } from './types';
// import OptionInput from './Optioninput';
// import MathPreview from './MathPreview';
// import { _axios } from '@/lib/axios';

// export enum SolutionType {
//   IMAGE = 'IMAGE',
//   VIDEO = 'VIDEO',
//   TEXT = 'TEXT',
// }

// interface CreateQuestionProps {
//   courseId: string;
//   lessonId: string;
//   chapterId: string;
//   questionId?: string;
//   isEditMode?: boolean;
// }

// const CreateMathsQuiz = ({
//   courseId,
//   lessonId,
//   chapterId,
//   questionId,
//   isEditMode = false,
// }: CreateQuestionProps) => {
//   const navigate = useNavigate();
//   const imageInputRef = useRef<HTMLInputElement>(null);

//   const [formData, setFormData] = useState<CreateQuestionSchema>({
//     courseId: courseId || '',
//     chapterId: chapterId || '',
//     lessonId: lessonId || '',
//     type: 'MCQ',
//     difficulty: 'MEDIUM',
//     questionModel: 'PRE',
//     questionSet: 'SET_1',
//     question: {
//       text: '',
//       latex: '',
//     },
//     options: [
//       { id: 'A', answer: '', type: 'LATEX' },
//       { id: 'B', answer: '', type: 'LATEX' },
//       { id: 'C', answer: '', type: 'LATEX' },
//       { id: 'D', answer: '', type: 'LATEX' },
//     ],
//     correctAnswer: '',
//     solutionType: SolutionType.TEXT,
//     solution: '',
//   });

//   const [questionInputType, setQuestionInputType] = useState<
//     'NORMAL' | 'LATEX'
//   >('LATEX');
//   const [showPreview, setShowPreview] = useState(false);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [imageFile, setImageFile] = useState<File | null>(null);

//   const { data: existingQuestion, isLoading: isLoadingQuestion } = useQuery({
//     queryKey: ['question-Id', questionId],
//     queryFn: async () => {
//       const response = await _axios.get(`/question/${questionId}`);
//       return response.data.question;
//     },
//     enabled: isEditMode && !!questionId,
//   });

//   useEffect(() => {
//     if (existingQuestion && isEditMode) {
//       setFormData({
//         courseId: existingQuestion.courseId,
//         chapterId: existingQuestion.chapterId,
//         lessonId: existingQuestion.lessonId,
//         type: existingQuestion.type,
//         difficulty: existingQuestion.difficulty,
//         questionModel: existingQuestion.questionModel,
//         questionSet: existingQuestion.questionSet || 'SET_1',
//         question: existingQuestion.question,
//         options: existingQuestion.options || [
//           { id: 'A', answer: '', type: 'LATEX' },
//           { id: 'B', answer: '', type: 'LATEX' },
//           { id: 'C', answer: '', type: 'LATEX' },
//           { id: 'D', answer: '', type: 'LATEX' },
//         ],
//         correctAnswer: existingQuestion.correctAnswer,
//         solutionType: existingQuestion.solutionType || SolutionType.TEXT,
//         solution: existingQuestion.solution || '',
//       });

//       if (existingQuestion.question.latex) {
//         setQuestionInputType('LATEX');
//       }

//       // If existing solution is an image URL, show preview
//       if (
//         existingQuestion.solutionType === SolutionType.IMAGE &&
//         existingQuestion.solution
//       ) {
//         setImagePreview(existingQuestion.solution);
//       }
//     }
//   }, [existingQuestion, isEditMode]);

//   // ─── KEY FIX: build FormData when solutionType is IMAGE ──────────────────
//   const buildPayload = (
//     data: CreateQuestionSchema,
//   ): FormData | CreateQuestionSchema => {
//     if (data.solutionType === SolutionType.IMAGE && imageFile) {
//       const fd = new FormData();

//       // Append every scalar field
//       fd.append('courseId', data.courseId);
//       fd.append('chapterId', data.chapterId);
//       fd.append('lessonId', data.lessonId);
//       fd.append('type', data.type);
//       fd.append('difficulty', data.difficulty);
//       fd.append('questionModel', data.questionModel);
//       fd.append('questionSet', data.questionSet);
//       fd.append('solutionType', data.solutionType);
//       fd.append('correctAnswer', data.correctAnswer);
//       fd.append('question', JSON.stringify(data.question));
//       fd.append(
//         'options',
//         JSON.stringify(data.type === 'MCQ' ? data.options : []),
//       );
//       fd.append('solution', imageFile);

//       return fd;
//     }

//     // TEXT / VIDEO — plain JSON, just fix the options array
//     return {
//       ...data,
//       options: data.type === 'MCQ' ? data.options : [],
//     };
//   };
//   // ─────────────────────────────────────────────────────────────────────────

//   const mutation = useMutation({
//     mutationFn: async (data: CreateQuestionSchema) => {
//       const payload = buildPayload(data);
//       const isFormData = payload instanceof FormData;

//       const config = isFormData
//         ? { headers: { 'Content-Type': 'multipart/form-data' } }
//         : { headers: { 'Content-Type': 'application/json' } };

//       if (isEditMode) {
//         return _axios.patch(`/question/${questionId}`, payload, config);
//       }
//       return _axios.post('/question', payload, config);
//     },
//     onSuccess: (data) => {
//       console.log('Question saved successfully:', data);
//       navigate({
//         to: '/courses/quizes',
//         search: {
//           page: 1,
//           limit: 10,
//           lessonId,
//           courseId,
//           chapterId,
//           mode: 'list',
//         },
//       });
//     },
//     onError: (error) => {
//       console.error('Error saving question:', error);
//     },
//   });

//   const handleQuestionChange = (value: string) => {
//     if (questionInputType === 'LATEX') {
//       setFormData((prev) => ({
//         ...prev,
//         question: { ...prev.question, latex: value },
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         question: { ...prev.question, text: value },
//       }));
//     }
//   };

//   const handleOptionChange = (
//     index: number,
//     value: string,
//     type: OptionType,
//   ) => {
//     const newOptions = [...formData.options];
//     newOptions[index] = { ...newOptions[index], answer: value, type };
//     setFormData((prev) => ({ ...prev, options: newOptions }));
//   };

//   const handleSolutionTypeChange = (type: SolutionType) => {
//     setFormData((prev) => ({ ...prev, solutionType: type, solution: '' }));
//     setImagePreview(null);
//     setImageFile(null);
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setImageFile(file);
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setImagePreview(reader.result as string);
//     };
//     reader.readAsDataURL(file);
//     // Use the filename as a non-empty placeholder so validation passes.
//     // The actual upload happens via FormData in buildPayload.
//     setFormData((prev) => ({ ...prev, solution: file.name }));
//   };

//   const handleRemoveImage = () => {
//     setImagePreview(null);
//     setImageFile(null);
//     setFormData((prev) => ({ ...prev, solution: '' }));
//     if (imageInputRef.current) imageInputRef.current.value = '';
//   };

//   const handleBack = () => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page: 1,
//         limit: 10,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'list',
//       },
//     });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!formData.courseId || !formData.chapterId || !formData.lessonId) {
//       alert('Please fill in all required fields');
//       return;
//     }

//     if (formData.type === 'MCQ' && !formData.correctAnswer) {
//       alert('Please select the correct answer');
//       return;
//     }

//     if (formData.type === 'FILL_BLANK' && !formData.correctAnswer.trim()) {
//       alert('Please enter the correct answer for Fill in the Blank');
//       return;
//     }

//     if (!formData.solution.trim()) {
//       alert('Please provide a solution');
//       return;
//     }

//     // For IMAGE type, ensure a file is selected (on create) or an existing URL exists (on edit)
//     if (
//       formData.solutionType === SolutionType.IMAGE &&
//       !imageFile &&
//       !imagePreview
//     ) {
//       alert('Please upload a solution image');
//       return;
//     }

//     mutation.mutate(formData);
//   };

//   if (isLoadingQuestion) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="spinner mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading question...</p>
//         </div>
//       </div>
//     );
//   }

//   const solutionTypeOptions = [
//     {
//       value: SolutionType.TEXT,
//       label: 'Text',
//       icon: FileText,
//       color: 'indigo',
//     },
//     { value: SolutionType.VIDEO, label: 'Video', icon: Video, color: 'rose' },
//     {
//       value: SolutionType.IMAGE,
//       label: 'Image',
//       icon: Image,
//       color: 'emerald',
//     },
//   ] as const;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={handleBack}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                 title="Back to Questions">
//                 <ArrowLeft className="w-6 h-6 text-gray-600" />
//               </button>
//               <div>
//                 <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                   {isEditMode ? 'Edit' : 'Create'} Math Quiz
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                   {isEditMode
//                     ? 'Update your math question'
//                     : 'Design engaging math questions with LaTeX support'}
//                 </p>
//               </div>
//             </div>
//             <button
//               type="button"
//               onClick={() => setShowPreview(!showPreview)}
//               className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-all duration-200 shadow-sm">
//               {showPreview ? 'Hide' : 'Show'} Preview
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Form Section */}
//           <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Basic Info */}
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
//                   <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">
//                     1
//                   </span>
//                   Basic Information
//                 </h2>

//                 <div className="grid grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Type
//                     </label>
//                     <select
//                       value={formData.type}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           type: e.target.value as QuestionType,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
//                       <option value="MCQ">MCQ</option>
//                       <option value="FILL_BLANK">Fill in the Blank</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Difficulty
//                     </label>
//                     <select
//                       value={formData.difficulty}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           difficulty: e.target.value as Difficulty,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
//                       <option value="EASY">Easy</option>
//                       <option value="MEDIUM">Medium</option>
//                       <option value="HARD">Hard</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Question Type
//                     </label>
//                     <select
//                       value={formData.questionModel}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           questionModel: e.target.value as QuestionModel,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
//                       <option value="PRE">Pre Question</option>
//                       <option value="POST">Post Question</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Question Set
//                     </label>
//                     <select
//                       value={formData.questionSet}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           questionSet: e.target.value as QuestionSet,
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
//                       required>
//                       {Array.from({ length: 10 }, (_, i) => i + 1).map(
//                         (num) => (
//                           <option key={num} value={`SET_${num}`}>
//                             SET {num}
//                           </option>
//                         ),
//                       )}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Question */}
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
//                   <span className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm">
//                     2
//                   </span>
//                   Question
//                 </h2>

//                 <div className="flex gap-2 mb-3">
//                   <button
//                     type="button"
//                     onClick={() => setQuestionInputType('LATEX')}
//                     className={`px-4 py-2 rounded-lg font-medium transition-all ${
//                       questionInputType === 'LATEX'
//                         ? 'bg-purple-600 text-white shadow-md'
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}>
//                     LaTeX
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setQuestionInputType('NORMAL')}
//                     className={`px-4 py-2 rounded-lg font-medium transition-all ${
//                       questionInputType === 'NORMAL'
//                         ? 'bg-purple-600 text-white shadow-md'
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}>
//                     Normal Text
//                   </button>
//                 </div>

//                 {questionInputType === 'NORMAL' ? (
//                   <textarea
//                     value={formData.question.text}
//                     onChange={(e) => handleQuestionChange(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none"
//                     rows={4}
//                     placeholder="Enter your question here..."
//                     required
//                   />
//                 ) : (
//                   <textarea
//                     value={formData.question.latex}
//                     onChange={(e) => handleQuestionChange(e.target.value)}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none font-mono text-sm"
//                     rows={4}
//                     placeholder="Enter LaTeX formula... e.g., $\\alpha + \\beta = \\frac{1}{2}$"
//                     required
//                   />
//                 )}
//               </div>

//               {/* MCQ Options */}
//               {formData.type === 'MCQ' && (
//                 <div className="space-y-4">
//                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                     <span className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center text-sm">
//                       3
//                     </span>
//                     Options (A–D)
//                   </h2>
//                   <div className="space-y-3">
//                     {formData.options.map((option, index) => (
//                       <OptionInput
//                         key={option.id}
//                         option={option}
//                         index={index}
//                         isCorrect={formData.correctAnswer === option.id}
//                         onCorrectChange={(id) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             correctAnswer: id,
//                           }))
//                         }
//                         onChange={handleOptionChange}
//                         onRemove={() => {}}
//                         canRemove={false}
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Fill in the Blank */}
//               {formData.type === 'FILL_BLANK' && (
//                 <div className="space-y-4">
//                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                     <span className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center text-sm">
//                       3
//                     </span>
//                     Correct Answer
//                   </h2>
//                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
//                     <input
//                       type="text"
//                       value={formData.correctAnswer}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           correctAnswer: e.target.value.trim(),
//                         }))
//                       }
//                       className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
//                       placeholder="Enter the exact correct answer (case sensitive)"
//                       required
//                     />
//                     <p className="mt-2 text-sm text-gray-500">
//                       Students must type this exact text to get it correct.
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {/* Solution Section */}
//               <div className="space-y-4">
//                 <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//                   <span className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center text-sm">
//                     4
//                   </span>
//                   Solution
//                 </h2>

//                 {/* Solution type selector */}
//                 <div className="flex gap-3">
//                   {solutionTypeOptions.map(
//                     ({ value, label, icon: Icon, color }) => {
//                       const isActive = formData.solutionType === value;
//                       const colorMap: Record<string, string> = {
//                         indigo: isActive
//                           ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
//                           : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border-gray-200',
//                         rose: isActive
//                           ? 'bg-rose-600 text-white shadow-md border-rose-600'
//                           : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border-gray-200',
//                         emerald: isActive
//                           ? 'bg-emerald-600 text-white shadow-md border-emerald-600'
//                           : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border-gray-200',
//                       };
//                       return (
//                         <button
//                           key={value}
//                           type="button"
//                           onClick={() => handleSolutionTypeChange(value)}
//                           className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${colorMap[color]}`}>
//                           <Icon className="w-4 h-4" />
//                           {label}
//                         </button>
//                       );
//                     },
//                   )}
//                 </div>

//                 {/* TEXT solution */}
//                 {formData.solutionType === SolutionType.TEXT && (
//                   <textarea
//                     value={formData.solution}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         solution: e.target.value,
//                       }))
//                     }
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none resize-none"
//                     rows={5}
//                     placeholder="Enter LaTeX formula... e.g., $\\alpha + \\beta = \\frac{1}{2}$"
//                     required
//                   />
//                 )}

//                 {/* VIDEO solution */}
//                 {formData.solutionType === SolutionType.VIDEO && (
//                   <div>
//                     <div className="relative">
//                       <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                       <input
//                         type="url"
//                         value={formData.solution}
//                         onChange={(e) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             solution: e.target.value,
//                           }))
//                         }
//                         className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all outline-none"
//                         placeholder="https://youtube.com/watch?v=... or video URL"
//                         required
//                       />
//                     </div>
//                     <p className="mt-2 text-sm text-gray-500">
//                       Paste a YouTube, or any video link as the solution.
//                     </p>
//                   </div>
//                 )}

//                 {/* IMAGE solution */}
//                 {formData.solutionType === SolutionType.IMAGE && (
//                   <div>
//                     {!imagePreview ? (
//                       <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors">
//                         <div className="flex flex-col items-center gap-2 text-emerald-600">
//                           <Upload className="w-8 h-8" />
//                           <span className="font-semibold text-sm">
//                             Click to upload solution image
//                           </span>
//                           <span className="text-xs text-gray-400">
//                             PNG, JPG, WEBP up to 5MB
//                           </span>
//                         </div>
//                         <input
//                           ref={imageInputRef}
//                           type="file"
//                           accept="image/*"
//                           className="hidden"
//                           onChange={handleImageChange}
//                         />
//                       </label>
//                     ) : (
//                       <div className="relative rounded-xl overflow-hidden border border-emerald-200">
//                         <img
//                           src={imagePreview}
//                           alt="Solution preview"
//                           className="w-full max-h-64 object-contain bg-gray-50"
//                         />
//                         <button
//                           type="button"
//                           onClick={handleRemoveImage}
//                           className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md">
//                           <X className="w-4 h-4" />
//                         </button>
//                         <div className="px-3 py-2 bg-white border-t border-emerald-100">
//                           <p className="text-xs text-gray-500 truncate">
//                             {imageFile?.name ?? 'Existing image'}
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>

//               {/* Submit */}
//               <div className="pt-6 flex gap-3">
//                 <button
//                   type="button"
//                   onClick={handleBack}
//                   className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-200">
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={mutation.isPending}
//                   className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
//                   {mutation.isPending
//                     ? isEditMode
//                       ? 'Updating...'
//                       : 'Creating...'
//                     : isEditMode
//                       ? 'Update Question'
//                       : 'Create Question'}
//                 </button>
//               </div>

//               {mutation.isError && (
//                 <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
//                   Error: {mutation.error.message}
//                 </div>
//               )}
//             </form>
//           </div>

//           {/* Preview Section */}
//           {showPreview && (
//             <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100 sticky top-6 h-fit">
//               <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//                 <svg
//                   className="w-6 h-6 text-indigo-600"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                   />
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//                   />
//                 </svg>
//                 Live Preview
//               </h2>

//               <div className="space-y-6">
//                 <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
//                   <div className="flex items-start gap-2 mb-3 flex-wrap">
//                     <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">
//                       {formData.type}
//                     </span>
//                     <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
//                       {formData.difficulty}
//                     </span>
//                     <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
//                       {formData.questionModel}
//                     </span>
//                     <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg">
//                       {formData.questionSet.replace('_', ' ')}
//                     </span>
//                   </div>
//                   <div className="text-gray-800 text-lg leading-relaxed">
//                     <MathPreview
//                       text={formData.question.text}
//                       latex={formData.question.latex}
//                     />
//                   </div>
//                 </div>

//                 {formData.type === 'MCQ' && formData.options.length > 0 && (
//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-gray-700">Options:</h3>
//                     {formData.options.map((option) => (
//                       <div
//                         key={option.id}
//                         className={`p-4 rounded-xl border-2 transition-all ${
//                           formData.correctAnswer === option.id
//                             ? 'bg-green-50 border-green-400'
//                             : 'bg-gray-50 border-gray-200'
//                         }`}>
//                         <div className="flex items-start gap-3">
//                           <span
//                             className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
//                               formData.correctAnswer === option.id
//                                 ? 'bg-green-500 text-white'
//                                 : 'bg-gray-300 text-gray-700'
//                             }`}>
//                             {option.id}
//                           </span>
//                           <div className="flex-1 pt-1">
//                             {option.type === 'LATEX' ? (
//                               <MathPreview text="" latex={option.answer} />
//                             ) : (
//                               <span className="text-gray-800">
//                                 {option.answer || '(Empty)'}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {formData.type === 'FILL_BLANK' && (
//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-gray-700">
//                       Correct Answer:
//                     </h3>
//                     <div className="p-4 bg-green-50 border-2 border-green-400 rounded-xl">
//                       <p className="text-gray-800 font-medium">
//                         {formData.correctAnswer || '(not set)'}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {formData.solution && (
//                   <div className="space-y-3">
//                     <h3 className="font-semibold text-gray-700 flex items-center gap-2">
//                       Solution
//                       <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-md">
//                         {formData.solutionType}
//                       </span>
//                     </h3>
//                     <div className="p-4 bg-teal-50 border-2 border-teal-200 rounded-xl">
//                       {formData.solutionType === SolutionType.TEXT && (
//                         <MathPreview text="" latex={formData.solution} />

//                         // <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
//                         //   {formData.solution}
//                         // </p>
//                       )}
//                       {formData.solutionType === SolutionType.VIDEO && (
//                         <a
//                           href={formData.solution}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm underline underline-offset-2 break-all">
//                           <Video className="w-4 h-4 flex-shrink-0" />
//                           {formData.solution}
//                         </a>
//                       )}
//                       {formData.solutionType === SolutionType.IMAGE &&
//                         imagePreview && (
//                           <img
//                             src={imagePreview}
//                             alt="Solution"
//                             className="w-full rounded-lg object-contain max-h-48"
//                           />
//                         )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateMathsQuiz;

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, FileText, Video, Image, Upload, X } from 'lucide-react';
import 'katex/dist/katex.min.css';
import type {
  CreateQuestionSchema,
  Difficulty,
  OptionType,
  QuestionModel,
  QuestionSet,
  QuestionType,
} from './types';
import OptionInput from './Optioninput';
import MathPreview from '../MathPreview';
import { _axios } from '@/lib/axios';

export enum SolutionType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
}

interface CreateQuestionProps {
  courseId: string;
  lessonId: string;
  chapterId: string;
  questionId?: string;
  isEditMode?: boolean;
}

const CreateMathsQuiz = ({
  courseId,
  lessonId,
  chapterId,
  questionId,
  isEditMode = false,
}: CreateQuestionProps) => {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const [optionImageFiles, setOptionImageFiles] = useState<(File | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [formData, setFormData] = useState<CreateQuestionSchema>({
    courseId: courseId || '',
    chapterId: chapterId || '',
    lessonId: lessonId || '',
    type: 'MCQ',
    difficulty: 'MEDIUM',
    questionModel: 'PRE',
    questionSet: 'SET_1',
    question: {
      text: '',
      latex: '',
      image: undefined,
    },
    options: [
      { id: 'A', answer: '', type: 'LATEX' },
      { id: 'B', answer: '', type: 'LATEX' },
      { id: 'C', answer: '', type: 'LATEX' },
      { id: 'D', answer: '', type: 'LATEX' },
    ],
    correctAnswer: '',
    solutionType: SolutionType.TEXT,
    solution: '',
  });

  const [questionInputType, setQuestionInputType] = useState<
    'NORMAL' | 'LATEX' | 'IMAGE'
  >('LATEX');
  const [showPreview, setShowPreview] = useState(false);

  // Solution image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Question image state
  const [questionImagePreview, setQuestionImagePreview] = useState<
    string | null
  >(null);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);

  const { data: existingQuestion, isLoading: isLoadingQuestion } = useQuery({
    queryKey: ['question-Id', questionId],
    queryFn: async () => {
      const response = await _axios.get(`/question/${questionId}`);
      return response.data.question;
    },
    enabled: isEditMode && !!questionId,
  });

  useEffect(() => {
    if (existingQuestion && isEditMode) {
      setFormData({
        courseId: existingQuestion.courseId,
        chapterId: existingQuestion.chapterId,
        lessonId: existingQuestion.lessonId,
        type: existingQuestion.type,
        difficulty: existingQuestion.difficulty,
        questionModel: existingQuestion.questionModel,
        questionSet: existingQuestion.questionSet || 'SET_1',
        question: existingQuestion.question,
        options: existingQuestion.options || [
          { id: 'A', answer: '', type: 'LATEX' },
          { id: 'B', answer: '', type: 'LATEX' },
          { id: 'C', answer: '', type: 'LATEX' },
          { id: 'D', answer: '', type: 'LATEX' },
        ],
        correctAnswer: existingQuestion.correctAnswer,
        solutionType: existingQuestion.solutionType || SolutionType.TEXT,
        solution: existingQuestion.solution || '',
      });

      // Determine question input type from existing data
      if (existingQuestion.question?.image) {
        setQuestionInputType('IMAGE');
        setQuestionImagePreview(existingQuestion.question.image);
      } else if (existingQuestion.question?.latex) {
        setQuestionInputType('LATEX');
      } else {
        setQuestionInputType('NORMAL');
      }

      // If existing solution is an image URL, show preview
      if (
        existingQuestion.solutionType === SolutionType.IMAGE &&
        existingQuestion.solution
      ) {
        setImagePreview(existingQuestion.solution);
      }
    }
  }, [existingQuestion, isEditMode]);

  // ─── Build FormData — always use multipart if question image OR solution image is a File ──
  // const buildPayload = (
  //   data: CreateQuestionSchema,
  // ): FormData | CreateQuestionSchema => {
  //   const needsFormData =
  //     (data.solutionType === SolutionType.IMAGE && imageFile) ||
  //     questionImageFile;

  //   if (needsFormData) {
  //     const fd = new FormData();

  //     fd.append('courseId', data.courseId);
  //     fd.append('chapterId', data.chapterId);
  //     fd.append('lessonId', data.lessonId);
  //     fd.append('type', data.type);
  //     fd.append('difficulty', data.difficulty);
  //     fd.append('questionModel', data.questionModel);
  //     fd.append('questionSet', data.questionSet);
  //     fd.append('solutionType', data.solutionType);
  //     fd.append('correctAnswer', data.correctAnswer);

  //     // Question: send as JSON object (text/latex fields), image as File separately
  //     const questionMeta = {
  //       text: data.question.text || '',
  //       latex: data.question.latex || '',
  //     };
  //     fd.append('question', JSON.stringify(questionMeta));

  //     // Append question image File if present
  //     if (questionImageFile) {
  //       fd.append('questionImage', questionImageFile);
  //     }

  //     fd.append(
  //       'options',
  //       JSON.stringify(data.type === 'MCQ' ? data.options : []),
  //     );

  //     // Solution
  //     if (data.solutionType === SolutionType.IMAGE && imageFile) {
  //       fd.append('solution', imageFile);
  //     } else {
  //       fd.append('solution', data.solution as string);
  //     }

  //     return fd;
  //   }

  //   // Plain JSON
  //   return {
  //     ...data,
  //     options: data.type === 'MCQ' ? data.options : [],
  //   };
  // };

  const buildPayload = (
    data: CreateQuestionSchema,
  ): FormData | CreateQuestionSchema => {
    const hasOptionImages = optionImageFiles.some(Boolean);
    const needsFormData =
      (data.solutionType === SolutionType.IMAGE && imageFile) ||
      questionImageFile ||
      hasOptionImages; // ← NEW

    if (needsFormData) {
      const fd = new FormData();

      fd.append('courseId', data.courseId);
      fd.append('chapterId', data.chapterId);
      fd.append('lessonId', data.lessonId);
      fd.append('type', data.type);
      fd.append('difficulty', data.difficulty);
      fd.append('questionModel', data.questionModel);
      fd.append('questionSet', data.questionSet);
      fd.append('solutionType', data.solutionType);
      fd.append('correctAnswer', data.correctAnswer);

      const questionMeta = {
        text: data.question.text || '',
        latex: data.question.latex || '',
      };
      fd.append('question', JSON.stringify(questionMeta));

      if (questionImageFile) {
        fd.append('questionImage', questionImageFile);
      }

      // Options: send metadata as JSON, images as separate files
      // Strip imageFile from JSON — it's not serializable
      const optionsMeta = (data.type === 'MCQ' ? data.options : []).map(
        ({ id, answer, type }) => ({ id, answer, type }),
      );
      fd.append('options', JSON.stringify(optionsMeta));

      // Append each option image with key optionImage_0, optionImage_1, etc.
      optionImageFiles.forEach((file, i) => {
        if (file) fd.append(`optionImage_${i}`, file);
      });

      if (data.solutionType === SolutionType.IMAGE && imageFile) {
        fd.append('solution', imageFile);
      } else {
        fd.append('solution', data.solution as string);
      }

      return fd;
    }

    return {
      ...data,
      options:
        data.type === 'MCQ'
          ? data.options.map(({ id, answer, type }) => ({ id, answer, type }))
          : [],
    };
  };

  const mutation = useMutation({
    mutationFn: async (data: CreateQuestionSchema) => {
      const payload = buildPayload(data);
      const isFormData = payload instanceof FormData;

      const config = isFormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : { headers: { 'Content-Type': 'application/json' } };

      if (isEditMode) {
        return _axios.patch(`/question/${questionId}`, payload, config);
      }
      return _axios.post('/question', payload, config);
    },
    onSuccess: (data) => {
      console.log('Question saved successfully:', data);
      navigate({
        to: '/courses/quizes',
        search: {
          page: 1,
          limit: 10,
          lessonId,
          courseId,
          chapterId,
          mode: 'list',
        },
      });
    },
    onError: (error) => {
      console.error('Error saving question:', error);
    },
  });

  const handleQuestionChange = (value: string) => {
    if (questionInputType === 'LATEX') {
      setFormData((prev) => ({
        ...prev,
        question: {
          ...prev.question,
          latex: value,
          text: '',
          image: undefined,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        question: {
          ...prev.question,
          text: value,
          latex: '',
          image: undefined,
        },
      }));
    }
  };

  const handleQuestionInputTypeChange = (
    type: 'NORMAL' | 'LATEX' | 'IMAGE',
  ) => {
    setQuestionInputType(type);
    // Clear question fields when switching type
    setFormData((prev) => ({
      ...prev,
      question: { text: '', latex: '', image: undefined },
    }));
    setQuestionImagePreview(null);
    setQuestionImageFile(null);
    if (questionImageInputRef.current) questionImageInputRef.current.value = '';
  };

  const handleQuestionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuestionImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestionImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Store filename as placeholder so validation can detect a file was chosen
    setFormData((prev) => ({
      ...prev,
      question: { text: '', latex: '', image: file.name },
    }));
  };

  const handleRemoveQuestionImage = () => {
    setQuestionImagePreview(null);
    setQuestionImageFile(null);
    setFormData((prev) => ({
      ...prev,
      question: { ...prev.question, image: undefined },
    }));
    if (questionImageInputRef.current) questionImageInputRef.current.value = '';
  };

  // const handleOptionChange = (
  //   index: number,
  //   value: string,
  //   type: OptionType,
  // ) => {
  //   const newOptions = [...formData.options];
  //   newOptions[index] = { ...newOptions[index], answer: value, type };
  //   setFormData((prev) => ({ ...prev, options: newOptions }));
  // };

  const handleOptionChange = (
    index: number,
    value: string,
    type: OptionType,
    imageFile?: File | null,
  ) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], answer: value, type };
    setFormData((prev) => ({ ...prev, options: newOptions }));

    // Track the File object separately (not in formData — can't serialize a File)
    if (imageFile !== undefined) {
      setOptionImageFiles((prev) => {
        const updated = [...prev];
        updated[index] = imageFile;
        return updated;
      });
    }
  };

  const handleSolutionTypeChange = (type: SolutionType) => {
    setFormData((prev) => ({ ...prev, solutionType: type, solution: '' }));
    setImagePreview(null);
    setImageFile(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setFormData((prev) => ({ ...prev, solution: file.name }));
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData((prev) => ({ ...prev, solution: '' }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleBack = () => {
    setOptionImageFiles([null, null, null, null]); // reset

    navigate({
      to: '/courses/quizes',
      search: {
        page: 1,
        limit: 10,
        lessonId,
        courseId,
        chapterId,
        mode: 'list',
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseId || !formData.chapterId || !formData.lessonId) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.type === 'MCQ' && !formData.correctAnswer) {
      alert('Please select the correct answer');
      return;
    }

    if (formData.type === 'FILL_BLANK' && !formData.correctAnswer.trim()) {
      alert('Please enter the correct answer for Fill in the Blank');
      return;
    }

    // Validate question has content
    if (
      questionInputType === 'IMAGE' &&
      !questionImageFile &&
      !questionImagePreview
    ) {
      alert('Please upload a question image');
      return;
    }

    if (questionInputType === 'LATEX' && !formData.question.latex?.trim()) {
      alert('Please enter a LaTeX question');
      return;
    }

    if (questionInputType === 'NORMAL' && !formData.question.text?.trim()) {
      alert('Please enter a question');
      return;
    }

    if (typeof formData.solution === 'string' && !formData.solution.trim()) {
      alert('Please provide a solution');
      return;
    }

    if (
      formData.solutionType === SolutionType.IMAGE &&
      !imageFile &&
      !imagePreview
    ) {
      alert('Please upload a solution image');
      return;
    }

    mutation.mutate(formData);
  };

  if (isLoadingQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  const solutionTypeOptions = [
    {
      value: SolutionType.TEXT,
      label: 'Text',
      icon: FileText,
      color: 'indigo',
    },
    { value: SolutionType.VIDEO, label: 'Video', icon: Video, color: 'rose' },
    {
      value: SolutionType.IMAGE,
      label: 'Image',
      icon: Image,
      color: 'emerald',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Questions">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit' : 'Create'} Math Quiz
                </h1>
                <p className="text-gray-600 mt-2">
                  {isEditMode
                    ? 'Update your math question'
                    : 'Design engaging math questions with LaTeX support'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-all duration-200 shadow-sm">
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">
                    1
                  </span>
                  Basic Information
                </h2>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as QuestionType,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
                      <option value="MCQ">MCQ</option>
                      <option value="FILL_BLANK">Fill in the Blank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: e.target.value as Difficulty,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={formData.questionModel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          questionModel: e.target.value as QuestionModel,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white">
                      <option value="PRE">Pre Question</option>
                      <option value="POST">Post Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Question Set
                    </label>
                    <select
                      value={formData.questionSet}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          questionSet: e.target.value as QuestionSet,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                      required>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={`SET_${num}`}>
                            SET {num}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm">
                    2
                  </span>
                  Question
                </h2>

                {/* Question type tabs */}
                <div className="flex gap-2 mb-3">
                  {(['LATEX', 'NORMAL', 'IMAGE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleQuestionInputTypeChange(t)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        questionInputType === t
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {t === 'IMAGE' && <Image className="w-3.5 h-3.5" />}
                      {t === 'LATEX'
                        ? 'LaTeX'
                        : t === 'NORMAL'
                          ? 'Normal Text'
                          : 'Image'}
                    </button>
                  ))}
                </div>

                {questionInputType === 'NORMAL' && (
                  <textarea
                    value={formData.question.text}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none"
                    rows={4}
                    placeholder="Enter your question here..."
                  />
                )}

                {questionInputType === 'LATEX' && (
                  <textarea
                    value={formData.question.latex}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none font-mono text-sm"
                    rows={4}
                    placeholder="Enter LaTeX formula... e.g., $\alpha + \beta = \frac{1}{2}$"
                  />
                )}

                {questionInputType === 'IMAGE' && (
                  <div>
                    {!questionImagePreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors">
                        <div className="flex flex-col items-center gap-2 text-purple-600">
                          <Upload className="w-8 h-8" />
                          <span className="font-semibold text-sm">
                            Click to upload question image
                          </span>
                          <span className="text-xs text-gray-400">
                            PNG, JPG, WEBP up to 5MB
                          </span>
                        </div>
                        <input
                          ref={questionImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQuestionImageChange}
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-purple-200">
                        <img
                          src={questionImagePreview}
                          alt="Question preview"
                          className="w-full max-h-64 object-contain bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveQuestionImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="px-3 py-2 bg-white border-t border-purple-100">
                          <p className="text-xs text-gray-500 truncate">
                            {questionImageFile?.name ?? 'Existing image'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MCQ Options */}
              {formData.type === 'MCQ' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center text-sm">
                      3
                    </span>
                    Options (A–D)
                  </h2>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <OptionInput
                        key={option.id}
                        option={option}
                        index={index}
                        isCorrect={formData.correctAnswer === option.id}
                        onCorrectChange={(id) =>
                          setFormData((prev) => ({
                            ...prev,
                            correctAnswer: id,
                          }))
                        }
                        onChange={handleOptionChange}
                        onRemove={() => {}}
                        canRemove={false}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fill in the Blank */}
              {formData.type === 'FILL_BLANK' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 bg-pink-600 text-white rounded-lg flex items-center justify-center text-sm">
                      3
                    </span>
                    Correct Answer
                  </h2>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <input
                      type="text"
                      value={formData.correctAnswer}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          correctAnswer: e.target.value.trim(),
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                      placeholder="Enter the exact correct answer (case sensitive)"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Students must type this exact text to get it correct.
                    </p>
                  </div>
                </div>
              )}

              {/* Solution Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center text-sm">
                    4
                  </span>
                  Solution
                </h2>

                <div className="flex gap-3">
                  {solutionTypeOptions.map(
                    ({ value, label, icon: Icon, color }) => {
                      const isActive = formData.solutionType === value;
                      const colorMap: Record<string, string> = {
                        indigo: isActive
                          ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border-gray-200',
                        rose: isActive
                          ? 'bg-rose-600 text-white shadow-md border-rose-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border-gray-200',
                        emerald: isActive
                          ? 'bg-emerald-600 text-white shadow-md border-emerald-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border-gray-200',
                      };
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleSolutionTypeChange(value)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border transition-all duration-200 ${colorMap[color]}`}>
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      );
                    },
                  )}
                </div>

                {formData.solutionType === SolutionType.TEXT && (
                  <textarea
                    value={formData.solution as string}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        solution: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all outline-none resize-none"
                    rows={5}
                    placeholder="Enter LaTeX formula... e.g., $\alpha + \beta = \frac{1}{2}$"
                    required
                  />
                )}

                {formData.solutionType === SolutionType.VIDEO && (
                  <div>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="url"
                        value={formData.solution as string}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            solution: e.target.value,
                          }))
                        }
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all outline-none"
                        placeholder="https://youtube.com/watch?v=... or video URL"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Paste a YouTube, or any video link as the solution.
                    </p>
                  </div>
                )}

                {formData.solutionType === SolutionType.IMAGE && (
                  <div>
                    {!imagePreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors">
                        <div className="flex flex-col items-center gap-2 text-emerald-600">
                          <Upload className="w-8 h-8" />
                          <span className="font-semibold text-sm">
                            Click to upload solution image
                          </span>
                          <span className="text-xs text-gray-400">
                            PNG, JPG, WEBP up to 5MB
                          </span>
                        </div>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-200">
                        <img
                          src={imagePreview}
                          alt="Solution preview"
                          className="w-full max-h-64 object-contain bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="px-3 py-2 bg-white border-t border-emerald-100">
                          <p className="text-xs text-gray-500 truncate">
                            {imageFile?.name ?? 'Existing image'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-200">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {mutation.isPending
                    ? isEditMode
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditMode
                      ? 'Update Question'
                      : 'Create Question'}
                </button>
              </div>

              {mutation.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  Error: {mutation.error.message}
                </div>
              )}
            </form>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100 sticky top-6 h-fit">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Live Preview
              </h2>

              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                  <div className="flex items-start gap-2 mb-3 flex-wrap">
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">
                      {formData.type}
                    </span>
                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
                      {formData.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
                      {formData.questionModel}
                    </span>
                    <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg">
                      {formData.questionSet.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-gray-800 text-lg leading-relaxed">
                    {questionInputType === 'IMAGE' && questionImagePreview ? (
                      <img
                        src={questionImagePreview}
                        alt="Question"
                        className="w-full rounded-lg object-contain max-h-48"
                      />
                    ) : (
                      <MathPreview
                        text={formData.question.text}
                        latex={formData.question.latex}
                      />
                    )}
                  </div>
                </div>

                {/* {formData.type === 'MCQ' && formData.options.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Options:</h3>
                    {formData.options.map((option) => (
                      <div
                        key={option.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.correctAnswer === option.id
                            ? 'bg-green-50 border-green-400'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              formData.correctAnswer === option.id
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                            {option.id}
                          </span>
                          <div className="flex-1 pt-1">
                            {option.type === 'LATEX' ? (
                              <MathPreview text="" latex={option.answer} />
                            ) : (
                              <span className="text-gray-800">
                                {option.answer || '(Empty)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )} */}

                {formData.type === 'MCQ' && formData.options.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">Options:</h3>
                    {formData.options.map((option, i) => (
                      <div
                        key={option.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.correctAnswer === option.id
                            ? 'bg-green-50 border-green-400'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              formData.correctAnswer === option.id
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                            {option.id}
                          </span>
                          <div className="flex-1 pt-1">
                            {option.type === 'IMAGE' ? (
                              optionImageFiles[i] ? (
                                <img
                                  src={URL.createObjectURL(
                                    optionImageFiles[i]!,
                                  )}
                                  alt={`Option ${option.id}`}
                                  className="max-h-24 rounded-lg object-contain"
                                />
                              ) : option.answer ? (
                                // existing image URL in edit mode
                                <img
                                  src={option.answer}
                                  alt={`Option ${option.id}`}
                                  className="max-h-24 rounded-lg object-contain"
                                />
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  (No image)
                                </span>
                              )
                            ) : option.type === 'LATEX' ? (
                              <MathPreview text="" latex={option.answer} />
                            ) : (
                              <span className="text-gray-800">
                                {option.answer || '(Empty)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.type === 'FILL_BLANK' && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700">
                      Correct Answer:
                    </h3>
                    <div className="p-4 bg-green-50 border-2 border-green-400 rounded-xl">
                      <p className="text-gray-800 font-medium">
                        {formData.correctAnswer || '(not set)'}
                      </p>
                    </div>
                  </div>
                )}

                {formData.solution && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      Solution
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-md">
                        {formData.solutionType}
                      </span>
                    </h3>
                    <div className="p-4 bg-teal-50 border-2 border-teal-200 rounded-xl">
                      {formData.solutionType === SolutionType.TEXT && (
                        <MathPreview
                          text=""
                          latex={formData.solution as string}
                        />
                      )}
                      {formData.solutionType === SolutionType.VIDEO && (
                        <a
                          href={formData.solution as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm underline underline-offset-2 break-all">
                          <Video className="w-4 h-4 flex-shrink-0" />
                          {formData.solution as string}
                        </a>
                      )}
                      {formData.solutionType === SolutionType.IMAGE &&
                        imagePreview && (
                          <img
                            src={imagePreview}
                            alt="Solution"
                            className="w-full rounded-lg object-contain max-h-48"
                          />
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMathsQuiz;
