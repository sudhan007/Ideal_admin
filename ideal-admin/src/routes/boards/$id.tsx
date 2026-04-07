import {
  createFileRoute,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { _axios } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowBigLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/boards/$id')({
  component: CreateBoardPage,
});

function CreateBoardPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditMode = id !== 'new';
  const stateBoard = isEditMode ? (location.state as any)?.board : null;
  const [formData, setFormData] = useState({
    boardName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goBack = () => {
    router.history.back();
  };

  useEffect(() => {
    if (isEditMode && stateBoard) {
      setFormData({
        boardName: stateBoard.boardName || '',
      });
    }
  }, [isEditMode, stateBoard]);
  const mutation = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      data.append('boardName', formData.boardName);
      if (isEditMode) {
        return _axios.put(`/boards/${id}`, data);
      } else {
        return _axios.post('/boards', data);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode
          ? 'Board updated successfully'
          : 'Board created successfully',
      );
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      goBack();
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Operation failed');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.boardName.trim()) {
      newErrors.boardName = 'Board name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      mutation.mutate();
    }
  };

  return (
    <div className="mx-auto p-2">
      <Button
        onClick={() =>
          navigate({
            to: '/boards',
            search: {
              page: 1,
              limit: 10,
              search: '',
              sortBy: 'createdAt',
              sortOrder: 'desc',
            },
          })
        }
        variant="outline"
        className="rounded-xsm hover:text-foreground text-foreground  cursor-pointer hover:bg-accent/50 my-2">
        <ArrowBigLeft className="mr-2 h-4 w-4" /> Back to Boards
      </Button>
      <Card className="rounded-xsm border-background">
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-5">
              <Label className="text-foreground" htmlFor="boardName">
                Board Name
              </Label>
              <Input
                id="boardName"
                name="boardName"
                className="text-foreground h-10 rounded-xsm"
                value={formData.boardName}
                placeholder="eg.CBSE"
                onChange={handleInputChange}
              />
              {errors.boardName && (
                <p className="text-sm text-destructive">{errors.boardName}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 col-span-full justify-end">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-xsm bg-foreground text-background hover:bg-foreground/90 hover:text-background cursor-pointer sm:w-auto">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditMode ? (
                  'Update Board'
                ) : (
                  'Create Board'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
