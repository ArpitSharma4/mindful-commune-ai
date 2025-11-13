import { Outlet } from 'react-router-dom';
import {ChatSidebar} from './ChatSidebar';

export const ChatLayout = () => {
  return (
        <div className="flex h-screen bg-background">
      <ChatSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
