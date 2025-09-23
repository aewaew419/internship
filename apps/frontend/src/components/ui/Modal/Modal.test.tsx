import { render, screen, fireEvent } from '@testing-library/react';
import { Modal, Drawer, BottomSheet, Popover, Toast } from './index';

// Mock the utils and hooks
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn(() => false) // Default to desktop
}));

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
}));

describe('Modal Component', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when escape key is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()} size="sm">
        <p>Small modal</p>
      </Modal>
    );
    
    expect(screen.getByText('Small modal').closest('div')).toHaveClass('max-w-sm');
    
    rerender(
      <Modal isOpen={true} onClose={jest.fn()} size="lg">
        <p>Large modal</p>
      </Modal>
    );
    
    expect(screen.getByText('Large modal').closest('div')).toHaveClass('max-w-lg');
  });

  it('handles mobile full screen mode', () => {
    const { useMediaQuery } = require('@/hooks/useMediaQuery');
    useMediaQuery.mockReturnValue(true); // Mobile
    
    render(
      <Modal isOpen={true} onClose={jest.fn()} mobileFullScreen>
        <p>Full screen modal</p>
      </Modal>
    );
    
    expect(screen.getByText('Full screen modal').closest('div')).toHaveClass('h-full');
  });
});

describe('Drawer Component', () => {
  it('renders with different positions', () => {
    const { rerender } = render(
      <Drawer isOpen={true} onClose={jest.fn()} position="left" title="Left Drawer">
        <p>Drawer content</p>
      </Drawer>
    );
    
    expect(screen.getByText('Left Drawer')).toBeInTheDocument();
    
    rerender(
      <Drawer isOpen={true} onClose={jest.fn()} position="right" title="Right Drawer">
        <p>Drawer content</p>
      </Drawer>
    );
    
    expect(screen.getByText('Right Drawer')).toBeInTheDocument();
  });

  it('handles close button click', () => {
    const onClose = jest.fn();
    render(
      <Drawer isOpen={true} onClose={onClose} title="Test Drawer">
        <p>Drawer content</p>
      </Drawer>
    );
    
    fireEvent.click(screen.getByLabelText('Close drawer'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('BottomSheet Component', () => {
  it('renders with drag handle', () => {
    render(
      <BottomSheet isOpen={true} onClose={jest.fn()} showDragHandle>
        <p>Bottom sheet content</p>
      </BottomSheet>
    );
    
    expect(screen.getByText('Bottom sheet content')).toBeInTheDocument();
    // Drag handle is a visual element without text
    const dragHandle = document.querySelector('.w-12.h-1.bg-gray-300');
    expect(dragHandle).toBeInTheDocument();
  });

  it('handles snap points', () => {
    const onSnapPointChange = jest.fn();
    render(
      <BottomSheet 
        isOpen={true} 
        onClose={jest.fn()} 
        snapPoints={[25, 50, 90]}
        onSnapPointChange={onSnapPointChange}
      >
        <p>Bottom sheet content</p>
      </BottomSheet>
    );
    
    const snapButtons = screen.getAllByRole('button', { name: /Snap to \d+% height/ });
    expect(snapButtons).toHaveLength(3);
  });
});

describe('Popover Component', () => {
  it('shows content on click trigger', () => {
    render(
      <Popover 
        trigger="click" 
        content={<div>Popover content</div>}
      >
        <button>Trigger</button>
      </Popover>
    );
    
    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('shows content on hover trigger', () => {
    render(
      <Popover 
        trigger="hover" 
        content={<div>Popover content</div>}
      >
        <button>Trigger</button>
      </Popover>
    );
    
    fireEvent.mouseEnter(screen.getByText('Trigger'));
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('does not show when disabled', () => {
    render(
      <Popover 
        trigger="click" 
        content={<div>Popover content</div>}
        disabled
      >
        <button>Trigger</button>
      </Popover>
    );
    
    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });
});

describe('Toast Component', () => {
  it('renders different types', () => {
    const { rerender } = render(
      <Toast 
        id="1" 
        message="Success message" 
        type="success"
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    
    rerender(
      <Toast 
        id="2" 
        message="Error message" 
        type="error"
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows title when provided', () => {
    render(
      <Toast 
        id="1" 
        title="Success!" 
        message="Operation completed" 
        type="success"
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Toast 
        id="1" 
        message="Test message" 
        onClose={onClose}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('renders action button', () => {
    const actionClick = jest.fn();
    render(
      <Toast 
        id="1" 
        message="Test message" 
        action={{ label: 'Undo', onClick: actionClick }}
        onClose={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Undo'));
    expect(actionClick).toHaveBeenCalled();
  });
});