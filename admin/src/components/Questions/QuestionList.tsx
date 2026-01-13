//@ts-nocheck
import React, { useState } from 'react'
import 'https://esm.run/mathlive'

// Mock data for demonstration - replace with your actual API call
const mockQuestions = [
  {
    _id: '1',
    courseId: 'course1',
    lessonId: 'lesson1',
    chapterId: 'chapter1',
    type: 'MCQ',
    difficulty: 'MEDIUM',
    marks: 2,
    question: {
      text: 'What is the derivative of x²?',
      latex: 'f(x) = x^2',
    },
    options: [
      { id: 'A', answer: 'x' },
      { id: 'B', answer: '2x' },
      { id: 'C', answer: 'x²' },
      { id: 'D', answer: '2' },
    ],
    correctAnswer: 'B',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    _id: '2',
    courseId: 'course1',
    lessonId: 'lesson1',
    chapterId: 'chapter1',
    type: 'MATH_INPUT',
    difficulty: 'HARD',
    marks: 3,
    question: {
      text: 'Express the unit vector in the direction of vector a',
      latex: '\\vec{a} = 3\\hat{i} + 4\\hat{j}',
    },
    correctAnswer: '\\frac{3}{5}\\hat{i} + \\frac{4}{5}\\hat{j}',
    isActive: true,
    createdAt: '2024-01-14T09:20:00Z',
  },
  {
    _id: '3',
    courseId: 'course1',
    lessonId: 'lesson1',
    chapterId: 'chapter1',
    type: 'FILL_BLANK',
    difficulty: 'EASY',
    marks: 1,
    question: {
      text: 'The capital of France is _____.',
    },
    correctAnswer: 'Paris',
    isActive: true,
    createdAt: '2024-01-13T14:45:00Z',
  },
]

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<any> & {
          readonly?: boolean
        },
        any
      >
    }
  }
}

interface QuestionListProps {
  courseId?: string
  lessonId?: string
  chapterId?: string
}

function QuestionList({ courseId, lessonId, chapterId }: QuestionListProps) {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  // Filter questions based on search
  const filteredQuestions = mockQuestions.filter((q) =>
    q.question.text.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getTypeLabel = (type: string) => {
    const typeMap = {
      MCQ: 'Multiple Choice',
      FILL_BLANK: 'Fill in Blank',
      MATH_INPUT: 'Math Formula',
    }
    return typeMap[type] || type
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      EASY: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HARD: 'bg-red-100 text-red-800',
    }
    return colors[difficulty] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold">Questions</h1>
            <p className="mt-2 text-blue-100">
              Manage and view all your questions
            </p>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No questions found
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div
                    key={question._id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}
                          >
                            {question.difficulty}
                          </span>
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {getTypeLabel(question.type)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {question.marks}{' '}
                            {question.marks === 1 ? 'mark' : 'marks'}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatDate(question.createdAt)}
                          </span>
                        </div>

                        <p className="text-gray-800 text-base mb-3">
                          {question.question.text}
                        </p>

                        {question.question.latex && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <math-field
                              readonly
                              className="text-lg"
                              style={{
                                border: 'none',
                                background: 'transparent',
                              }}
                            >
                              {question.question.latex}
                            </math-field>
                          </div>
                        )}

                        {/* MCQ Options */}
                        {question.type === 'MCQ' && question.options && (
                          <div className="space-y-2 mt-4">
                            <p className="text-sm font-semibold text-gray-600 mb-2">
                              Options:
                            </p>
                            {question.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-lg border-2 ${
                                  opt.id === question.correctAnswer
                                    ? 'bg-green-50 border-green-400'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <strong className="mr-2">{opt.id}.</strong>
                                <span>{opt.answer}</span>
                                {opt.id === question.correctAnswer && (
                                  <span className="ml-2 text-sm text-green-600 font-semibold">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fill Blank Answer */}
                        {question.type === 'FILL_BLANK' && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-600 mb-2">
                              Correct Answer:
                            </p>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <span className="font-medium text-green-800">
                                {question.correctAnswer}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Math Input Answer */}
                        {question.type === 'MATH_INPUT' && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-600 mb-2">
                              Expected Formula:
                            </p>
                            <div className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                              <math-field
                                readonly
                                className="text-lg"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                }}
                              >
                                {question.correctAnswer}
                              </math-field>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setSelectedQuestion(question)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="View details"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                          title="Edit question"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this question?',
                              )
                            ) {
                              console.log('Delete:', question._id)
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete question"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination placeholder */}
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredQuestions.length} questions
              </div>
              <div className="flex gap-2">
                <button
                  disabled
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionList
