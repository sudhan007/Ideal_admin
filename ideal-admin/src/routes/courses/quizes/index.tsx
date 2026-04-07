import { NotFound } from '@/components/NotFound';
import CreateMathsQuiz from '@/components/Questions/Create_Question';
import QuestionList from '@/components/Questions/QuestionList';
import QuizBulkUpload from '@/components/Questions/quiz_bulk_upload';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/courses/quizes/')({
  component: RouteComponent,
  validateSearch: (search: {
    page: Number;
    limit: Number;
    lessonId?: string;
    courseId?: string;
    chapterId?: string;
    mode?: 'list' | 'create' | 'edit' | 'bulk';
    questionId?: string;
  }) => search,
});

function RouteComponent() {
  const search = useSearch({ from: '/courses/quizes/' });
  const { mode = 'list', chapterId, courseId, lessonId, questionId } = search;

  // Redirect to NotFound if required params are missing for create/edit modes
  if (
    (mode === 'create' || mode === 'edit') &&
    (!chapterId || !courseId || !lessonId)
  ) {
    return <NotFound />;
  }

  // Create mode
  if (mode === 'create') {
    return (
      <CreateMathsQuiz
        courseId={courseId!}
        lessonId={lessonId!}
        chapterId={chapterId!}
      />
    );
  }

  if (mode === 'bulk') {
    return (
      <QuizBulkUpload
        courseId={courseId!}
        lessonId={lessonId!}
        chapterId={chapterId!}
      />
    );
  }

  // Edit mode
  if (mode === 'edit' && questionId) {
    return (
      <CreateMathsQuiz
        courseId={courseId!}
        lessonId={lessonId!}
        chapterId={chapterId!}
        questionId={questionId}
        isEditMode={true}
      />
    );
  }

  if (mode === 'list') {
    return <QuestionList />;
  }

  return <NotFound />;
}
