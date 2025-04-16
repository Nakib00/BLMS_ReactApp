import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const IndividualTaskDetails = () => {
  const { taskId, assignmentId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkboxLoading, setCheckboxLoading] = useState(null);

  const statusLabels = {
    pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
    in_progress: { text: 'In Progress', class: 'bg-blue-100 text-blue-800' },
    completed: { text: 'Completed', class: 'bg-green-100 text-green-800' },
    cancelled: { text: 'Cancelled', class: 'bg-red-100 text-red-800' }
  };

  const CheckIcon = () => (
    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );

  const UncheckIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  );

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
        const assignment = data.data.assigned_users.find(a => a.id.toString() === assignmentId);
        if (!assignment) {
          throw new Error('Assignment not found');
        }
        setTaskDetails({ task: data.data, assignment });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId, assignmentId, token]);

  const handleCheckboxToggle = async (subtaskId) => {
    try {
      setCheckboxLoading(subtaskId);
      const response = await fetch(`https://hubbackend.desklago.com/api/tasks/individual-tasks/toggle-checkbox/${subtaskId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle checkbox');
      }

      // Update the local state immediately with the new data
      setTaskDetails(prev => {
        if (!prev) return prev;
        const updatedAssignment = {
          ...prev.assignment,
          individual_tasks: prev.assignment.individual_tasks.map(task => 
            task.id === subtaskId 
              ? { ...task, checkbox: task.checkbox === 1 ? 0 : 1 }
              : task
          )
        };
        return {
          ...prev,
          assignment: updatedAssignment
        };
      });

      // Fetch fresh data in the background
      const taskResponse = await fetch(`https://hubbackend.desklago.com/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (taskResponse.ok) {
        const freshData = await taskResponse.json();
        const assignment = freshData.data.assigned_users.find(a => a.id.toString() === assignmentId);
        if (assignment) {
          setTaskDetails({ task: freshData.data, assignment });
        }
      }
    } catch (err) {
      setError(err.message);
      // Revert optimistic update on error
      const taskResponse = await fetch(`https://hubbackend.desklago.com/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (taskResponse.ok) {
        const data = await taskResponse.json();
        const assignment = data.data.assigned_users.find(a => a.id.toString() === assignmentId);
        if (assignment) {
          setTaskDetails({ task: data.data, assignment });
        }
      }
    } finally {
      setCheckboxLoading(null);
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

  if (!taskDetails) {
    return (
      <div className="p-4 text-center text-gray-600">
        Task details not found
      </div>
    );
  }

  const { task, assignment } = taskDetails;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/dashboard/tasks/${taskId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Task Details
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Individual Tasks for {assignment.user.name}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Task: {task.title}
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500">Assignment Details</h4>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[assignment.status].class}`}>
                    {statusLabels[assignment.status].text}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Due Date:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                {assignment.feedback && (
                  <div className="sm:col-span-2">
                    <span className="text-sm text-gray-500">Feedback:</span>
                    <p className="mt-1 text-sm text-gray-900">{assignment.feedback}</p>
                  </div>
                )}
              </div>
            </div>

            {assignment.individual_tasks.length > 0 ? (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-4">Subtasks</h4>
                <div className="bg-white shadow overflow-hidden rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {assignment.individual_tasks.map((subtask) => (
                      <li key={subtask.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleCheckboxToggle(subtask.id)}
                              className="flex-shrink-0 focus:outline-none hover:opacity-75 transition-opacity disabled:opacity-50"
                              disabled={checkboxLoading === subtask.id}
                            >
                              {checkboxLoading === subtask.id ? (
                                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : subtask.checkbox === 1 ? (
                                <CheckIcon />
                              ) : (
                                <UncheckIcon />
                              )}
                            </button>
                            <div>
                              <h5 className={`text-sm font-medium ${subtask.checkbox === 1 ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {subtask.title}
                              </h5>
                              <p className={`mt-1 text-sm ${subtask.checkbox === 1 ? 'text-gray-400' : 'text-gray-500'}`}>
                                {subtask.description}
                              </p>
                              <p className="mt-2 text-xs text-gray-400">
                                Last updated: {format(new Date(subtask.updated_at), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[subtask.status].class}`}>
                              {statusLabels[subtask.status].text}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No individual tasks found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualTaskDetails;