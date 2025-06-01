import React from 'react';
import PropTypes from 'prop-types';
import * as RadixTabs from '@radix-ui/react-tabs';

const Tabs = React.forwardRef(({ className, ...props }, ref) => (
  <RadixTabs.Root
    ref={ref}
    className={`flex flex-col ${className || ''}`}
    {...props}
  />
));
Tabs.displayName = RadixTabs.Root.displayName;
Tabs.propTypes = { className: PropTypes.string };

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 dark:bg-gray-800 dark:text-gray-400 ${className || ''}`}
    {...props}
  />
));
TabsList.displayName = RadixTabs.List.displayName;
TabsList.propTypes = { className: PropTypes.string };

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:ring-offset-gray-950 dark:focus-visible:ring-blue-400 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-50 ${className || ''}`}
    {...props}
  />
));
TabsTrigger.displayName = RadixTabs.Trigger.displayName;
TabsTrigger.propTypes = { className: PropTypes.string };

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-400 ${className || ''}`}
    {...props}
  />
));
TabsContent.displayName = RadixTabs.Content.displayName;
TabsContent.propTypes = { className: PropTypes.string };

export { Tabs, TabsList, TabsTrigger, TabsContent }; 