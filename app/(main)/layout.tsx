'use client';

import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/auth';

import { Spinner } from '@/components/spinner';
import Navigation from '@/components/main/navigation';
import { SearchCommand } from '@/components/search-command';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (!user) {
    return redirect('/');
  }

  return (
    <div className='h-full flex dark:bg-[#1F1F1F]'>
      <Navigation user={user} />
      <main className='flex-1 h-full overflow-y-auto'>
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
