import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, Drawer, BottomSheet, Popover, Toast } from './index';

const meta: Meta = {
  title: 'UI/Modal Components',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

// Modal Stories
export const BasicModal: StoryObj = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <button 
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Open Modal
        </button>
        
        <Modal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          title="Basic Modal"
        >
          <div className="space-y-4">
            <p>This is a basic modal with a title and close button.</p>
            <p>You can click the overlay or press Escape to close it.</p>
            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};

export const ModalSizes: StoryObj = {
  render: () => {
    const [openModal, setOpenModal] = useState<string | null>(null);
    
    return (
      <div className="space-x-4">
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <button 
            key={size}
            onClick={() => setOpenModal(size)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {size.toUpperCase()} Modal
          </button>
        ))}
        
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <Modal 
            key={size}
            isOpen={openModal === size} 
            onClose={() => setOpenModal(null)}
            title={`${size.toUpperCase()} Modal`}
            size={size}
          >
            <p>This is a {size} sized modal.</p>
          </Modal>
        ))}
      </div>
    );
  },
};

export const MobileFullScreenModal: StoryObj = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <button 
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Open Mobile Full Screen
        </button>
        
        <Modal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          title="Mobile Full Screen Modal"
          mobileFullScreen
        >
          <div className="space-y-4">
            <p>This modal becomes full screen on mobile devices.</p>
            <p>Try viewing this on a mobile device or narrow viewport.</p>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Scrollable content area</p>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Drawer Stories
export const DrawerPositions: StoryObj = {
  render: () => {
    const [openDrawer, setOpenDrawer] = useState<string | null>(null);
    
    return (
      <div className="grid grid-cols-2 gap-4">
        {(['left', 'right', 'top', 'bottom'] as const).map((position) => (
          <button 
            key={position}
            onClick={() => setOpenDrawer(position)}
            className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
          >
            {position} Drawer
          </button>
        ))}
        
        {(['left', 'right', 'top', 'bottom'] as const).map((position) => (
          <Drawer 
            key={position}
            isOpen={openDrawer === position} 
            onClose={() => setOpenDrawer(null)}
            title={`${position} Drawer`}
            position={position}
          >
            <div className="space-y-4">
              <p>This drawer slides in from the {position}.</p>
              <p>Perfect for navigation menus, filters, or additional content.</p>
            </div>
          </Drawer>
        ))}
      </div>
    );
  },
};

// Bottom Sheet Stories
export const BasicBottomSheet: StoryObj = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div>
        <button 
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Open Bottom Sheet
        </button>
        
        <BottomSheet 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          title="Bottom Sheet"
          snapPoints={[25, 50, 90]}
        >
          <div className="space-y-4">
            <p>This is a bottom sheet that slides up from the bottom.</p>
            <p>You can drag the handle to resize it or tap the snap point indicators.</p>
            <div className="space-y-2">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="p-3 bg-gray-100 rounded">
                  Item {i + 1}
                </div>
              ))}
            </div>
          </div>
        </BottomSheet>
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Popover Stories
export const PopoverTriggers: StoryObj = {
  render: () => (
    <div className="flex gap-4 items-center justify-center min-h-[200px]">
      <Popover 
        trigger="click" 
        content={
          <div className="space-y-2">
            <h4 className="font-semibold">Click Popover</h4>
            <p className="text-sm text-gray-600">This opens on click.</p>
          </div>
        }
      >
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Click Me
        </button>
      </Popover>
      
      <Popover 
        trigger="hover" 
        content={
          <div className="space-y-2">
            <h4 className="font-semibold">Hover Popover</h4>
            <p className="text-sm text-gray-600">This opens on hover.</p>
          </div>
        }
      >
        <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Hover Me
        </button>
      </Popover>
      
      <Popover 
        trigger="focus" 
        content={
          <div className="space-y-2">
            <h4 className="font-semibold">Focus Popover</h4>
            <p className="text-sm text-gray-600">This opens on focus.</p>
          </div>
        }
      >
        <input 
          placeholder="Focus me"
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </Popover>
    </div>
  ),
};

export const PopoverPlacements: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3 gap-8 items-center justify-items-center min-h-[400px]">
      <Popover placement="top-start" content="Top Start">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Top Start</button>
      </Popover>
      <Popover placement="top" content="Top Center">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Top</button>
      </Popover>
      <Popover placement="top-end" content="Top End">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Top End</button>
      </Popover>
      
      <Popover placement="left" content="Left">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Left</button>
      </Popover>
      <div className="px-3 py-2 bg-gray-200 rounded text-sm">Center</div>
      <Popover placement="right" content="Right">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Right</button>
      </Popover>
      
      <Popover placement="bottom-start" content="Bottom Start">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Bottom Start</button>
      </Popover>
      <Popover placement="bottom" content="Bottom Center">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Bottom</button>
      </Popover>
      <Popover placement="bottom-end" content="Bottom End">
        <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm">Bottom End</button>
      </Popover>
    </div>
  ),
};

// Toast Stories
export const ToastTypes: StoryObj = {
  render: () => {
    const [toasts, setToasts] = useState<any[]>([]);
    
    const addToast = (type: 'success' | 'error' | 'warning' | 'info') => {
      const id = Date.now().toString();
      const newToast = {
        id,
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Toast`,
        message: `This is a ${type} toast notification.`,
        onClose: (toastId: string) => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        },
      };
      setToasts(prev => [...prev, newToast]);
    };
    
    return (
      <div>
        <div className="space-x-4 mb-4">
          <button 
            onClick={() => addToast('success')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Success Toast
          </button>
          <button 
            onClick={() => addToast('error')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Error Toast
          </button>
          <button 
            onClick={() => addToast('warning')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Warning Toast
          </button>
          <button 
            onClick={() => addToast('info')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Info Toast
          </button>
        </div>
        
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    );
  },
};

export const ToastWithAction: StoryObj = {
  render: () => {
    const [toasts, setToasts] = useState<any[]>([]);
    
    const addActionToast = () => {
      const id = Date.now().toString();
      const newToast = {
        id,
        type: 'info' as const,
        title: 'File Deleted',
        message: 'Your file has been moved to trash.',
        action: {
          label: 'Undo',
          onClick: () => alert('File restored!'),
        },
        onClose: (toastId: string) => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        },
      };
      setToasts(prev => [...prev, newToast]);
    };
    
    return (
      <div>
        <button 
          onClick={addActionToast}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Show Toast with Action
        </button>
        
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    );
  },
};