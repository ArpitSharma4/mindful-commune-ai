import { Outlet } from 'react-router-dom';
import {ChatSidebar} from './ChatSidebar';

export const ChatLayout = () => {
  return (
    <div className="flex h-[calc(100vh-80px)]">
      <ChatSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
