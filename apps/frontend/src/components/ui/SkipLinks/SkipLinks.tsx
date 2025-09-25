"use client";

import { useSkipLinks, useHighContrast } from "@/hooks/useAccessibility";
import { cn } from "@/lib/utils";
import { SCREEN_READER_MESSAGES } from "@/lib/accessibility";

export interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
    onClick?: () => void;
  }>;
}

const defaultLinks = [
  {
    href: "#main-content",
    label: SCREEN_READER_MESSAGES.NAVIGATION.SKIP_TO_CONTENT,
  },
  {
    href: "#main-navigation", 
    label: SCREEN_READER_MESSAGES.NAVIGATION.SKIP_TO_NAVIGATION,
  },
];

export const SkipLinks = ({ links = defaultLinks }: SkipLinksProps) => {
  const { skipToContent, skipToNavigation } = useSkipLinks();
  const isHighContrast = useHighContrast();

  const handleSkipClick = (href: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
      return;
    }

    // Default skip link behavior
    switch (href) {
      case "#main-content":
        skipToContent();
        break;
      case "#main-navigation":
        skipToNavigation();
        break;
      default:
        // Try to find and focus the target element
        const target = document.querySelector(href) as HTMLElement;
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };

  return (
    <div className="sr-only focus-within:not-sr-only">
      <nav 
        aria-label="Skip navigation links"
        className={cn(
          "fixed top-0 left-0 z-[9999]",
          "bg-white border-2 border-gray-300 rounded-br-lg shadow-lg",
          "p-2 space-y-1",
          isHighContrast && [
            "bg-white border-4 border-black",
            "shadow-2xl"
          ]
        )}
      >
        {links.map((link, index) => (
          <button
            key={index}
            type="button"
            className={cn(
              "block w-full text-left px-3 py-2 text-sm font-medium",
              "text-primary-600 hover:text-primary-800",
              "bg-white hover:bg-primary-50",
              "border border-primary-300 rounded",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
              "transition-colors duration-200",
              "min-w-[200px]",
              isHighContrast && [
                "text-blue-800 hover:text-blue-900",
                "bg-white hover:bg-blue-50",
                "border-2 border-blue-600 hover:border-blue-800",
                "focus:ring-4 focus:ring-blue-300 focus:border-blue-900"
              ]
            )}
            onClick={() => handleSkipClick(link.href, link.onClick)}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </div>
  );
};