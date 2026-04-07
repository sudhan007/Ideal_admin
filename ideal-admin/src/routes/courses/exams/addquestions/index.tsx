import CreateMathsQuiz from '@/components/exam_Questions/Create_Question';
import ExamBulkUpload from '@/components/exam_Questions/exam_quiz_upload';
import QuestionList from '@/components/exam_Questions/QuestionList';
import { NotFound } from '@/components/NotFound';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/courses/exams/addquestions/')({
  component: RouteComponent,
  validateSearch: (search: {
    page: string;
    limit: string;
    search: string;
    examId?: string;
    mode?: 'list' | 'create' | 'edit' | 'bulk';
    questionId?: string;
  }) => search,
});

function RouteComponent() {
  const search = useSearch({ from: '/courses/exams/addquestions/' });
  const { mode = 'list', examId, questionId } = search;

  if ((mode === 'create' || mode === 'edit') && !examId) {
    return <NotFound />;
  }

  if (mode === 'create') {
    return <CreateMathsQuiz examId={examId!} />;
  }

  if (mode === 'bulk') {
    return <ExamBulkUpload examId={examId!} />;
  }

  // Edit mode
  if (mode === 'edit' && questionId) {
    return (
      <CreateMathsQuiz
        examId={examId!}
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
