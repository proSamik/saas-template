'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/lib/store';
import api from '@/lib/axios';

interface Project {
  id: string;
  attributes: {
    name: string;
    description: string;
    status: 'active' | 'completed' | 'archived';
    created_at: string;
    updated_at: string;
  };
}

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/projects');
        setProjects(response.data.data);
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        setError(error?.response?.data?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in to access this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={() => {}}
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-500">No projects found. Create your first project to get started!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-2">{project.attributes.name}</h3>
              <p className="text-gray-600 mb-4">{project.attributes.description}</p>
              <div className="flex justify-between items-center">
                <span
                  className={`capitalize px-3 py-1 rounded-full text-sm ${{
                    active: 'bg-green-100 text-green-800',
                    completed: 'bg-blue-100 text-blue-800',
                    archived: 'bg-gray-100 text-gray-800'
                  }[project.attributes.status]}`}
                >
                  {project.attributes.status}
                </span>
                <span className="text-sm text-gray-500">
                  Updated {new Date(project.attributes.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}