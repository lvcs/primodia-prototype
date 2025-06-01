import React from 'react';
import PropTypes from 'prop-types';
import * as RadixSlider from '@radix-ui/react-slider';

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <RadixSlider.Root
    ref={ref}
    className={`relative flex w-full touch-none select-none items-center ${className || ''}`}
    {...props}
  >
    <RadixSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
      <RadixSlider.Range className="absolute h-full bg-blue-500 dark:bg-blue-400" />
    </RadixSlider.Track>
    <RadixSlider.Thumb className="block h-5 w-5 rounded-full border-2 border-blue-500 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-blue-400 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-400" />
  </RadixSlider.Root>
));

Slider.displayName = RadixSlider.Root.displayName;

Slider.propTypes = {
  className: PropTypes.string,
  // Add other RadixSlider.Root prop types as needed
  // Example: value, defaultValue, onValueChange, disabled, min, max, step, etc.
};

export { Slider }; 