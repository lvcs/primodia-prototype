import React from 'react';
import PropTypes from 'prop-types';
import * as RadixSwitch from '@radix-ui/react-switch';

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <RadixSwitch.Root
    className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-gray-950 dark:data-[state=checked]:bg-blue-500 dark:data-[state=unchecked]:bg-gray-700 ${className || ''}`}
    {...props}
    ref={ref}
  >
    <RadixSwitch.Thumb
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:bg-gray-100`}
    />
  </RadixSwitch.Root>
));
Switch.displayName = RadixSwitch.Root.displayName;
Switch.propTypes = { className: PropTypes.string };

export { Switch }; 