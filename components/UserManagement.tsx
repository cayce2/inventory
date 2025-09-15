/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { 
  User, 
  Loader2, 
  CheckCircle,
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserPlus,
  X
} from "lucide-react"

// Define user roles with their permissions
const USER_ROLES = {
  ADMIN: {
    name: 'Admin',
    description: 'Full access to all features and settings',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings']
  },
  EDITOR: {
    name: 'Editor',
    description: 'Can create, edit, and delete content',
    permissions: ['read', 'write', 'delete']
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access to content',
    permissions: ['read']
  },
  MODERATOR: {
    name: 'Moderator',
    description: 'Can moderate content and manage users',
    permissions: ['read', 'write', 'manage_users']
  }
}

interface SubUser {
  id: string
  name: string
  email: string
  role: keyof typeof USER_ROLES
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastLogin?: string
}

interface UserManagementProps {
  error: string
  setError: (error: string) => void
  successMessage: string
  setSuccessMessage: (message: string) => void
}

export default function UserManagement({ error, setError, successMessage, setSuccessMessage }: UserManagementProps) {
  // User Management States
  const [subUsers, setSubUsers] = useState<SubUser[]>([])
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SubUser | null>(null)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<keyof typeof USER_ROLES>("VIEWER")
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSubUsers()
  }, [])

  const fetchSubUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/user/sub-users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSubUsers(data.subUsers || [])
      } else {
        console.error("Failed to fetch sub-users")
      }
    } catch (error) {
      console.error("Error fetching sub-users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/user/sub-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
        }),
      })

      if (response.ok) {
        setSuccessMessage("User added successfully")
        setTimeout(() => setSuccessMessage(""), 3000)
        setShowAddUserModal(false)
        setNewUserName("")
        setNewUserEmail("")
        setNewUserRole("VIEWER")
        fetchSubUsers() // Refresh the users list
      } else {
        const data = await response.json()
        setError(data.error || "Failed to add user")
      }
    } catch (error) {
      console.error("Error adding user:", error)
      setError("An error occurred while adding the user")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/user/sub-users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
        }),
      })

      if (response.ok) {
        setSuccessMessage("User updated successfully")
        setTimeout(() => setSuccessMessage(""), 3000)
        setShowEditUserModal(false)
        setSelectedUser(null)
        setNewUserName("")
        setNewUserEmail("")
        setNewUserRole("VIEWER")
        fetchSubUsers() // Refresh the users list
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      setError("An error occurred while updating the user")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setError("")
    setSuccessMessage("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/user/sub-users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setSuccessMessage("User deleted successfully")
        setTimeout(() => setSuccessMessage(""), 3000)
        fetchSubUsers() // Refresh the users list
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      setError("An error occurred while deleting the user")
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/user/sub-users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setSuccessMessage(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
        setTimeout(() => setSuccessMessage(""), 3000)
        fetchSubUsers() // Refresh the users list
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update user status")
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      setError("An error occurred while updating the user status")
    }
  }

  const openEditModal = (user: SubUser) => {
    setSelectedUser(user)
    setNewUserName(user.name)
    setNewUserEmail(user.email)
    setNewUserRole(user.role)
    setShowEditUserModal(true)
  }

  const closeModals = () => {
    setShowAddUserModal(false)
    setShowEditUserModal(false)
    setSelectedUser(null)
    setNewUserName("")
    setNewUserEmail("")
    setNewUserRole("VIEWER")
    setError("")
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'EDITOR': return 'bg-blue-100 text-blue-800'
      case 'MODERATOR': return 'bg-orange-100 text-orange-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage sub-users and their access permissions</p>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus className="-ml-1 mr-2 h-4 w-4" />
            Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : subUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No sub-users found</p>
                    <p className="text-xs text-gray-400">Add your first user to get started</p>
                  </td>
                </tr>
              ) : (
                subUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {USER_ROLES[user.role].name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.status)}
                          className={`p-1 rounded ${user.status === 'active' 
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.status === 'active' ? 
                            <X className="h-4 w-4" /> : 
                            <CheckCircle className="h-4 w-4" />
                          }
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Role Descriptions */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(USER_ROLES).map(([key, role]) => (
              <div key={key} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center mb-2">
                  <Shield className="h-4 w-4 text-indigo-600 mr-2" />
                  <h4 className="font-medium text-gray-900">{role.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {permission.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddUser} className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="newUserName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="newUserName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="newUserEmail"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="newUserRole"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as keyof typeof USER_ROLES)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {Object.entries(USER_ROLES).map(([key, role]) => (
                    <option key={key} value={key}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="-ml-1 mr-2 h-4 w-4" />
                      Add User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEditUser} className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="editUserName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="editUserName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editUserEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="editUserEmail"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editUserRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="editUserRole"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as keyof typeof USER_ROLES)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {Object.entries(USER_ROLES).map(([key, role]) => (
                    <option key={key} value={key}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="-ml-1 mr-2 h-4 w-4" />
                      Update User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}