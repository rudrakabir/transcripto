import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-800 text-white h-full">
      <div className="p-4">
        <h1 className="text-xl font-bold">App Name</h1>
      </div>
      <nav className="mt-4">
        <ul>
          <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
            Dashboard
          </li>
          <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">
            Settings
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;