import React from 'react';
import PropTypes from 'prop-types';

function ControlSectionWrapper({ label, children, className }) {
  return (
    <div className={`mb-4 ${className || ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

ControlSectionWrapper.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export { ControlSectionWrapper }; 