import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Панель керування — Gen',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // If on login route, we let the page render without the admin sidebar/header
  return (
    <div className="min-h-screen bg-graphite-100 flex flex-col md:flex-row">
      {session ? (
        <>
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader adminName={session.name} />
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
              {children}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          {children}
        </div>
      )}
    </div>
  );
}
