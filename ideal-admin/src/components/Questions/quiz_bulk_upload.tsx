// import { useState } from 'react';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { useNavigate } from '@tanstack/react-router';
// import {
//   ArrowLeft,
//   Upload,
//   FileText,
//   Video,
//   Image as ImageIcon,
//   X,
//   CheckCircle,
//   ChevronRight,
//   Clock,
//   RefreshCw,
// } from 'lucide-react';
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

// interface ExistingPdf {
//   id: string;
//   pdf_id: string;
//   fileName: string;
//   status: string;
//   numPages: number | null;
//   numPagesCompleted: number | null;
//   percentDone: number | null;
//   createdAt: string;
// }

// interface QuizBulkUploadProps {
//   courseId: string;
//   lessonId: string;
//   chapterId: string;
// }

// const statusBadge = (status: string) => {
//   const map: Record<string, { label: string; className: string }> = {
//     completed: {
//       label: 'Completed',
//       className: 'bg-emerald-100 text-emerald-700',
//     },
//     processing: {
//       label: 'Processing',
//       className: 'bg-amber-100 text-amber-700',
//     },
//     error: { label: 'Error', className: 'bg-red-100 text-red-700' },
//   };
//   const cfg = map[status] ?? {
//     label: status,
//     className: 'bg-gray-100 text-gray-600',
//   };
//   return (
//     <span
//       className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.className}`}>
//       {cfg.label}
//     </span>
//   );
// };

// const QuizBulkUpload = ({
//   courseId,
//   lessonId,
//   chapterId,
// }: QuizBulkUploadProps) => {
//   const navigate = useNavigate();

//   // Steps: 'select' → show existing PDFs + upload option
//   //        'upload' → drag-drop upload UI (new PDF)
//   //        'uploaded' → PDF uploaded, ready to parse
//   //        'review' → edit parsed questions
//   const [currentStep, setCurrentStep] = useState<
//     'select' | 'upload' | 'uploaded' | 'review'
//   >('select');

//   const [pdfFile, setPdfFile] = useState<File | null>(null);
//   const [pdfId, setPdfId] = useState<string | null>(null);

//   const [editedQuestions, setEditedQuestions] = useState<
//     CreateQuestionSchema[]
//   >([]);

//   const [solutionPreviews, setSolutionPreviews] = useState<
//     Record<number, string | null>
//   >({});
//   const [solutionFiles, setSolutionFiles] = useState<
//     Record<number, File | null>
//   >({});

//   // ─── Fetch existing PDFs for this lesson ───────────────────────────────────
//   const {
//     data: existingPdfsData,
//     isLoading: pdfsLoading,
//     refetch: refetchPdfs,
//   } = useQuery({
//     queryKey: ['uploaded-pdfs', lessonId],
//     queryFn: async () => {
//       const res = await _axios.get(`/question/pdfs/lesson/${lessonId}`);
//       return res.data;
//     },
//     enabled: currentStep === 'select',
//   });

//   const existingPdfs: ExistingPdf[] = existingPdfsData?.success
//     ? existingPdfsData.pdfs
//     : [];

//   // ─── Mutations ─────────────────────────────────────────────────────────────
//   const uploadPdfMutation = useMutation({
//     mutationFn: async (file: File) => {
//       const formData = new FormData();
//       formData.append('file', file);
//       const response = await _axios.post('/question/upload', formData);
//       return response.data;
//     },
//     onSuccess: (data) => {
//       if (data.success && data.pdf_id) {
//         setPdfId(data.pdf_id);
//         setCurrentStep('uploaded');
//       }
//     },
//     onError: (error: any) => {
//       console.error('PDF upload failed:', error);
//       alert('Failed to upload PDF to Mathpix. Please try again.');
//     },
//   });

//   const processBulkMutation = useMutation({
//     mutationFn: async (pdf_id: string) => {
//       const response = await _axios.post('/question/process-bulk', {
//         pdf_id,
//         lessonId,
//       });
//       return response.data;
//     },
//     onSuccess: (data) => {
//       if (data.success && data.questions?.length) {
//         const converted = data.questions.map((parsed: any, idx: number) =>
//           convertParsedToFormData(parsed, idx),
//         );
//         setEditedQuestions(converted);
//         setCurrentStep('review');
//       } else {
//         alert('No questions were parsed from the PDF.');
//       }
//     },
//     onError: (error: any) => {
//       console.error('Bulk processing failed:', error);
//       alert('Failed to process PDF. Please try again.');
//     },
//   });

//   const bulkCreateMutation = useMutation({
//     mutationFn: async () => {
//       const savePromises = editedQuestions.map(async (question, index) => {
//         const isImageSolution =
//           question.solutionType === SolutionType.IMAGE && solutionFiles[index];

//         let payload: FormData | CreateQuestionSchema;

//         if (isImageSolution) {
//           const fd = new FormData();
//           fd.append('courseId', question.courseId);
//           fd.append('chapterId', question.chapterId);
//           fd.append('lessonId', question.lessonId);
//           fd.append('type', question.type);
//           fd.append('difficulty', question.difficulty);
//           fd.append('questionModel', question.questionModel);
//           fd.append('questionSet', question.questionSet);
//           fd.append('solutionType', question.solutionType);
//           fd.append('correctAnswer', question.correctAnswer);
//           fd.append(
//             'question',
//             JSON.stringify({
//               text: question.question.text || '',
//               latex: question.question.latex || '',
//             }),
//           );
//           fd.append(
//             'options',
//             JSON.stringify(question.type === 'MCQ' ? question.options : []),
//           );
//           fd.append('solution', solutionFiles[index]!);
//           payload = fd;
//         } else {
//           payload = {
//             ...question,
//             options: question.type === 'MCQ' ? question.options : [],
//           };
//         }

//         const config = isImageSolution
//           ? { headers: { 'Content-Type': 'multipart/form-data' } }
//           : { headers: { 'Content-Type': 'application/json' } };

//         return _axios.post('/question', payload, config);
//       });

//       return Promise.all(savePromises);
//     },
//     onSuccess: () => {
//       alert(`✅ ${editedQuestions.length} questions created successfully!`);
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
//     onError: (error: any) => {
//       console.error('Bulk create error:', error);
//       alert('Failed to save some questions. Please check console.');
//     },
//   });

//   // ─── Helpers ───────────────────────────────────────────────────────────────
//   const convertParsedToFormData = (
//     parsed: any,
//     index: number,
//   ): CreateQuestionSchema => ({
//     courseId,
//     chapterId,
//     lessonId,
//     type: (parsed.type as QuestionType) || 'MCQ',
//     difficulty: (parsed.difficulty as Difficulty) || 'MEDIUM',
//     questionModel: 'PRE' as QuestionModel,
//     questionSet: `SET_${(index % 10) + 1}` as QuestionSet,
//     question: {
//       text: parsed.question?.text || '',
//       latex: parsed.question?.latex || '',
//       image: undefined,
//     },
//     options:
//       parsed.options?.map((opt: any) => ({
//         id: opt.id,
//         answer: opt.answer || '',
//         type: 'LATEX' as OptionType,
//       })) || [],
//     correctAnswer: parsed.correctAnswer || '',
//     solutionType: (parsed.solutionType as SolutionType) || SolutionType.TEXT,
//     solution: parsed.solution || '',
//   });

//   const updateQuestion = (
//     index: number,
//     updates: Partial<CreateQuestionSchema>,
//   ) => {
//     setEditedQuestions((prev) => {
//       const copy = [...prev];
//       copy[index] = { ...copy[index], ...updates };
//       return copy;
//     });
//   };

//   const updateOption = (
//     qIndex: number,
//     optIndex: number,
//     value: string,
//     type: OptionType,
//   ) => {
//     setEditedQuestions((prev) => {
//       const copy = [...prev];
//       const newOptions = [...copy[qIndex].options];
//       newOptions[optIndex] = { ...newOptions[optIndex], answer: value, type };
//       copy[qIndex] = { ...copy[qIndex], options: newOptions };
//       return copy;
//     });
//   };

//   const setCorrectForQuestion = (qIndex: number, id: string) =>
//     updateQuestion(qIndex, { correctAnswer: id });

//   const removeQuestion = (index: number) => {
//     setEditedQuestions((prev) => prev.filter((_, i) => i !== index));
//     setSolutionPreviews((prev) => {
//       const c = { ...prev };
//       delete c[index];
//       return c;
//     });
//     setSolutionFiles((prev) => {
//       const c = { ...prev };
//       delete c[index];
//       return c;
//     });
//   };

//   const handleSolutionTypeChange = (qIndex: number, type: SolutionType) => {
//     updateQuestion(qIndex, { solutionType: type, solution: '' });
//     setSolutionPreviews((prev) => ({ ...prev, [qIndex]: null }));
//     setSolutionFiles((prev) => ({ ...prev, [qIndex]: null }));
//   };

//   const handleSolutionImageChange = (
//     qIndex: number,
//     e: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setSolutionFiles((prev) => ({ ...prev, [qIndex]: file }));
//     const reader = new FileReader();
//     reader.onloadend = () =>
//       setSolutionPreviews((prev) => ({
//         ...prev,
//         [qIndex]: reader.result as string,
//       }));
//     reader.readAsDataURL(file);
//     updateQuestion(qIndex, { solution: file.name });
//   };

//   const handleRemoveSolutionImage = (qIndex: number) => {
//     setSolutionPreviews((prev) => ({ ...prev, [qIndex]: null }));
//     setSolutionFiles((prev) => ({ ...prev, [qIndex]: null }));
//     updateQuestion(qIndex, { solution: '' });
//   };

//   const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     const file = e.dataTransfer.files[0];
//     if (file?.type === 'application/pdf') setPdfFile(file);
//   };

//   const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file?.type === 'application/pdf') setPdfFile(file);
//   };

//   const startUpload = () => {
//     if (pdfFile) uploadPdfMutation.mutate(pdfFile);
//   };
//   const startProcessing = () => {
//     if (pdfId) processBulkMutation.mutate(pdfId);
//   };

//   // Called when user picks an already-uploaded PDF from the list
//   const handleSelectExistingPdf = (pdf: ExistingPdf) => {
//     setPdfId(pdf.pdf_id);
//     setCurrentStep('uploaded');
//   };

//   const handleBulkSave = () => {
//     if (editedQuestions.length === 0) {
//       alert('No questions to save');
//       return;
//     }
//     bulkCreateMutation.mutate();
//   };

//   const handleBack = () =>
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
//       icon: ImageIcon,
//       color: 'emerald',
//     },
//   ] as const;

//   // ─── Render ────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-indigo-100">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={handleBack}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                 <ArrowLeft className="w-6 h-6 text-gray-600" />
//               </button>
//               <div>
//                 <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                   Bulk Upload Math Questions
//                 </h1>
//                 <p className="text-gray-600 mt-1">
//                   Select an existing PDF or upload a new one → Review &amp; edit
//                   → Save all at once
//                 </p>
//               </div>
//             </div>

//             {currentStep === 'review' && (
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={handleBack}
//                   className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleBulkSave}
//                   disabled={
//                     bulkCreateMutation.isPending || editedQuestions.length === 0
//                   }
//                   className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg disabled:opacity-50">
//                   {bulkCreateMutation.isPending ? (
//                     'Saving all questions...'
//                   ) : (
//                     <>
//                       <CheckCircle className="w-5 h-5" />
//                       Save {editedQuestions.length} Questions
//                     </>
//                   )}
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── STEP: SELECT (existing PDFs + upload new) ── */}
//         {currentStep === 'select' && (
//           <div className="space-y-6">
//             {/* Upload new card */}
//             <div
//               className="bg-white rounded-3xl shadow-xl border-2 border-dashed border-purple-300 p-8 flex items-center gap-6 cursor-pointer hover:border-purple-500 hover:shadow-2xl transition-all group"
//               onClick={() => setCurrentStep('upload')}>
//               <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
//                 <Upload className="w-7 h-7" />
//               </div>
//               <div className="flex-1">
//                 <p className="text-lg font-semibold text-gray-800">
//                   Upload a new PDF
//                 </p>
//                 <p className="text-sm text-gray-500 mt-0.5">
//                   Mathpix will extract all math questions, options, and LaTeX
//                   automatically
//                 </p>
//               </div>
//               <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
//             </div>

//             {/* Existing PDFs */}
//             <div className="bg-white rounded-3xl shadow-xl p-8">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-bold text-gray-800">
//                   Previously uploaded PDFs
//                 </h2>
//                 <button
//                   onClick={() => refetchPdfs()}
//                   className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
//                   <RefreshCw className="w-4 h-4" />
//                   Refresh
//                 </button>
//               </div>

//               {pdfsLoading ? (
//                 <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
//                   <RefreshCw className="w-5 h-5 animate-spin" />
//                   Loading PDFs…
//                 </div>
//               ) : existingPdfs.length === 0 ? (
//                 <div className="text-center py-16 text-gray-400">
//                   <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
//                   <p className="text-sm">
//                     No PDFs uploaded for this lesson yet.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {existingPdfs.map((pdf) => (
//                     <button
//                       key={pdf.id}
//                       disabled={pdf.status !== 'completed'}
//                       onClick={() => handleSelectExistingPdf(pdf)}
//                       className="w-full flex items-center gap-5 p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left group">
//                       {/* Icon */}
//                       <div className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0 group-hover:border-indigo-300">
//                         <FileText className="w-5 h-5 text-indigo-500" />
//                       </div>

//                       {/* Info */}
//                       <div className="flex-1 min-w-0">
//                         <p className="font-medium text-gray-800 truncate">
//                           {pdf.fileName}
//                         </p>
//                         <div className="flex items-center gap-3 mt-1">
//                           <span className="flex items-center gap-1 text-xs text-gray-400">
//                             <Clock className="w-3 h-3" />
//                             {new Date(pdf.createdAt).toLocaleDateString(
//                               'en-GB',
//                               {
//                                 day: 'numeric',
//                                 month: 'short',
//                                 year: 'numeric',
//                                 hour: '2-digit',
//                                 minute: '2-digit',
//                               },
//                             )}
//                           </span>
//                           {pdf.numPages != null && (
//                             <span className="text-xs text-gray-400">
//                               {pdf.numPages} pages
//                             </span>
//                           )}
//                         </div>
//                       </div>

//                       {/* Status + arrow */}
//                       <div className="flex items-center gap-3 shrink-0">
//                         {statusBadge(pdf.status)}
//                         {pdf.status === 'completed' && (
//                           <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
//                         )}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* ── STEP: UPLOAD (new PDF drag-drop) ── */}
//         {currentStep === 'upload' && (
//           <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
//             <button
//               onClick={() => setCurrentStep('select')}
//               className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
//               <ArrowLeft className="w-4 h-4" /> Back to PDF list
//             </button>

//             <div
//               onDrop={handlePdfDrop}
//               onDragOver={(e) => e.preventDefault()}
//               className="border-2 border-dashed border-purple-300 rounded-3xl py-16 px-8 hover:border-purple-400 transition-colors cursor-pointer">
//               <Upload className="w-16 h-16 mx-auto text-purple-500 mb-6" />
//               <h3 className="text-2xl font-semibold text-gray-800 mb-2">
//                 Upload your PDF
//               </h3>
//               <p className="text-gray-500 mb-8 max-w-md mx-auto">
//                 Our Mathpix-powered pipeline will extract all math questions,
//                 options, and LaTeX automatically
//               </p>

//               <label className="inline-flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-2xl font-semibold cursor-pointer hover:bg-purple-700">
//                 <Upload className="w-5 h-5" />
//                 Choose PDF file
//                 <input
//                   type="file"
//                   accept="application/pdf"
//                   className="hidden"
//                   onChange={handlePdfSelect}
//                 />
//               </label>

//               {pdfFile && (
//                 <div className="mt-8 flex items-center justify-center gap-3 text-sm">
//                   <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-2xl flex items-center gap-2">
//                     📄 {pdfFile.name}
//                   </div>
//                   <button
//                     onClick={startUpload}
//                     disabled={uploadPdfMutation.isPending}
//                     className="px-6 py-2 bg-purple-600 text-white rounded-2xl font-medium hover:bg-purple-700 disabled:opacity-50">
//                     {uploadPdfMutation.isPending
//                       ? 'Uploading to Mathpix...'
//                       : 'Upload & Continue'}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* ── STEP: UPLOADED (ready to parse) ── */}
//         {currentStep === 'uploaded' && (
//           <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
//             <button
//               onClick={() => setCurrentStep('select')}
//               className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
//               <ArrowLeft className="w-4 h-4" /> Back to PDF list
//             </button>

//             <div className="max-w-md mx-auto">
//               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
//                 ✅
//               </div>
//               <h3 className="text-2xl font-semibold mb-2">
//                 PDF ready to parse!
//               </h3>
//               <p className="text-gray-500 mb-8">
//                 PDF ID:{' '}
//                 <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">
//                   {pdfId}
//                 </span>
//               </p>

//               <button
//                 onClick={startProcessing}
//                 disabled={processBulkMutation.isPending}
//                 className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-bold text-xl shadow-lg hover:shadow-xl disabled:opacity-50">
//                 {processBulkMutation.isPending
//                   ? 'Processing with Mathpix...'
//                   : 'Parse Questions Now'}
//               </button>

//               <p className="text-xs text-gray-400 mt-8">
//                 This may take a few seconds depending on PDF size
//               </p>
//             </div>
//           </div>
//         )}

//         {/* ── STEP: REVIEW & EDIT ── */}
//         {currentStep === 'review' && (
//           <div>
//             <div className="flex items-center justify-between mb-6 px-2">
//               <h2 className="text-3xl font-bold text-gray-800">
//                 Review {editedQuestions.length} Questions
//               </h2>
//               <div className="text-sm text-gray-500">
//                 All fields are editable • Questions without correct answers will
//                 still be saved
//               </div>
//             </div>

//             <div className="space-y-8">
//               {editedQuestions.map((question, qIndex) => (
//                 <div
//                   key={qIndex}
//                   className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
//                   {/* Question header */}
//                   <div className="px-8 pt-6 pb-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
//                     <div className="flex items-center gap-4">
//                       <span className="text-2xl font-bold text-purple-600">
//                         Q{qIndex + 1}
//                       </span>
//                       <div className="flex gap-2">
//                         <select
//                           value={question.type}
//                           onChange={(e) =>
//                             updateQuestion(qIndex, {
//                               type: e.target.value as QuestionType,
//                             })
//                           }
//                           className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400">
//                           <option value="MCQ">MCQ</option>
//                           <option value="FILL_BLANK">Fill in the Blank</option>
//                         </select>
//                         <select
//                           value={question.difficulty}
//                           onChange={(e) =>
//                             updateQuestion(qIndex, {
//                               difficulty: e.target.value as Difficulty,
//                             })
//                           }
//                           className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400">
//                           <option value="EASY">Easy</option>
//                           <option value="MEDIUM">Medium</option>
//                           <option value="HARD">Hard</option>
//                         </select>
//                         <select
//                           value={question.questionModel}
//                           onChange={(e) =>
//                             updateQuestion(qIndex, {
//                               questionModel: e.target.value as QuestionModel,
//                             })
//                           }
//                           className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400">
//                           <option value="PRE">Pre Question</option>
//                           <option value="POST">Post Question</option>
//                         </select>
//                         <select
//                           value={question.questionSet}
//                           onChange={(e) =>
//                             updateQuestion(qIndex, {
//                               questionSet: e.target.value as QuestionSet,
//                             })
//                           }
//                           className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400">
//                           {Array.from({ length: 10 }, (_, i) => (
//                             <option key={i} value={`SET_${i + 1}`}>
//                               SET {i + 1}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => removeQuestion(qIndex)}
//                       className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium">
//                       <X className="w-4 h-4" />
//                       Remove Question
//                     </button>
//                   </div>

//                   {/* Question body */}
//                   <div className="p-8">
//                     <div className="mb-8">
//                       <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
//                         Question
//                       </div>
//                       <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
//                         <MathPreview
//                           text={question.question.text}
//                           latex={question.question.latex}
//                         />
//                       </div>
//                     </div>

//                     {question.type === 'MCQ' && question.options.length > 0 && (
//                       <div className="mb-10">
//                         <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">
//                           Options
//                         </div>
//                         <div className="space-y-4">
//                           {question.options.map((option, optIndex) => (
//                             <OptionInput
//                               key={option.id}
//                               option={option}
//                               index={optIndex}
//                               isCorrect={question.correctAnswer === option.id}
//                               onCorrectChange={(id) =>
//                                 setCorrectForQuestion(qIndex, id)
//                               }
//                               onChange={(oIdx, value, type) =>
//                                 updateOption(qIndex, oIdx, value, type)
//                               }
//                               onRemove={() => {}}
//                               canRemove={false}
//                             />
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {question.type === 'FILL_BLANK' && (
//                       <div className="mb-10">
//                         <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">
//                           Correct Answer
//                         </div>
//                         <input
//                           type="text"
//                           value={question.correctAnswer}
//                           onChange={(e) =>
//                             updateQuestion(qIndex, {
//                               correctAnswer: e.target.value.trim(),
//                             })
//                           }
//                           className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none"
//                           placeholder="Exact answer students must type"
//                         />
//                       </div>
//                     )}

//                     {/* Solution Section */}
//                     <div>
//                       <div className="text-xs uppercase tracking-widest text-gray-400 mb-3">
//                         Solution
//                       </div>
//                       <div className="flex gap-2 mb-4">
//                         {solutionTypeOptions.map(
//                           ({ value, label, icon: Icon, color }) => {
//                             const isActive = question.solutionType === value;
//                             const colorMap: Record<string, string> = {
//                               indigo: isActive
//                                 ? 'bg-indigo-600 text-white'
//                                 : 'bg-gray-100 text-gray-600 hover:bg-indigo-50',
//                               rose: isActive
//                                 ? 'bg-rose-600 text-white'
//                                 : 'bg-gray-100 text-gray-600 hover:bg-rose-50',
//                               emerald: isActive
//                                 ? 'bg-emerald-600 text-white'
//                                 : 'bg-gray-100 text-gray-600 hover:bg-emerald-50',
//                             };
//                             return (
//                               <button
//                                 key={value}
//                                 type="button"
//                                 onClick={() =>
//                                   handleSolutionTypeChange(qIndex, value)
//                                 }
//                                 className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all border ${colorMap[color]}`}>
//                                 <Icon className="w-4 h-4" />
//                                 {label}
//                               </button>
//                             );
//                           },
//                         )}
//                       </div>

//                       {question.solutionType === SolutionType.TEXT && (
//                         <textarea
//                           value={question.solution as string}
//                           onChange={(e) =>
//                             updateQuestion(qIndex, { solution: e.target.value })
//                           }
//                           rows={5}
//                           className="w-full px-5 py-4 border border-gray-300 rounded-3xl focus:border-teal-400 focus:ring-2 focus:ring-teal-200 outline-none resize-none"
//                           placeholder="Enter solution in LaTeX..."
//                         />
//                       )}

//                       {question.solutionType === SolutionType.VIDEO && (
//                         <input
//                           type="url"
//                           value={question.solution as string}
//                           onChange={(e) =>
//                             updateQuestion(qIndex, { solution: e.target.value })
//                           }
//                           className="w-full px-5 py-4 border border-gray-300 rounded-3xl focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
//                           placeholder="https://youtube.com/watch?v=..."
//                         />
//                       )}

//                       {question.solutionType === SolutionType.IMAGE && (
//                         <div>
//                           {!solutionPreviews[qIndex] ? (
//                             <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-emerald-300 rounded-3xl cursor-pointer bg-emerald-50 hover:bg-emerald-100">
//                               <div className="text-emerald-600 flex flex-col items-center gap-3">
//                                 <Upload className="w-10 h-10" />
//                                 <span className="font-semibold">
//                                   Upload solution image
//                                 </span>
//                                 <span className="text-xs">
//                                   PNG, JPG, WEBP • max 5 MB
//                                 </span>
//                               </div>
//                               <input
//                                 type="file"
//                                 accept="image/*"
//                                 className="hidden"
//                                 onChange={(e) =>
//                                   handleSolutionImageChange(qIndex, e)
//                                 }
//                               />
//                             </label>
//                           ) : (
//                             <div className="relative rounded-3xl overflow-hidden border border-emerald-200 bg-white">
//                               <img
//                                 src={solutionPreviews[qIndex]!}
//                                 alt="Solution"
//                                 className="w-full max-h-64 object-contain"
//                               />
//                               <button
//                                 onClick={() =>
//                                   handleRemoveSolutionImage(qIndex)
//                                 }
//                                 className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-2xl hover:bg-red-600">
//                                 <X className="w-5 h-5" />
//                               </button>
//                               <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-4 py-3 text-xs text-gray-500">
//                                 {solutionFiles[qIndex]?.name ||
//                                   'Solution image'}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {editedQuestions.length === 0 && (
//               <div className="text-center py-20 text-gray-400">
//                 No questions left to review.
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default QuizBulkUpload;

// import { useState, useRef } from 'react';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { useNavigate } from '@tanstack/react-router';
// import {
//   ArrowLeft,
//   Upload,
//   FileText,
//   Video,
//   Image as ImageIcon,
//   X,
//   CheckCircle,
//   ChevronRight,
//   Clock,
//   RefreshCw,
// } from 'lucide-react';
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

// // ─── Types ─────────────────────────────────────────────────────────────────────

// export enum SolutionType {
//   IMAGE = 'IMAGE',
//   VIDEO = 'VIDEO',
//   TEXT = 'TEXT',
// }

// type QuestionInputType = 'LATEX' | 'NORMAL' | 'IMAGE';

// interface ExistingPdf {
//   id: string;
//   pdf_id: string;
//   fileName: string;
//   status: string;
//   numPages: number | null;
//   numPagesCompleted: number | null;
//   percentDone: number | null;
//   createdAt: string;
// }

// interface QuizBulkUploadProps {
//   courseId: string;
//   lessonId: string;
//   chapterId: string;
// }

// // ─── Small helpers ─────────────────────────────────────────────────────────────

// const statusBadge = (status: string) => {
//   const map: Record<string, { label: string; cls: string }> = {
//     completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700' },
//     processing: { label: 'Processing', cls: 'bg-amber-100 text-amber-700' },
//     error: { label: 'Error', cls: 'bg-red-100 text-red-700' },
//   };
//   const cfg = map[status] ?? {
//     label: status,
//     cls: 'bg-gray-100 text-gray-600',
//   };
//   return (
//     <span
//       className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
//       {cfg.label}
//     </span>
//   );
// };

// const solutionColorMap: Record<string, { active: string; inactive: string }> = {
//   indigo: {
//     active: 'bg-indigo-600 text-white border-indigo-600',
//     inactive: 'bg-gray-100 text-gray-600 hover:bg-indigo-50 border-gray-200',
//   },
//   rose: {
//     active: 'bg-rose-600 text-white border-rose-600',
//     inactive: 'bg-gray-100 text-gray-600 hover:bg-rose-50 border-gray-200',
//   },
//   emerald: {
//     active: 'bg-emerald-600 text-white border-emerald-600',
//     inactive: 'bg-gray-100 text-gray-600 hover:bg-emerald-50 border-gray-200',
//   },
// };

// const solutionTypeOptions = [
//   { value: SolutionType.TEXT, label: 'Text', icon: FileText, color: 'indigo' },
//   { value: SolutionType.VIDEO, label: 'Video', icon: Video, color: 'rose' },
//   {
//     value: SolutionType.IMAGE,
//     label: 'Image',
//     icon: ImageIcon,
//     color: 'emerald',
//   },
// ] as const;

// // ─── Component ─────────────────────────────────────────────────────────────────

// const QuizBulkUpload = ({
//   courseId,
//   lessonId,
//   chapterId,
// }: QuizBulkUploadProps) => {
//   const navigate = useNavigate();

//   // ── Step management ──────────────────────────────────────────────────────────
//   // select → upload → uploaded → review
//   const [currentStep, setCurrentStep] = useState<
//     'select' | 'upload' | 'uploaded' | 'review'
//   >('select');

//   // ── PDF state ────────────────────────────────────────────────────────────────
//   const [pdfFile, setPdfFile] = useState<File | null>(null);
//   const [pdfId, setPdfId] = useState<string | null>(null);

//   // ── Parsed questions ─────────────────────────────────────────────────────────
//   const [editedQuestions, setEditedQuestions] = useState<
//     CreateQuestionSchema[]
//   >([]);

//   // ── Per-question: SOLUTION image ─────────────────────────────────────────────
//   const [solutionPreviews, setSolutionPreviews] = useState<
//     Record<number, string | null>
//   >({});
//   const [solutionFiles, setSolutionFiles] = useState<
//     Record<number, File | null>
//   >({});

//   // ── Per-question: QUESTION input type ────────────────────────────────────────
//   const [questionInputTypes, setQuestionInputTypes] = useState<
//     Record<number, QuestionInputType>
//   >({});

//   // ── Per-question: QUESTION image ─────────────────────────────────────────────
//   const [questionImagePreviews, setQuestionImagePreviews] = useState<
//     Record<number, string | null>
//   >({});
//   const [questionImageFiles, setQuestionImageFiles] = useState<
//     Record<number, File | null>
//   >({});

//   // One hidden <input type="file"> ref per question card
//   const questionImageInputRefs = useRef<
//     Record<number, HTMLInputElement | null>
//   >({});

//   // ── Fetch existing PDFs for this lesson ──────────────────────────────────────
//   const {
//     data: existingPdfsData,
//     isLoading: pdfsLoading,
//     refetch: refetchPdfs,
//   } = useQuery({
//     queryKey: ['uploaded-pdfs', lessonId],
//     queryFn: async () => {
//       const res = await _axios.get(`/question/pdfs/lesson/${lessonId}`);
//       return res.data;
//     },
//     enabled: currentStep === 'select',
//   });

//   const existingPdfs: ExistingPdf[] = existingPdfsData?.success
//     ? existingPdfsData.pdfs
//     : [];

//   // ── Mutations ─────────────────────────────────────────────────────────────────

//   const uploadPdfMutation = useMutation({
//     mutationFn: async (file: File) => {
//       const formData = new FormData();
//       formData.append('file', file);
//       const response = await _axios.post('/question/upload', formData);
//       return response.data;
//     },
//     onSuccess: (data) => {
//       if (data.success && data.pdf_id) {
//         setPdfId(data.pdf_id);
//         setCurrentStep('uploaded');
//       }
//     },
//     onError: (error: any) => {
//       console.error('PDF upload failed:', error);
//       alert('Failed to upload PDF to Mathpix. Please try again.');
//     },
//   });

//   const processBulkMutation = useMutation({
//     mutationFn: async (pdf_id: string) => {
//       const response = await _axios.post('/question/process-bulk', {
//         pdf_id,
//         lessonId,
//       });
//       return response.data;
//     },
//     onSuccess: (data) => {
//       if (data.success && data.questions?.length) {
//         const converted = data.questions.map((parsed: any, idx: number) =>
//           convertParsedToFormData(parsed, idx),
//         );
//         // Default every parsed question to LATEX (math PDFs are almost always LaTeX)
//         const defaultTypes: Record<number, QuestionInputType> = {};
//         converted.forEach((_: any, i: number) => {
//           defaultTypes[i] = 'LATEX';
//         });
//         setQuestionInputTypes(defaultTypes);
//         setEditedQuestions(converted);
//         setCurrentStep('review');
//       } else {
//         alert('No questions were parsed from the PDF.');
//       }
//     },
//     onError: (error: any) => {
//       console.error('Bulk processing failed:', error);
//       alert('Failed to process PDF. Please try again.');
//     },
//   });

//   //   const bulkCreateMutation = useMutation({
//   //     mutationFn: async () => {
//   //       const savePromises = editedQuestions.map(async (question, index) => {
//   //         const hasQImgFile = !!questionImageFiles[index];
//   //         const hasSolImgFile =
//   //           question.solutionType === SolutionType.IMAGE &&
//   //           !!solutionFiles[index];

//   //         const needsFormData = hasQImgFile || hasSolImgFile;

//   //         let payload: FormData | CreateQuestionSchema;

//   //         if (needsFormData) {
//   //           const fd = new FormData();
//   //           fd.append('courseId', question.courseId);
//   //           fd.append('chapterId', question.chapterId);
//   //           fd.append('lessonId', question.lessonId);
//   //           fd.append('type', question.type);
//   //           fd.append('difficulty', question.difficulty);
//   //           fd.append('questionModel', question.questionModel);
//   //           fd.append('questionSet', question.questionSet);
//   //           fd.append('solutionType', question.solutionType);
//   //           fd.append('correctAnswer', question.correctAnswer);
//   //           fd.append(
//   //             'question',
//   //             JSON.stringify({
//   //               text: question.question.text || '',
//   //               latex: question.question.latex || '',
//   //             }),
//   //           );
//   //           if (hasQImgFile)
//   //             fd.append('questionImage', questionImageFiles[index]!);
//   //           fd.append(
//   //             'options',
//   //             JSON.stringify(question.type === 'MCQ' ? question.options : []),
//   //           );
//   //           if (hasSolImgFile) {
//   //             fd.append('solution', solutionFiles[index]!);
//   //           } else {
//   //             fd.append('solution', question.solution as string);
//   //           }
//   //           payload = fd;
//   //         } else {
//   //           payload = {
//   //             ...question,
//   //             options: question.type === 'MCQ' ? question.options : [],
//   //           };
//   //         }

//   //         return console.log(payload);

//   //         const config = needsFormData
//   //           ? { headers: { 'Content-Type': 'multipart/form-data' } }
//   //           : { headers: { 'Content-Type': 'application/json' } };

//   //         return _axios.post('/question', payload, config);
//   //       });

//   //       return Promise.all(savePromises);
//   //     },
//   //     onSuccess: () => {
//   //       alert(`✅ ${editedQuestions.length} questions created successfully!`);
//   //       navigate({
//   //         to: '/courses/quizes',
//   //         search: {
//   //           page: 1,
//   //           limit: 10,
//   //           lessonId,
//   //           courseId,
//   //           chapterId,
//   //           mode: 'list',
//   //         },
//   //       });
//   //     },
//   //     onError: (error: any) => {
//   //       console.error('Bulk create error:', error);
//   //       alert('Failed to save some questions. Please check console.');
//   //     },
//   //   });

//   // ── Helpers ───────────────────────────────────────────────────────────────────
//   const bulkCreateMutation = useMutation({
//     mutationFn: async () => {
//       if (editedQuestions.length === 0) throw new Error('No questions to save');

//       const formData = new FormData();

//       // 1. Stringify all question metadata
//       const questionsPayload = editedQuestions.map((q, index) => ({
//         ...q,
//         // We will override image fields with actual URLs later on backend
//         question: {
//           text: q.question.text || '',
//           latex: q.question.latex || '',
//           // image will be set by backend if file uploaded
//         },
//         options: q.type === 'MCQ' ? q.options : [],
//       }));

//       formData.append('questions', JSON.stringify(questionsPayload));

//       // 2. Append question images (if any)
//       Object.entries(questionImageFiles).forEach(([indexStr, file]) => {
//         if (file) {
//           formData.append(`questionImage_${indexStr}`, file);
//         }
//       });

//       // 3. Append solution images (only when solutionType === IMAGE)
//       Object.entries(solutionFiles).forEach(([indexStr, file]) => {
//         const qIndex = parseInt(indexStr);
//         const question = editedQuestions[qIndex];

//         if (file && question?.solutionType === SolutionType.IMAGE) {
//           formData.append(`solutionImage_${indexStr}`, file);
//         }
//       });

//       const response = await _axios.post('/question/bulk-upload', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       return response.data;
//     },

//     onSuccess: (data) => {
//       if (data.success) {
//         alert(`✅ ${editedQuestions.length} questions created successfully!`);
//         navigate({
//           to: '/courses/quizes',
//           search: {
//             page: 1,
//             limit: 10,
//             lessonId,
//             courseId,
//             chapterId,
//             mode: 'list',
//           },
//         });
//       }
//     },

//     onError: (error: any) => {
//       console.error('Bulk create error:', error);
//       alert(
//         error.response?.data?.message ||
//           'Failed to save questions. Please check console.',
//       );
//     },
//   });
//   const convertParsedToFormData = (
//     parsed: any,
//     index: number,
//   ): CreateQuestionSchema => ({
//     courseId,
//     chapterId,
//     lessonId,
//     type: (parsed.type as QuestionType) || 'MCQ',
//     difficulty: (parsed.difficulty as Difficulty) || 'MEDIUM',
//     questionModel: 'PRE' as QuestionModel,
//     questionSet: `SET_${(index % 10) + 1}` as QuestionSet,
//     question: {
//       text: parsed.question?.text || '',
//       latex: parsed.question?.latex || '',
//       image: undefined,
//     },
//     options:
//       parsed.options?.map((opt: any) => ({
//         id: opt.id,
//         answer: opt.answer || '',
//         type: 'LATEX' as OptionType,
//       })) || [],
//     correctAnswer: parsed.correctAnswer || '',
//     solutionType: (parsed.solutionType as SolutionType) || SolutionType.TEXT,
//     solution: parsed.solution || '',
//   });

//   /** Generic updater for top-level fields of a question */
//   const updateQuestion = (
//     index: number,
//     updates: Partial<CreateQuestionSchema>,
//   ) => {
//     setEditedQuestions((prev) => {
//       const copy = [...prev];
//       copy[index] = { ...copy[index], ...updates };
//       return copy;
//     });
//   };

//   const updateOption = (
//     qIndex: number,
//     optIndex: number,
//     value: string,
//     type: OptionType,
//   ) => {
//     setEditedQuestions((prev) => {
//       const copy = [...prev];
//       const newOptions = [...copy[qIndex].options];
//       newOptions[optIndex] = { ...newOptions[optIndex], answer: value, type };
//       copy[qIndex] = { ...copy[qIndex], options: newOptions };
//       return copy;
//     });
//   };

//   const setCorrectForQuestion = (qIndex: number, id: string) =>
//     updateQuestion(qIndex, { correctAnswer: id });

//   const removeQuestion = (index: number) => {
//     setEditedQuestions((prev) => prev.filter((_, i) => i !== index));
//     const drop = <T,>(rec: Record<number, T>): Record<number, T> => {
//       const c = { ...rec };
//       delete c[index];
//       return c;
//     };
//     setSolutionPreviews(drop);
//     setSolutionFiles(drop);
//     setQuestionInputTypes(drop);
//     setQuestionImagePreviews(drop);
//     setQuestionImageFiles(drop);
//   };

//   // ── Question input-type switch ────────────────────────────────────────────────

//   const handleQuestionInputTypeChange = (
//     qIndex: number,
//     type: QuestionInputType,
//   ) => {
//     setQuestionInputTypes((prev) => ({ ...prev, [qIndex]: type }));
//     updateQuestion(qIndex, {
//       question: { text: '', latex: '', image: undefined },
//     });
//     setQuestionImagePreviews((prev) => ({ ...prev, [qIndex]: null }));
//     setQuestionImageFiles((prev) => ({ ...prev, [qIndex]: null }));
//     if (questionImageInputRefs.current[qIndex]) {
//       questionImageInputRefs.current[qIndex]!.value = '';
//     }
//   };

//   const handleQuestionTextChange = (qIndex: number, value: string) => {
//     const inputType = questionInputTypes[qIndex] ?? 'LATEX';
//     if (inputType === 'LATEX') {
//       updateQuestion(qIndex, {
//         question: { text: '', latex: value, image: undefined },
//       });
//     } else {
//       updateQuestion(qIndex, {
//         question: { text: value, latex: '', image: undefined },
//       });
//     }
//   };

//   // ── Question image handlers ───────────────────────────────────────────────────

//   const handleQuestionImageChange = (
//     qIndex: number,
//     e: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setQuestionImageFiles((prev) => ({ ...prev, [qIndex]: file }));
//     const reader = new FileReader();
//     reader.onloadend = () =>
//       setQuestionImagePreviews((prev) => ({
//         ...prev,
//         [qIndex]: reader.result as string,
//       }));
//     reader.readAsDataURL(file);
//     // Store filename so we know a file was picked (used in FormData branching)
//     updateQuestion(qIndex, {
//       question: { text: '', latex: '', image: file.name },
//     });
//   };

//   const handleRemoveQuestionImage = (qIndex: number) => {
//     setQuestionImagePreviews((prev) => ({ ...prev, [qIndex]: null }));
//     setQuestionImageFiles((prev) => ({ ...prev, [qIndex]: null }));
//     updateQuestion(qIndex, {
//       question: { text: '', latex: '', image: undefined },
//     });
//     if (questionImageInputRefs.current[qIndex]) {
//       questionImageInputRefs.current[qIndex]!.value = '';
//     }
//   };

//   // ── Solution image handlers ───────────────────────────────────────────────────

//   const handleSolutionTypeChange = (qIndex: number, type: SolutionType) => {
//     updateQuestion(qIndex, { solutionType: type, solution: '' });
//     setSolutionPreviews((prev) => ({ ...prev, [qIndex]: null }));
//     setSolutionFiles((prev) => ({ ...prev, [qIndex]: null }));
//   };

//   const handleSolutionImageChange = (
//     qIndex: number,
//     e: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setSolutionFiles((prev) => ({ ...prev, [qIndex]: file }));
//     const reader = new FileReader();
//     reader.onloadend = () =>
//       setSolutionPreviews((prev) => ({
//         ...prev,
//         [qIndex]: reader.result as string,
//       }));
//     reader.readAsDataURL(file);
//     updateQuestion(qIndex, { solution: file.name });
//   };

//   const handleRemoveSolutionImage = (qIndex: number) => {
//     setSolutionPreviews((prev) => ({ ...prev, [qIndex]: null }));
//     setSolutionFiles((prev) => ({ ...prev, [qIndex]: null }));
//     updateQuestion(qIndex, { solution: '' });
//   };

//   // ── PDF drag-drop / select ────────────────────────────────────────────────────

//   const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     const file = e.dataTransfer.files[0];
//     if (file?.type === 'application/pdf') setPdfFile(file);
//   };

//   const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file?.type === 'application/pdf') setPdfFile(file);
//   };

//   const startUpload = () => {
//     if (pdfFile) uploadPdfMutation.mutate(pdfFile);
//   };
//   const startProcessing = () => {
//     if (pdfId) processBulkMutation.mutate(pdfId);
//   };

//   const handleSelectExistingPdf = (pdf: ExistingPdf) => {
//     setPdfId(pdf.pdf_id);
//     setCurrentStep('uploaded');
//   };
//   const validateQuestionsBeforeSave = (): {
//     isValid: boolean;
//     message: string;
//   } => {
//     const errors: string[] = [];

//     editedQuestions.forEach((question, index) => {
//       const qNum = index + 1;

//       // 1. Check Correct Answer for MCQ
//       if (question.type === 'MCQ') {
//         if (!question.correctAnswer || question.correctAnswer.trim() === '') {
//           errors.push(
//             `Question ${qNum}: Please select a correct answer (A/B/C/D)`,
//           );
//         } else {
//           // Optional: Extra safety check if options exist
//           const optionIds = question.options.map((opt) => opt.id);
//           if (!optionIds.includes(question.correctAnswer)) {
//             errors.push(
//               `Question ${qNum}: Correct answer is not among the options`,
//             );
//           }
//         }
//       }

//       // 2. Check Solution (must have some solution)
//       if (
//         !question.solution ||
//         (typeof question.solution === 'string' &&
//           question.solution.trim() === '')
//       ) {
//         if (question.solutionType === SolutionType.IMAGE) {
//           if (!solutionFiles[index]) {
//             errors.push(`Question ${qNum}: Please upload a solution image`);
//           }
//         } else if (question.solutionType === SolutionType.VIDEO) {
//           errors.push(
//             `Question ${qNum}: Please enter a video URL for the solution`,
//           );
//         } else {
//           errors.push(`Question ${qNum}: Please provide a text solution`);
//         }
//       }

//       // 3. Check Question content (basic check)
//       const q = question.question;
//       if (
//         (!q.text || q.text.trim() === '') &&
//         (!q.latex || q.latex.trim() === '') &&
//         !questionImageFiles[index]
//       ) {
//         errors.push(`Question ${qNum}: Question text or image is required`);
//       }
//     });

//     if (errors.length > 0) {
//       return {
//         isValid: false,
//         message: `Please fix the following issues before saving:\n\n${errors.join('\n')}`,
//       };
//     }

//     return { isValid: true, message: '' };
//   };
//   const handleBulkSave = () => {
//     if (editedQuestions.length === 0) {
//       alert('No questions to save');
//       return;
//     }

//     // Run validation
//     const validation = validateQuestionsBeforeSave();

//     if (!validation.isValid) {
//       alert(validation.message);
//       return;
//     }

//     // If validation passes → proceed with mutation
//     bulkCreateMutation.mutate();
//   };

//   const handleBack = () =>
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

//   // ── Render ────────────────────────────────────────────────────────────────────

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
//       <div className="max-w-6xl mx-auto">
//         {/* ════════ HEADER ════════ */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-indigo-100">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={handleBack}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
//                 <ArrowLeft className="w-6 h-6 text-gray-600" />
//               </button>
//               <div>
//                 <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                   Bulk Upload Math Questions
//                 </h1>
//                 <p className="text-gray-600 mt-1">
//                   Select an existing PDF or upload a new one → Review &amp; edit
//                   → Save all at once
//                 </p>
//               </div>
//             </div>

//             {currentStep === 'review' && (
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={handleBack}
//                   className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleBulkSave}
//                   disabled={
//                     bulkCreateMutation.isPending || editedQuestions.length === 0
//                   }
//                   className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-lg disabled:opacity-50">
//                   {bulkCreateMutation.isPending ? (
//                     'Saving all questions...'
//                   ) : (
//                     <>
//                       <CheckCircle className="w-5 h-5" />
//                       Save {editedQuestions.length} Questions
//                     </>
//                   )}
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ════════════════════════════════════════════════════════
//             STEP 1 — SELECT
//         ════════════════════════════════════════════════════════ */}
//         {currentStep === 'select' && (
//           <div className="space-y-6">
//             {/* Upload-new card */}
//             <div
//               onClick={() => setCurrentStep('upload')}
//               className="bg-white rounded-3xl shadow-xl border-2 border-dashed border-purple-300 p-8 flex items-center gap-6 cursor-pointer hover:border-purple-500 hover:shadow-2xl transition-all group">
//               <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
//                 <Upload className="w-7 h-7" />
//               </div>
//               <div className="flex-1">
//                 <p className="text-lg font-semibold text-gray-800">
//                   Upload a new PDF
//                 </p>
//                 <p className="text-sm text-gray-500 mt-0.5">
//                   Mathpix will extract all math questions, options and LaTeX
//                   automatically
//                 </p>
//               </div>
//               <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
//             </div>

//             {/* Existing PDFs */}
//             <div className="bg-white rounded-3xl shadow-xl p-8">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-bold text-gray-800">
//                   Previously uploaded PDFs
//                 </h2>
//                 <button
//                   onClick={() => refetchPdfs()}
//                   className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
//                   <RefreshCw className="w-4 h-4" />
//                   Refresh
//                 </button>
//               </div>

//               {pdfsLoading ? (
//                 <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
//                   <RefreshCw className="w-5 h-5 animate-spin" />
//                   Loading PDFs…
//                 </div>
//               ) : existingPdfs.length === 0 ? (
//                 <div className="text-center py-16 text-gray-400">
//                   <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
//                   <p className="text-sm">
//                     No PDFs uploaded for this lesson yet.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {existingPdfs.map((pdf) => (
//                     <button
//                       key={pdf.id}
//                       disabled={pdf.status !== 'completed'}
//                       onClick={() => handleSelectExistingPdf(pdf)}
//                       className="w-full flex items-center gap-5 p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left group">
//                       <div className="w-11 h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0 group-hover:border-indigo-300">
//                         <FileText className="w-5 h-5 text-indigo-500" />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="font-medium text-gray-800 truncate">
//                           {pdf.fileName}
//                         </p>
//                         <div className="flex items-center gap-3 mt-1">
//                           <span className="flex items-center gap-1 text-xs text-gray-400">
//                             <Clock className="w-3 h-3" />
//                             {new Date(pdf.createdAt).toLocaleDateString(
//                               'en-GB',
//                               {
//                                 day: 'numeric',
//                                 month: 'short',
//                                 year: 'numeric',
//                                 hour: '2-digit',
//                                 minute: '2-digit',
//                               },
//                             )}
//                           </span>
//                           {pdf.numPages != null && (
//                             <span className="text-xs text-gray-400">
//                               {pdf.numPages} pages
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-3 shrink-0">
//                         {statusBadge(pdf.status)}
//                         {pdf.status === 'completed' && (
//                           <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
//                         )}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* ════════════════════════════════════════════════════════
//             STEP 2 — UPLOAD (drag-drop new PDF)
//         ════════════════════════════════════════════════════════ */}
//         {currentStep === 'upload' && (
//           <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
//             <button
//               onClick={() => setCurrentStep('select')}
//               className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
//               <ArrowLeft className="w-4 h-4" /> Back to PDF list
//             </button>

//             <div
//               onDrop={handlePdfDrop}
//               onDragOver={(e) => e.preventDefault()}
//               className="border-2 border-dashed border-purple-300 rounded-3xl py-16 px-8 hover:border-purple-400 transition-colors">
//               <Upload className="w-16 h-16 mx-auto text-purple-500 mb-6" />
//               <h3 className="text-2xl font-semibold text-gray-800 mb-2">
//                 Upload your PDF
//               </h3>
//               <p className="text-gray-500 mb-8 max-w-md mx-auto">
//                 Our Mathpix-powered pipeline will extract all math questions,
//                 options and LaTeX automatically
//               </p>

//               <label className="inline-flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-2xl font-semibold cursor-pointer hover:bg-purple-700">
//                 <Upload className="w-5 h-5" />
//                 Choose PDF file
//                 <input
//                   type="file"
//                   accept="application/pdf"
//                   className="hidden"
//                   onChange={handlePdfSelect}
//                 />
//               </label>

//               {pdfFile && (
//                 <div className="mt-8 flex items-center justify-center gap-3 text-sm">
//                   <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-2xl flex items-center gap-2">
//                     📄 {pdfFile.name}
//                   </span>
//                   <button
//                     onClick={startUpload}
//                     disabled={uploadPdfMutation.isPending}
//                     className="px-6 py-2 bg-purple-600 text-white rounded-2xl font-medium hover:bg-purple-700 disabled:opacity-50">
//                     {uploadPdfMutation.isPending
//                       ? 'Uploading to Mathpix...'
//                       : 'Upload & Continue'}
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* ════════════════════════════════════════════════════════
//             STEP 3 — UPLOADED (ready to parse)
//         ════════════════════════════════════════════════════════ */}
//         {currentStep === 'uploaded' && (
//           <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
//             <button
//               onClick={() => setCurrentStep('select')}
//               className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
//               <ArrowLeft className="w-4 h-4" /> Back to PDF list
//             </button>

//             <div className="max-w-md mx-auto">
//               <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
//                 ✅
//               </div>
//               <h3 className="text-2xl font-semibold mb-2">
//                 PDF ready to parse!
//               </h3>
//               <p className="text-gray-500 mb-8">
//                 PDF ID:{' '}
//                 <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">
//                   {pdfId}
//                 </span>
//               </p>

//               <button
//                 onClick={startProcessing}
//                 disabled={processBulkMutation.isPending}
//                 className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-bold text-xl shadow-lg hover:shadow-xl disabled:opacity-50">
//                 {processBulkMutation.isPending
//                   ? 'Processing with Mathpix...'
//                   : 'Parse Questions Now'}
//               </button>

//               <p className="text-xs text-gray-400 mt-8">
//                 This may take a few seconds depending on PDF size
//               </p>
//             </div>
//           </div>
//         )}

//         {/* ════════════════════════════════════════════════════════
//             STEP 4 — REVIEW & EDIT
//         ════════════════════════════════════════════════════════ */}
//         {currentStep === 'review' && (
//           <div>
//             <div className="flex items-center justify-between mb-6 px-2">
//               <h2 className="text-3xl font-bold text-gray-800">
//                 Review {editedQuestions.length} Questions
//               </h2>
//               <p className="text-sm text-gray-500">
//                 All fields are editable • Questions without correct answers will
//                 still be saved
//               </p>
//             </div>

//             <div className="space-y-8">
//               {editedQuestions.map((question, qIndex) => {
//                 const qInputType = questionInputTypes[qIndex] ?? 'LATEX';

//                 return (
//                   <div
//                     key={qIndex}
//                     className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
//                     {/* ── Card header ─────────────────────────────────────── */}
//                     <div className="px-8 pt-6 pb-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
//                       <div className="flex items-center gap-4 flex-wrap">
//                         <span className="text-2xl font-bold text-purple-600">
//                           Q{qIndex + 1}
//                         </span>
//                         <div className="flex flex-wrap gap-2">
//                           <select
//                             value={question.type}
//                             onChange={(e) =>
//                               updateQuestion(qIndex, {
//                                 type: e.target.value as QuestionType,
//                               })
//                             }
//                             className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400 bg-white">
//                             <option value="MCQ">MCQ</option>
//                             <option value="FILL_BLANK">
//                               Fill in the Blank
//                             </option>
//                           </select>
//                           <select
//                             value={question.difficulty}
//                             onChange={(e) =>
//                               updateQuestion(qIndex, {
//                                 difficulty: e.target.value as Difficulty,
//                               })
//                             }
//                             className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400 bg-white">
//                             <option value="EASY">Easy</option>
//                             <option value="MEDIUM">Medium</option>
//                             <option value="HARD">Hard</option>
//                           </select>
//                           <select
//                             value={question.questionModel}
//                             onChange={(e) =>
//                               updateQuestion(qIndex, {
//                                 questionModel: e.target.value as QuestionModel,
//                               })
//                             }
//                             className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400 bg-white">
//                             <option value="PRE">Pre Question</option>
//                             <option value="POST">Post Question</option>
//                           </select>
//                           <select
//                             value={question.questionSet}
//                             onChange={(e) =>
//                               updateQuestion(qIndex, {
//                                 questionSet: e.target.value as QuestionSet,
//                               })
//                             }
//                             className="px-4 py-2 rounded-2xl border border-gray-200 text-sm font-medium focus:border-purple-400 bg-white">
//                             {Array.from({ length: 10 }, (_, i) => (
//                               <option key={i} value={`SET_${i + 1}`}>
//                                 SET {i + 1}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => removeQuestion(qIndex)}
//                         className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium shrink-0 ml-4">
//                         <X className="w-4 h-4" />
//                         Remove
//                       </button>
//                     </div>

//                     {/* ── Card body ────────────────────────────────────────── */}
//                     <div className="p-8 space-y-8">
//                       {/* ─── SECTION 1: QUESTION ──────────────────────────── */}
//                       <div>
//                         <div className="flex items-center gap-2 mb-4">
//                           <span className="w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
//                             1
//                           </span>
//                           <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
//                             Question
//                           </span>
//                         </div>

//                         {/* Input-type tabs — mirrors CreateMathsQuiz exactly */}
//                         <div className="flex gap-2 mb-4">
//                           {/* {(['LATEX', 'NORMAL', 'IMAGE'] as const).map((t) => ( */}
//                           {(['LATEX'] as const).map((t) => (
//                             <button
//                               key={t}
//                               type="button"
//                               onClick={() =>
//                                 handleQuestionInputTypeChange(qIndex, t)
//                               }
//                               className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
//                                 qInputType === t
//                                   ? 'bg-purple-600 text-white shadow-md'
//                                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                               }`}>
//                               {t === 'IMAGE' && (
//                                 <ImageIcon className="w-3.5 h-3.5" />
//                               )}
//                               {t === 'LATEX'
//                                 ? 'LaTeX'
//                                 : t === 'NORMAL'
//                                   ? 'Normal Text'
//                                   : 'Image'}
//                             </button>
//                           ))}
//                         </div>

//                         {/* LATEX textarea */}
//                         {qInputType === 'LATEX' && (
//                           <textarea
//                             value={question.question.latex || ''}
//                             onChange={(e) =>
//                               handleQuestionTextChange(qIndex, e.target.value)
//                             }
//                             rows={3}
//                             className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none resize-none font-mono text-sm"
//                             placeholder="Enter LaTeX…  e.g. $\alpha + \beta = \frac{1}{2}$"
//                           />
//                         )}

//                         {/* NORMAL textarea */}
//                         {qInputType === 'NORMAL' && (
//                           <textarea
//                             value={question.question.text || ''}
//                             onChange={(e) =>
//                               handleQuestionTextChange(qIndex, e.target.value)
//                             }
//                             rows={3}
//                             className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
//                             placeholder="Enter your question here…"
//                           />
//                         )}

//                         {/* IMAGE upload */}
//                         {qInputType === 'IMAGE' && (
//                           <div>
//                             {!questionImagePreviews[qIndex] ? (
//                               <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-purple-300 rounded-2xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors">
//                                 <div className="flex flex-col items-center gap-2 text-purple-600">
//                                   <Upload className="w-8 h-8" />
//                                   <span className="font-semibold text-sm">
//                                     Click to upload question image
//                                   </span>
//                                   <span className="text-xs text-gray-400">
//                                     PNG, JPG, WEBP · max 5 MB
//                                   </span>
//                                 </div>
//                                 <input
//                                   ref={(el) => {
//                                     questionImageInputRefs.current[qIndex] = el;
//                                   }}
//                                   type="file"
//                                   accept="image/*"
//                                   className="hidden"
//                                   onChange={(e) =>
//                                     handleQuestionImageChange(qIndex, e)
//                                   }
//                                 />
//                               </label>
//                             ) : (
//                               <div className="relative rounded-2xl overflow-hidden border border-purple-200">
//                                 <img
//                                   src={questionImagePreviews[qIndex]!}
//                                   alt="Question"
//                                   className="w-full max-h-64 object-contain bg-gray-50"
//                                 />
//                                 <button
//                                   type="button"
//                                   onClick={() =>
//                                     handleRemoveQuestionImage(qIndex)
//                                   }
//                                   className="absolute top-3 right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors">
//                                   <X className="w-4 h-4" />
//                                 </button>
//                                 <div className="px-4 py-2 bg-white border-t border-purple-100">
//                                   <p className="text-xs text-gray-500 truncate">
//                                     {questionImageFiles[qIndex]?.name ??
//                                       'Question image'}
//                                   </p>
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                         )}

//                         {/* Inline preview for LATEX / NORMAL */}
//                         {(qInputType === 'LATEX' || qInputType === 'NORMAL') &&
//                           (question.question.latex ||
//                             question.question.text) && (
//                             <div className="mt-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
//                               <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">
//                                 Preview
//                               </p>
//                               <MathPreview
//                                 text={question.question.text}
//                                 latex={question.question.latex}
//                               />
//                             </div>
//                           )}
//                       </div>

//                       {/* ─── SECTION 2: OPTIONS / CORRECT ANSWER ──────────── */}
//                       {question.type === 'MCQ' &&
//                         question.options.length > 0 && (
//                           <div>
//                             <div className="flex items-center gap-2 mb-4">
//                               <span className="w-7 h-7 bg-pink-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
//                                 2
//                               </span>
//                               <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
//                                 Options (A–D)
//                               </span>
//                             </div>
//                             <div className="space-y-4">
//                               {question.options.map((option, optIndex) => (
//                                 <OptionInput
//                                   key={option.id}
//                                   option={option}
//                                   index={optIndex}
//                                   isCorrect={
//                                     question.correctAnswer === option.id
//                                   }
//                                   onCorrectChange={(id) =>
//                                     setCorrectForQuestion(qIndex, id)
//                                   }
//                                   onChange={(oIdx, value, type) =>
//                                     updateOption(qIndex, oIdx, value, type)
//                                   }
//                                   onRemove={() => {}}
//                                   canRemove={false}
//                                 />
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                       {question.type === 'FILL_BLANK' && (
//                         <div>
//                           <div className="flex items-center gap-2 mb-4">
//                             <span className="w-7 h-7 bg-pink-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
//                               2
//                             </span>
//                             <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
//                               Correct Answer
//                             </span>
//                           </div>
//                           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
//                             <input
//                               type="text"
//                               value={question.correctAnswer}
//                               onChange={(e) =>
//                                 updateQuestion(qIndex, {
//                                   correctAnswer: e.target.value.trim(),
//                                 })
//                               }
//                               className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none"
//                               placeholder="Exact answer students must type (case-sensitive)"
//                             />
//                             <p className="mt-2 text-xs text-gray-400">
//                               Students must type this exact text to get it
//                               correct.
//                             </p>
//                           </div>
//                         </div>
//                       )}

//                       {/* ─── SECTION 3: SOLUTION ──────────────────────────── */}
//                       <div>
//                         <div className="flex items-center gap-2 mb-4">
//                           <span className="w-7 h-7 bg-teal-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
//                             3
//                           </span>
//                           <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
//                             Solution
//                           </span>
//                         </div>

//                         {/* Solution-type tabs */}
//                         <div className="flex gap-2 mb-4">
//                           {solutionTypeOptions.map(
//                             ({ value, label, icon: Icon, color }) => {
//                               const isActive = question.solutionType === value;
//                               const cls = solutionColorMap[color];
//                               return (
//                                 <button
//                                   key={value}
//                                   type="button"
//                                   onClick={() =>
//                                     handleSolutionTypeChange(qIndex, value)
//                                   }
//                                   className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium border transition-all text-sm ${
//                                     isActive ? cls.active : cls.inactive
//                                   }`}>
//                                   <Icon className="w-4 h-4" />
//                                   {label}
//                                 </button>
//                               );
//                             },
//                           )}
//                         </div>

//                         {/* TEXT */}
//                         {question.solutionType === SolutionType.TEXT && (
//                           <textarea
//                             value={question.solution as string}
//                             onChange={(e) =>
//                               updateQuestion(qIndex, {
//                                 solution: e.target.value,
//                               })
//                             }
//                             rows={5}
//                             className="w-full px-5 py-4 border border-gray-300 rounded-3xl focus:border-teal-400 focus:ring-2 focus:ring-teal-200 outline-none resize-none font-mono text-sm"
//                             placeholder="Enter solution in LaTeX…  e.g. $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$"
//                           />
//                         )}

//                         {/* VIDEO */}
//                         {question.solutionType === SolutionType.VIDEO && (
//                           <div>
//                             <div className="relative">
//                               <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                               <input
//                                 type="url"
//                                 value={question.solution as string}
//                                 onChange={(e) =>
//                                   updateQuestion(qIndex, {
//                                     solution: e.target.value,
//                                   })
//                                 }
//                                 className="w-full pl-11 pr-4 py-4 border border-gray-300 rounded-3xl focus:border-rose-400 focus:ring-2 focus:ring-rose-200 outline-none"
//                                 placeholder="https://youtube.com/watch?v=…"
//                               />
//                             </div>
//                             <p className="mt-2 text-xs text-gray-400">
//                               Paste a YouTube or any video URL as the solution.
//                             </p>
//                           </div>
//                         )}

//                         {/* IMAGE */}
//                         {question.solutionType === SolutionType.IMAGE && (
//                           <div>
//                             {!solutionPreviews[qIndex] ? (
//                               <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-emerald-300 rounded-3xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors">
//                                 <div className="flex flex-col items-center gap-2 text-emerald-600">
//                                   <Upload className="w-10 h-10" />
//                                   <span className="font-semibold">
//                                     Upload solution image
//                                   </span>
//                                   <span className="text-xs">
//                                     PNG, JPG, WEBP · max 5 MB
//                                   </span>
//                                 </div>
//                                 <input
//                                   type="file"
//                                   accept="image/*"
//                                   className="hidden"
//                                   onChange={(e) =>
//                                     handleSolutionImageChange(qIndex, e)
//                                   }
//                                 />
//                               </label>
//                             ) : (
//                               <div className="relative rounded-3xl overflow-hidden border border-emerald-200 bg-white">
//                                 <img
//                                   src={solutionPreviews[qIndex]!}
//                                   alt="Solution"
//                                   className="w-full max-h-64 object-contain"
//                                 />
//                                 <button
//                                   type="button"
//                                   onClick={() =>
//                                     handleRemoveSolutionImage(qIndex)
//                                   }
//                                   className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md transition-colors">
//                                   <X className="w-4 h-4" />
//                                 </button>
//                                 <div className="px-4 py-2.5 bg-white border-t border-emerald-100">
//                                   <p className="text-xs text-gray-500 truncate">
//                                     {solutionFiles[qIndex]?.name ??
//                                       'Solution image'}
//                                   </p>
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     {/* end card body */}
//                   </div>
//                 );
//               })}
//             </div>

//             {editedQuestions.length === 0 && (
//               <div className="text-center py-20 text-gray-400">
//                 No questions left to review.
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default QuizBulkUpload;

/// style changes

import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Upload,
  FileText,
  Video,
  Image as ImageIcon,
  X,
  CheckCircle,
  ChevronRight,
  Clock,
  RefreshCw,
  Loader2,
  Sparkles,
  FileSearch,
  Zap,
  AlertCircle,
} from 'lucide-react';
import type {
  CreateQuestionSchema,
  Difficulty,
  OptionType,
  QuestionModel,
  QuestionSet,
  QuestionType,
} from './types';
import OptionInput from './Optioninput';
import { _axios } from '@/lib/axios';
import { toast } from 'sonner';
import MathPreview from '../MathPreview';

// ─── Types ─────────────────────────────────────────────────────────────────────

export enum SolutionType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
}

type QuestionInputType = 'LATEX' | 'NORMAL' | 'IMAGE';

interface ExistingPdf {
  id: string;
  pdf_id: string;
  fileName: string;
  status: string;
  numPages: number | null;
  numPagesCompleted: number | null;
  percentDone: number | null;
  createdAt: string;
}

interface QuizBulkUploadProps {
  courseId: string;
  lessonId: string;
  chapterId: string;
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────

const LoadingOverlay = ({
  message,
  subMessage,
  steps,
  currentStepIndex,
}: {
  message: string;
  subMessage?: string;
  steps?: string[];
  currentStepIndex?: number;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full mx-4 text-center border border-slate-100">
      {/* Animated ring */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-violet-600 animate-pulse" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1">{message}</h3>
      {subMessage && (
        <p className="text-sm text-slate-500 mb-6">{subMessage}</p>
      )}

      {steps && steps.length > 0 && (
        <div className="text-left space-y-2 mt-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                  i < (currentStepIndex ?? 0)
                    ? 'bg-emerald-500'
                    : i === (currentStepIndex ?? 0)
                      ? 'bg-violet-600'
                      : 'bg-slate-100'
                }`}>
                {i < (currentStepIndex ?? 0) ? (
                  <CheckCircle className="w-3 h-3 text-white" />
                ) : i === (currentStepIndex ?? 0) ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>
              <span
                className={`text-sm transition-colors duration-300 ${
                  i < (currentStepIndex ?? 0)
                    ? 'text-emerald-600 line-through decoration-emerald-300'
                    : i === (currentStepIndex ?? 0)
                      ? 'text-violet-700 font-semibold'
                      : 'text-slate-400'
                }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      )}

      {!steps && (
        <div className="flex gap-1 justify-center mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    completed: {
      label: 'Completed',
      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      dot: 'bg-emerald-500',
    },
    processing: {
      label: 'Processing',
      cls: 'bg-amber-50 text-amber-700 border border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
    },
    error: {
      label: 'Error',
      cls: 'bg-red-50 text-red-700 border border-red-200',
      dot: 'bg-red-500',
    },
  };
  const cfg = map[status] ?? {
    label: status,
    cls: 'bg-slate-50 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
  };
  return (
    <span
      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({
  current,
}: {
  current: 'select' | 'upload' | 'uploaded' | 'review';
}) => {
  const steps = [
    { key: 'select', label: 'Select PDF' },
    { key: 'uploaded', label: 'Ready' },
    { key: 'review', label: 'Review & Save' },
  ];
  const order = ['select', 'upload', 'uploaded', 'review'];
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const stepIdx = order.indexOf(step.key);
        const isDone = currentIdx > stepIdx;
        const isActive =
          current === step.key ||
          (step.key === 'select' && current === 'upload');
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isDone
                  ? 'bg-emerald-100 text-emerald-700'
                  : isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400'
              }`}>
              {isDone ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold border-current">
                  {i + 1}
                </span>
              )}
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-px ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const solutionColorMap: Record<string, { active: string; inactive: string }> = {
  indigo: {
    active: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
    inactive:
      'bg-white text-slate-600 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300',
  },
  rose: {
    active: 'bg-rose-600 text-white border-rose-600 shadow-sm',
    inactive:
      'bg-white text-slate-600 hover:bg-rose-50 border-slate-200 hover:border-rose-300',
  },
  emerald: {
    active: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    inactive:
      'bg-white text-slate-600 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300',
  },
};

const solutionTypeOptions = [
  {
    value: SolutionType.TEXT,
    label: 'Text / LaTeX',
    icon: FileText,
    color: 'indigo',
  },
  { value: SolutionType.VIDEO, label: 'Video URL', icon: Video, color: 'rose' },
  {
    value: SolutionType.IMAGE,
    label: 'Image',
    icon: ImageIcon,
    color: 'emerald',
  },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

const QuizBulkUpload = ({
  courseId,
  lessonId,
  chapterId,
}: QuizBulkUploadProps) => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<
    'select' | 'upload' | 'uploaded' | 'review'
  >('select');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<
    CreateQuestionSchema[]
  >([]);
  const [solutionPreviews, setSolutionPreviews] = useState<
    Record<number, string | null>
  >({});
  const [solutionFiles, setSolutionFiles] = useState<
    Record<number, File | null>
  >({});
  const [questionInputTypes, setQuestionInputTypes] = useState<
    Record<number, QuestionInputType>
  >({});
  const [questionImagePreviews, setQuestionImagePreviews] = useState<
    Record<number, string | null>
  >({});
  const [questionImageFiles, setQuestionImageFiles] = useState<
    Record<number, File | null>
  >({});
  const [savingStepIndex, setSavingStepIndex] = useState(0);
  const questionImageInputRefs = useRef<
    Record<number, HTMLInputElement | null>
  >({});

  // Simulate step progress during save
  const savingSteps = [
    'Validating questions',
    'Uploading question images',
    'Uploading solution images',
    'Creating questions in database',
    'Finalizing records',
  ];

  const {
    data: existingPdfsData,
    isLoading: pdfsLoading,
    refetch: refetchPdfs,
  } = useQuery({
    queryKey: ['uploaded-pdfs', lessonId],
    queryFn: async () => {
      const res = await _axios.get(`/bulk-upload/pdfs/lesson/${lessonId}`);
      return res.data;
    },
    enabled: currentStep === 'select',
  });

  const existingPdfs: ExistingPdf[] = existingPdfsData?.success
    ? existingPdfsData.pdfs
    : [];

  const uploadPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await _axios.post('/bulk-upload/upload', formData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.pdf_id) {
        setPdfId(data.pdf_id);
        setCurrentStep('uploaded');
      }
    },
    onError: () => {
      toast.error('Failed to upload PDF to Mathpix. Please try again.');
    },
  });

  const processBulkMutation = useMutation({
    mutationFn: async (pdf_id: string) => {
      const response = await _axios.post('/bulk-upload/process-bulk', {
        pdf_id,
        lessonId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.questions?.length) {
        const converted = data.questions.map((parsed: any, idx: number) =>
          convertParsedToFormData(parsed, idx),
        );
        const defaultTypes: Record<number, QuestionInputType> = {};
        converted.forEach((_: any, i: number) => {
          defaultTypes[i] = 'LATEX';
        });
        setQuestionInputTypes(defaultTypes);
        setEditedQuestions(converted);
        setCurrentStep('review');
      } else {
        toast.error('No questions were parsed from the PDF.');
      }
    },
    onError: () => {
      toast.error('Failed to process PDF. Please try again.');
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      if (editedQuestions.length === 0) throw new Error('No questions to save');
      setSavingStepIndex(0);

      const formData = new FormData();
      const questionsPayload = editedQuestions.map((q) => ({
        ...q,
        question: {
          text: q.question.text || '',
          latex: q.question.latex || '',
        },
        options: q.type === 'MCQ' ? q.options : [],
      }));
      formData.append('questions', JSON.stringify(questionsPayload));

      setSavingStepIndex(1);
      Object.entries(questionImageFiles).forEach(([indexStr, file]) => {
        if (file) formData.append(`questionImage_${indexStr}`, file);
      });

      setSavingStepIndex(2);
      Object.entries(solutionFiles).forEach(([indexStr, file]) => {
        const qIndex = parseInt(indexStr);
        if (
          file &&
          editedQuestions[qIndex]?.solutionType === SolutionType.IMAGE
        ) {
          formData.append(`solutionImage_${indexStr}`, file);
        }
      });

      setSavingStepIndex(3);
      const response = await _axios.post(
        '/bulk-upload/upload-lesson-questions',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      setSavingStepIndex(4);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
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
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Failed to save questions. Please check console.',
      );
    },
  });

  const convertParsedToFormData = (
    parsed: any,
    index: number,
  ): CreateQuestionSchema => ({
    courseId,
    chapterId,
    lessonId,
    type: (parsed.type as QuestionType) || 'MCQ',
    difficulty: (parsed.difficulty as Difficulty) || 'MEDIUM',
    questionModel: 'PRE' as QuestionModel,
    questionSet: `SET_1` as QuestionSet,
    question: {
      text: parsed.question?.text || '',
      latex: parsed.question?.latex || '',
      image: undefined,
    },
    options:
      parsed.options?.map((opt: any) => ({
        id: opt.id,
        answer: opt.answer || '',
        type: 'LATEX' as OptionType,
      })) || [],
    correctAnswer: parsed.correctAnswer || '',
    solutionType: (parsed.solutionType as SolutionType) || SolutionType.TEXT,
    solution: parsed.solution || '',
  });

  const updateQuestion = (
    index: number,
    updates: Partial<CreateQuestionSchema>,
  ) => {
    setEditedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const updateOption = (
    qIndex: number,
    optIndex: number,
    value: string,
    type: OptionType,
  ) => {
    setEditedQuestions((prev) => {
      const copy = [...prev];
      const newOptions = [...copy[qIndex].options];
      newOptions[optIndex] = { ...newOptions[optIndex], answer: value, type };
      copy[qIndex] = { ...copy[qIndex], options: newOptions };
      return copy;
    });
  };

  const setCorrectForQuestion = (qIndex: number, id: string) =>
    updateQuestion(qIndex, { correctAnswer: id });

  const removeQuestion = (index: number) => {
    setEditedQuestions((prev) => prev.filter((_, i) => i !== index));
    const drop = <T,>(rec: Record<number, T>): Record<number, T> => {
      const c = { ...rec };
      delete c[index];
      return c;
    };
    setSolutionPreviews(drop);
    setSolutionFiles(drop);
    setQuestionInputTypes(drop);
    setQuestionImagePreviews(drop);
    setQuestionImageFiles(drop);
  };

  const handleQuestionInputTypeChange = (
    qIndex: number,
    type: QuestionInputType,
  ) => {
    setQuestionInputTypes((prev) => ({ ...prev, [qIndex]: type }));
    updateQuestion(qIndex, {
      question: { text: '', latex: '', image: undefined },
    });
    setQuestionImagePreviews((prev) => ({ ...prev, [qIndex]: null }));
    setQuestionImageFiles((prev) => ({ ...prev, [qIndex]: null }));
    if (questionImageInputRefs.current[qIndex])
      questionImageInputRefs.current[qIndex]!.value = '';
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    const inputType = questionInputTypes[qIndex] ?? 'LATEX';
    updateQuestion(qIndex, {
      question:
        inputType === 'LATEX'
          ? { text: '', latex: value, image: undefined }
          : { text: value, latex: '', image: undefined },
    });
  };

  const handleQuestionImageChange = (
    qIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuestionImageFiles((prev) => ({ ...prev, [qIndex]: file }));
    const reader = new FileReader();
    reader.onloadend = () =>
      setQuestionImagePreviews((prev) => ({
        ...prev,
        [qIndex]: reader.result as string,
      }));
    reader.readAsDataURL(file);
    updateQuestion(qIndex, {
      question: { text: '', latex: '', image: file.name },
    });
  };

  const handleRemoveQuestionImage = (qIndex: number) => {
    setQuestionImagePreviews((prev) => ({ ...prev, [qIndex]: null }));
    setQuestionImageFiles((prev) => ({ ...prev, [qIndex]: null }));
    updateQuestion(qIndex, {
      question: { text: '', latex: '', image: undefined },
    });
    if (questionImageInputRefs.current[qIndex])
      questionImageInputRefs.current[qIndex]!.value = '';
  };

  const handleSolutionTypeChange = (qIndex: number, type: SolutionType) => {
    updateQuestion(qIndex, { solutionType: type, solution: '' });
    setSolutionPreviews((prev) => ({ ...prev, [qIndex]: null }));
    setSolutionFiles((prev) => ({ ...prev, [qIndex]: null }));
  };

  const handleSolutionImageChange = (
    qIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSolutionFiles((prev) => ({ ...prev, [qIndex]: file }));
    const reader = new FileReader();
    reader.onloadend = () =>
      setSolutionPreviews((prev) => ({
        ...prev,
        [qIndex]: reader.result as string,
      }));
    reader.readAsDataURL(file);
    updateQuestion(qIndex, { solution: file.name });
  };

  const handleRemoveSolutionImage = (qIndex: number) => {
    setSolutionPreviews((prev) => ({ ...prev, [qIndex]: null }));
    setSolutionFiles((prev) => ({ ...prev, [qIndex]: null }));
    updateQuestion(qIndex, { solution: '' });
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') setPdfFile(file);
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === 'application/pdf') setPdfFile(file);
  };

  const validateQuestionsBeforeSave = (): {
    isValid: boolean;
    message: string;
  } => {
    const errors: string[] = [];
    editedQuestions.forEach((question, index) => {
      const qNum = index + 1;
      if (question.type === 'MCQ') {
        if (!question.correctAnswer?.trim()) {
          errors.push(`Q${qNum}: Select a correct answer (A/B/C/D)`);
        } else if (
          !question.options.map((o) => o.id).includes(question.correctAnswer)
        ) {
          errors.push(`Q${qNum}: Correct answer is not among the options`);
        }
      }
      if (
        !question.solution ||
        (typeof question.solution === 'string' &&
          question.solution.trim() === '')
      ) {
        if (
          question.solutionType === SolutionType.IMAGE &&
          !solutionFiles[index]
        ) {
          errors.push(`Q${qNum}: Upload a solution image`);
        } else if (question.solutionType === SolutionType.VIDEO) {
          errors.push(`Q${qNum}: Enter a video URL`);
        } else if (question.solutionType === SolutionType.TEXT) {
          errors.push(`Q${qNum}: Provide a text solution`);
        }
      }
      const q = question.question;
      if (!q.text?.trim() && !q.latex?.trim() && !questionImageFiles[index]) {
        errors.push(`Q${qNum}: Question text or image is required`);
      }
    });
    if (errors.length > 0) {
      return {
        isValid: false,
        message: `Fix these issues before saving:\n\n${errors.join('\n')}`,
      };
    }
    return { isValid: true, message: '' };
  };

  const handleBulkSave = () => {
    if (editedQuestions.length === 0) {
      toast.error('No questions to save');
      return;
    }
    const validation = validateQuestionsBeforeSave();
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    bulkCreateMutation.mutate();
  };

  const handleBack = () =>
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

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Loading Overlays ─────────────────────────────────────────────────── */}
      {uploadPdfMutation.isPending && (
        <LoadingOverlay
          message="Uploading to Mathpix"
          subMessage="Sending your PDF for AI-powered extraction…"
        />
      )}
      {processBulkMutation.isPending && (
        <LoadingOverlay
          message="Extracting Questions"
          subMessage="Mathpix is parsing math, LaTeX and options…"
          steps={[
            'Analysing PDF structure',
            'Extracting math questions',
            'Parsing LaTeX & options',
            'Building question cards',
          ]}
          currentStepIndex={1}
        />
      )}
      {bulkCreateMutation.isPending && (
        <LoadingOverlay
          message="Saving Questions"
          subMessage={`Saving ${editedQuestions.length} questions to the database…`}
          steps={savingSteps}
          currentStepIndex={savingStepIndex}
        />
      )}

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div
        className={`bg-white border-b border-slate-200 ${
          currentStep === 'review' ? 'sticky top-16 z-40 shadow-sm' : ''
        }`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800 truncate">
                Bulk Upload Questions
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Upload a PDF → Mathpix extracts questions → Review & save
              </p>
            </div>
          </div>

          {/* Center: step indicator (hidden on small screens when reviewing) */}
          <div className="hidden md:flex">
            <StepIndicator current={currentStep} />
          </div>

          {/* Right: actions */}
          {currentStep === 'review' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                <FileText className="w-3.5 h-3.5" />
                {editedQuestions.length} questions
              </span>
              <button
                onClick={handleBulkSave}
                disabled={
                  bulkCreateMutation.isPending || editedQuestions.length === 0
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <CheckCircle className="w-4 h-4" />
                Save All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ══════════════════════════════════════════════
            STEP 1 — SELECT
        ══════════════════════════════════════════════ */}
        {currentStep === 'select' && (
          <div className="space-y-5">
            {/* Hero upload card */}
            <button
              onClick={() => setCurrentStep('upload')}
              className="w-full group bg-white border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl p-8 flex items-center gap-5 transition-all hover:shadow-md text-left">
              <div className="w-14 h-14 bg-violet-50 group-hover:bg-violet-100 rounded-2xl flex items-center justify-center shrink-0 transition-colors">
                <Upload className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base">
                  Upload a new PDF
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Mathpix will automatically extract math questions, options &
                  LaTeX
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-violet-600 bg-violet-50 group-hover:bg-violet-100 px-4 py-2 rounded-xl transition-colors shrink-0">
                <Zap className="w-4 h-4" />
                New upload
              </div>
            </button>

            {/* Existing PDFs */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700">
                    Previously uploaded PDFs
                  </h2>
                </div>
                <button
                  onClick={() => refetchPdfs()}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-600 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {pdfsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  <p className="text-sm">Loading your PDFs…</p>
                </div>
              ) : existingPdfs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm">
                    No PDFs uploaded for this lesson yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {existingPdfs.map((pdf) => (
                    <button
                      key={pdf.id}
                      disabled={pdf.status !== 'completed'}
                      onClick={() => {
                        setPdfId(pdf.pdf_id);
                        setCurrentStep('uploaded');
                      }}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left group">
                      <div className="w-9 h-9 bg-slate-100 group-hover:bg-violet-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {pdf.fileName}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(pdf.createdAt).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </span>
                          {pdf.numPages != null && (
                            <span className="text-xs text-slate-400">
                              {pdf.numPages} pages
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {statusBadge(pdf.status)}
                        {pdf.status === 'completed' && (
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2 — UPLOAD (new PDF)
        ══════════════════════════════════════════════ */}
        {currentStep === 'upload' && (
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setCurrentStep('select')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to list
            </button>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div
                onDrop={handlePdfDrop}
                onDragOver={(e) => e.preventDefault()}
                className="p-10 text-center border-b border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Drop your PDF here
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                  Or click below to browse your files. Mathpix will extract all
                  math automatically.
                </p>
                <label className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-4 h-4" />
                  Choose PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfSelect}
                  />
                </label>
              </div>

              {pdfFile ? (
                <div className="px-6 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {pdfFile.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => uploadPdfMutation.mutate(pdfFile)}
                    disabled={uploadPdfMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors shrink-0">
                    {uploadPdfMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Upload & Continue
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 text-center text-xs text-slate-400">
                  Supports PDF files up to 50 MB
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 3 — UPLOADED (ready to parse)
        ══════════════════════════════════════════════ */}
        {currentStep === 'uploaded' && (
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setCurrentStep('select')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to list
            </button>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                PDF ready to parse
              </h3>
              <p className="text-sm text-slate-500 mb-2">
                Your PDF has been uploaded and is ready for question extraction.
              </p>
              <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg mb-8">
                <span className="text-xs text-slate-400">ID:</span>
                <code className="text-xs text-slate-600 font-mono">
                  {pdfId}
                </code>
              </div>

              <button
                onClick={() => pdfId && processBulkMutation.mutate(pdfId)}
                disabled={processBulkMutation.isPending}
                className="w-full flex items-center justify-center gap-2.5 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-base shadow-sm hover:shadow-md disabled:opacity-50 transition-all">
                {processBulkMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Extracting with
                    Mathpix…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Extract Questions Now
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 mt-4">
                This may take a few seconds depending on PDF size.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            STEP 4 — REVIEW & EDIT
        ══════════════════════════════════════════════ */}
        {currentStep === 'review' && (
          <div>
            {/* Review summary bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Review Questions
                  <span className="ml-2 text-base font-normal text-slate-400">
                    ({editedQuestions.length})
                  </span>
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  All fields are editable before saving
                </p>
              </div>
              {/* <button
                onClick={handleBulkSave}
                disabled={
                  bulkCreateMutation.isPending || editedQuestions.length === 0
                }
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm shadow-sm disabled:opacity-50 transition-all">
                <CheckCircle className="w-4 h-4" />
                Save {editedQuestions.length} Questions
              </button> */}
            </div>

            {editedQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No questions left to review.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {editedQuestions.map((question, qIndex) => {
                  const qInputType = questionInputTypes[qIndex] ?? 'LATEX';
                  return (
                    <div
                      key={qIndex}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Card header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="w-8 h-8 bg-violet-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                            {qIndex + 1}
                          </span>

                          {/* Compact selects */}
                          {[
                            {
                              value: question.type,
                              key: 'type',
                              opts: [
                                { v: 'MCQ', l: 'MCQ' },
                                { v: 'FILL_BLANK', l: 'Fill blank' },
                              ],
                            },
                            {
                              value: question.difficulty,
                              key: 'difficulty',
                              opts: [
                                { v: 'EASY', l: 'Easy' },
                                { v: 'MEDIUM', l: 'Medium' },
                                { v: 'HARD', l: 'Hard' },
                              ],
                            },
                            {
                              value: question.questionModel,
                              key: 'questionModel',
                              opts: [
                                { v: 'PRE', l: 'Pre' },
                                { v: 'POST', l: 'Post' },
                              ],
                            },
                            {
                              value: question.questionSet,
                              key: 'questionSet',
                              opts: Array.from({ length: 10 }, (_, i) => ({
                                v: `SET_${i + 1}`,
                                l: `Set ${i + 1}`,
                              })),
                            },
                          ].map(({ value, key, opts }) => (
                            <select
                              key={key}
                              value={value}
                              onChange={(e) =>
                                updateQuestion(qIndex, {
                                  [key]: e.target.value,
                                } as any)
                              }
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none">
                              {opts.map((o) => (
                                <option key={o.v} value={o.v}>
                                  {o.l}
                                </option>
                              ))}
                            </select>
                          ))}
                        </div>
                        <button
                          onClick={() => removeQuestion(qIndex)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0 px-2 py-1.5 rounded-lg hover:bg-red-50">
                          <X className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>

                      {/* Card body */}
                      <div className="p-6 space-y-6">
                        {/* ── Section 1: Question ─────────────────────────── */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Question
                            </span>
                          </div>

                          {/* Input-type tabs */}
                          <div className="flex gap-1.5 mb-3 bg-slate-100 p-1 rounded-xl w-fit">
                            {/* {(['LATEX', 'NORMAL', 'IMAGE'] as const).map( */}
                            {(['LATEX'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  handleQuestionInputTypeChange(qIndex, t)
                                }
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  qInputType === t
                                    ? 'bg-white text-violet-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}>
                                {t === 'IMAGE' && (
                                  <ImageIcon className="w-3 h-3" />
                                )}
                                {t === 'LATEX'
                                  ? 'LaTeX'
                                  : t === 'NORMAL'
                                    ? 'Text'
                                    : 'Image'}
                              </button>
                            ))}
                          </div>

                          {qInputType === 'LATEX' && (
                            <textarea
                              value={question.question.latex || ''}
                              onChange={(e) =>
                                handleQuestionTextChange(qIndex, e.target.value)
                              }
                              rows={3}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none font-mono text-sm bg-slate-50/50"
                              placeholder="$\alpha + \beta = \frac{1}{2}$"
                            />
                          )}

                          {qInputType === 'NORMAL' && (
                            <textarea
                              value={question.question.text || ''}
                              onChange={(e) =>
                                handleQuestionTextChange(qIndex, e.target.value)
                              }
                              rows={3}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none text-sm"
                              placeholder="Enter your question here…"
                            />
                          )}

                          {qInputType === 'IMAGE' && (
                            <div>
                              {!questionImagePreviews[qIndex] ? (
                                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 hover:border-violet-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-violet-50/50 transition-colors">
                                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                                  <span className="text-xs font-semibold text-slate-500">
                                    Upload question image
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    PNG, JPG, WEBP · max 5 MB
                                  </span>
                                  <input
                                    ref={(el) => {
                                      questionImageInputRefs.current[qIndex] =
                                        el;
                                    }}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleQuestionImageChange(qIndex, e)
                                    }
                                  />
                                </label>
                              ) : (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                                  <img
                                    src={questionImagePreviews[qIndex]!}
                                    alt="Question"
                                    className="w-full max-h-56 object-contain bg-slate-50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveQuestionImage(qIndex)
                                    }
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {(qInputType === 'LATEX' ||
                            qInputType === 'NORMAL') &&
                            (question.question.latex ||
                              question.question.text) && (
                              <div className="mt-3 bg-violet-50/60 rounded-xl p-4 border border-violet-100">
                                <p className="text-[10px] uppercase tracking-widest text-violet-400 mb-2 font-semibold">
                                  Preview
                                </p>
                                <MathPreview
                                  text={question.question.text}
                                  latex={question.question.latex}
                                />
                              </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100" />

                        {/* ── Section 2: Options / Answer ─────────────────── */}
                        {question.type === 'MCQ' &&
                          question.options.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  Options (A–D)
                                </span>
                              </div>
                              <div className="space-y-3">
                                {question.options.map((option, optIndex) => (
                                  <OptionInput
                                    key={option.id}
                                    option={option}
                                    index={optIndex}
                                    isCorrect={
                                      question.correctAnswer === option.id
                                    }
                                    onCorrectChange={(id) =>
                                      setCorrectForQuestion(qIndex, id)
                                    }
                                    onChange={(oIdx, value, type) =>
                                      updateOption(qIndex, oIdx, value, type)
                                    }
                                    onRemove={() => {}}
                                    canRemove={false}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                        {question.type === 'FILL_BLANK' && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Correct Answer
                              </span>
                            </div>
                            <input
                              type="text"
                              value={question.correctAnswer}
                              onChange={(e) =>
                                updateQuestion(qIndex, {
                                  correctAnswer: e.target.value.trim(),
                                })
                              }
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-sm"
                              placeholder="Exact answer (case-sensitive)"
                            />
                          </div>
                        )}

                        <div className="border-t border-slate-100" />

                        {/* ── Section 3: Solution ─────────────────────────── */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              Solution
                            </span>
                          </div>

                          {/* Solution-type tabs */}
                          <div className="flex gap-1.5 mb-3">
                            {solutionTypeOptions.map(
                              ({ value, label, icon: Icon, color }) => {
                                const isActive =
                                  question.solutionType === value;
                                const cls = solutionColorMap[color];
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                      handleSolutionTypeChange(qIndex, value)
                                    }
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${isActive ? cls.active : cls.inactive}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                  </button>
                                );
                              },
                            )}
                          </div>

                          {question.solutionType === SolutionType.TEXT && (
                            <textarea
                              value={question.solution as string}
                              onChange={(e) =>
                                updateQuestion(qIndex, {
                                  solution: e.target.value,
                                })
                              }
                              rows={4}
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none font-mono text-sm bg-slate-50/50"
                              placeholder="Enter solution in LaTeX…  e.g. $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$"
                            />
                          )}

                          {question.solutionType === SolutionType.VIDEO && (
                            <div>
                              <div className="relative">
                                <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                  type="url"
                                  value={question.solution as string}
                                  onChange={(e) =>
                                    updateQuestion(qIndex, {
                                      solution: e.target.value,
                                    })
                                  }
                                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
                                  placeholder="https://youtube.com/watch?v=…"
                                />
                              </div>
                              <p className="mt-1.5 text-xs text-slate-400">
                                Paste a YouTube or any video URL.
                              </p>
                            </div>
                          )}

                          {question.solutionType === SolutionType.IMAGE && (
                            <div>
                              {!solutionPreviews[qIndex] ? (
                                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 hover:border-emerald-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-emerald-50/50 transition-colors">
                                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                                  <span className="text-xs font-semibold text-slate-500">
                                    Upload solution image
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    PNG, JPG, WEBP · max 5 MB
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleSolutionImageChange(qIndex, e)
                                    }
                                  />
                                </label>
                              ) : (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                                  <img
                                    src={solutionPreviews[qIndex]!}
                                    alt="Solution"
                                    className="w-full max-h-56 object-contain bg-slate-50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveSolutionImage(qIndex)
                                    }
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                  <div className="px-4 py-2 bg-white border-t border-slate-100">
                                    <p className="text-xs text-slate-400 truncate">
                                      {solutionFiles[qIndex]?.name ??
                                        'Solution image'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bottom save bar */}
                <div className="sticky bottom-6 mt-6">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xl px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {editedQuestions.length} questions ready
                        </p>
                        <p className="text-xs text-slate-400">
                          All changes are saved locally
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBack}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkSave}
                        disabled={
                          bulkCreateMutation.isPending ||
                          editedQuestions.length === 0
                        }
                        className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 transition-all">
                        <CheckCircle className="w-4 h-4" />
                        Save All Questions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBulkUpload;
