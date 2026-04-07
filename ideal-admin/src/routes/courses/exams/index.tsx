import CreateEditExam from '@/components/exams/createExam';
import { ExamList } from '@/components/exams/examList';
import { NotFound } from '@/components/NotFound';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/courses/exams/')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      lessonId: search.lessonId,
      courseId: search.courseId,
      chapterId: search.chapterId,
      mode: search.mode,
      examId: search.examId,
      examData: search.examData,
      page: Number(search.page ?? 1),
      search: (search.search as string) ?? '',
      limit: (search.limit as number) ?? 10,
      sortBy: (search.sortBy as string) ?? 'createdAt',
      sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
    };
  },
});

function RouteComponent() {
  const search = useSearch({ from: '/courses/exams/' });
  const {
    mode = 'list',
    chapterId,
    courseId,
    lessonId,
    examId,
    examData,
  } = search;

  if (
    (mode === 'create' || mode === 'edit') &&
    (!chapterId || !courseId || !lessonId)
  ) {
    return <NotFound />;
  }

  if (mode === 'create') {
    return (
      <CreateEditExam
        courseId={courseId}
        lessonId={lessonId}
        chapterId={chapterId}
      />
    );
  }

  if (mode === 'edit' && examId) {
    return (
      <CreateEditExam
        courseId={courseId}
        lessonId={lessonId}
        chapterId={chapterId}
        examId={examId}
        examData={examData}
      />
    );
  }

  if (mode === 'list') {
    return <ExamList />;
  }

  return <NotFound />;
}
