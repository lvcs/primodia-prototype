import React from 'react';
import PropTypes from 'prop-types';
import * as RadixSelect from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'; // Assuming you might install @radix-ui/react-icons later

const Select = RadixSelect.Root;

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus:ring-blue-400 ${className || ''}`}
    {...props}
  >
    {children}
    <RadixSelect.Icon asChild>
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = RadixSelect.Trigger.displayName;
SelectTrigger.propTypes = { className: PropTypes.string, children: PropTypes.node };

const SelectValue = React.forwardRef(({ className, ...props }, ref) => (
  <RadixSelect.Value
    ref={ref}
    className={`text-sm ${className || ''}`}
    {...props}
  />
));
SelectValue.displayName = RadixSelect.Value.displayName;
SelectValue.propTypes = { className: PropTypes.string };

const SelectContent = React.forwardRef(({ className, children, position = 'popper', ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-300 bg-white text-gray-900 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 ${className || ''}`}
      position={position}
      {...props}
    >
      <RadixSelect.Viewport
        className={`p-1 ${position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'}`}
      >
        {children}
      </RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = RadixSelect.Content.displayName;
SelectContent.propTypes = { className: PropTypes.string, children: PropTypes.node, position: PropTypes.string };

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <RadixSelect.Label
    ref={ref}
    className={`py-1.5 pl-8 pr-2 text-sm font-semibold ${className || ''}`}
    {...props}
  />
));
SelectLabel.displayName = RadixSelect.Label.displayName;
SelectLabel.propTypes = { className: PropTypes.string };

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 ${className || ''}`}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <RadixSelect.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </RadixSelect.ItemIndicator>
    </span>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = RadixSelect.Item.displayName;
SelectItem.propTypes = { className: PropTypes.string, children: PropTypes.node };

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <RadixSelect.Separator
    ref={ref}
    className={`-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700 ${className || ''}`}
    {...props}
  />
));
SelectSeparator.displayName = RadixSelect.Separator.displayName;
SelectSeparator.propTypes = { className: PropTypes.string };

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectValue,
}; 