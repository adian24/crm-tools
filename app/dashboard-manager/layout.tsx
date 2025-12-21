import ManagerDashboardLayout from '@/components/ManagerDashboardLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagerDashboardLayout>{children}</ManagerDashboardLayout>;
}