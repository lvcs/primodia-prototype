import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ children, className, ...props }) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export { Button }; 