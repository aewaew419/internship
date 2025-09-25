"use client";

import { lazy, Suspense, memo } from 'react';
import { LoginFormSkeleton } from './LoginFormSkeleton';

// Lazy load the main LoginForm component
const LoginFormComponent = lazy(() => 
  import('@/components/forms/LoginForm').then(module => ({
    default: module.LoginForm
  }))
);

// Lazy load the AccessibleLoginForm component
const AccessibleLoginFormComponent = lazy(() => 
  import('@/components/forms/AccessibleLoginForm').then(module => ({
    default: module.AccessibleLoginForm
  }))
);

interface LazyLoginFormProps {
  accessible?: boolean;
  onSubmit?: (data: any) => Promise<void>;
  [key: string]: any;
}

const LazyLoginFormInner = memo(({ accessible = false, ...props }: LazyLoginFormProps) => {
  const FormComponent = accessible ? AccessibleLoginFormComponent : LoginFormComponent;

  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <FormComponent {...props} />
    </Suspense>
  );
});

LazyLoginFormInner.displayName = 'LazyLoginFormInner';

export const LazyLoginForm = LazyLoginFormInner;