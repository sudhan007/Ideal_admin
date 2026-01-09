//@ts-nocheck
import React, { useState, useRef, useEffect } from 'react'
import 'https://esm.run/mathlive'
import type { MathfieldElement } from 'mathlive'
import { useMutation } from '@tanstack/react-query'
import { _axios } from '@/lib/axios'

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
    'MCQ' | 'FILL_BLANK' | 'MATH_INPUT'
  >('MCQ')

  const [questionData, setQuestionData] = useState({
    questionText: '',
    questionLatex: '',
    type: 'MCQ',
    options: [
      { id: 'A', answer: '' },
      { id: 'B', answer: '' },
      { id: 'C', answer: '' },
      { id: 'D', answer: '' },
    ],
    correctAnswer: '', // For MCQ: stores option id (A, B, C, D), For others: stores actual answer
    correctAnswerLatex: '', // For math_input type
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    marks: 1,
  })

  useEffect(() => {
    if (propCourseId) setSelectedCourse(propCourseId)
    if (propLessonId) setSelectedLesson(propLessonId)
  }, [propCourseId, propLessonId])

  // Update question type in data when type changes
  useEffect(() => {
    setQuestionData((prev) => ({
      ...prev,
      type: questionType,
      // Reset correct answer when type changes
      correctAnswer: '',
      correctAnswerLatex: '',
    }))
  }, [questionType])

  const validateQuestion = () => {
    if (!selectedCourse || !selectedLesson || !propChapterId) {
      alert('Please ensure course, lesson, and chapter are provided.')
      return false
    }

    if (!questionData.questionText.trim()) {
      alert('Please enter question text.')
      return false
    }

    if (questionType === 'MCQ') {
      const hasEmptyOption = questionData.options.some(
        (opt) => !opt.answer.trim(),
      )
      if (hasEmptyOption) {
        alert('Please fill in all MCQ options.')
        return false
      }
      if (!questionData.correctAnswer) {
        alert('Please select the correct answer.')
        return false
      }
    } else if (questionType === 'FILL_BLANK') {
      if (!questionData.correctAnswer.trim()) {
        alert('Please enter the correct answer.')
        return false
      }
    } else if (questionType === 'MATH_INPUT') {
      if (!questionData.correctAnswerLatex.trim()) {
        alert('Please enter the correct formula.')
        return false
      }
    }

    return true
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      console.log(data, 'ereee')
      const res = await _axios.post('/question', data)
      console.log(res)
      return res.data
    },
    onSuccess: (data) => {
      alert('Question created successfully!')
      resetForm()
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to save question')
    },
  })

  const saveQuestion = async () => {
    if (!validateQuestion()) return

    // Build payload according to backend schema
    const payload = {
      courseId: selectedCourse,
      lessonId: selectedLesson,
      chapterId: propChapterId,
      type: questionType,
      difficulty: questionData.difficulty,
      marks: questionData.marks,
      question: {
        text: questionData.questionText,
        ...(questionData.questionLatex && {
          latex: questionData.questionLatex,
        }),
      },
      // For MCQ: include options array, For others: omit options
      ...(questionType === 'MCQ' && {
        options: questionData.options.filter((opt) => opt.answer.trim()),
      }),
      // correctAnswer handling:
      // - MCQ: option id (A, B, C, D)
      // - fill_blank: text answer
      // - math_input: latex formula
      correctAnswer:
        questionType === 'MATH_INPUT'
          ? questionData.correctAnswerLatex
          : questionData.correctAnswer,
      isActive: true,
    }

    mutate(payload)

    // try {
    //   const response = await fetch('/api/admin/questions', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload),
    //   })

    //   if (response.ok) {
    //     const result = await response.json()
    //     alert('Question saved successfully!')
    //     // Reset form
    //     resetForm()
    //   } else {
    //     const error = await response.json()
    //     alert(`Failed to save question: ${error.message || 'Unknown error'}`)
    //   }
    // } catch (err) {
    //   console.error('Error saving question:', err)
    //   alert('Error saving question. Please try again.')
    // } finally {
    //   setIsSubmitting(false)
    // }
  }

  const resetForm = () => {
    setQuestionData({
      questionText: '',
      questionLatex: '',
      type: 'MCQ',
      options: [
        { id: 'A', answer: '' },
        { id: 'B', answer: '' },
        { id: 'C', answer: '' },
        { id: 'D', answer: '' },
      ],
      correctAnswer: '',
      correctAnswerLatex: '',
      difficulty: 'MEDIUM',
      marks: 1,
    })
    setQuestionType('MCQ')
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold">Create New Question</h1>
            <p className="mt-2 text-blue-100">
              Fill in the details to add a question to your course
            </p>
          </div>

          <div className="p-8 space-y-10">
            {/* Question Type */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-5">
                Question Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setQuestionType('MCQ')}
                  className={`p-6 rounded-xl font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    questionType === 'MCQ'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  Multiple Choice
                </button>
                <button
                  onClick={() => setQuestionType('FILL_BLANK')}
                  className={`p-6 rounded-xl font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    questionType === 'FILL_BLANK'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  Fill in the Blanks
                </button>
                {/* <button
                  onClick={() => setQuestionType('MATH_INPUT')}
                  className={`p-6 rounded-xl font-medium text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    questionType === 'MATH_INPUT'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  Math Formula Input
                </button> */}
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                onClick={resetForm}
                disabled={isPending}
                className="px-8 py-4 bg-gray-200 text-gray-700 text-lg font-semibold rounded-xl shadow hover:shadow-md hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={saveQuestion}
                disabled={isPending}
                className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isPending ? 'Saving...' : 'Save Question'}
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
          Question Text <span className="text-red-500">*</span>
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
      {type === 'MCQ' && <MCQEditor data={data} onChange={onChange} />}
      {type === 'FILL_BLANK' && (
        <FillBlankEditor data={data} onChange={onChange} />
      )}
      {type === 'MATH_INPUT' && (
        <MathInputEditor
          data={data}
          onChange={onChange}
          answerMathRef={answerMathRef}
          insertSymbol={insertSymbol}
        />
      )}

      {/* Difficulty & Marks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={data.difficulty}
            onChange={(e) => onChange({ ...data, difficulty: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        {/* <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Marks
          </label>
          <input
            type="number"
            min="1"
            value={data.marks}
            onChange={(e) =>
              onChange({ ...data, marks: parseInt(e.target.value) || 1 })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div> */}
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
        Correct Answer (Formula) <span className="text-red-500">*</span>
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

function MCQEditor({
  data,
  onChange,
}: {
  data: any
  onChange: (d: any) => void
}) {
  const updateOption = (index: number, value: string) => {
    const options = [...data.options]
    options[index].answer = value
    onChange({ ...data, options })
  }

  const selectCorrectAnswer = (optionId: string) => {
    onChange({ ...data, correctAnswer: optionId })
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        Options <span className="text-red-500">*</span>
      </label>
      <div className="space-y-4">
        {data.options.map((opt: any, i: number) => (
          <div
            key={opt.id}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <span className="font-bold text-lg text-gray-600 w-10">
              {opt.id}.
            </span>
            <input
              type="text"
              value={opt.answer}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Option ${opt.id}`}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="correct"
                checked={data.correctAnswer === opt.id}
                onChange={() => selectCorrectAnswer(opt.id)}
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
        Correct Answer (Text) <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={data.correctAnswer}
        onChange={(e) => onChange({ ...data, correctAnswer: e.target.value })}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
        placeholder="Enter the correct answer"
      />
    </div>
  )
}

function QuestionPreview({ data, type }: { data: any; type: string }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-2">Question:</p>
        <p className="text-lg text-gray-800 leading-relaxed">
          {data.questionText || (
            <em className="text-gray-400">No question text</em>
          )}
        </p>
      </div>

      {data.questionLatex && (
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
          <math-field readonly className="text-xl">
            {data.questionLatex}
          </math-field>
        </div>
      )}

      {type === 'MCQ' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500 mb-2">Options:</p>
          {data.options.map((opt: any) => (
            <div
              key={opt.id}
              className={`p-5 rounded-xl border-2 transition-all ${
                opt.id === data.correctAnswer
                  ? 'bg-green-50 border-green-400 shadow-sm'
                  : 'bg-white border-gray-200'
              }`}
            >
              <strong className="text-lg mr-3">{opt.id}.</strong>
              <span className="text-gray-800">
                {opt.answer || <em className="text-gray-400">Empty option</em>}
              </span>
              {opt.id === data.correctAnswer && (
                <span className="ml-3 text-sm text-green-600 font-semibold">
                  ✓ Correct
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {type === 'FILL_BLANK' && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">
            Correct Answer:
          </p>
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <span className="text-lg text-gray-800 font-medium">
              {data.correctAnswer || <em className="text-gray-400">—</em>}
            </span>
          </div>
        </div>
      )}

      {type === 'MATH_INPUT' && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">
            Expected Formula:
          </p>
          <div className="p-6 bg-emerald-50 rounded-xl border-2 border-emerald-200">
            <math-field readonly className="text-xl">
              {data.correctAnswerLatex || '\\phantom{empty}'}
            </math-field>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <strong>Difficulty:</strong>{' '}
          <span className="px-3 py-1 bg-gray-200 rounded-full capitalize font-medium">
            {data.difficulty}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          <strong>Marks:</strong>{' '}
          <span className="px-3 py-1 bg-gray-200 rounded-full font-medium">
            {data.marks}
          </span>
        </p>
      </div>
    </div>
  )
}

export default CreateQuestion
