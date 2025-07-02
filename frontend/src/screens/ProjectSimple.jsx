import React, { useState, useEffect, useRef, useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'
import { 
    FiArrowLeft, FiUsers, FiSettings, FiPlus, FiSave, FiPlay, 
    FiFolder, FiFile, FiX, FiSend, FiRefreshCw, FiDownload,
    FiUpload, FiTrash2, FiEdit, FiCopy, FiCode
} from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'
import Markdown from 'markdown-to-jsx'
import { sendMessage, receiveMessage, initializeSocket } from '../config/socket'
import { getWebContainer } from '../config/webcontainer'

const SimpleProject = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useContext(UserContext)
    
    // 🎯 CORE STATE - Keep it simple!
    const [project, setProject] = useState(location.state?.project || {})
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    
    // 🎨 UI STATE
    const [activeTab, setActiveTab] = useState('files') // 'files', 'chat', 'settings'
    const [showModal, setShowModal] = useState(null) // null, 'addUser', 'createFile', 'settings'
    const [newFileName, setNewFileName] = useState('')
    const [selectedUsers, setSelectedUsers] = useState(new Set())
    
    // 🚀 WEBCONTAINER STATE
    const [webContainer, setWebContainer] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [logs, setLogs] = useState([])
    const [showConsole, setShowConsole] = useState(false)
    
    // 📁 SIMPLIFIED FILE OPERATIONS
    const createFile = () => {
        if (!newFileName.trim()) return
        
        const newTree = {
            ...fileTree,
            [newFileName]: { file: { contents: '// Start coding here...' } }
        }
        
        setFileTree(newTree)
        saveFileTree(newTree)
        setCurrentFile(newFileName)
        setOpenFiles([...openFiles, newFileName])
        setNewFileName('')
        setShowModal(null)
    }
    
    const deleteFile = (fileName) => {
        if (!confirm(`Delete ${fileName}?`)) return
        
        const newTree = { ...fileTree }
        delete newTree[fileName]
        
        setFileTree(newTree)
        saveFileTree(newTree)
        
        // Close file if open
        setOpenFiles(openFiles.filter(f => f !== fileName))
        if (currentFile === fileName) {
            setCurrentFile(openFiles[0] || null)
        }
    }
    
    const saveFile = () => {
        if (!currentFile) return
        
        const content = document.getElementById('code-editor')?.value || ''
        const newTree = {
            ...fileTree,
            [currentFile]: { file: { contents: content } }
        }
        
        setFileTree(newTree)
        saveFileTree(newTree)
        
        // Show save notification
        showNotification('File saved! ✅')
    }
    
    const saveFileTree = (tree) => {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: tree
        }).catch(err => {
            console.error('Save failed:', err)
            showNotification('Save failed! ❌')
        })
    }
    
    // 🚀 SIMPLIFIED RUN PROJECT
    const runProject = async () => {
        try {
            setIsLoading(true)
            setShowConsole(true)
            setLogs(['🚀 Starting project...'])
            
            if (!webContainer) {
                showNotification('WebContainer not ready')
                return
            }
            
            await webContainer.mount(fileTree)
            addLog('📦 Installing dependencies...')
            
            const installProcess = await webContainer.spawn('npm', ['install'])
            installProcess.output.pipeTo(new WritableStream({
                write(chunk) { addLog(chunk) }
            }))
            
            addLog('🎯 Starting server...')
            const runProcess = await webContainer.spawn('npm', ['start'])
            runProcess.output.pipeTo(new WritableStream({
                write(chunk) { addLog(chunk) }
            }))
            
            webContainer.on('server-ready', (port, url) => {
                setPreviewUrl(url)
                addLog(`✅ Server ready: ${url}`)
                setIsLoading(false)
            })
            
        } catch (err) {
            addLog(`❌ Error: ${err.message}`)
            setIsLoading(false)
        }
    }
    
    // 💬 SIMPLIFIED MESSAGING
    const sendChatMessage = (e) => {
        e?.preventDefault()
        if (!message.trim()) return
        
        const messageData = { message, sender: user }
        sendMessage('project-message', messageData)
        setMessages(prev => [...prev, messageData])
        setMessage('')
    }
    
    // 👥 ADD COLLABORATORS
    const addCollaborators = () => {
        setIsLoading(true)
        axios.put('/projects/add-user', {
            projectId: project._id,
            users: Array.from(selectedUsers)
        }).then(res => {
            setProject(res.data.project)
            setSelectedUsers(new Set())
            setShowModal(null)
            showNotification('Collaborators added! 👥')
        }).catch(err => {
            console.error('Add user failed:', err)
            showNotification('Failed to add collaborators ❌')
        }).finally(() => setIsLoading(false))
    }
    
    // 🔧 HELPER FUNCTIONS
    const addLog = (log) => setLogs(prev => [...prev, log])
    const showNotification = (msg) => {
        // Simple notification system
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg z-50'
        notification.textContent = msg
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
    }
    
    const getFileIcon = (fileName) => {
        if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return '🟨'
        if (fileName.endsWith('.html')) return '🟧'
        if (fileName.endsWith('.css')) return '🟦'
        if (fileName.endsWith('.json')) return '🟩'
        if (fileName.endsWith('.md')) return '🟪'
        return '📄'
    }
    
    // 🎯 INITIALIZATION
    useEffect(() => {
        const init = async () => {
            try {
                // Initialize WebContainer
                const container = await getWebContainer()
                setWebContainer(container)
                
                // Initialize Socket
                initializeSocket(project._id)
                receiveMessage('project-message', (data) => {
                    setMessages(prev => [...prev, data])
                })
                
                // Load project data
                const projectRes = await axios.get(`/projects/get-project/${project._id}`)
                setProject(projectRes.data.project)
                setFileTree(projectRes.data.project.fileTree || {})
                
                // Load users
                const usersRes = await axios.get('/users/all')
                setUsers(usersRes.data.users)
                
            } catch (err) {
                console.error('Initialization failed:', err)
                showNotification('Failed to load project ❌')
            }
        }
        
        init()
    }, [])
    
    // ⌨️ KEYBOARD SHORTCUTS
    useEffect(() => {
        const handleKeyboard = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                saveFile()
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault()
                runProject()
            }
        }
        
        document.addEventListener('keydown', handleKeyboard)
        return () => document.removeEventListener('keydown', handleKeyboard)
    }, [currentFile])

    return (
        <div className="h-screen w-screen flex bg-gray-100">
            {/* 📱 LEFT SIDEBAR */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <FiArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex-1 mx-3">
                            <h1 className="font-bold text-lg truncate">{project.name}</h1>
                            <p className="text-sm text-gray-500">{project.users?.length || 0} collaborators</p>
                        </div>
                        <button 
                            onClick={() => setShowModal('settings')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <FiSettings className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200">
                    {[
                        { id: 'files', icon: FiFolder, label: 'Files' },
                        { id: 'chat', icon: FiSend, label: 'Chat' },
                        { id: 'users', icon: FiUsers, label: 'Team' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 p-3 flex items-center justify-center space-x-2 ${
                                activeTab === tab.id 
                                    ? 'border-b-2 border-blue-500 text-blue-600' 
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>
                
                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    {/* FILES TAB */}
                    {activeTab === 'files' && (
                        <div className="h-full flex flex-col">
                            <div className="p-3 border-b border-gray-200">
                                <button
                                    onClick={() => setShowModal('createFile')}
                                    className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <FiPlus className="h-4 w-4" />
                                    <span>New File</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-3">
                                {Object.keys(fileTree).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <FiFile className="h-12 w-12 mx-auto mb-3" />
                                        <p>No files yet</p>
                                        <button 
                                            onClick={() => setShowModal('createFile')}
                                            className="mt-2 text-blue-600 hover:underline"
                                        >
                                            Create your first file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {Object.keys(fileTree).map(fileName => (
                                            <div 
                                                key={fileName}
                                                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer group ${
                                                    currentFile === fileName ? 'bg-blue-100' : 'hover:bg-gray-100'
                                                }`}
                                                onClick={() => {
                                                    setCurrentFile(fileName)
                                                    if (!openFiles.includes(fileName)) {
                                                        setOpenFiles([...openFiles, fileName])
                                                    }
                                                }}
                                            >
                                                <span className="text-lg">{getFileIcon(fileName)}</span>
                                                <span className="flex-1 text-sm font-medium truncate">{fileName}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        deleteFile(fileName)
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded"
                                                >
                                                    <FiTrash2 className="h-3 w-3 text-red-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* CHAT TAB */}
                    {activeTab === 'chat' && (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-auto p-3 space-y-3">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <FiSend className="h-12 w-12 mx-auto mb-3" />
                                        <p>No messages yet</p>
                                        <p className="text-xs">Start collaborating!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div 
                                            key={index}
                                            className={`p-3 rounded-lg ${
                                                msg.sender._id === user._id 
                                                    ? 'bg-blue-100 ml-4' 
                                                    : 'bg-gray-100 mr-4'
                                            }`}
                                        >
                                            <div className="text-xs text-gray-600 mb-1">
                                                {msg.sender.email || 'Anonymous'}
                                            </div>
                                            <div className="text-sm">{msg.message}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={sendChatMessage} className="p-3 border-t border-gray-200">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!message.trim()}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <FiSend className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    
                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="h-full flex flex-col">
                            <div className="p-3 border-b border-gray-200">
                                <button
                                    onClick={() => setShowModal('addUser')}
                                    className="w-full flex items-center justify-center space-x-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <FiPlus className="h-4 w-4" />
                                    <span>Add User</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-3">
                                {project.users?.length > 0 ? (
                                    <div className="space-y-2">
                                        {project.users.map((collaborator, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {collaborator.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{collaborator.email}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {collaborator._id === project.creator ? 'Owner' : 'Collaborator'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FiUsers className="h-12 w-12 mx-auto mb-3" />
                                        <p>No collaborators yet</p>
                                        <button 
                                            onClick={() => setShowModal('addUser')}
                                            className="mt-2 text-blue-600 hover:underline"
                                        >
                                            Add collaborators
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 💻 MAIN EDITOR AREA */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h2 className="font-medium">Code Editor</h2>
                        {currentFile && (
                            <div className="flex items-center space-x-2 text-sm">
                                <span>{getFileIcon(currentFile)}</span>
                                <span>{currentFile}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={saveFile}
                            disabled={!currentFile}
                            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            <FiSave className="h-4 w-4" />
                            <span>Save</span>
                        </button>
                        <button
                            onClick={runProject}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-3 py-1 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <FiRefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <FiPlay className="h-4 w-4" />
                            )}
                            <span>{isLoading ? 'Running...' : 'Run'}</span>
                        </button>
                    </div>
                </div>
                
                {/* File Tabs */}
                {openFiles.length > 0 && (
                    <div className="bg-gray-700 text-white flex items-center overflow-x-auto">
                        {openFiles.map(fileName => (
                            <div 
                                key={fileName}
                                className={`flex items-center space-x-2 px-4 py-2 cursor-pointer ${
                                    currentFile === fileName ? 'bg-gray-800' : 'hover:bg-gray-600'
                                }`}
                                onClick={() => setCurrentFile(fileName)}
                            >
                                <span>{getFileIcon(fileName)}</span>
                                <span className="text-sm">{fileName}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenFiles(openFiles.filter(f => f !== fileName))
                                        if (currentFile === fileName) {
                                            setCurrentFile(openFiles[0] || null)
                                        }
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FiX className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Code Editor */}
                <div className="flex-1 flex">
                    <div className="flex-1 bg-gray-900">
                        {currentFile ? (
                            <textarea
                                id="code-editor"
                                className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
                                defaultValue={fileTree[currentFile]?.file?.contents || ''}
                                placeholder="Start coding..."
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <FiCode className="h-16 w-16 mx-auto mb-4" />
                                    <p className="text-lg font-medium">Welcome to your project!</p>
                                    <p className="text-sm">Select a file to start coding</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Preview Panel */}
                    {previewUrl && (
                        <div className="w-1/2 border-l border-gray-300">
                            <div className="bg-gray-100 p-2 border-b border-gray-300 flex items-center justify-between">
                                <h3 className="font-medium">Preview</h3>
                                <button
                                    onClick={() => setPreviewUrl(null)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <FiX className="h-4 w-4" />
                                </button>
                            </div>
                            <iframe
                                src={previewUrl}
                                className="w-full h-full"
                                title="Preview"
                            />
                        </div>
                    )}
                </div>
                
                {/* Console */}
                {showConsole && (
                    <div className="h-48 bg-gray-800 text-white border-t border-gray-600">
                        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
                            <h3 className="font-medium">Console</h3>
                            <button
                                onClick={() => setShowConsole(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 h-full overflow-auto font-mono text-sm">
                            {logs.map((log, index) => (
                                <div key={index} className="mb-1">{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* 🎭 MODALS */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg w-96 max-h-96 overflow-auto">
                        {/* Create File Modal */}
                        {showModal === 'createFile' && (
                            <>
                                <div className="p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold">Create New File</h2>
                                </div>
                                <div className="p-4">
                                    <input
                                        type="text"
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        placeholder="Enter file name (e.g., index.js)"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="p-4 border-t border-gray-200 flex space-x-2">
                                    <button
                                        onClick={() => setShowModal(null)}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={createFile}
                                        disabled={!newFileName.trim()}
                                        className="flex-1 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Create
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {/* Add User Modal */}
                        {showModal === 'addUser' && (
                            <>
                                <div className="p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold">Add Collaborators</h2>
                                </div>
                                <div className="p-4 max-h-64 overflow-auto">
                                    {users.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={() => {
                                                const newSelected = new Set(selectedUsers)
                                                if (newSelected.has(user._id)) {
                                                    newSelected.delete(user._id)
                                                } else {
                                                    newSelected.add(user._id)
                                                }
                                                setSelectedUsers(newSelected)
                                            }}
                                            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${
                                                selectedUsers.has(user._id) ? 'bg-blue-100' : 'hover:bg-gray-100'
                                            }`}
                                        >
                                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {user.email?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{user.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-gray-200 flex space-x-2">
                                    <button
                                        onClick={() => setShowModal(null)}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addCollaborators}
                                        disabled={selectedUsers.size === 0 || isLoading}
                                        className="flex-1 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Adding...' : `Add (${selectedUsers.size})`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <Tooltip id="tooltip" />
        </div>
    )
}

export default SimpleProject
