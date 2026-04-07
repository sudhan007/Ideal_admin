import {
  ChevronLeftCircle,
  Home,
  Library,
  User,
  Menu,
  Moon,
  Sun,
  GraduationCap,
  Layers,
  Users,
  Video,
  Bell,
  LayoutDashboard,
  LogOut,
  Landmark,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { _axios } from '@/lib/axios';

interface Link {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const links: Link[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Courses',
    href: '/courses',
    icon: GraduationCap,
  },
  {
    name: 'Mentors',
    href: '/mentors',
    icon: User,
  },
  {
    name: 'Grades',
    href: '/grades',
    icon: Layers,
  },
  {
    name: 'Board of Education',
    href: '/boards',
    icon: LayoutDashboard,
  },
  {
    name: 'Students',
    href: '/students',
    icon: Users,
  },
  {
    name: 'Batches',
    href: '/batches',
    icon: Library,
  },
  {
    name: 'Notification',
    href: '/notification',
    icon: Bell,
  },
  {
    name: 'Demo Courses',
    href: '/demo',
    icon: Video,
  },
  {
    name: 'Question Bank',
    href: '/questionbank',
    icon: Landmark,
  },
];

export default function Layout({ isDarkMode, setIsDarkMode }: any) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isIconMode, setIsIconMode] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await _axios.post('/admin-auth/logout');
      return res.data;
    },
    onSuccess: () => {
      toast.success('Logged out successfully');
      navigate({ to: '/login' });
    },
    onError: () => {
      toast.error('Logout failed. Please try again.');
    },
  });

  const handleLogOut = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    setMounted(true);

    const savedSidebarMode = localStorage.getItem('sidebarMode');
    if (savedSidebarMode === 'icon') {
      setIsIconMode(true);
    } else {
      setIsIconMode(false);
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setIsDarkMode(true);
    }

    setIsLargeScreen(window.innerWidth >= 1024);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
  };

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mounted && isLargeScreen) {
      localStorage.setItem('sidebarMode', isIconMode ? 'icon' : 'default');
    }
  }, [isIconMode, isLargeScreen, mounted]);

  const toggleSidebar = () => {
    if (isLargeScreen) {
      setIsIconMode(!isIconMode);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleMenuClick = (path: string) => {
    navigate({ to: path });
    setActiveMenu(path);
    setIsOpen(false);
  };

  useEffect(() => {
    const activeMenu = location.pathname.split('/')[1]
      ? `/${location.pathname.split('/')[1]}`
      : '/';
    setActiveMenu(activeMenu);
  }, [location.pathname]);

  return (
    <main>
      <aside
        className={`z-50
          min-h-screen bg-sidebar text-sidebar-foreground transform fixed transition-all duration-300
          overflow-hidden
          ${
            isLargeScreen
              ? isIconMode
                ? 'w-20'
                : 'w-72'
              : isOpen
                ? 'w-72 opacity-100 pointer-events-auto'
                : 'w-0 p-0 pointer-events-none -translate-x-72 duration-500'
          }
        `}>
        <ul className="flex flex-col gap-0 relative">
          <li
            className={`flex items-center absolute top-2 right-0 p-2 m-1 gap-3 rounded-sm cursor-pointer ${isIconMode && isLargeScreen ? 'justify-center' : ''}`}>
            {!isLargeScreen && (
              <ChevronLeftCircle
                className="right-2 cursor-pointer"
                onClick={toggleSidebar}
              />
            )}
            {isLargeScreen && !isIconMode && (
              <ChevronLeftCircle
                className="right-2 cursor-pointer"
                onClick={toggleSidebar}
              />
            )}
          </li>

          <li
            className={`flex items-center p-2 m-1 gap-3 rounded-sm min-h-16 cursor-pointer ${isIconMode && isLargeScreen ? 'justify-center' : ''}`}>
            <span>
              {!isIconMode && <img src="/logo.png" alt="" className="" />}
              {isIconMode && isLargeScreen && (
                <Menu
                  className={`cursor-pointer ${isIconMode ? 'top-12 right-0' : ''}`}
                  onClick={toggleSidebar}
                />
              )}
            </span>
          </li>

          {links.map((link, index) =>
            isIconMode ? (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <li
                    onClick={() => handleMenuClick(link.href)}
                    className={`flex items-center p-2 m-1 gap-3 rounded-sm cursor-pointer hover:bg-background hover:text-sidebar-foreground ${isIconMode && isLargeScreen ? 'justify-center' : ''} ${activeMenu === link.href ? 'bg-background text-sidebar-foreground' : ''}`}>
                    <span>
                      <link.icon className="w-6 h-6" />
                    </span>
                    {((!isLargeScreen && isOpen) ||
                      (isLargeScreen && !isIconMode)) && (
                      <span className="text-lg">{link.name}</span>
                    )}
                  </li>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{link.name}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <li
                key={index}
                onClick={() => handleMenuClick(link.href)}
                className={`flex items-center p-2 m-1 gap-3 rounded-sm cursor-pointer hover:bg-background hover:text-sidebar-foreground ${isIconMode && isLargeScreen ? 'justify-center' : ''} ${activeMenu === link.href ? 'bg-black/90 text-white' : ''}`}>
                <span>
                  <link.icon className="w-6 h-6" />
                </span>
                {((!isLargeScreen && isOpen) ||
                  (isLargeScreen && !isIconMode)) && (
                  <span className="text-lg">{link.name}</span>
                )}
              </li>
            ),
          )}
        </ul>
      </aside>

      <header
        className={`h-16 z-45 fixed flex justify-between transform transition-all duration-300 bg-sidebar text-sidebar-foreground p-2 ${isLargeScreen && !isIconMode ? 'ml-72 min-w-[calc(100vw-18rem)]' : isLargeScreen ? 'ml-20 min-w-[calc(100vw-5rem)]' : 'min-w-full'}`}>
        <div className="h-full flex items-center text-primary gap-3">
          {!isLargeScreen && (
            <Menu className="cursor-pointer" onClick={toggleSidebar} />
          )}
          <h1 className="text-3xl capitalize text-foreground">
            {location.pathname.split('/')[1] !== ''
              ? location.pathname.split('/')[1]
              : 'Dashboard'}
          </h1>
        </div>

        <div className="h-full flex items-center mr-5">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
                disabled={logoutMutation.isPending}>
                <LogOut className="w-6 h-6" />
                <span>
                  {logoutMutation.isPending ? 'Logging out...' : 'LogOut'}
                </span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out? You will need to sign in
                  again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogOut}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer">
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main
        className={`relative p-2 pt-18 ${isLargeScreen && !isIconMode ? 'ml-72' : isLargeScreen ? 'ml-20' : ''}`}>
        <Outlet />
        <Toaster position="top-right" />
      </main>
    </main>
  );
}
