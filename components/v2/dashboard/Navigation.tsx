import React from 'react';
import { Calendar, Activity, ClipboardList } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    {
      id: 'program',
      label: 'Fitness Program',
      icon: Calendar
    },
    {
      id: 'assessment',
      label: 'Assessment',
      icon: Activity
    },
    {
      id: 'survey',
      label: 'Survey',
      icon: ClipboardList
    }
  ];

  return (
    <div className="w-full flex justify-between items-center gap-3 mb-6">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <div 
            key={tab.id} 
            className={`bg-white rounded-lg shadow-md p-3 flex-1 text-center hover:shadow-lg transition-all duration-200 cursor-pointer ${
              isActive ? 'ring-2 ring-[var(--brand-puce)] shadow-lg' : ''
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="w-full h-full flex flex-col justify-center items-center text-sm font-medium text-gray-700 hover:text-[var(--brand-puce)] transition-colors">
              <Icon 
                size={18} 
                className={isActive ? 'text-[var(--brand-puce)]' : ''} 
              />
              <span className={`mt-1 ${isActive ? 'text-[var(--brand-puce)]' : ''}`}>
                {tab.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Navigation;
export { Navigation };
