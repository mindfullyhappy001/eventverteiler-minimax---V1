import React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border border-gray-200 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-600',
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

const AlertDescription = React.forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription };