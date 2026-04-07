import { NotFound } from '@/components/NotFound';
import CreateDemoMathsQuiz from '@/components/demo_Questions/Create_Question';
import QuestionList from '@/components/demo_Questions/QuestionList';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/demo/addquestion/')({
  component: RouteComponent,
  validateSearch: (search: {
    page: string;
    limit: string;
    search: string;
    demoCourseId?: string;
    mode?: 'list' | 'create' | 'edit';
    questionId?: string;
  }) => search,
});

function RouteComponent() {
  const search = useSearch({ from: '/demo/addquestion/' });
  const { mode = 'list', demoCourseId, questionId } = search;

  if ((mode === 'create' || mode === 'edit') && !demoCourseId) {
    return <NotFound />;
  }

  if (mode === 'create') {
    return <CreateDemoMathsQuiz demoCourseId={demoCourseId!} />;
  }

  // Edit mode
  if (mode === 'edit' && questionId) {
    return (
      <CreateDemoMathsQuiz
        demoCourseId={demoCourseId!}
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
