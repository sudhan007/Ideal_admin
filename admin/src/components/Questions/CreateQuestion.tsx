// //@ts-nocheck
// import React, { useState, useRef, useEffect } from 'react'
// import 'https://esm.run/mathlive'
// import type { MathfieldElement } from 'mathlive'
// declare global {
//   interface Window {
//     mathVirtualKeyboard: {
//       show: () => void
//       hide: () => void
//     }
//   }
// }

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       'math-field': React.DetailedHTMLProps<
//         React.HTMLAttributes<MathfieldElement> & {
//           'virtual-keyboard-mode'?: 'auto' | 'manual' | 'onfocus' | 'off'
//           readonly?: boolean
//         },
//         MathfieldElement
//       >
//     }
//   }
// }

// interface CreateQuestionProps {
//   courseId?: string
//   lessonId?: string
//   chapterId?: string
// }

// function CreateQuestion({
//   courseId: propCourseId,
//   lessonId: propLessonId,
//   chapterId: propChapterId,
// }: CreateQuestionProps = {}) {
//   const [selectedCourse, setSelectedCourse] = useState(propCourseId || '')
//   const [selectedLesson, setSelectedLesson] = useState(propLessonId || '')
//   const [questionType, setQuestionType] = useState<
//     'mcq' | 'fill_blank' | 'math_input'
//   >('mcq')

//   const [questionData, setQuestionData] = useState({
//     questionText: '',
//     questionLatex: '',
//     type: 'mcq',
//     options: ['', '', '', ''],
//     correctAnswer: '',
//     correctAnswerLatex: '',
//     difficulty: 'medium' as 'easy' | 'medium' | 'hard',
//   })

//   useEffect(() => {
//     if (propCourseId) setSelectedCourse(propCourseId)
//     if (propLessonId) setSelectedLesson(propLessonId)
//   }, [propCourseId, propLessonId])

//   const saveQuestion = async () => {
//     if (!selectedCourse || !selectedLesson || !propChapterId) {
//       alert('Please select course, lesson, and ensure chapter is provided.')
//       return
//     }

//     const payload = {
//       courseId: selectedCourse,
//       lessonId: selectedLesson,
//       chapterId: propChapterId,
//       type: questionType,
//       ...questionData,
//     }

//     try {
//       const response = await fetch('/api/admin/questions', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       })

//       if (response.ok) {
//         alert('Question saved successfully!')
//       } else {
//         alert('Failed to save question.')
//       }
//     } catch (err) {
//       alert('Error saving question.')
//     }
//   }

//   return (
//     <div className="admin-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//       <h1 className="text-3xl font-bold mb-8">Create Question</h1>

//       {/* Step 2: Question Type */}
//       <section className="mb-10">
//         <h2 className="text-2xl font-semibold mb-4"> Question Type</h2>
//         <div className="flex gap-4 flex-wrap">
//           <button
//             onClick={() => setQuestionType('mcq')}
//             className={`px-6 py-3 rounded-lg font-medium ${questionType === 'mcq' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
//           >
//             Multiple Choice
//           </button>
//           <button
//             onClick={() => setQuestionType('fill_blank')}
//             className={`px-6 py-3 rounded-lg font-medium ${questionType === 'fill_blank' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
//           >
//             Fill in the Blanks
//           </button>
//           <button
//             onClick={() => setQuestionType('math_input')}
//             className={`px-6 py-3 rounded-lg font-medium ${questionType === 'math_input' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
//           >
//             Math Formula Input
//           </button>
//         </div>
//       </section>

//       <section className="mb-10">
//         <h2 className="text-2xl font-semibold mb-4">Question Content</h2>
//         <MathQuestionEditor
//           type={questionType}
//           data={questionData}
//           onChange={setQuestionData}
//         />
//       </section>

//       {/* Step 4: Preview */}
//       <section className="mb-10">
//         <h2 className="text-2xl font-semibold mb-4">Preview</h2>
//         <QuestionPreview data={questionData} type={questionType} />
//       </section>

//       <button
//         onClick={saveQuestion}
//         className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
//       >
//         Save Question
//       </button>
//     </div>
//   )
// }

// function MathQuestionEditor({
//   type,
//   data,
//   onChange,
// }: {
//   type: string
//   data: any
//   onChange: (d: any) => void
// }) {
//   const questionMathRef = useRef<MathfieldElement>(null)
//   const answerMathRef = useRef<MathfieldElement>(null)

//   // Setup virtual keyboard for each math-field
//   const setupKeyboard = (mf: MathfieldElement | null) => {
//     if (mf) {
//       // Set policy to manual for reliable control
//       mf.mathVirtualKeyboardPolicy = 'manual'

//       const showKB = () => window.mathVirtualKeyboard?.show()
//       const hideKB = () => window.mathVirtualKeyboard?.hide()

//       mf.addEventListener('focusin', showKB)
//       mf.addEventListener('focusout', hideKB)

//       // Cleanup on unmount
//       return () => {
//         mf.removeEventListener('focusin', showKB)
//         mf.removeEventListener('focusout', hideKB)
//       }
//     }
//   }

//   useEffect(() => {
//     const cleanupQuestion = setupKeyboard(questionMathRef.current)
//     return cleanupQuestion
//   }, [])

//   return (
//     <div className="space-y-8">
//       {/* Question Text */}
//       <div>
//         <label className="block font-medium mb-2">Question Text:</label>
//         <textarea
//           value={data.questionText}
//           onChange={(e) => onChange({ ...data, questionText: e.target.value })}
//           rows={4}
//           className="w-full p-4 border rounded-lg"
//           placeholder="e.g., Find the value of x in the equation..."
//         />
//       </div>

//       {/* Question Formula (optional) */}
//       <div>
//         <label className="block font-medium mb-2">
//           Question Formula (optional):
//         </label>
//         <div className="border rounded-lg p-4 bg-gray-50">
//           <math-field
//             ref={questionMathRef}
//             className="math-input-field"
//             onInput={(e: any) =>
//               onChange({ ...data, questionLatex: e.target.value })
//             }
//           >
//             {data.questionLatex}
//           </math-field>
//         </div>
//         <small className="text-gray-600">
//           Current LaTeX: {data.questionLatex || 'empty'}
//         </small>
//       </div>

//       {/* Type-specific editors */}
//       {type === 'mcq' && <MCQEditor data={data} onChange={onChange} />}
//       {type === 'fill_blank' && (
//         <FillBlankEditor data={data} onChange={onChange} />
//       )}
//       {type === 'math_input' && (
//         <MathInputEditor
//           data={data}
//           onChange={onChange}
//           answerMathRef={answerMathRef}
//         />
//       )}

//       {/* Difficulty */}
//       <div>
//         <label className="block font-medium mb-2">Difficulty:</label>
//         <select
//           value={data.difficulty}
//           onChange={(e) => onChange({ ...data, difficulty: e.target.value })}
//           className="w-full p-3 border rounded-lg"
//         >
//           <option value="easy">Easy</option>
//           <option value="medium">Medium</option>
//           <option value="hard">Hard</option>
//         </select>
//       </div>
//     </div>
//   )
// }

// function MathInputEditor({
//   data,
//   onChange,
//   answerMathRef,
// }: {
//   data: any
//   onChange: (d: any) => void
//   answerMathRef: React.RefObject<MathfieldElement>
// }) {
//   const insert = (latex: string) => {
//     answerMathRef.current?.executeCommand(['insert', latex])
//   }

//   useEffect(() => {
//     if (answerMathRef.current) {
//       answerMathRef.current.mathVirtualKeyboardPolicy = 'manual'

//       const showKB = () => window.mathVirtualKeyboard?.show()
//       const hideKB = () => window.mathVirtualKeyboard?.hide()

//       answerMathRef.current.addEventListener('focusin', showKB)
//       answerMathRef.current.addEventListener('focusout', hideKB)

//       return () => {
//         answerMathRef.current?.removeEventListener('focusin', showKB)
//         answerMathRef.current?.removeEventListener('focusout', hideKB)
//       }
//     }
//   }, [])

//   return (
//     <div>
//       <label className="block font-medium mb-2">
//         Correct Answer (Formula):
//       </label>
//       <div className="border rounded-lg p-4 bg-gray-50 mb-4">
//         <math-field
//           ref={answerMathRef}
//           className="math-input-field"
//           onInput={(e: any) => {
//             const latex = e.target.value
//             onChange({
//               ...data,
//               correctAnswerLatex: latex,
//               correctAnswer: latex,
//             })
//           }}
//         >
//           {data.correctAnswerLatex}
//         </math-field>
//       </div>

//       <p className="mb-4">
//         <strong>Current LaTeX:</strong>{' '}
//         <code>{data.correctAnswerLatex || 'empty'}</code>
//       </p>
//     </div>
//   )
// }

// function MCQEditor({
//   data,
//   onChange,
// }: {
//   data: any
//   onChange: (d: any) => void
// }) {
//   const updateOption = (index: number, value: string) => {
//     const options = [...data.options]
//     options[index] = value
//     onChange({ ...data, options })
//   }

//   return (
//     <div>
//       <label className="block font-medium mb-4">Options:</label>
//       {data.options.map((opt: string, i: number) => (
//         <div key={i} className="flex items-center gap-4 mb-4">
//           <span className="font-bold w-8">{String.fromCharCode(65 + i)}.</span>
//           <input
//             type="text"
//             value={opt}
//             onChange={(e) => updateOption(i, e.target.value)}
//             className="flex-1 p-3 border rounded-lg"
//             placeholder={`Option ${String.fromCharCode(65 + i)}`}
//           />
//           <input
//             type="radio"
//             name="correct"
//             checked={data.correctAnswer === opt}
//             onChange={() => onChange({ ...data, correctAnswer: opt })}
//           />
//           <label>Correct</label>
//         </div>
//       ))}
//     </div>
//   )
// }

// function FillBlankEditor({
//   data,
//   onChange,
// }: {
//   data: any
//   onChange: (d: any) => void
// }) {
//   return (
//     <div>
//       <label className="block font-medium mb-2">Correct Answer (text):</label>
//       <input
//         type="text"
//         value={data.correctAnswer}
//         onChange={(e) => onChange({ ...data, correctAnswer: e.target.value })}
//         className="w-full p-3 border rounded-lg"
//       />
//     </div>
//   )
// }

// function QuestionPreview({ data, type }: { data: any; type: string }) {
//   return (
//     <div className="border-2 border-dashed p-8 rounded-lg bg-gray-50">
//       <p className="text-lg mb-4">{data.questionText}</p>
//       {data.questionLatex && (
//         <div className="my-6">
//           <math-field readonly>{data.questionLatex}</math-field>
//         </div>
//       )}

//       {type === 'mcq' && (
//         <div className="space-y-3">
//           {data.options.map((opt: string, i: number) => (
//             <div
//               key={i}
//               className={`p-3 rounded border ${opt === data.correctAnswer ? 'bg-green-100 border-green-500' : 'bg-white'}`}
//             >
//               <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
//             </div>
//           ))}
//         </div>
//       )}

//       {type === 'fill_blank' && (
//         <p>
//           <strong>Correct Answer:</strong> {data.correctAnswer}
//         </p>
//       )}

//       {type === 'math_input' && (
//         <div>
//           <strong>Expected Formula:</strong>
//           <div className="my-4">
//             <math-field readonly>{data.correctAnswerLatex}</math-field>
//           </div>
//         </div>
//       )}

//       <p className="mt-6">
//         <strong>Difficulty:</strong> {data.difficulty}
//       </p>
//     </div>
//   )
// }

// export default CreateQuestion

//@ts-nocheck

// //@ts-nocheck
// import React, { useState, useRef, useEffect } from 'react'
// import 'https://esm.run/mathlive'
// import type { MathfieldElement } from 'mathlive'

// declare global {
//   interface Window {
//     mathVirtualKeyboard: {
//       show: () => void
//       hide: () => void
//     }
//   }
// }

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       'math-field': React.DetailedHTMLProps<
//         React.HTMLAttributes<MathfieldElement> & {
//           'virtual-keyboard-mode'?: 'auto' | 'manual' | 'onfocus' | 'off'
//           readonly?: boolean
//         },
//         MathfieldElement
//       >
//     }
//   }
// }

// interface CreateQuestionProps {
//   courseId?: string
//   lessonId?: string
//   chapterId?: string
// }

// function CreateQuestion({
//   courseId: propCourseId,
//   lessonId: propLessonId,
//   chapterId: propChapterId,
// }: CreateQuestionProps = {}) {
//   const [selectedCourse, setSelectedCourse] = useState(propCourseId || '')
//   const [selectedLesson, setSelectedLesson] = useState(propLessonId || '')
//   const [questionType, setQuestionType] = useState<
//     'mcq' | 'fill_blank' | 'math_input'
//   >('mcq')

//   const [questionData, setQuestionData] = useState({
//     questionText: '',
//     questionLatex: '',
//     type: 'mcq',
//     options: ['', '', '', ''],
//     correctAnswer: '',
//     correctAnswerLatex: '',
//     difficulty: 'medium' as 'easy' | 'medium' | 'hard',
//   })

//   useEffect(() => {
//     if (propCourseId) setSelectedCourse(propCourseId)
//     if (propLessonId) setSelectedLesson(propLessonId)
//   }, [propCourseId, propLessonId])

//   const saveQuestion = async () => {
//     if (!selectedCourse || !selectedLesson || !propChapterId) {
//       alert('Please select course, lesson, and ensure chapter is provided.')
//       return
//     }

//     const payload = {
//       courseId: selectedCourse,
//       lessonId: selectedLesson,
//       chapterId: propChapterId,
//       type: questionType,
//       ...questionData,
//     }

//     try {
//       const response = await fetch('/api/admin/questions', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       })

//       if (response.ok) {
//         alert('Question saved successfully!')
//       } else {
//         alert('Failed to save question.')
//       }
//     } catch (err) {
//       alert('Error saving question.')
//     }
//   }

//   return (
//     <div className="admin-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//       <h1 className="text-3xl font-bold mb-8">Create Question</h1>

//       {/* Step 2: Question Type */}
//       <section className="mb-10">
//         <h2 className="text-2xl font-semibold mb-4"> Question Type</h2>
//         <div className="flex gap-4 flex-wrap">
//           <button
//             onClick={() => setQuestionType('mcq')}
//             className={`px-6 py-3 rounded-lg font-medium ${questionType === 'mcq' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
//           >
//             Multiple Choice
//           </button>
//           <button
//             onClick={() => setQuestionType('fill_blank')}
//             className={`px-6 py-3 rounded-lg font-medium ${questionType === 'fill_blank' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
//           >
//             Fill in the Blanks
//           </button>
//           <button
//             onClick={() => setQuestionType('math_input')}
//             className={`px-6 py-3 rounded-lg font-medium ${questionType === 'math_input' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
//           >
//             Math Formula Input
//           </button>
//         </div>
//       </section>

//       <section className="mb-10">
//         <h2 className="text-2xl font-semibold mb-4">Question Content</h2>
//         <MathQuestionEditor
//           type={questionType}
//           data={questionData}
//           onChange={setQuestionData}
//         />
//       </section>

//       {/* Step 4: Preview */}
//       <section className="mb-10">
//         <h2 className="text-2xl font-semibold mb-4">Preview</h2>
//         <QuestionPreview data={questionData} type={questionType} />
//       </section>

//       <button
//         onClick={saveQuestion}
//         className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
//       >
//         Save Question
//       </button>
//     </div>
//   )
// }

// // Symbol Button Component
// function SymbolButton({
//   latex,
//   display,
//   onClick,
// }: {
//   latex: string
//   display: string
//   onClick: (latex: string) => void
// }) {
//   return (
//     <button
//       onClick={() => onClick(latex)}
//       className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm font-medium transition-colors"
//       title={`Insert ${display}`}
//     >
//       {display}
//     </button>
//   )
// }

// function MathQuestionEditor({
//   type,
//   data,
//   onChange,
// }: {
//   type: string
//   data: any
//   onChange: (d: any) => void
// }) {
//   const questionMathRef = useRef<MathfieldElement>(null)
//   const answerMathRef = useRef<MathfieldElement>(null)

//   // Insert symbol into the active math field
//   const insertSymbol = (
//     mathRef: React.RefObject<MathfieldElement>,
//     latex: string,
//   ) => {
//     if (mathRef.current) {
//       mathRef.current.executeCommand(['insert', latex])
//       mathRef.current.focus()
//     }
//   }

//   // Setup virtual keyboard for each math-field
//   const setupKeyboard = (mf: MathfieldElement | null) => {
//     if (mf) {
//       mf.mathVirtualKeyboardPolicy = 'manual'

//       const showKB = () => window.mathVirtualKeyboard?.show()
//       const hideKB = () => window.mathVirtualKeyboard?.hide()

//       mf.addEventListener('focusin', showKB)
//       mf.addEventListener('focusout', hideKB)

//       return () => {
//         mf.removeEventListener('focusin', showKB)
//         mf.removeEventListener('focusout', hideKB)
//       }
//     }
//   }

//   useEffect(() => {
//     const cleanupQuestion = setupKeyboard(questionMathRef.current)
//     return cleanupQuestion
//   }, [])

//   return (
//     <div className="space-y-8">
//       {/* Question Text */}
//       <div>
//         <label className="block font-medium mb-2">Question Text:</label>
//         <textarea
//           value={data.questionText}
//           onChange={(e) => onChange({ ...data, questionText: e.target.value })}
//           rows={4}
//           className="w-full p-4 border rounded-lg"
//           placeholder="e.g., Find the value of x in the equation..."
//         />
//       </div>

//       {/* Question Formula (optional) */}
//       <div>
//         <label className="block font-medium mb-2">
//           Question Formula (optional):
//         </label>

//         {/* Symbol Toolbar for Question */}
//         <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
//           <p className="text-xs font-semibold text-gray-600 mb-2">
//             Quick Insert Symbols:
//           </p>
//           <div className="flex flex-wrap gap-2">
//             <SymbolButton
//               latex="\hat{i}"
//               display="î (hat)"
//               onClick={(l) => insertSymbol(questionMathRef, l)}
//             />
//             <SymbolButton
//               latex="\hat{j}"
//               display="ĵ (hat)"
//               onClick={(l) => insertSymbol(questionMathRef, l)}
//             />
//             <SymbolButton
//               latex="\hat{k}"
//               display="k̂ (hat)"
//               onClick={(l) => insertSymbol(questionMathRef, l)}
//             />
//           </div>
//         </div>

//         <div className="border rounded-lg p-4 bg-gray-50">
//           <math-field
//             ref={questionMathRef}
//             className="math-input-field"
//             onInput={(e: any) =>
//               onChange({ ...data, questionLatex: e.target.value })
//             }
//           >
//             {data.questionLatex}
//           </math-field>
//         </div>
//         <small className="text-gray-600">
//           Current LaTeX: {data.questionLatex || 'empty'}
//         </small>
//       </div>

//       {/* Type-specific editors */}
//       {type === 'mcq' && <MCQEditor data={data} onChange={onChange} />}
//       {type === 'fill_blank' && (
//         <FillBlankEditor data={data} onChange={onChange} />
//       )}
//       {type === 'math_input' && (
//         <MathInputEditor
//           data={data}
//           onChange={onChange}
//           answerMathRef={answerMathRef}
//           insertSymbol={insertSymbol}
//         />
//       )}

//       {/* Difficulty */}
//       <div>
//         <label className="block font-medium mb-2">Difficulty:</label>
//         <select
//           value={data.difficulty}
//           onChange={(e) => onChange({ ...data, difficulty: e.target.value })}
//           className="w-full p-3 border rounded-lg"
//         >
//           <option value="easy">Easy</option>
//           <option value="medium">Medium</option>
//           <option value="hard">Hard</option>
//         </select>
//       </div>
//     </div>
//   )
// }

// function MathInputEditor({
//   data,
//   onChange,
//   answerMathRef,
//   insertSymbol,
// }: {
//   data: any
//   onChange: (d: any) => void
//   answerMathRef: React.RefObject<MathfieldElement>
//   insertSymbol: (ref: React.RefObject<MathfieldElement>, latex: string) => void
// }) {
//   useEffect(() => {
//     if (answerMathRef.current) {
//       answerMathRef.current.mathVirtualKeyboardPolicy = 'manual'

//       const showKB = () => window.mathVirtualKeyboard?.show()
//       const hideKB = () => window.mathVirtualKeyboard?.hide()

//       answerMathRef.current.addEventListener('focusin', showKB)
//       answerMathRef.current.addEventListener('focusout', hideKB)

//       return () => {
//         answerMathRef.current?.removeEventListener('focusin', showKB)
//         answerMathRef.current?.removeEventListener('focusout', hideKB)
//       }
//     }
//   }, [])

//   return (
//     <div>
//       <label className="block font-medium mb-2">
//         Correct Answer (Formula):
//       </label>

//       {/* Symbol Toolbar for Answer */}
//       <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
//         <p className="text-xs font-semibold text-gray-600 mb-2">
//           Quick Insert Symbols:
//         </p>
//         <div className="flex flex-wrap gap-2">
//           <SymbolButton
//             latex="\hat{i}"
//             display="î (hat)"
//             onClick={(l) => insertSymbol(questionMathRef, l)}
//           />
//           <SymbolButton
//             latex="\hat{j}"
//             display="ĵ (hat)"
//             onClick={(l) => insertSymbol(questionMathRef, l)}
//           />
//           <SymbolButton
//             latex="\hat{k}"
//             display="k̂ (hat)"
//             onClick={(l) => insertSymbol(questionMathRef, l)}
//           />
//         </div>
//       </div>

//       <div className="border rounded-lg p-4 bg-gray-50 mb-4">
//         <math-field
//           ref={answerMathRef}
//           className="math-input-field"
//           onInput={(e: any) => {
//             const latex = e.target.value
//             onChange({
//               ...data,
//               correctAnswerLatex: latex,
//               correctAnswer: latex,
//             })
//           }}
//         >
//           {data.correctAnswerLatex}
//         </math-field>
//       </div>

//       <p className="mb-4">
//         <strong>Current LaTeX:</strong>{' '}
//         <code>{data.correctAnswerLatex || 'empty'}</code>
//       </p>
//     </div>
//   )
// }

// function MCQEditor({
//   data,
//   onChange,
// }: {
//   data: any
//   onChange: (d: any) => void
// }) {
//   const updateOption = (index: number, value: string) => {
//     const options = [...data.options]
//     options[index] = value
//     onChange({ ...data, options })
//   }

//   return (
//     <div>
//       <label className="block font-medium mb-4">Options:</label>
//       {data.options.map((opt: string, i: number) => (
//         <div key={i} className="flex items-center gap-4 mb-4">
//           <span className="font-bold w-8">{String.fromCharCode(65 + i)}.</span>
//           <input
//             type="text"
//             value={opt}
//             onChange={(e) => updateOption(i, e.target.value)}
//             className="flex-1 p-3 border rounded-lg"
//             placeholder={`Option ${String.fromCharCode(65 + i)}`}
//           />
//           <input
//             type="radio"
//             name="correct"
//             checked={data.correctAnswer === opt}
//             onChange={() => onChange({ ...data, correctAnswer: opt })}
//           />
//           <label>Correct</label>
//         </div>
//       ))}
//     </div>
//   )
// }

// function FillBlankEditor({
//   data,
//   onChange,
// }: {
//   data: any
//   onChange: (d: any) => void
// }) {
//   return (
//     <div>
//       <label className="block font-medium mb-2">Correct Answer (text):</label>
//       <input
//         type="text"
//         value={data.correctAnswer}
//         onChange={(e) => onChange({ ...data, correctAnswer: e.target.value })}
//         className="w-full p-3 border rounded-lg"
//       />
//     </div>
//   )
// }

// function QuestionPreview({ data, type }: { data: any; type: string }) {
//   return (
//     <div className="border-2 border-dashed p-8 rounded-lg bg-gray-50">
//       <p className="text-lg mb-4">{data.questionText}</p>
//       {data.questionLatex && (
//         <div className="my-6">
//           <math-field readonly>{data.questionLatex}</math-field>
//         </div>
//       )}

//       {type === 'mcq' && (
//         <div className="space-y-3">
//           {data.options.map((opt: string, i: number) => (
//             <div
//               key={i}
//               className={`p-3 rounded border ${opt === data.correctAnswer ? 'bg-green-100 border-green-500' : 'bg-white'}`}
//             >
//               <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
//             </div>
//           ))}
//         </div>
//       )}

//       {type === 'fill_blank' && (
//         <p>
//           <strong>Correct Answer:</strong> {data.correctAnswer}
//         </p>
//       )}

//       {type === 'math_input' && (
//         <div>
//           <strong>Expected Formula:</strong>
//           <div className="my-4">
//             <math-field readonly>{data.correctAnswerLatex}</math-field>
//           </div>
//         </div>
//       )}

//       <p className="mt-6">
//         <strong>Difficulty:</strong> {data.difficulty}
//       </p>
//     </div>
//   )
// }

// export default CreateQuestion

//@ts-nocheck
import React, { useState, useRef, useEffect } from 'react'
import 'https://esm.run/mathlive'
import type { MathfieldElement } from 'mathlive'

declare global {
  interface Window {
    mathVirtualKeyboard: {
      show: () => void
      hide: () => void
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement> & {
          'virtual-keyboard-mode'?: 'auto' | 'manual' | 'onfocus' | 'off'
          readonly?: boolean
        },
        MathfieldElement
      >
    }
  }
}

interface CreateQuestionProps {
  courseId?: string
  lessonId?: string
  chapterId?: string
}

function CreateQuestion({
  courseId: propCourseId,
  lessonId: propLessonId,
  chapterId: propChapterId,
}: CreateQuestionProps = {}) {
  const [selectedCourse, setSelectedCourse] = useState(propCourseId || '')
  const [selectedLesson, setSelectedLesson] = useState(propLessonId || '')
  const [questionType, setQuestionType] = useState<
    'mcq' | 'fill_blank' | 'math_input'
  >('mcq')

  const [questionData, setQuestionData] = useState({
    questionText: '',
    questionLatex: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: '',
    correctAnswerLatex: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  })

  useEffect(() => {
    if (propCourseId) setSelectedCourse(propCourseId)
    if (propLessonId) setSelectedLesson(propLessonId)
  }, [propCourseId, propLessonId])

  const saveQuestion = async () => {
    if (!selectedCourse || !selectedLesson || !propChapterId) {
      alert('Please select course, lesson, and ensure chapter is provided.')
      return
    }

    const payload = {
      courseId: selectedCourse,
      lessonId: selectedLesson,
      chapterId: propChapterId,
      type: questionType,
      ...questionData,
    }

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert('Question saved successfully!')
      } else {
        alert('Failed to save question.')
      }
    } catch (err) {
      alert('Error saving question.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50  px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r  px-8 py-5 text-white">
            <h1 className="text-2xl font-bold text-black">
              Create New Question
            </h1>
            <p className="mt-2 text-black">
              Fill in the details to add a question
            </p>
          </div>

          <div className="p-4 space-y-10">
            {/* Question Type */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-5">
                Question Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setQuestionType('mcq')}
                  className={`p-6 rounded-xl font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    questionType === 'mcq'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  Multiple Choice
                </button>
                <button
                  onClick={() => setQuestionType('fill_blank')}
                  className={`p-6 rounded-xl font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    questionType === 'fill_blank'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  Fill in the Blanks
                </button>
                <button
                  onClick={() => setQuestionType('math_input')}
                  className={`p-6 rounded-xl font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    questionType === 'math_input'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  Math Formula Input
                </button>
              </div>
            </section>

            {/* Question Content */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-5">
                Question Content
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <MathQuestionEditor
                  type={questionType}
                  data={questionData}
                  onChange={setQuestionData}
                />
              </div>
            </section>

            {/* Preview */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-5">
                Preview
              </h2>
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8">
                <QuestionPreview data={questionData} type={questionType} />
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={saveQuestion}
                className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modern Symbol Button with rendered math preview
function SymbolButton({
  latex,
  display,
  onClick,
}: {
  latex: string
  display: string
  onClick: (latex: string) => void
}) {
  return (
    <button
      onClick={() => onClick(latex)}
      className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-blue-50 border border-gray-300 hover:border-blue-400 rounded-lg shadow-sm hover:shadow transition-all duration-200 group"
      title={`Insert ${display}`}
    >
      <span className="text-lg font-medium text-gray-700">
        <math-field readonly fonts-directory="/fonts" className="text-base">
          {latex}
        </math-field>
      </span>
      <span className="text-xs text-gray-500 group-hover:text-blue-600">
        {display}
      </span>
    </button>
  )
}

function MathQuestionEditor({
  type,
  data,
  onChange,
}: {
  type: string
  data: any
  onChange: (d: any) => void
}) {
  const questionMathRef = useRef<MathfieldElement>(null)
  const answerMathRef = useRef<MathfieldElement>(null)

  const insertSymbol = (
    mathRef: React.RefObject<MathfieldElement>,
    latex: string,
  ) => {
    if (mathRef.current) {
      mathRef.current.executeCommand(['insert', latex])
      mathRef.current.focus()
    }
  }

  const setupKeyboard = (mf: MathfieldElement | null) => {
    if (mf) {
      mf.mathVirtualKeyboardPolicy = 'manual'

      const showKB = () => window.mathVirtualKeyboard?.show()
      const hideKB = () => window.mathVirtualKeyboard?.hide()

      mf.addEventListener('focusin', showKB)
      mf.addEventListener('focusout', hideKB)

      return () => {
        mf.removeEventListener('focusin', showKB)
        mf.removeEventListener('focusout', hideKB)
      }
    }
  }

  useEffect(() => {
    const cleanupQuestion = setupKeyboard(questionMathRef.current)
    return cleanupQuestion
  }, [])

  return (
    <div className="space-y-8">
      {/* Question Text */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Question Text
        </label>
        <textarea
          value={data.questionText}
          onChange={(e) => onChange({ ...data, questionText: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          placeholder="e.g., Find the value of x in the equation..."
        />
      </div>

      {/* Question Formula */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Question Formula (Optional)
        </label>

        <div className="mb-4 p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
          <p className="text-sm font-medium text-blue-800 mb-3">
            Quick Unit Vectors
          </p>
          <div className="flex flex-wrap gap-3">
            <SymbolButton
              latex="\hat{i}"
              display="i hat"
              onClick={(l) => insertSymbol(questionMathRef, l)}
            />
            <SymbolButton
              latex="\hat{j}"
              display="j hat"
              onClick={(l) => insertSymbol(questionMathRef, l)}
            />
            <SymbolButton
              latex="\hat{k}"
              display="k hat"
              onClick={(l) => insertSymbol(questionMathRef, l)}
            />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm">
          <math-field
            ref={questionMathRef}
            className="math-input-field w-full text-lg"
            onInput={(e: any) =>
              onChange({ ...data, questionLatex: e.target.value })
            }
          >
            {data.questionLatex}
          </math-field>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Current LaTeX:{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">
            {data.questionLatex || 'empty'}
          </code>
        </p>
      </div>

      {/* Type-specific editors */}
      {type === 'mcq' && <MCQEditor data={data} onChange={onChange} />}
      {type === 'fill_blank' && (
        <FillBlankEditor data={data} onChange={onChange} />
      )}
      {type === 'math_input' && (
        <MathInputEditor
          data={data}
          onChange={onChange}
          answerMathRef={answerMathRef}
          insertSymbol={insertSymbol}
        />
      )}

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Difficulty Level
        </label>
        <select
          value={data.difficulty}
          onChange={(e) => onChange({ ...data, difficulty: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
    </div>
  )
}

function MathInputEditor({
  data,
  onChange,
  answerMathRef,
  insertSymbol,
}: {
  data: any
  onChange: (d: any) => void
  answerMathRef: React.RefObject<MathfieldElement>
  insertSymbol: (ref: React.RefObject<MathfieldElement>, latex: string) => void
}) {
  useEffect(() => {
    if (answerMathRef.current) {
      answerMathRef.current.mathVirtualKeyboardPolicy = 'manual'

      const showKB = () => window.mathVirtualKeyboard?.show()
      const hideKB = () => window.mathVirtualKeyboard?.hide()

      answerMathRef.current.addEventListener('focusin', showKB)
      answerMathRef.current.addEventListener('focusout', hideKB)

      return () => {
        answerMathRef.current?.removeEventListener('focusin', showKB)
        answerMathRef.current?.removeEventListener('focusout', hideKB)
      }
    }
  }, [])

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Correct Answer (Formula)
      </label>

      <div className="mb-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
        <p className="text-sm font-medium text-emerald-800 mb-3">
          Quick Unit Vectors
        </p>
        <div className="flex flex-wrap gap-3">
          <SymbolButton
            latex="\hat{i}"
            display="i hat"
            onClick={(l) => insertSymbol(answerMathRef, l)}
          />
          <SymbolButton
            latex="\hat{j}"
            display="j hat"
            onClick={(l) => insertSymbol(answerMathRef, l)}
          />
          <SymbolButton
            latex="\hat{k}"
            display="k hat"
            onClick={(l) => insertSymbol(answerMathRef, l)}
          />
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm">
        <math-field
          ref={answerMathRef}
          className="math-input-field w-full text-lg"
          onInput={(e: any) => {
            const latex = e.target.value
            onChange({
              ...data,
              correctAnswerLatex: latex,
              correctAnswer: latex,
            })
          }}
        >
          {data.correctAnswerLatex}
        </math-field>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Current LaTeX:{' '}
        <code className="bg-gray-100 px-2 py-1 rounded">
          {data.correctAnswerLatex || 'empty'}
        </code>
      </p>
    </div>
  )
}

// Rest of components (MCQ, FillBlank, Preview) with improved styling
function MCQEditor({
  data,
  onChange,
}: {
  data: any
  onChange: (d: any) => void
}) {
  const updateOption = (index: number, value: string) => {
    const options = [...data.options]
    options[index] = value
    onChange({ ...data, options })
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        Options
      </label>
      <div className="space-y-4">
        {data.options.map((opt: string, i: number) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <span className="font-bold text-lg text-gray-600 w-10">
              {String.fromCharCode(65 + i)}.
            </span>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="correct"
                checked={data.correctAnswer === opt}
                onChange={() => onChange({ ...data, correctAnswer: opt })}
                className="w-5 h-5 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Correct</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

function FillBlankEditor({
  data,
  onChange,
}: {
  data: any
  onChange: (d: any) => void
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Correct Answer (Text)
      </label>
      <input
        type="text"
        value={data.correctAnswer}
        onChange={(e) => onChange({ ...data, correctAnswer: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function QuestionPreview({ data, type }: { data: any; type: string }) {
  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-800 leading-relaxed">
        {data.questionText || (
          <em className="text-gray-400">No question text</em>
        )}
      </p>

      {data.questionLatex && (
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
          <math-field readonly className="text-xl">
            {data.questionLatex}
          </math-field>
        </div>
      )}

      {type === 'mcq' && (
        <div className="space-y-3">
          {data.options.map((opt: string, i: number) => (
            <div
              key={i}
              className={`p-5 rounded-xl border-2 transition-all ${
                opt === data.correctAnswer
                  ? 'bg-green-50 border-green-400 shadow-sm'
                  : 'bg-white border-gray-200'
              }`}
            >
              <strong className="text-lg mr-3">
                {String.fromCharCode(65 + i)}.
              </strong>
              <span className="text-gray-800">
                {opt || <em>Empty option</em>}
              </span>
            </div>
          ))}
        </div>
      )}

      {type === 'fill_blank' && (
        <p className="text-lg">
          <strong className="text-gray-700">Correct Answer:</strong>{' '}
          <span className="text-blue-700 font-medium">
            {data.correctAnswer || '—'}
          </span>
        </p>
      )}

      {type === 'math_input' && (
        <div>
          <strong className="text-gray-700 text-lg block mb-3">
            Expected Formula:
          </strong>
          <div className="p-6 bg-emerald-50 rounded-xl border-2 border-emerald-200">
            <math-field readonly className="text-xl">
              {data.correctAnswerLatex || '\\phantom{empty}'}
            </math-field>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 mt-6">
        <strong>Difficulty:</strong>{' '}
        <span className="px-3 py-1 bg-gray-200 rounded-full capitalize font-medium">
          {data.difficulty}
        </span>
      </p>
    </div>
  )
}

export default CreateQuestion
