import { NotFound } from '@/components/NotFound';
import CreateMathsQuiz from '@/components/Questions/Create_Question';
import QuestionList from '@/components/Questions/QuestionList';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/questions/')({
  component: RouteComponent,

  validateSearch: (search: {
    page: string;
    limit: string;
    search: string;
    lessonId?: string;
    courseId?: string;
    chapterId?: string;
    mode?: 'list' | 'create' | 'edit';
    questionId?: string;
  }) => search,
});

function RouteComponent() {
  const search = useSearch({ from: '/questions/' });
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

  // List mode (default)
  if (mode === 'list') {
    return <QuestionList />;
  }

  return <NotFound />;
}
