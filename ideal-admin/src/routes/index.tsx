// routes/index.tsx  (or your home route file)

import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, BookOpen, GraduationCap, Users2, Layers } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { _axios } from '@/lib/axios';

export const Route = createFileRoute('/')({
  component: DashboardPage,
  staticData: {
    title: 'Admin Dashboard',
  },
});

interface CountsResponse {
  status: boolean;
  message: string;
  data: {
    students: number;
    courses: number;
    enrollments: number;
    staffs: number;
    batches: number;
  };
}

function DashboardPage() {
  const {
    data: counts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin'],
    queryFn: async () => {
      const res = await _axios.get(`/admin-dashboard`);
      return res.data;
    },
    staleTime: 3 * 60 * 1000,
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              {(error as Error)?.message || 'Could not load dashboard data'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Please check your connection or try again later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Students"
            value={counts?.data?.students ?? 0}
            icon={<Users className="h-6 w-6" />}
            colorClass="text-blue-600 bg-blue-100"
          />

          <StatCard
            title="Courses"
            value={counts?.data?.courses ?? 0}
            icon={<BookOpen className="h-6 w-6" />}
            colorClass="text-emerald-600 bg-emerald-100"
          />

          <StatCard
            title="Enrollments"
            value={counts?.data?.enrollments ?? 0}
            icon={<GraduationCap className="h-6 w-6" />}
            colorClass="text-amber-600 bg-amber-100"
          />

          <StatCard
            title="Mentors"
            value={counts?.data?.staffs ?? 0}
            icon={<Users2 className="h-6 w-6" />}
            colorClass="text-violet-600 bg-violet-100"
          />

          <StatCard
            title="Batches"
            value={counts?.data?.batches ?? 0}
            icon={<Layers className="h-6 w-6" />}
            colorClass="text-pink-600 bg-pink-100"
          />
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}

function StatCard({ title, value, icon, colorClass }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`rounded-full p-2 ${colorClass.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
