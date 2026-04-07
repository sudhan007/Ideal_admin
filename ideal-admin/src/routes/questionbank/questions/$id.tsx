import {
  createFileRoute,
  useParams,
  useSearch,
  useNavigate,
} from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpDown,
  Eye,
  Send,
  X,
  CheckSquare,
  Square,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@mantine/hooks';
import { CourseTableSkeleton } from '@/components/TableSkeleton';
import { Pagination } from '@/components/Pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner'; // or your toast lib
import MathPreview from '@/components/MathPreview';

// ─── Types ────────────────────────────────────────────────────────────────────

type Question = {
  _id: string;
  type: 'MCQ' | 'MULTI_SELECT' | 'TRUE_FALSE' | string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionModel: 'PRE' | 'POST';
  question: { text: string; latex: string };
  correctAnswer: string;
  options?: Array<{ id: string; answer: string; type: string }>;
  courseName: string;
  chapterName: string;
  lessonName: string;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    questions: Question[];
    lessonStats: any | null;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
};

type Exam = {
  _id: string;
  examName: string;
};

type Chapter = {
  _id: string;
  chapterName: string;
  order: number;
};

type Lesson = {
  _id: string;
  lessonName: string;
  order: number;
};

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/questionbank/questions/$id')({
  component: QuestionsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    limit: Number(search.limit ?? 10),
    search: (search.search as string) ?? '',
    model: (search.model as string) ?? '',
    chapterId: (search.chapterId as string) ?? '',
    lessonId: (search.lessonId as string) ?? '',
    sortBy:
      (search.sortBy as 'createdAt' | 'difficulty' | 'type') ?? 'createdAt',
    sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
  }),
});

// ─── Difficulty badge colours ──────────────────────────────────────────────────

const difficultyStyles: Record<string, string> = {
  EASY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HARD: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Send-to-Exams Modal ───────────────────────────────────────────────────────

function SendToExamsModal({
  open,
  onClose,
  selectedCount,
  selectedIds,
  courseId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedIds: string[];
  courseId: string;
  onSuccess: () => void;
}) {
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  const { data: examsData, isLoading: examsLoading } = useQuery<{
    ok: boolean;
    data: Exam[];
  }>({
    queryKey: ['exam-dropdown', courseId],
    queryFn: async () => {
      const res = await _axios.get(`/exam/dropdown?courseId=${courseId}`);
      return res.data;
    },
    enabled: open,
  });

  const exams = examsData?.data ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await _axios.post('/question-bank/send-to-exams', {
        examIds: selectedExamIds,
        questionIds: selectedIds,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        `${selectedCount} question(s) sent to ${selectedExamIds.length} exam(s)`,
      );
      setSelectedExamIds([]);
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error('Failed to send questions. Please try again.');
    },
  });

  const toggleExam = (id: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelectedExamIds(
      selectedExamIds.length === exams.length ? [] : exams.map((e) => e._id),
    );
  };

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ border: '1px solid #e5e7eb' }}>
        {/* Coloured top strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              Send to Exams
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-medium text-violet-600">
                {selectedCount}
              </span>{' '}
              question{selectedCount !== 1 ? 's' : ''} selected · choose target
              exam(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Exam list */}
        <div
          className="px-6 py-4"
          style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {examsLoading ? (
            <div className="flex items-center justify-center h-24 gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading exams…</span>
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400 gap-1">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">No exams found for this course</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Select all */}
              <button
                onClick={toggleAll}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left group">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    selectedExamIds.length === exams.length
                      ? 'bg-violet-600 border-violet-600'
                      : 'border-gray-300 group-hover:border-violet-400'
                  }`}>
                  {selectedExamIds.length === exams.length && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 10 8">
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {selectedExamIds.length === exams.length
                    ? 'Deselect all'
                    : 'Select all exams'}
                </span>
              </button>

              <div className="border-t border-gray-100 my-1" />

              {exams.map((exam) => {
                const checked = selectedExamIds.includes(exam._id);
                return (
                  <button
                    key={exam._id}
                    onClick={() => toggleExam(exam._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                      checked
                        ? 'bg-violet-50 border border-violet-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
                        checked
                          ? 'bg-violet-600 border-violet-600'
                          : 'border-gray-300'
                      }`}>
                      {checked && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 10 8">
                          <path
                            d="M1 4l2.5 2.5L9 1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        checked ? 'text-violet-700' : 'text-gray-700'
                      }`}>
                      {exam.examName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50">
          <span className="text-xs text-gray-400">
            {selectedExamIds.length} exam
            {selectedExamIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-200 transition-colors bg-gray-100">
              Cancel
            </button>
            <button
              disabled={selectedExamIds.length === 0 || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5">
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function HierarchyFilters({
  courseId,
  chapterId,
  lessonId,
  difficulty,
  model,
  onChange,
}: {
  courseId: string;
  chapterId: string;
  lessonId: string;
  // difficulty: string;
  // model: string;
  onChange: (
    patch: Partial<{
      chapterId: string;
      lessonId: string;
      // difficulty: string;
      // model: string;
      page: number;
    }>,
  ) => void;
}) {
  // Fetch chapters for this course
  const { data: chaptersData, isLoading: chaptersLoading } = useQuery<{
    chapters: Chapter[];
  }>({
    queryKey: ['chapters-dropdown', courseId],
    queryFn: async () => {
      const res = await _axios.get(`/chapters/dropdown/${courseId}`);
      return res.data;
    },
    enabled: !!courseId,
  });

  // Fetch lessons only when a chapter is selected
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery<{
    lessons: Lesson[];
  }>({
    queryKey: ['lessons-dropdown', chapterId],
    queryFn: async () => {
      const res = await _axios.get(`/lessons/dropdown/${chapterId}`);
      return res.data;
    },
    enabled: !!chapterId,
  });

  const chapters = chaptersData?.chapters ?? [];
  const lessons = lessonsData?.lessons ?? [];

  const activeCount = [chapterId, lessonId, difficulty, model].filter(
    Boolean,
  ).length;

  return (
    <div className="mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Filters
          </span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() =>
              onChange({
                chapterId: '',
                lessonId: '',
                // difficulty: '',
                // model: '',
                page: 1,
              })
            }
            className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 transition-colors">
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Chapter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Chapter</label>
          <div className="relative">
            <select
              value={chapterId}
              disabled={chaptersLoading}
              onChange={(e) =>
                onChange({ chapterId: e.target.value, lessonId: '', page: 1 })
              }
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 disabled:opacity-50 transition-colors">
              <option value="">All chapters</option>
              {chapters.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.chapterName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              {chaptersLoading ? (
                <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />
              ) : (
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Lesson */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Lesson</label>
          <div className="relative">
            <select
              value={lessonId}
              disabled={!chapterId || lessonsLoading}
              onChange={(e) => onChange({ lessonId: e.target.value, page: 1 })}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors">
              <option value="">All lessons</option>
              {lessons.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.lessonName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              {lessonsLoading ? (
                <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />
              ) : (
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          </div>
          {!chapterId && (
            <p className="text-[10px] text-gray-400">Select a chapter first</p>
          )}
        </div>

        {/* Difficulty */}
        {/* <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Difficulty
          </label>
          <div className="relative">
            <select
              value={difficulty}
              onChange={(e) =>
                onChange({ difficulty: e.target.value, page: 1 })
              }
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 transition-colors">
              <option value="">All levels</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg
                className="h-3.5 w-3.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Model</label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => onChange({ model: e.target.value, page: 1 })}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 transition-colors">
              <option value="">PRE & POST</option>
              <option value="PRE">PRE</option>
              <option value="POST">POST</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg
                className="h-3.5 w-3.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div> */}
      </div>

      {/* Active filter pills */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-200">
          {chapterId && chaptersData && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
              {chaptersData.chapters.find((c) => c._id === chapterId)
                ?.chapterName ?? chapterId}
              <button
                onClick={() =>
                  onChange({ chapterId: '', lessonId: '', page: 1 })
                }
                className="hover:text-violet-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {lessonId && lessonsData && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
              {lessonsData.lessons.find((l) => l._id === lessonId)
                ?.lessonName ?? lessonId}
              <button
                onClick={() => onChange({ lessonId: '', page: 1 })}
                className="hover:text-violet-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {difficulty && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
              <button
                onClick={() => onChange({ difficulty: '', page: 1 })}
                className="hover:text-amber-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {model && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              {model}
              <button
                onClick={() => onChange({ model: '', page: 1 })}
                className="hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
// ─── Main Page ────────────────────────────────────────────────────────────────

function QuestionsPage() {
  const { id: courseId } = useParams({ from: '/questionbank/questions/$id' });
  const navigate = useNavigate();
  const search = useSearch({ from: '/questionbank/questions/$id' });

  const {
    page = 1,
    limit = 1,
    search: searchTerm = '',
    model = '',
    chapterId = '',
    lessonId = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = search;

  const [sorting, setSorting] = useState<SortingState>([
    { id: sortBy, desc: sortOrder === 'desc' },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [debouncedSearch] = useDebouncedValue(searchTerm, 500);

  // ── Cross-page selection: stored as a Set of question IDs ──────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: [
      'course-questions',
      courseId,
      {
        page,
        limit,
        search: debouncedSearch,
        model,
        sortBy,
        sortOrder,
        chapterId,
        lessonId,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        courseId: String(courseId),
        search: debouncedSearch,
        model,
        sortBy,
        sortOrder,
      });
      if (chapterId) params.set('chapterId', chapterId);
      if (lessonId) params.set('lessonId', lessonId);
      const res = await _axios.get(`/question/all?${params}`);
      return res.data;
    },
  });

  const questions = data?.data.questions ?? [];
  const totalPages = data?.data.pagination.totalPages ?? 1;
  const totalItems = data?.data.pagination.total ?? 0;
  const itemsPerPage = data?.data.pagination.limit ?? limit;

  // ── Selection helpers ──────────────────────────────────────────────────────

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const currentPageIds = questions.map((q) => q._id);

  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id));

  const someCurrentPageSelected =
    !allCurrentPageSelected && currentPageIds.some((id) => selectedIds.has(id));

  const toggleCurrentPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentPageSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Navigate helpers ───────────────────────────────────────────────────────

  const handlePageChange = (newPage: number) =>
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });

  const handleLimitChange = (newLimit: number) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, limit: newLimit }) });

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: ColumnDef<Question>[] = [
    {
      id: 'select',
      header: () => (
        <button
          onClick={toggleCurrentPage}
          className="flex items-center justify-center w-5 h-5"
          title={
            allCurrentPageSelected ? 'Deselect this page' : 'Select this page'
          }>
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              allCurrentPageSelected
                ? 'bg-violet-600 border-violet-600'
                : someCurrentPageSelected
                  ? 'bg-violet-200 border-violet-400'
                  : 'border-gray-300 hover:border-violet-400'
            }`}>
            {allCurrentPageSelected && (
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="none"
                viewBox="0 0 10 8">
                <path
                  d="M1 4l2.5 2.5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {someCurrentPageSelected && !allCurrentPageSelected && (
              <div className="w-2 h-0.5 bg-violet-600 rounded" />
            )}
          </div>
        </button>
      ),
      cell: ({ row }) => {
        const checked = isSelected(row.original._id);
        return (
          <button
            onClick={() => toggleOne(row.original._id)}
            className="flex items-center justify-center w-5 h-5">
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                checked
                  ? 'bg-violet-600 border-violet-600'
                  : 'border-gray-300 hover:border-violet-400'
              }`}>
              {checked && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 10 8">
                  <path
                    d="M1 4l2.5 2.5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </button>
        );
      },
    },
    {
      accessorKey: 'question.latex',
      header: 'Question',
      cell: ({ row }) => {
        const q = row.original.question;
        return (
          <MathPreview text={q.text} latex={q.latex || ''} />
          // <div className="max-w-xs truncate font-medium text-gray-800">
          //   { || q.text || '(empty question)'}
          // </div>
        );
      },
    },
    {
      accessorKey: 'chapterName',
      header: 'Chapter Name',
      cell: ({ row }) => {
        return (
          <div className="max-w-md truncate font-medium">
            {row.original.chapterName}
          </div>
        );
      },
    },
    {
      accessorKey: 'lessonName',
      header: 'Lesson Name',
      cell: ({ row }) => {
        return (
          <div className="max-w-md truncate font-medium">
            {row.original.lessonName}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-medium">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'difficulty',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Difficulty
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            difficultyStyles[row.original.difficulty] ?? ''
          }`}>
          {row.original.difficulty.charAt(0) +
            row.original.difficulty.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: 'questionModel',
      header: 'Model',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.questionModel === 'PRE' ? 'default' : 'secondary'
          }
          className="text-xs">
          {row.original.questionModel}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
    },
    // {
    //   id: 'actions',
    //   header: 'Actions',
    //   cell: ({ row }) => (
    //     <Tooltip>
    //       <TooltipTrigger asChild>
    //         <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-gray-400 hover:text-gray-700">
    //           <Eye className="h-4 w-4" />
    //         </button>
    //       </TooltipTrigger>
    //       <TooltipContent>
    //         <p>View Question</p>
    //       </TooltipContent>
    //     </Tooltip>
    //   ),
    // },
  ];

  const table = useReactTable({
    data: questions,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnVisibility },
  });

  const selectedCount = selectedIds.size;

  return (
    <div className="mx-auto p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Questions
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Course : {questions[0]?.courseName || ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search questions…"
            value={searchTerm}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }),
                replace: true,
              })
            }
            className="w-full sm:w-72"
          />
        </div>
      </div>

      <HierarchyFilters
        courseId={courseId}
        chapterId={chapterId}
        lessonId={lessonId}
        onChange={(patch) =>
          navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
        }
      />

      {/* ── Selection Toolbar (appears when something is selected) ──────────── */}
      {selectedCount > 0 && (
        <div
          className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl border"
          style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            borderColor: '#c4b5fd',
          }}>
          <div className="flex items-center gap-2.5">
            {/* <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-white" />
            </div> */}
            <span className="text-sm font-semibold text-violet-800">
              {selectedCount} question{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <span className="text-xs text-violet-500">(across all pages)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-100 rounded-lg transition-colors">
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-sm">
              <Send className="h-3.5 w-3.5" />
              Send to Exams
            </button>
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <CourseTableSkeleton />
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground text-sm">
                    No questions found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const selected = isSelected(row.original._id);
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        selected
                          ? 'bg-violet-50/60 hover:bg-violet-50'
                          : 'hover:bg-gray-50/70'
                      }`}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-gray-700">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        className="p-6 bg-gray-50 border-t"
      />

      {/* ── Send to Exams Modal ─────────────────────────────────────────────── */}
      <SendToExamsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedCount={selectedCount}
        selectedIds={Array.from(selectedIds)}
        courseId={courseId}
        onSuccess={clearSelection}
      />
    </div>
  );
}
