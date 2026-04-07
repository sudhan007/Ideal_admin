// import { useState } from 'react';
// import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
// import { useQuery } from '@tanstack/react-query';
// import { Plus, Edit, Trash2, Eye, ArrowBigLeft } from 'lucide-react';
// import MathPreview from './MathPreview';
// import 'katex/dist/katex.min.css';
// import { _axios } from '@/lib/axios';
// import { Pagination } from '../Pagination';
// import { Button } from '../ui/button';

// interface Question {
//   _id: string;
//   type: 'MCQ' | 'FILL_BLANK';
//   difficulty: 'EASY' | 'MEDIUM' | 'HARD';
//   marks: number;
//   question: {
//     text: string;
//     latex: string;
//   };
//   options?: Array<{
//     id: string;
//     answer: string;
//     type?: 'NORMAL' | 'LATEX';
//   }>;
//   correctAnswer: string;
//   isActive?: boolean; // API doesn't return this field
//   createdAt: string;
//   lessonName?: string;
// }

// interface ApiResponse {
//   questions: Question[];
//   lessonStats: {
//     lessonId: string;
//     lessonName: string;
//     mcqCount: number;
//     fillInBlankCount: number;
//   };
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//     hasNextPage: boolean;
//     hasPrevPage: boolean;
//   };
// }

// const QuestionList = () => {
//   const navigate = useNavigate();
//   const router = useRouter();
//   const search: any = useSearch({ from: '/courses/quizes/' });
//   const { lessonId, courseId, chapterId, page = 1, limit = 10 } = search;

//   const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
//     null,
//   );

//   // Fetch questions
//   const { data: response, isLoading } = useQuery<ApiResponse>({
//     queryKey: ['questions', lessonId, page, limit],
//     queryFn: async () => {
//       const params = new URLSearchParams({
//         courseId: String(courseId),
//         chapterId: String(chapterId),
//         lessonId: String(lessonId),
//         page: String(page),
//         limit: String(limit),
//       });
//       const res = await _axios.get(`/question/all?${params.toString()}`);
//       return res.data.data;
//     },
//     enabled: !!lessonId,
//   });

//   const handlePageChange = (newPage: number) => {
//     navigate({ search: (prev: any) => ({ ...prev, page: newPage }) });
//   };

//   const handleLimitChange = (newLimit: number) => {
//     navigate({
//       search: (prev: any) => ({ ...prev, page: 1, limit: newLimit }),
//     });
//   };

//   const totalPages = response?.pagination?.totalPages || 1;
//   const totalItems = response?.pagination?.total || 0;
//   const itemsPerPage = response?.pagination?.limit || limit;
//   const questions = response?.questions || [];
//   const lessonName = response?.lessonStats?.lessonName || '';

//   const handleCreateQuestion = () => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page,
//         limit,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'create',
//       },
//     });
//   };

//   const handleEditQuestion = (questionId: string) => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page,
//         limit,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'edit',
//         questionId,
//       },
//     });
//   };

//   const getDifficultyColor = (difficulty: string) => {
//     switch (difficulty) {
//       case 'EASY':
//         return 'bg-green-100 text-green-700 border-green-300';
//       case 'MEDIUM':
//         return 'bg-yellow-100 text-yellow-700 border-yellow-300';
//       case 'HARD':
//         return 'bg-red-100 text-red-700 border-red-300';
//       default:
//         return 'bg-gray-100 text-gray-700 border-gray-300';
//     }
//   };

//   const getTypeColor = (type: string) => {
//     return type === 'MCQ'
//       ? 'bg-blue-100 text-blue-700 border-blue-300'
//       : 'bg-purple-100 text-purple-700 border-purple-300';
//   };

//   const getTypeText = (type: string) => {
//     return type === 'MCQ' ? 'MCQ' : 'Fill in Blank';
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="spinner mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading questions...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
//       <Button
//         onClick={() => router.history.back()}
//         variant="outline"
//         className="rounded-xsm hover:text-foreground text-foreground my-3  cursor-pointer hover:bg-accent/50">
//         <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Lessons
//       </Button>
//       <div className="max-w-7xl mx-auto">
//         {/* Header with Lesson Name */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               {/* <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                 Question Bank
//               </h1> */}
//               {lessonName && (
//                 <div className="mt-2 flex items-center gap-2">
//                   <span className="text-gray-600">Lesson:</span>
//                   <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm">
//                     {lessonName}
//                   </span>
//                 </div>
//               )}
//               <p className="text-gray-600 mt-2">
//                 Manage your math quiz questions
//               </p>
//             </div>
//             <button
//               onClick={handleCreateQuestion}
//               className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
//               <Plus className="w-5 h-5" />
//               Create Question
//             </button>
//           </div>

//           {/* Lesson Stats Bar */}
//           {response?.lessonStats && (
//             <div className="mt-6 pt-6 border-t border-gray-100">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">📊</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Total Questions</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.mcqCount +
//                         response.lessonStats.fillInBlankCount}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">✅</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">MCQ Questions</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.mcqCount}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">📝</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Fill in Blank</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.fillInBlankCount}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Questions List */}
//         <div className="space-y-4">
//           {questions.length > 0 ? (
//             questions.map((question) => (
//               <div
//                 key={question._id}
//                 className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
//                 <div className="p-6">
//                   {/* Question Header */}
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex gap-2 flex-wrap">
//                       <span
//                         className={`px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
//                           question.type,
//                         )}`}>
//                         {getTypeText(question.type)}
//                       </span>
//                       <span
//                         className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(
//                           question.difficulty,
//                         )}`}>
//                         {question.difficulty}
//                       </span>
//                       <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-300">
//                         {question.marks}{' '}
//                         {question.marks === 1 ? 'Mark' : 'Marks'}
//                       </span>
//                       <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-300">
//                         {new Date(question.createdAt).toLocaleDateString()}
//                       </span>
//                     </div>

//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => setSelectedQuestion(question)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                         title="View Details">
//                         <Eye className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => handleEditQuestion(question._id)}
//                         className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                         title="Edit Question">
//                         <Edit className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => {
//                           /* Add delete handler */
//                         }}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="Delete Question">
//                         <Trash2 className="w-5 h-5" />
//                       </button>
//                     </div>
//                   </div>

//                   {/* Question Content */}
//                   <div className="mb-4">
//                     <div className="text-gray-800 text-lg leading-relaxed bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
//                       <MathPreview
//                         text={question.question.text}
//                         latex={question.question.latex || ''}
//                       />
//                     </div>
//                   </div>

//                   {/* Options Preview (MCQ only) */}
//                   {question.type === 'MCQ' && question.options && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       {question.options.map((option) => (
//                         <div
//                           key={option.id}
//                           className={`p-3 rounded-lg border-2 transition-all ${
//                             question.correctAnswer === option.id
//                               ? 'bg-green-50 border-green-400'
//                               : 'bg-gray-50 border-gray-200'
//                           }`}>
//                           <div className="flex items-start gap-2">
//                             <span
//                               className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
//                                 question.correctAnswer === option.id
//                                   ? 'bg-green-500 text-white'
//                                   : 'bg-gray-300 text-gray-700'
//                               }`}>
//                               {option.id}
//                             </span>
//                             <div className="flex-1 pt-0.5 text-sm">
//                               {option.type === 'LATEX' ? (
//                                 <MathPreview text="" latex={option.answer} />
//                               ) : (
//                                 <span className="text-gray-800">
//                                   {option.answer}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {/* Fill in Blank Answer */}
//                   {question.type === 'FILL_BLANK' && (
//                     <div className="p-3 bg-green-50 border-2 border-green-400 rounded-lg">
//                       <p className="text-sm text-gray-600 mb-1">
//                         Correct Answer:
//                       </p>
//                       <p className="text-gray-800 font-medium">
//                         {question.correctAnswer}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
//               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-5xl">📝</span>
//               </div>
//               <h3 className="text-xl font-bold text-gray-800 mb-2">
//                 No Questions Yet
//               </h3>
//               <p className="text-gray-600 mb-6">
//                 Get started by creating your first question
//               </p>
//               <button
//                 onClick={handleCreateQuestion}
//                 className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
//                 <Plus className="w-5 h-5" />
//                 Create First Question
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Question Detail Modal */}
//       {selectedQuestion && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
//           onClick={() => setSelectedQuestion(null)}>
//           <div
//             className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}>
//             <div className="p-8">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-2xl font-bold text-gray-800">
//                   Question Details
//                 </h2>
//                 <button
//                   onClick={() => setSelectedQuestion(null)}
//                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                   <svg
//                     className="w-6 h-6"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24">
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>

//               <div className="space-y-6">
//                 {/* Badges */}
//                 <div className="flex gap-2 flex-wrap">
//                   <span
//                     className={`px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
//                       selectedQuestion.type,
//                     )}`}>
//                     {getTypeText(selectedQuestion.type)}
//                   </span>
//                   <span
//                     className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(
//                       selectedQuestion.difficulty,
//                     )}`}>
//                     {selectedQuestion.difficulty}
//                   </span>
//                   <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-300">
//                     {selectedQuestion.marks} Marks
//                   </span>
//                   <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-300">
//                     Created:{' '}
//                     {new Date(selectedQuestion.createdAt).toLocaleDateString()}
//                   </span>
//                 </div>

//                 {/* Question */}
//                 <div>
//                   <h3 className="text-sm font-semibold text-gray-600 mb-2">
//                     Question:
//                   </h3>
//                   <div className="text-gray-800 text-lg leading-relaxed bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
//                     <MathPreview
//                       text={selectedQuestion.question.text}
//                       latex={selectedQuestion.question.latex || ''}
//                     />
//                   </div>
//                 </div>

//                 {/* Options or Answer */}
//                 {selectedQuestion.type === 'MCQ' && selectedQuestion.options ? (
//                   <div>
//                     <h3 className="text-sm font-semibold text-gray-600 mb-3">
//                       Options:
//                     </h3>
//                     <div className="space-y-3">
//                       {selectedQuestion.options.map((option) => (
//                         <div
//                           key={option.id}
//                           className={`p-4 rounded-lg border-2 ${
//                             selectedQuestion.correctAnswer === option.id
//                               ? 'bg-green-50 border-green-400'
//                               : 'bg-gray-50 border-gray-200'
//                           }`}>
//                           <div className="flex items-start gap-3">
//                             <span
//                               className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
//                                 selectedQuestion.correctAnswer === option.id
//                                   ? 'bg-green-500 text-white'
//                                   : 'bg-gray-300 text-gray-700'
//                               }`}>
//                               {option.id}
//                             </span>
//                             <div className="flex-1 pt-1">
//                               {option.type === 'LATEX' ? (
//                                 <MathPreview text="" latex={option.answer} />
//                               ) : (
//                                 <span className="text-gray-800">
//                                   {option.answer}
//                                 </span>
//                               )}
//                             </div>
//                             {selectedQuestion.correctAnswer === option.id && (
//                               <span className="text-green-600 font-semibold text-sm">
//                                 ✓ Correct
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ) : (
//                   <div>
//                     <h3 className="text-sm font-semibold text-gray-600 mb-2">
//                       Correct Answer:
//                     </h3>
//                     <div className="p-4 bg-green-50 border-2 border-green-400 rounded-lg">
//                       <p className="text-gray-800 font-medium text-lg">
//                         {selectedQuestion.correctAnswer}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Actions */}
//                 <div className="flex gap-3 pt-4">
//                   <button
//                     onClick={() => {
//                       handleEditQuestion(selectedQuestion._id);
//                       setSelectedQuestion(null);
//                     }}
//                     className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
//                     <Edit className="w-5 h-5" />
//                     Edit Question
//                   </button>
//                   <button
//                     onClick={() => setSelectedQuestion(null)}
//                     className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Pagination */}
//       {questions.length > 0 && (
//         <Pagination
//           currentPage={page}
//           totalPages={totalPages}
//           totalItems={totalItems}
//           itemsPerPage={itemsPerPage}
//           onPageChange={handlePageChange}
//           onLimitChange={handleLimitChange}
//           className="p-6 bg-gray-50 border-t"
//         />
//       )}
//     </div>
//   );
// };

// export default QuestionList;

// import { useState } from 'react';
// import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
// import { useQuery } from '@tanstack/react-query';
// import { Plus, Edit, Trash2, Eye, ArrowBigLeft, Filter } from 'lucide-react';
// import MathPreview from './MathPreview';
// import 'katex/dist/katex.min.css';
// import { _axios } from '@/lib/axios';
// import { Pagination } from '../Pagination';
// import { Button } from '../ui/button';

// interface Question {
//   _id: string;
//   type: 'MCQ' | 'FILL_BLANK';
//   difficulty: 'EASY' | 'MEDIUM' | 'HARD';
//   marks: number;
//   question: {
//     text: string;
//     latex: string;
//   };
//   options?: Array<{
//     id: string;
//     answer: string;
//     type?: 'NORMAL' | 'LATEX';
//   }>;
//   correctAnswer: string;
//   isActive?: boolean;
//   createdAt: string;
//   lessonName?: string;
// }

// interface ApiResponse {
//   questions: Question[];
//   lessonStats: {
//     lessonId: string;
//     lessonName: string;
//     mcqCount: number;
//     fillInBlankCount: number;
//   };
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//     hasNextPage: boolean;
//     hasPrevPage: boolean;
//   };
// }

// const QuestionList = () => {
//   const navigate = useNavigate();
//   const router = useRouter();
//   const search: any = useSearch({ from: '/courses/quizes/' });
//   const {
//     lessonId,
//     courseId,
//     chapterId,
//     page = 1,
//     limit = 10,
//     type = 'ALL', // Add type filter to search params
//   } = search;

//   const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
//     null,
//   );

//   // Fetch questions
//   const { data: response, isLoading } = useQuery<ApiResponse>({
//     queryKey: ['questions', lessonId, page, limit, type],
//     queryFn: async () => {
//       const params = new URLSearchParams({
//         courseId: String(courseId),
//         chapterId: String(chapterId),
//         lessonId: String(lessonId),
//         page: String(page),
//         limit: String(limit),
//       });

//       // Add type filter if not 'ALL'
//       if (type && type !== 'ALL') {
//         params.append('type', type);
//       }

//       const res = await _axios.get(`/question/all?${params.toString()}`);
//       return res.data.data;
//     },
//     enabled: !!lessonId,
//   });

//   const handlePageChange = (newPage: number) => {
//     navigate({ search: (prev: any) => ({ ...prev, page: newPage }) });
//   };

//   const handleLimitChange = (newLimit: number) => {
//     navigate({
//       search: (prev: any) => ({ ...prev, page: 1, limit: newLimit }),
//     });
//   };

//   const handleTypeFilter = (newType: string) => {
//     navigate({
//       search: (prev: any) => ({ ...prev, page: 1, type: newType }),
//     });
//   };

//   const totalPages = response?.pagination?.totalPages || 1;
//   const totalItems = response?.pagination?.total || 0;
//   const itemsPerPage = response?.pagination?.limit || limit;
//   const questions = response?.questions || [];
//   const lessonName = response?.lessonStats?.lessonName || '';

//   const handleCreateQuestion = () => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page,
//         limit,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'create',
//         type,
//       },
//     });
//   };

//   const handleEditQuestion = (questionId: string) => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page,
//         limit,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'edit',
//         questionId,
//         type,
//       },
//     });
//   };

//   const getDifficultyColor = (difficulty: string) => {
//     switch (difficulty) {
//       case 'EASY':
//         return 'bg-green-100 text-green-700 border-green-300';
//       case 'MEDIUM':
//         return 'bg-yellow-100 text-yellow-700 border-yellow-300';
//       case 'HARD':
//         return 'bg-red-100 text-red-700 border-red-300';
//       default:
//         return 'bg-gray-100 text-gray-700 border-gray-300';
//     }
//   };

//   const getTypeColor = (type: string) => {
//     return type === 'MCQ'
//       ? 'bg-blue-100 text-blue-700 border-blue-300'
//       : 'bg-purple-100 text-purple-700 border-purple-300';
//   };

//   const getTypeText = (type: string) => {
//     return type === 'MCQ' ? 'MCQ' : 'Fill in Blank';
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="spinner mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading questions...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
//       <Button
//         onClick={() => router.history.back()}
//         variant="outline"
//         className="rounded-xsm hover:text-foreground text-foreground my-3 cursor-pointer hover:bg-accent/50">
//         <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Lessons
//       </Button>
//       <div className="max-w-7xl mx-auto">
//         {/* Header with Lesson Name */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               {lessonName && (
//                 <div className="mt-2 flex items-center gap-2">
//                   <span className="text-gray-600">Lesson:</span>
//                   <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm">
//                     {lessonName}
//                   </span>
//                 </div>
//               )}
//               <p className="text-gray-600 mt-2">
//                 Manage your math quiz questions
//               </p>
//             </div>
//             <button
//               onClick={handleCreateQuestion}
//               className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
//               <Plus className="w-5 h-5" />
//               Create Question
//             </button>
//           </div>

//           {/* Filter Section */}
//           <div className="mt-6 pt-6 border-t border-gray-100">
//             <div className="flex items-center gap-3 mb-4">
//               <Filter className="w-5 h-5 text-gray-600" />
//               <span className="text-sm font-semibold text-gray-700">
//                 Filter by Type:
//               </span>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => handleTypeFilter('ALL')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     type === 'ALL' || !type
//                       ? 'bg-indigo-600 text-white shadow-md'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}>
//                   All Questions
//                 </button>
//                 <button
//                   onClick={() => handleTypeFilter('MCQ')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     type === 'MCQ'
//                       ? 'bg-blue-600 text-white shadow-md'
//                       : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
//                   }`}>
//                   MCQ
//                 </button>
//                 <button
//                   onClick={() => handleTypeFilter('FILL_BLANK')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     type === 'FILL_BLANK'
//                       ? 'bg-purple-600 text-white shadow-md'
//                       : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
//                   }`}>
//                   Fill in Blank
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Lesson Stats Bar */}
//           {response?.lessonStats && (
//             <div className="mt-6 pt-6 border-t border-gray-100">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">📊</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Total Questions</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.mcqCount +
//                         response.lessonStats.fillInBlankCount}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">✅</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">MCQ Questions</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.mcqCount}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">📝</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Fill in Blank</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.fillInBlankCount}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Questions List */}
//         <div className="space-y-4">
//           {questions.length > 0 ? (
//             questions.map((question) => (
//               <div
//                 key={question._id}
//                 className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
//                 <div className="p-6">
//                   {/* Question Header */}
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex gap-2 flex-wrap">
//                       <span
//                         className={`px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
//                           question.type,
//                         )}`}>
//                         {getTypeText(question.type)}
//                       </span>
//                       <span
//                         className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(
//                           question.difficulty,
//                         )}`}>
//                         {question.difficulty}
//                       </span>
//                       <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-300">
//                         {question.marks}{' '}
//                         {question.marks === 1 ? 'Mark' : 'Marks'}
//                       </span>
//                       <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-300">
//                         {new Date(question.createdAt).toLocaleDateString()}
//                       </span>
//                     </div>

//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => setSelectedQuestion(question)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                         title="View Details">
//                         <Eye className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => handleEditQuestion(question._id)}
//                         className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                         title="Edit Question">
//                         <Edit className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => {
//                           /* Add delete handler */
//                         }}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="Delete Question">
//                         <Trash2 className="w-5 h-5" />
//                       </button>
//                     </div>
//                   </div>

//                   {/* Question Content */}
//                   <div className="mb-4">
//                     <div className="text-gray-800 text-lg leading-relaxed bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
//                       <MathPreview
//                         text={question.question.text}
//                         latex={question.question.latex || ''}
//                       />
//                     </div>
//                   </div>

//                   {/* Options Preview (MCQ only) */}
//                   {question.type === 'MCQ' && question.options && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       {question.options.map((option) => (
//                         <div
//                           key={option.id}
//                           className={`p-3 rounded-lg border-2 transition-all ${
//                             question.correctAnswer === option.id
//                               ? 'bg-green-50 border-green-400'
//                               : 'bg-gray-50 border-gray-200'
//                           }`}>
//                           <div className="flex items-start gap-2">
//                             <span
//                               className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
//                                 question.correctAnswer === option.id
//                                   ? 'bg-green-500 text-white'
//                                   : 'bg-gray-300 text-gray-700'
//                               }`}>
//                               {option.id}
//                             </span>
//                             <div className="flex-1 pt-0.5 text-sm">
//                               {option.type === 'LATEX' ? (
//                                 <MathPreview text="" latex={option.answer} />
//                               ) : (
//                                 <span className="text-gray-800">
//                                   {option.answer}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {/* Fill in Blank Answer */}
//                   {question.type === 'FILL_BLANK' && (
//                     <div className="p-3 bg-green-50 border-2 border-green-400 rounded-lg">
//                       <p className="text-sm text-gray-600 mb-1">
//                         Correct Answer:
//                       </p>
//                       <p className="text-gray-800 font-medium">
//                         {question.correctAnswer}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
//               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-5xl">📝</span>
//               </div>
//               <h3 className="text-xl font-bold text-gray-800 mb-2">
//                 No Questions Found
//               </h3>
//               <p className="text-gray-600 mb-6">
//                 {type && type !== 'ALL'
//                   ? `No ${type === 'MCQ' ? 'MCQ' : 'Fill in Blank'} questions found. Try changing the filter.`
//                   : 'Get started by creating your first question'}
//               </p>
//               <button
//                 onClick={handleCreateQuestion}
//                 className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
//                 <Plus className="w-5 h-5" />
//                 Create Question
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Question Detail Modal - (rest of the code remains the same) */}
//       {selectedQuestion && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
//           onClick={() => setSelectedQuestion(null)}>
//           <div
//             className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}>
//             {/* Modal content remains the same */}
//           </div>
//         </div>
//       )}

//       {/* Pagination */}
//       {questions.length > 0 && (
//         <Pagination
//           currentPage={page}
//           totalPages={totalPages}
//           totalItems={totalItems}
//           itemsPerPage={itemsPerPage}
//           onPageChange={handlePageChange}
//           onLimitChange={handleLimitChange}
//           className="p-6 bg-gray-50 border-t"
//         />
//       )}
//     </div>
//   );
// };

// export default QuestionList;

// import { useState } from 'react';
// import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
// import { useQuery } from '@tanstack/react-query';
// import { Plus, Edit, Trash2, Eye, ArrowBigLeft, Filter } from 'lucide-react';
// import MathPreview from './MathPreview';
// import 'katex/dist/katex.min.css';
// import { _axios } from '@/lib/axios';
// import { Pagination } from '../Pagination';
// import { Button } from '../ui/button';

// interface Question {
//   _id: string;
//   type: 'MCQ' | 'FILL_BLANK';
//   difficulty: 'EASY' | 'MEDIUM' | 'HARD';
//   marks: number;
//   question: {
//     text: string;
//     latex: string;
//   };
//   options?: Array<{
//     id: string;
//     answer: string;
//     type?: 'NORMAL' | 'LATEX';
//   }>;
//   correctAnswer: string;
//   isActive?: boolean;
//   createdAt: string;
//   lessonName?: string;
//   questionModel?: 'POST' | 'PRE';
// }

// interface ApiResponse {
//   questions: Question[];
//   lessonStats: {
//     lessonId: string;
//     lessonName: string;
//     mcqCount: number;
//     fillInBlankCount: number;
//   };
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//     hasNextPage: boolean;
//     hasPrevPage: boolean;
//   };
// }

// const QuestionList = () => {
//   const navigate = useNavigate();
//   const router = useRouter();
//   const search: any = useSearch({ from: '/courses/quizes/' });
//   const {
//     lessonId,
//     courseId,
//     chapterId,
//     page = 1,
//     limit = 10,
//     type = 'ALL',
//     questionModel = 'ALL', // Add questionModel filter to search params
//   } = search;

//   const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
//     null,
//   );

//   // Fetch questions
//   const { data: response, isLoading } = useQuery<ApiResponse>({
//     queryKey: ['questions', lessonId, page, limit, type, questionModel],
//     queryFn: async () => {
//       const params = new URLSearchParams({
//         courseId: String(courseId),
//         chapterId: String(chapterId),
//         lessonId: String(lessonId),
//         page: String(page),
//         limit: String(limit),
//       });

//       // Add type filter if not 'ALL'
//       if (type && type !== 'ALL') {
//         params.append('type', type);
//       }

//       // Add questionModel filter if not 'ALL'
//       if (questionModel && questionModel !== 'ALL') {
//         params.append('questionModel', questionModel);
//       }

//       const res = await _axios.get(`/question/all?${params.toString()}`);
//       return res.data.data;
//     },
//     enabled: !!lessonId,
//   });

//   const handlePageChange = (newPage: number) => {
//     navigate({ search: (prev: any) => ({ ...prev, page: newPage }) });
//   };

//   const handleLimitChange = (newLimit: number) => {
//     navigate({
//       search: (prev: any) => ({ ...prev, page: 1, limit: newLimit }),
//     });
//   };

//   const handleTypeFilter = (newType: string) => {
//     navigate({
//       search: (prev: any) => ({ ...prev, page: 1, type: newType }),
//     });
//   };

//   const handleQuestionModelFilter = (newQuestionModel: string) => {
//     navigate({
//       search: (prev: any) => ({
//         ...prev,
//         page: 1,
//         questionModel: newQuestionModel,
//       }),
//     });
//   };

//   const totalPages = response?.pagination?.totalPages || 1;
//   const totalItems = response?.pagination?.total || 0;
//   const itemsPerPage = response?.pagination?.limit || limit;
//   const questions = response?.questions || [];
//   const lessonName = response?.lessonStats?.lessonName || '';

//   const handleCreateQuestion = () => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page,
//         limit,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'create',
//         type,
//         questionModel,
//       },
//     });
//   };

//   const handleEditQuestion = (questionId: string) => {
//     navigate({
//       to: '/courses/quizes',
//       search: {
//         page,
//         limit,
//         lessonId,
//         courseId,
//         chapterId,
//         mode: 'edit',
//         questionId,
//         type,
//         questionModel,
//       },
//     });
//   };

//   const getDifficultyColor = (difficulty: string) => {
//     switch (difficulty) {
//       case 'EASY':
//         return 'bg-green-100 text-green-700 border-green-300';
//       case 'MEDIUM':
//         return 'bg-yellow-100 text-yellow-700 border-yellow-300';
//       case 'HARD':
//         return 'bg-red-100 text-red-700 border-red-300';
//       default:
//         return 'bg-gray-100 text-gray-700 border-gray-300';
//     }
//   };

//   const getTypeColor = (type: string) => {
//     return type === 'MCQ'
//       ? 'bg-blue-100 text-blue-700 border-blue-300'
//       : 'bg-purple-100 text-purple-700 border-purple-300';
//   };

//   const getTypeText = (type: string) => {
//     return type === 'MCQ' ? 'MCQ' : 'Fill in Blank';
//   };

//   const getQuestionModelColor = (model: string) => {
//     return model === 'POST'
//       ? 'bg-orange-100 text-orange-700 border-orange-300'
//       : 'bg-teal-100 text-teal-700 border-teal-300';
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="spinner mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading questions...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
//       <Button
//         onClick={() => router.history.back()}
//         variant="outline"
//         className="rounded-xsm hover:text-foreground text-foreground my-3 cursor-pointer hover:bg-accent/50">
//         <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Lessons
//       </Button>
//       <div className="max-w-7xl mx-auto">
//         {/* Header with Lesson Name */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               {lessonName && (
//                 <div className="mt-2 flex items-center gap-2">
//                   <span className="text-gray-600">Lesson:</span>
//                   <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm">
//                     {lessonName}
//                   </span>
//                 </div>
//               )}
//               <p className="text-gray-600 mt-2">
//                 Manage your math quiz questions
//               </p>
//             </div>
//             <button
//               onClick={handleCreateQuestion}
//               className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
//               <Plus className="w-5 h-5" />
//               Create Question
//             </button>
//           </div>

//           {/* Filter Section */}
//           <div className="mt-6 pt-6 border-t border-gray-100">
//             {/* Question Type Filter */}
//             <div className="flex items-center gap-3 mb-4">
//               <Filter className="w-5 h-5 text-gray-600" />
//               <span className="text-sm font-semibold text-gray-700">
//                 Filter by Type:
//               </span>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => handleTypeFilter('ALL')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     type === 'ALL' || !type
//                       ? 'bg-indigo-600 text-white shadow-md'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}>
//                   All Questions
//                 </button>
//                 <button
//                   onClick={() => handleTypeFilter('MCQ')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     type === 'MCQ'
//                       ? 'bg-blue-600 text-white shadow-md'
//                       : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
//                   }`}>
//                   MCQ
//                 </button>
//                 <button
//                   onClick={() => handleTypeFilter('FILL_BLANK')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     type === 'FILL_BLANK'
//                       ? 'bg-purple-600 text-white shadow-md'
//                       : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
//                   }`}>
//                   Fill in Blank
//                 </button>
//               </div>
//             </div>

//             {/* Question Model Filter */}
//             <div className="flex items-center gap-3">
//               <Filter className="w-5 h-5 text-gray-600" />
//               <span className="text-sm font-semibold text-gray-700">
//                 Filter by Model:
//               </span>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => handleQuestionModelFilter('ALL')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     questionModel === 'ALL' || !questionModel
//                       ? 'bg-indigo-600 text-white shadow-md'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}>
//                   All Models
//                 </button>
//                 <button
//                   onClick={() => handleQuestionModelFilter('PRE')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     questionModel === 'PRE'
//                       ? 'bg-teal-600 text-white shadow-md'
//                       : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
//                   }`}>
//                   PRE
//                 </button>
//                 <button
//                   onClick={() => handleQuestionModelFilter('POST')}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                     questionModel === 'POST'
//                       ? 'bg-orange-600 text-white shadow-md'
//                       : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
//                   }`}>
//                   POST
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Lesson Stats Bar */}
//           {response?.lessonStats && (
//             <div className="mt-6 pt-6 border-t border-gray-100">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">📊</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Total Questions</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.mcqCount +
//                         response.lessonStats.fillInBlankCount}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">✅</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">MCQ Questions</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.mcqCount}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                     <span className="text-lg">📝</span>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">Fill in Blank</p>
//                     <p className="text-xl font-bold text-gray-800">
//                       {response.lessonStats.fillInBlankCount}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Questions List */}
//         <div className="space-y-4">
//           {questions.length > 0 ? (
//             questions.map((question) => (
//               <div
//                 key={question._id}
//                 className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
//                 <div className="p-6">
//                   {/* Question Header */}
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex gap-2 flex-wrap">
//                       <span
//                         className={`px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
//                           question.type,
//                         )}`}>
//                         {getTypeText(question.type)}
//                       </span>
//                       <span
//                         className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(
//                           question.difficulty,
//                         )}`}>
//                         {question.difficulty}
//                       </span>
//                       {question.questionModel && (
//                         <span
//                           className={`px-3 py-1 rounded-lg text-xs font-bold border ${getQuestionModelColor(
//                             question.questionModel,
//                           )}`}>
//                           {question.questionModel}
//                         </span>
//                       )}
//                       {/* <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-300">
//                         {question.marks}{' '}
//                         {question.marks === 1 ? 'Mark' : 'Marks'}
//                       </span> */}
//                       <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-300">
//                         {new Date(question.createdAt).toLocaleDateString()}
//                       </span>
//                     </div>

//                     <div className="flex gap-2">
//                       {/* <button
//                         onClick={() => setSelectedQuestion(question)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                         title="View Details">
//                         <Eye className="w-5 h-5" />
//                       </button> */}
//                       <button
//                         onClick={() => handleEditQuestion(question._id)}
//                         className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                         title="Edit Question">
//                         <Edit className="w-5 h-5" />
//                       </button>
//                       <button
//                         onClick={() => {
//                           /* Add delete handler */
//                         }}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                         title="Delete Question">
//                         <Trash2 className="w-5 h-5" />
//                       </button>
//                     </div>
//                   </div>

//                   {/* Question Content */}
//                   <div className="mb-4">
//                     <div className="text-gray-800 text-lg leading-relaxed bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
//                       <MathPreview
//                         text={question.question.text}
//                         latex={question.question.latex || ''}
//                       />
//                     </div>
//                   </div>

//                   {/* Options Preview (MCQ only) */}
//                   {question.type === 'MCQ' && question.options && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       {question.options.map((option) => (
//                         <div
//                           key={option.id}
//                           className={`p-3 rounded-lg border-2 transition-all ${
//                             question.correctAnswer === option.id
//                               ? 'bg-green-50 border-green-400'
//                               : 'bg-gray-50 border-gray-200'
//                           }`}>
//                           <div className="flex items-start gap-2">
//                             <span
//                               className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
//                                 question.correctAnswer === option.id
//                                   ? 'bg-green-500 text-white'
//                                   : 'bg-gray-300 text-gray-700'
//                               }`}>
//                               {option.id}
//                             </span>
//                             <div className="flex-1 pt-0.5 text-sm">
//                               {option.type === 'LATEX' ? (
//                                 <MathPreview text="" latex={option.answer} />
//                               ) : (
//                                 <span className="text-gray-800">
//                                   {option.answer}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {/* Fill in Blank Answer */}
//                   {question.type === 'FILL_BLANK' && (
//                     <div className="p-3 bg-green-50 border-2 border-green-400 rounded-lg">
//                       <p className="text-sm text-gray-600 mb-1">
//                         Correct Answer:
//                       </p>
//                       <p className="text-gray-800 font-medium">
//                         {question.correctAnswer}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
//               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-5xl">📝</span>
//               </div>
//               <h3 className="text-xl font-bold text-gray-800 mb-2">
//                 No Questions Found
//               </h3>
//               <p className="text-gray-600 mb-6">
//                 {type && type !== 'ALL'
//                   ? `No ${type === 'MCQ' ? 'MCQ' : 'Fill in Blank'} questions found. Try changing the filter.`
//                   : questionModel && questionModel !== 'ALL'
//                     ? `No ${questionModel} questions found. Try changing the filter.`
//                     : 'Get started by creating your first question'}
//               </p>
//               <button
//                 onClick={handleCreateQuestion}
//                 className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
//                 <Plus className="w-5 h-5" />
//                 Create Question
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Question Detail Modal */}
//       {selectedQuestion && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
//           onClick={() => setSelectedQuestion(null)}>
//           <div
//             className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}>
//             {/* Modal content remains the same */}
//           </div>
//         </div>
//       )}

//       {/* Pagination */}
//       {questions.length > 0 && (
//         <Pagination
//           currentPage={page}
//           totalPages={totalPages}
//           totalItems={totalItems}
//           itemsPerPage={itemsPerPage}
//           onPageChange={handlePageChange}
//           onLimitChange={handleLimitChange}
//           className="p-6 bg-gray-50 border-t"
//         />
//       )}
//     </div>
//   );
// };

// export default QuestionList;

import { useState } from 'react';
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, ArrowBigLeft, Filter } from 'lucide-react';
import MathPreview from '../MathPreview';
import 'katex/dist/katex.min.css';
import { _axios } from '@/lib/axios';
import { Pagination } from '../Pagination';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
interface Question {
  _id: string;
  type: 'MCQ' | 'FILL_BLANK';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  question: {
    text: string;
    latex: string;
    image?: string; // ✅ S3 URL for image questions
  };
  options?: Array<{
    id: string;
    answer: string;
    type?: 'NORMAL' | 'LATEX';
  }>;
  correctAnswer: string;
  isActive?: boolean;
  createdAt: string;
  lessonName?: string;
  questionModel?: 'POST' | 'PRE';
}

interface ApiResponse {
  questions: Question[];
  lessonStats: {
    lessonId: string;
    lessonName: string;
    mcqCount: number;
    fillInBlankCount: number;
    preCount: number;
    postCount: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const QuestionContent = ({ question }: { question: Question['question'] }) => {
  if (question.image) {
    return (
      <img
        src={question.image}
        alt="Question"
        className="max-h-64 w-auto rounded-lg object-contain"
      />
    );
  }
  return <MathPreview text={question.text} latex={question.latex || ''} />;
};

const QuestionList = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const search: any = useSearch({ from: '/courses/quizes/' });
  const {
    lessonId,
    courseId,
    chapterId,
    page = 1,
    limit = 10,
    type = 'ALL',
    questionModel = 'ALL', // Add questionModel filter to search params
  } = search;

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );

  // Fetch questions
  const {
    data: response,
    isLoading,
    refetch,
  } = useQuery<ApiResponse>({
    queryKey: ['questions', lessonId, page, limit, type, questionModel],
    queryFn: async () => {
      const params = new URLSearchParams({
        courseId: String(courseId),
        chapterId: String(chapterId),
        lessonId: String(lessonId),
        page: String(page),
        limit: String(limit),
      });

      // Add type filter if not 'ALL'
      if (type && type !== 'ALL') {
        params.append('type', type);
      }

      // Add questionModel filter if not 'ALL'
      if (questionModel && questionModel !== 'ALL') {
        params.append('questionModel', questionModel);
      }

      const res = await _axios.get(`/question/all?${params.toString()}`);
      return res.data.data;
    },
    enabled: !!lessonId,
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) =>
      _axios.delete(`/question/deletequestion?questionId=${questionId}`),
    onSuccess: () => {
      refetch();
      toast.success('question deleted successfully');
    },
  });

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev: any) => ({ ...prev, page: newPage }) });
  };

  const handleLimitChange = (newLimit: number) => {
    navigate({
      search: (prev: any) => ({ ...prev, page: 1, limit: newLimit }),
    });
  };

  const handleTypeFilter = (newType: string) => {
    navigate({
      search: (prev: any) => ({ ...prev, page: 1, type: newType }),
    });
  };

  const handleQuestionModelFilter = (newQuestionModel: string) => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        page: 1,
        questionModel: newQuestionModel,
      }),
    });
  };

  const totalPages = response?.pagination?.totalPages || 1;
  const totalItems = response?.pagination?.total || 0;
  const itemsPerPage = response?.pagination?.limit || limit;
  const questions = response?.questions || [];
  const lessonName = response?.lessonStats?.lessonName || '';

  const handleCreateQuestion = (path: string) => {
    navigate({
      to: '/courses/quizes',
      search: {
        page,
        limit,
        lessonId,
        courseId,
        chapterId,
        mode: path,
        type,
        questionModel,
      },
    });
  };

  const handleEditQuestion = (questionId: string) => {
    navigate({
      to: '/courses/quizes',
      search: {
        page,
        limit,
        lessonId,
        courseId,
        chapterId,
        mode: 'edit',
        questionId,
        type,
        questionModel,
      },
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'HARD':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'MCQ'
      ? 'bg-blue-100 text-blue-700 border-blue-300'
      : 'bg-purple-100 text-purple-700 border-purple-300';
  };

  const getTypeText = (type: string) => {
    return type === 'MCQ' ? 'MCQ' : 'Fill in Blank';
  };

  const getQuestionModelColor = (model: string) => {
    return model === 'POST'
      ? 'bg-orange-100 text-orange-700 border-orange-300'
      : 'bg-teal-100 text-teal-700 border-teal-300';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50  px-4">
      <Button
        onClick={() => {
          navigate({
            to: '/courses/$id/chapters/$chapterId',
            params: {
              id: String(courseId),
              chapterId: String(chapterId),
            },
          });
        }}
        variant="outline"
        className="rounded-xsm hover:text-foreground text-foreground my-3 cursor-pointer hover:bg-accent/50">
        <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Lessons
      </Button>
      <div className="max-w-7xl mx-auto">
        {/* Header with Lesson Name */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 border border-indigo-100 sticky top-16 z-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              {lessonName && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-600">Lesson:</span>
                  <span className="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm">
                    {lessonName}
                  </span>
                </div>
              )}
              <p className="text-gray-600 mt-2">
                Manage your math quiz questions
              </p>
            </div>
            <div className="flex item-center gap-3">
              <button
                onClick={() => {
                  handleCreateQuestion('bulk');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <Plus className="w-5 h-5" />
                Bulk Upload
              </button>
              <button
                onClick={() => {
                  handleCreateQuestion('create');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <Plus className="w-5 h-5" />
                Create Question
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex item-center justify-between flex-wrap">
            {/* Question Type Filter */}
            <div className="flex items-center gap-3 ">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Filter by Type:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTypeFilter('ALL')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === 'ALL' || !type
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  All Questions
                </button>
                <button
                  onClick={() => handleTypeFilter('MCQ')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === 'MCQ'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}>
                  MCQ
                </button>
                <button
                  onClick={() => handleTypeFilter('FILL_BLANK')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === 'FILL_BLANK'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}>
                  Fill in Blank
                </button>
              </div>
            </div>

            {/* Question Model Filter */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Filter by Model:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuestionModelFilter('ALL')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    questionModel === 'ALL' || !questionModel
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  All Models
                </button>
                <button
                  onClick={() => handleQuestionModelFilter('PRE')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    questionModel === 'PRE'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  }`}>
                  PRE
                </button>
                <button
                  onClick={() => handleQuestionModelFilter('POST')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    questionModel === 'POST'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}>
                  POST
                </button>
              </div>
            </div>
          </div>

          {/* Lesson Stats Bar */}
          {response?.lessonStats && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="text-xl font-bold text-gray-800">
                      {response.lessonStats.mcqCount +
                        response.lessonStats.fillInBlankCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">✅</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MCQ Questions</p>
                    <p className="text-xl font-bold text-gray-800">
                      {response.lessonStats.mcqCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fill in Blank</p>
                    <p className="text-xl font-bold text-gray-800">
                      {response.lessonStats.fillInBlankCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">PRE Questions</p>
                    <p className="text-xl font-bold text-gray-800">
                      {response.lessonStats.preCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎓</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">POST Questions</p>
                    <p className="text-xl font-bold text-gray-800">
                      {response.lessonStats.postCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length > 0 ? (
            questions.map((question) => (
              <div
                key={question._id}
                className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${getTypeColor(
                          question.type,
                        )}`}>
                        {getTypeText(question.type)}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(
                          question.difficulty,
                        )}`}>
                        {question.difficulty}
                      </span>
                      {question.questionModel && (
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${getQuestionModelColor(
                            question.questionModel,
                          )}`}>
                          {question.questionModel}
                        </span>
                      )}
                      {/* <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-300">
                        {question.marks}{' '}
                        {question.marks === 1 ? 'Mark' : 'Marks'}
                      </span> */}
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-300">
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {/* <button
                        onClick={() => setSelectedQuestion(question)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details">
                        <Eye className="w-5 h-5" />
                      </button> */}
                      <button
                        onClick={() => handleEditQuestion(question._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Question">
                        <Edit className="w-5 h-5" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Question ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently Delete the question
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMutation.mutate(question._id)
                              }
                              className="">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="mb-4">
                    <div className="text-gray-800 text-lg leading-relaxed bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                      <QuestionContent question={question.question} />
                    </div>
                  </div>

                  {/* Options Preview (MCQ only) */}
                  {question.type === 'MCQ' && question.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            question.correctAnswer === option.id
                              ? 'bg-green-50 border-green-400'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                          <div className="flex items-start gap-2">
                            <span
                              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                                question.correctAnswer === option.id
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-700'
                              }`}>
                              {option.id}
                            </span>
                            <div className="flex-1 pt-0.5 text-sm">
                              {option.type === 'LATEX' ? (
                                <MathPreview text="" latex={option.answer} />
                              ) : (
                                <span className="text-gray-800">
                                  {option.answer}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fill in Blank Answer */}
                  {question.type === 'FILL_BLANK' && (
                    <div className="p-3 bg-green-50 border-2 border-green-400 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        Correct Answer:
                      </p>
                      <p className="text-gray-800 font-medium">
                        {question.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Questions Found
              </h3>
              <p className="text-gray-600 mb-6">
                {type && type !== 'ALL'
                  ? `No ${type === 'MCQ' ? 'MCQ' : 'Fill in Blank'} questions found. Try changing the filter.`
                  : questionModel && questionModel !== 'ALL'
                    ? `No ${questionModel} questions found. Try changing the filter.`
                    : 'Get started by creating your first question'}
              </p>
              {/* <button
                onClick={handleCreateQuestion}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <Plus className="w-5 h-5" />
                Create Question
              </button> */}
            </div>
          )}
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQuestion(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal content remains the same */}
          </div>
        </div>
      )}

      {/* Pagination */}
      {questions.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          className="p-6 bg-gray-50 border-t"
        />
      )}
    </div>
  );
};

export default QuestionList;
