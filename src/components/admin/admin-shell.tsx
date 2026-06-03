import { AdminSidebar } from "./admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 bg-mesh">
        <div className="px-6 lg:px-10 py-8 space-y-6 max-w-[1600px] mx-auto">{children}</div>
      </div>
    </div>
  );
}
