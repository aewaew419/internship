"use client";

import { useState, useEffect } from "react";
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Role, RoleHierarchy as RoleHierarchyType } from "@/types/admin";

interface RoleHierarchyProps {
  roles: Role[];
  onRoleSelect?: (role: Role) => void;
  onRoleEdit?: (role: Role) => void;
  onRoleDelete?: (role: Role) => void;
  onRoleCreate?: (parentRole?: Role) => void;
  selectedRoleId?: number;
  showActions?: boolean;
  className?: string;
}

interface RoleTreeNodeProps {
  node: RoleHierarchyType;
  level: number;
  onToggle: (nodeId: number) => void;
  onSelect?: (role: Role) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onCreate?: (parentRole?: Role) => void;
  expandedNodes: Set<number>;
  selectedRoleId?: number;
  showActions?: boolean;
  allRoles: Role[];
}

const RoleTreeNode = ({
  node,
  level,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  expandedNodes,
  selectedRoleId,
  showActions = true,
  allRoles,
}: RoleTreeNodeProps) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedRoleId === node.id;
  const role = allRoles.find(r => r.id === node.id);

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  const handleSelect = () => {
    if (role && onSelect) {
      onSelect(role);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (role && onEdit) {
      onEdit(role);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (role && onDelete) {
      onDelete(role);
    }
  };

  const handleCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (role && onCreate) {
      onCreate(role);
    }
  };

  return (
    <div className="select-none">
      {/* Node */}
      <div
        className={`flex items-center py-2 px-3 rounded-md cursor-pointer transition-colors ${
          isSelected 
            ? "bg-red-50 border border-red-200" 
            : "hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 w-5 h-5 mr-2">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
        </div>

        {/* Role Icon */}
        <UserGroupIcon className={`w-5 h-5 mr-3 ${
          role?.isSystem ? "text-blue-500" : "text-gray-500"
        }`} />

        {/* Role Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className={`text-sm font-medium truncate ${
              isSelected ? "text-red-900" : "text-gray-900"
            }`}>
              {node.displayName}
            </span>
            {role?.isSystem && (
              <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                System
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {node.name}
          </div>
        </div>

        {/* Permission Count */}
        <div className="flex-shrink-0 mr-3">
          <span className="text-xs text-gray-500">
            {role?.permissions?.length || 0} permissions
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCreate}
              className="p-1 rounded hover:bg-gray-200"
              title="Add child role"
            >
              <PlusIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleEdit}
              className="p-1 rounded hover:bg-gray-200"
              title="Edit role"
            >
              <PencilIcon className="w-4 h-4 text-gray-500" />
            </button>
            {!role?.isSystem && (
              <button
                onClick={handleDelete}
                className="p-1 rounded hover:bg-gray-200"
                title="Delete role"
              >
                <TrashIcon className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <RoleTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreate={onCreate}
              expandedNodes={expandedNodes}
              selectedRoleId={selectedRoleId}
              showActions={showActions}
              allRoles={allRoles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const RoleHierarchy = ({
  roles,
  onRoleSelect,
  onRoleEdit,
  onRoleDelete,
  onRoleCreate,
  selectedRoleId,
  showActions = true,
  className = "",
}: RoleHierarchyProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [hierarchy, setHierarchy] = useState<RoleHierarchyType[]>([]);

  // Build hierarchy from flat roles array
  useEffect(() => {
    const buildHierarchy = (roles: Role[]): RoleHierarchyType[] => {
      const roleMap = new Map<number, RoleHierarchyType>();
      const rootRoles: RoleHierarchyType[] = [];

      // Create hierarchy nodes
      roles.forEach(role => {
        roleMap.set(role.id, {
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          children: [],
          level: 0,
          parentId: undefined, // Will be set when hierarchy is implemented
        });
      });

      // For now, treat all roles as root level since parentId is not implemented yet
      // This will be updated when role hierarchy is fully implemented
      roles.forEach(role => {
        const node = roleMap.get(role.id);
        if (node) {
          rootRoles.push(node);
        }
      });

      // Sort by display name
      rootRoles.sort((a, b) => a.displayName.localeCompare(b.displayName));

      return rootRoles;
    };

    setHierarchy(buildHierarchy(roles));
  }, [roles]);

  // Auto-expand nodes with children
  useEffect(() => {
    const nodesWithChildren = hierarchy
      .filter(node => node.children.length > 0)
      .map(node => node.id);
    
    setExpandedNodes(new Set(nodesWithChildren));
  }, [hierarchy]);

  const handleToggle = (nodeId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    const allNodeIds = new Set<number>();
    
    const collectNodeIds = (nodes: RoleHierarchyType[]) => {
      nodes.forEach(node => {
        allNodeIds.add(node.id);
        collectNodeIds(node.children);
      });
    };
    
    collectNodeIds(hierarchy);
    setExpandedNodes(allNodeIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (roles.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No roles found</p>
        <p className="text-sm">Create your first role to get started</p>
        {onRoleCreate && (
          <button
            onClick={() => onRoleCreate()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Role
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Role Hierarchy</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExpandAll}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Expand All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Collapse All
            </button>
            {onRoleCreate && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => onRoleCreate()}
                  className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add Role
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {hierarchy.map((node) => (
          <div key={node.id} className="group">
            <RoleTreeNode
              node={node}
              level={0}
              onToggle={handleToggle}
              onSelect={onRoleSelect}
              onEdit={onRoleEdit}
              onDelete={onRoleDelete}
              onCreate={onRoleCreate}
              expandedNodes={expandedNodes}
              selectedRoleId={selectedRoleId}
              showActions={showActions}
              allRoles={roles}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>{roles.length} roles total</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span>System Role</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span>Custom Role</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};