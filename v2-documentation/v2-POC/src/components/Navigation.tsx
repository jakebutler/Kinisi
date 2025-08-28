import React from 'react';
import { CalendarIcon, ClipboardIcon, ActivityIcon } from 'lucide-react';
interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab
}) => {
  const tabs = [{
    id: 'program',
    label: 'Fitness Program',
    icon: CalendarIcon
  }, {
    id: 'assessment',
    label: 'Personalized Assessment',
    icon: ActivityIcon
  }, {
    id: 'survey',
    label: 'Intake Survey',
    icon: ClipboardIcon
  }];
  return <div className="w-full flex justify-between items-center gap-3">
      {tabs.map(tab => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return <div key={tab.id} className={`bg-white rounded-lg shadow-md p-3 flex-1 text-center hover:shadow-lg transition-shadow ${isActive ? 'ring-2 ring-[rgb(204,136,153)]' : ''}`}>
            <button onClick={() => setActiveTab(tab.id)} className="w-full h-full flex flex-col justify-center items-center text-sm font-medium text-gray-700 hover:text-[rgb(204,136,153)] transition-colors" style={{
          fontFamily: 'Nunito, "Nunito Fallback", sans-serif'
        }}>
              <Icon size={18} className={isActive ? 'text-[rgb(204,136,153)]' : ''} />
              <span className={`mt-1 ${isActive ? 'text-[rgb(204,136,153)]' : ''}`}>
                {tab.label}
              </span>
            </button>
          </div>;
    })}
    </div>;
};
export default Navigation;