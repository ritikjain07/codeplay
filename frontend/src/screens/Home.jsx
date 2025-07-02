import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const { user } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState("")
    const [projectDescription, setProjectDescription] = useState("")
    const [projects, setProjects] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortOption, setSortOption] = useState("newest")

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        
        // Only send name field as that's what backend expects
        axios.post('/projects/create', {
            name: projectName
        })
            .then((res) => {
                console.log('Project created:', res.data);
                setProjects([res.data, ...projects])  // Fixed: res.data instead of res.data.project
                setProjectName("")
                setProjectDescription("")
                setIsModalOpen(false)
            })
            .catch((error) => {
                console.error("Error creating project:", error)
                console.error("Error response:", error.response?.data)
                // Check if it's an authentication error
                if (error.response?.status === 401) {
                    alert('Please log in again')
                    // Redirect to login
                    navigate('/login')
                }
            })
    }

    useEffect(() => {
        setIsLoading(true)
        axios.get('/projects/all').then((res) => {
            console.log('Projects fetched:', res.data);
            setProjects(res.data.projects || [])
            setIsLoading(false)
        }).catch(err => {
            console.error("Error fetching projects:", err)
            console.error("Error response:", err.response?.data)
            if (err.response?.status === 401) {
                console.log('User not authenticated, redirecting to login');
                navigate('/login')
            }
            setIsLoading(false)
        })
    }, [])

    // Filter and sort projects
    const filteredProjects = projects.filter(project => 
        project && project.name && project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const sortedProjects = [...filteredProjects].sort((a, b) => {
        if (sortOption === "newest") {
            return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
        } else if (sortOption === "oldest") {
            return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0)
        } else if (sortOption === "name") {
            return (a?.name || '').localeCompare(b?.name || '')
        } else if (sortOption === "collaborators") {
            return (b?.users?.length || 0) - (a?.users?.length || 0)
        }
        return 0
    })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Projects</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Welcome back, {user?.email?.split('@')[0] || 'User'}! Manage your projects here.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 md:mt-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create New Project
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="search"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-48">
                        <select
                            className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="name">Name</option>
                            <option value="collaborators">Most Collaborators</option>
                        </select>
                    </div>
                </div>

                {/* Projects Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <div 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 h-56 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors duration-200"
                        >
                            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Create New Project</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center">Start collaborating on a new project</p>
                        </div>

                        {sortedProjects.map((project) => (
                            <div 
                                key={project._id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            >
                                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">{project.name}</h3>
                                        <span className="text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 py-1 px-2 rounded-full">
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                                        {project.description || "No description provided"}
                                    </p>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{project.users.length} {project.users.length === 1 ? 'Member' : 'Members'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(project.createdAt).toLocaleDateString('en-US', { 
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigate(`/project`, {
                                                    state: { project }
                                                })
                                            }}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                                        >
                                            Original
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigate(`/project-improved`, {
                                                    state: { project }
                                                })
                                            }}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                                        >
                                            Improved
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                navigate(`/project-simple`, {
                                                    state: { project }
                                                })
                                            }}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                                        >
                                            Simple
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {sortedProjects.length === 0 && !isLoading && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No projects found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {searchTerm ? `No projects matching "${searchTerm}"` : "You haven't created any projects yet"}
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Create Your First Project
                        </button>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Project</h2>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={createProject} className="px-6 py-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Project Name
                                </label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter project name"
                                    required 
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    value={projectDescription}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Brief description of your project"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home