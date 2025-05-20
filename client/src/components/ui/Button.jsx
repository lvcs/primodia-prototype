import React from 'react';
import PropTypes from 'prop-types';
import * as Primitive from '@radix-ui/react-primitive';

const Button = React.forwardRef((
  { asChild, children, className, ...props }, 
  forwardedRef
) => {
  const Comp = asChild ? Primitive.Slot : 'button';
  return (
    <Comp
      ref={forwardedRef}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${className || ''}`}
      {...props}
    >
      {children}
    </Comp>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  asChild: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

export { Button }; 