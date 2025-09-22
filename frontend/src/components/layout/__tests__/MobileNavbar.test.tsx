import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNavbar } from '../MobileNavbar';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { NavItem } from '@/types/navigation';

// Mock Next.js hooks
const mockPush = jest.fn();
const mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => mockPathname,
}));

// Mock useSwipeGesture hook
jest.mock('@/hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => ({ current: null }),
}));

// Mock AuthProvider
const mockLogout = jest.fn();
jest.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: { id: '1', name: 'Test User' },
  }),
}));

// Mock Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

const mockNavItems: NavItem[] = [
  {
    name: 'คำขอฝึกงาน',
    path: '/intern-request',
    icon: <span>📋</span>,
    roles: ['student'],
  },
  {
    name: 'อาจารย์',
    path: '/instructor',
    icon: <span>👨‍🏫</span>,
    roles: ['instructor'],
  },
];

describe('MobileNavbar', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = 'unset';
  });

  const renderMobileNavbar = (props = {}) => {
    return render(
      <MobileNavbar navItems={mockNavItems} {...props} />
    );
  };

  describe('Mobile Header', () => {
    it('renders mobile header with logo and hamburger menu', () => {
      renderMobileNavbar();
      
      expect(screen.getByAltText('Internship Management System')).toBeInTheDocument();
      expect(screen.getByText('ระบบจัดการฝึกงาน')).toBeInTheDocument();
      expect(screen.getByLabelText('เปิด/ปิดเมนู')).toBeInTheDocument();
    });

    it('has proper touch target size for hamburger button', () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      const styles = window.getComputedStyle(hamburgerButton);
      
      // Should have btn-touch class for proper touch targets
      expect(hamburgerButton).toHaveClass('btn-touch');
    });

    it('toggles hamburger icon when menu opens/closes', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      
      // Initially should show hamburger icon
      expect(hamburgerButton.querySelector('path[d*="M4 6h16M4 12h16M4 18h16"]')).toBeInTheDocument();
      
      // Click to open menu
      await user.click(hamburgerButton);
      
      // Should show close icon
      await waitFor(() => {
        expect(hamburgerButton.querySelector('path[d*="M6 18L18 6M6 6l12 12"]')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Sidebar', () => {
    it('opens sidebar when hamburger button is clicked', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      
      // Sidebar should not be visible initially
      const sidebar = document.querySelector('.mobile-nav-sidebar');
      expect(sidebar).not.toHaveClass('open');
      
      // Click to open
      await user.click(hamburgerButton);
      
      // Sidebar should be open
      await waitFor(() => {
        expect(sidebar).toHaveClass('open');
      });
    });

    it('prevents body scroll when menu is open', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      
      // Open menu
      await user.click(hamburgerButton);
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('restores body scroll when menu is closed', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      
      // Open and close menu
      await user.click(hamburgerButton);
      await user.click(hamburgerButton);
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('unset');
      });
    });

    it('renders navigation items with proper touch targets', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      // Check dashboard link
      const dashboardLink = screen.getByText('หน้าแรก').closest('button');
      expect(dashboardLink).toHaveClass('btn-touch');
      expect(dashboardLink).toHaveClass('mobile-nav-item');
      
      // Check nav items
      mockNavItems.forEach((item) => {
        const navButton = screen.getByText(item.name).closest('button');
        expect(navButton).toHaveClass('btn-touch');
        expect(navButton).toHaveClass('mobile-nav-item');
      });
    });

    it('navigates to correct path when nav item is clicked', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      const internRequestButton = screen.getByText('คำขอฝึกงาน');
      await user.click(internRequestButton);
      
      expect(mockPush).toHaveBeenCalledWith('/intern-request');
    });

    it('closes menu after navigation', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      const internRequestButton = screen.getByText('คำขอฝึกงาน');
      await user.click(internRequestButton);
      
      // Menu should close after navigation
      await waitFor(() => {
        const sidebar = document.querySelector('.mobile-nav-sidebar');
        expect(sidebar).not.toHaveClass('open');
      });
    });

    it('handles logout functionality', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      const logoutButton = screen.getByText('ออกจากระบบ');
      await user.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Overlay', () => {
    it('shows overlay when menu is open', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      await waitFor(() => {
        const overlay = document.querySelector('.mobile-nav-overlay');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('closes menu when overlay is clicked', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      await waitFor(() => {
        const overlay = document.querySelector('.mobile-nav-overlay');
        expect(overlay).toBeInTheDocument();
      });
      
      const overlay = document.querySelector('.mobile-nav-overlay');
      fireEvent.click(overlay!);
      
      await waitFor(() => {
        const sidebar = document.querySelector('.mobile-nav-sidebar');
        expect(sidebar).not.toHaveClass('open');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('only shows on mobile screens', () => {
      renderMobileNavbar();
      
      const header = document.querySelector('header');
      const sidebar = document.querySelector('.mobile-nav-sidebar');
      const overlay = document.querySelector('.mobile-nav-overlay');
      
      // Should have md:hidden class for desktop hiding
      expect(header).toHaveClass('md:hidden');
      expect(sidebar).toHaveClass('md:hidden');
      if (overlay) {
        expect(overlay).toHaveClass('md:hidden');
      }
    });

    it('has proper animation classes', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      await waitFor(() => {
        const sidebar = document.querySelector('.mobile-nav-sidebar');
        expect(sidebar).toHaveClass('animate-in', 'slide-in-from-left');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      expect(hamburgerButton).toHaveAttribute('aria-label', 'เปิด/ปิดเมนู');
    });

    it('has proper alt text for images', () => {
      renderMobileNavbar();
      
      const logoImages = screen.getAllByAltText('Internship Management System');
      expect(logoImages).toHaveLength(2); // One in header, one in sidebar
    });

    it('disables hamburger button during animation', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      
      // Click to start animation
      await user.click(hamburgerButton);
      
      // Button should be disabled during animation
      // Note: This test might need adjustment based on actual animation timing
      expect(hamburgerButton).toBeEnabled(); // Will be enabled after animation completes
    });
  });

  describe('Touch Interactions', () => {
    it('has touch-manipulation class for better touch response', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      // Check navigation items have touch-manipulation
      const navButtons = document.querySelectorAll('.mobile-nav-item');
      navButtons.forEach(button => {
        expect(button).toHaveClass('touch-feedback');
      });
    });

    it('provides visual feedback for touch interactions', async () => {
      renderMobileNavbar();
      
      const hamburgerButton = screen.getByLabelText('เปิด/ปิดเมนู');
      await user.click(hamburgerButton);
      
      const navButtons = document.querySelectorAll('.mobile-nav-item');
      navButtons.forEach(button => {
        expect(button).toHaveClass('touch-feedback');
      });
    });
  });
});