import React from 'react';
import { LogOutIcon } from 'lucide-react';
interface HeaderProps {
  username?: string;
}
const Header: React.FC<HeaderProps> = ({
  username = 'User'
}) => {
  return <header className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-transparent bg-clip-text">
          Kinisi
        </h1>
      </div>
      {username && <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{username}</span>
          <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1" onClick={() => console.log('Sign out clicked')}>
            <LogOutIcon size={16} />
            <span>Sign out</span>
          </button>
        </div>}
    </header>;
};
export default Header;