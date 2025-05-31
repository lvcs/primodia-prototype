import PropTypes from 'prop-types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ui/components/Tabs';
import GameTab from './GameTab';
import PlanetTab from './PlanetTab'; // Import the PlanetTab component
import CameraTab from './CameraTab'; // Import CameraTab
import TileDebugTab from './TileDebugTab'; // Import TileDebugTab

function UnifiedControlPanel({ className }) {
  const tabs = [
    { id: 'game', label: 'Game', Component: GameTab },
    { id: 'camera', label: 'Camera', Component: CameraTab },
    { id: 'planet', label: 'Planet', Component: PlanetTab },  
    { id: 'tile-debug', label: 'Tile (debug)', Component: TileDebugTab },
  ];

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg ${className || ''}`}>
      <Tabs defaultValue={tabs[0]?.id || 'planet'} className="w-full">
        <TabsList aria-label="Manage your game controls">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.Component ? <tab.Component /> : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {tab.content}
              </p>
            )}
            {/* Example of using a button inside a tab */}
            {/* {tab.id === 'camera' && <Button className='mt-2'>Reset View</Button>} */}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

UnifiedControlPanel.propTypes = {
  className: PropTypes.string,
};

export default UnifiedControlPanel; 