'use client'

import { useEffect, useState } from 'react'
import { useSession, useUser } from '@clerk/nextjs'
import { useClerkSupabaseClient } from '@/lib/clerk-supabase'

interface Task {
  id: number
  name: string
  user_id: string
  created_at: string
}

export default function ClerkSupabaseExample() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // The `useUser()` hook is used to ensure that Clerk has loaded data about the signed in user
  const { user } = useUser()
  // The `useSession()` hook is used to get the Clerk session object
  // The session object is used to get the Clerk session token
  const { session } = useSession()

  // Create a custom Supabase client that injects the Clerk session token into the request headers
  const supabase = useClerkSupabaseClient()

  // This `useEffect` will wait for the User object to be loaded before requesting
  // the tasks for the signed in user
  useEffect(() => {
    if (!user) return

    async function loadTasks() {
      setLoading(true)
      setError(null)
      
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })
          
        if (error) {
          console.error('Error loading tasks:', error)
          setError(error.message)
        } else {
          setTasks(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [user, supabase])

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Please enter a task name')
      return
    }

    try {
      // Insert task into the "tasks" database
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          name: name.trim(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating task:', error)
        setError(error.message)
      } else {
        // Add the new task to the local state
        setTasks(prev => [data, ...prev])
        setName('')
        setError(null)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred while creating the task')
    }
  }

  async function deleteTask(taskId: number) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('Error deleting task:', error)
        setError(error.message)
      } else {
        // Remove the task from the local state
        setTasks(prev => prev.filter(task => task.id !== taskId))
        setError(null)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred while deleting the task')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to view and manage your tasks.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">
            Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}! 
            Here are your personal tasks, secured with Row Level Security.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={createTask} className="flex gap-2">
            <input
              autoFocus
              type="text"
              name="name"
              placeholder="Enter new task"
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Task
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length > 0 ? (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h3 className="font-medium">{task.name}</h3>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tasks found. Create your first task above!
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How this works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Authentication is handled by Clerk</li>
            <li>• The Clerk session token is automatically passed to Supabase</li>
            <li>• Row Level Security (RLS) ensures you can only see your own tasks</li>
            <li>• The user_id column is automatically populated with your Clerk user ID</li>
            <li>• All database operations are properly authenticated and authorized</li>
          </ul>
        </div>
      </div>
    </div>
  )
}