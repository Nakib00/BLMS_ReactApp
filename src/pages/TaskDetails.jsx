import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const TaskDetails = () => {
  const { taskId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [individualTaskForm, setIndividualTaskForm] = useState({
    title: '',
    description: '',
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignDueDate, setAssignDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assigning, setAssigning] = useState(false);

  const priorityLabels = {
    1: { text: 'Low', class: 'bg-blue-100 text-blue-800' },
    2: { text: 'Medium', class: 'bg-yellow-100 text-yellow-800' },
    3: { text: 'High', class: 'bg-red-100 text-red-800' }
  };

  const statusLabels = {
    pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
    in_progress: { text: 'In Progress', class: 'bg-blue-100 text-blue-800' },
    completed: { text: 'Completed', class: 'bg-green-100 text-green-800' },
    cancelled: { text: 'Cancelled', class: 'bg-red-100 text-red-800' }
  };

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://hubbackend.desklago.com/api/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch task details');
        }

        const data = await response.json();
        setTask(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId, token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://hubbackend.desklago.com/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        const filteredUsers = data.data.filter(user => 
          ['admin', 'leader', 'member'].includes(user.type.toLowerCase()) &&
          !task.assigned_users.some(assigned => assigned.user.id === user.id)
        );
        setUsers(filteredUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    if (showAssignModal && task) {
      fetchUsers();
    }
  }, [token, showAssignModal, task]);

  const handleCreateIndividualTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://hubbackend.desklago.com/api/tasks/individual-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...individualTaskForm,
          task_id: taskId,
          user_id: selectedAssignment.user.id,
          task_user_assigns_id: selectedAssignment.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create individual task');
      }

      const taskResponse = await fetch(`https://hubbackend.desklago.com/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!taskResponse.ok) {
        throw new Error('Failed to fetch updated task details');
      }

      const data = await taskResponse.json();
      setTask(data.data);

      setIndividualTaskForm({ title: '', description: '' });
      setShowCreateModal(false);
      setSelectedAssignment(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setAssigning(true);
      const response = await fetch(`https://hubbackend.desklago.com/api/tasks/assign-user/${taskId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedUser,
          due_date: assignDueDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign user');
      }

      const taskResponse = await fetch(`https://hubbackend.desklago.com/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (taskResponse.ok) {
        const data = await taskResponse.json();
        setTask(data.data);
      }

      setShowAssignModal(false);
      setSelectedUser(null);
      setAssignDueDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-4 text-center text-gray-600">
        Task not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tasks
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {task.title}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityLabels[task.priority].class}`}>
                {priorityLabels[task.priority].text} Priority
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Created by {task.creator.name} on {format(new Date(task.created_at), 'MMM dd, yyyy')}
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{task.description}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[task.status].class}`}>
                    {statusLabels[task.status].text}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(task.due_date), 'MMM dd, yyyy')}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Users</h3>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Assign New User
                </button>
              </div>
            </div>
            <div className="bg-white overflow-hidden">
              <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">User</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Due Date</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {task.assigned_users.map((assignment) => (
                          <tr key={assignment.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3">
                              <div className="flex items-center">
                                {assignment.user.profile_image ? (
                                  <img
                                    src={`https://hubbackend.desklago.com/storage/${assignment.user.profile_image}`}
                                    alt={assignment.user.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 text-lg">
                                      {assignment.user.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">{assignment.user.name}</div>
                                  <div className="text-gray-500">{assignment.user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[assignment.status].class}`}>
                                {statusLabels[assignment.status].text}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm space-x-4">
                              <button
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowCreateModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Add Subtask
                              </button>
                              {assignment.individual_tasks.length > 0 && (
                                <button
                                  onClick={() => navigate(`/dashboard/tasks/${taskId}/assignments/${assignment.id}`)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  View Subtasks ({assignment.individual_tasks.length})
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Individual Task Modal */}
      {showCreateModal && selectedAssignment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Create Subtask for {selectedAssignment.user.name}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedAssignment(null);
                  setIndividualTaskForm({ title: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateIndividualTask} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={individualTaskForm.title}
                  onChange={(e) => setIndividualTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows="3"
                  value={individualTaskForm.description}
                  onChange={(e) => setIndividualTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedAssignment(null);
                    setIndividualTaskForm({ title: '', description: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Subtask
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Assign New User</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUser(null);
                  setAssignDueDate(format(new Date(), 'yyyy-MM-dd'));
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignUser} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                <div className="border rounded-md p-4 space-y-4 max-h-60 overflow-y-auto">
                  {users.length > 0 ? (
                    users.map(user => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="user"
                          value={user.id}
                          checked={selectedUser === user.id}
                          onChange={() => setSelectedUser(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex items-center">
                          {user.profile_image ? (
                            <img
                              src={`https://hubbackend.desklago.com/storage/${user.profile_image}`}
                              alt={user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">{user.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">
                              {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No available users to assign</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  required
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setAssignDueDate(format(new Date(), 'yyyy-MM-dd'));
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUser || assigning}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    !selectedUser || assigning
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {assigning ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Assigning...
                    </span>
                  ) : (
                    'Assign User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;