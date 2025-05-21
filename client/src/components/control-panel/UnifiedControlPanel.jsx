import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/Tabs';
import GlobeTab from './GlobeTab'; // Import the GlobeTab component
import CameraTab from './CameraTab'; // Import CameraTab
import TileDebugTab from './TileDebugTab'; // Import TileDebugTab
import CameraDebugTab from './CameraDebugTab'; // Import CameraDebugTab
import GlobeDebugTab from './GlobeDebugTab'; // Import GlobeDebugTab
// import { Button } from '@components/ui/Button';
// import { Slider } from '@components/ui/Slider';
// import { Input } from '@components/ui/Input';

function UnifiedControlPanel({ className }) {
  // TODO: Fetch or determine tab structure dynamically if needed
  const tabs = [
    { id: 'globe', label: 'Globe', Component: GlobeTab },
    { id: 'camera', label: 'Camera', Component: CameraTab },
    { id: 'tile-debug', label: 'Tile (debug)', Component: TileDebugTab },
    { id: 'camera-debug', label: 'Camera (debug)', Component: CameraDebugTab },
    { id: 'globe-debug', label: 'Globe (debug)', Component: GlobeDebugTab },
  ];

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-800 shadow-lg rounded-lg ${className || ''}`}>
      <Tabs defaultValue={tabs[0]?.id || 'globe'} className="w-full">
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