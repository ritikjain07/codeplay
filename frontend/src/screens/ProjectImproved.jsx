import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
// Use dynamic import to avoid build errors
// import { getWebContainer } from '../config/webcontainer'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

// Icons
import { 
  FiSend, FiX, FiCode, FiPlay, FiUsers, FiPlusCircle, 
  FiFile, FiFolder, FiDownload, FiUpload, FiSave, 
  FiPlus, FiSettings, FiTrash2, FiAlertCircle, FiEdit,
  FiCopy, FiArrowLeft, FiRefreshCw, FiLogOut, FiTerminal 
} from 'react-icons/fi'

// Syntax highlighting component
function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

// File Tree Component
const FileTree = ({ fileTree, currentFile, setCurrentFile, openFiles, setOpenFiles, deleteFile, saveFileTree, unsavedChanges }) => {
    const [searchTerm, setSearchTerm] = useState('')
    
    const filteredFiles = Object.keys(fileTree).filter(file => 
        file.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getFileIcon = (fileName) => {
        if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) 
            return <span className="text-yellow-400 text-xs font-bold">JS</span>
        if (fileName.endsWith('.html')) 
            return <span className="text-orange-400 text-xs font-bold">HTML</span>
        if (fileName.endsWith('.css')) 
            return <span className="text-blue-400 text-xs font-bold">CSS</span>
        if (fileName.endsWith('.json')) 
            return <span className="text-green-400 text-xs font-bold">JSON</span>
        if (fileName.endsWith('.md')) 
            return <span className="text-purple-400 text-xs font-bold">MD</span>
        return <FiFile className="text-gray-400 h-4 w-4" />
    }

    const openFile = (file) => {
        setCurrentFile(file)
        if (!openFiles.includes(file)) {
            setOpenFiles([...openFiles, file])
        }
    }

    const renameFile = (oldName) => {
        const newName = prompt('Rename file:', oldName)
        if (newName && newName !== oldName && !fileTree[newName]) {
            const newTree = { ...fileTree }
            newTree[newName] = { ...newTree[oldName] }
            delete newTree[oldName]
            
            // Update open files
            const updatedOpenFiles = openFiles.map(f => f === oldName ? newName : f)
            setOpenFiles(updatedOpenFiles)
            
            // Update current file
            if (currentFile === oldName) {
                setCurrentFile(newName)
            }
            
            saveFileTree(newTree)
        }
    }

    return (
        <div className="h-full bg-gray-900 text-white flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-700">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2 px-3 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                    {searchTerm && (
                        <FiX 
                            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                            onClick={() => setSearchTerm('')}
                        />
                    )}
                </div>
            </div>

            {/* Files List */}
            <div className="flex-grow overflow-auto p-3">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs uppercase text-gray-400 font-semibold flex items-center">
                        <FiFolder className="h-3.5 w-3.5 mr-1.5" />
                        Files ({filteredFiles.length})
                    </h3>
                </div>
                
                {filteredFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FiFile className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">
                            {searchTerm ? `No files match "${searchTerm}"` : 'No files yet'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredFiles.map((file) => (
                            <div 
                                key={file}
                                className={`group flex items-center px-2 py-2 rounded cursor-pointer ${
                                    currentFile === file ? 'bg-blue-600' : 'hover:bg-gray-800'
                                }`}
                                onClick={() => openFile(file)}
                            >
                                <div className="w-6 h-6 flex items-center justify-center mr-2">
                                    {getFileIcon(file)}
                                </div>
                                <span className="flex-grow text-sm truncate">{file}</span>
                                {unsavedChanges[file] && (
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                                )}
                                
                                {/* File Actions */}
                                <div className="hidden group-hover:flex items-center space-x-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            renameFile(file)
                                        }}
                                        className="p-1 hover:bg-gray-700 rounded"
                                        title="Rename"
                                    >
                                        <FiEdit className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm(`Delete ${file}?`)) {
                                                deleteFile(file)
                                            }
                                        }}
                                        className="p-1 hover:bg-red-600 rounded"
                                        title="Delete"
                                    >
                                        <FiTrash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Chat Component
const ChatPanel = ({ messages, message, setMessage, send, user, WriteAiMessage, messageBoxRef }) => {
    const quickActions = [
        { text: "How do I get started?", action: "How do I get started with this project?" },
        { text: "Create React component", action: "Generate a sample React component" },
        { text: "Add CSS styles", action: "Help me create some CSS styles" },
        { text: "Fix bugs", action: "Help me debug my code" },
    ]

    const askAI = (prompt) => {
        sendMessage('project-message', {
            message: prompt,
            sender: user
        })
    }

    return (
        <div className="h-full flex flex-col">
            {/* Messages */}
            <div 
                ref={messageBoxRef}
                className="flex-grow overflow-auto p-4 space-y-3"
            >
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FiCode className="h-12 w-12 mx-auto mb-3" />
                        <h3 className="font-medium mb-2">Start collaborating!</h3>
                        <p className="text-sm mb-4">Ask AI for help or chat with your team</p>
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => askAI(item.action)}
                                    className="p-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                                >
                                    {item.text}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index}
                            className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                                msg.sender._id === 'ai' 
                                    ? 'bg-gray-800 text-white' 
                                    : msg.sender._id === user._id 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-200 text-gray-800'
                            }`}>
                                <div className="flex items-center mb-1">
                                    <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold mr-2">
                                        {msg.sender._id === 'ai' ? 'AI' : msg.sender.email?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-xs opacity-75">
                                        {msg.sender._id === 'ai' ? 'AI Assistant' : msg.sender.email}
                                    </span>
                                </div>
                                <div className="text-sm">
                                    {msg.sender._id === 'ai' ? WriteAiMessage(msg.message) : msg.message}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Message Input */}
            <form onSubmit={send} className="p-4 border-t border-gray-200">
                <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-grow py-2 px-4 bg-transparent outline-none"
                        type="text"
                        placeholder="Type a message..."
                    />
                    <button
                        type="submit"
                        className="p-2 px-4 text-blue-600 hover:bg-blue-50 transition-colors"
                        disabled={!message.trim()}
                    >
                        <FiSend className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    )
}

// Code Editor Component
const CodeEditor = ({ currentFile, fileTree, setFileTree, saveFileTree, unsavedChanges, setUnsavedChanges, openFiles, setOpenFiles, setCurrentFile }) => {
    const handleFileChange = (e) => {
        if (!currentFile) return
        
        const updatedContent = e.target.value
        const currentContent = fileTree[currentFile]?.file?.contents || ''
        
        if (updatedContent !== currentContent) {
            setUnsavedChanges({ ...unsavedChanges, [currentFile]: true })
        } else {
            const newUnsavedChanges = { ...unsavedChanges }
            delete newUnsavedChanges[currentFile]
            setUnsavedChanges(newUnsavedChanges)
        }
    }

    const saveCurrentFile = () => {
        if (!currentFile) return
        
        const updatedContent = document.querySelector('.code-editor-textarea')?.value || ''
        
        const ft = {
            ...fileTree,
            [currentFile]: {
                file: {
                    contents: updatedContent
                }
            }
        }
        
        setFileTree(ft)
        saveFileTree(ft)
        
        // Remove from unsaved changes
        const newUnsavedChanges = { ...unsavedChanges }
        delete newUnsavedChanges[currentFile]
        setUnsavedChanges(newUnsavedChanges)
    }

    const closeFile = (fileToClose) => {
        if (unsavedChanges[fileToClose]) {
            if (!confirm("You have unsaved changes. Close anyway?")) {
                return
            }
            const newUnsavedChanges = { ...unsavedChanges }
            delete newUnsavedChanges[fileToClose]
            setUnsavedChanges(newUnsavedChanges)
        }
        
        setOpenFiles(openFiles.filter(file => file !== fileToClose))
        if (currentFile === fileToClose) {
            const remainingFiles = openFiles.filter(file => file !== fileToClose)
            setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null)
        }
    }

    return (
        <div className="flex-grow flex flex-col bg-gray-900 text-white">
            {/* Tabs */}
            {openFiles.length > 0 && (
                <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
                    {openFiles.map((file) => (
                        <div 
                            key={file}
                            className={`flex items-center px-4 py-2 cursor-pointer min-w-max ${
                                currentFile === file ? 'bg-gray-900' : 'hover:bg-gray-700'
                            }`}
                            onClick={() => setCurrentFile(file)}
                        >
                            <span className="text-sm mr-2">{file}</span>
                            {unsavedChanges[file] && (
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                            )}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    closeFile(file)
                                }} 
                                className="p-1 rounded hover:bg-gray-600"
                            >
                                <FiX className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor */}
            <div className="flex-grow">
                {currentFile ? (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                            <span className="text-sm text-gray-300">{currentFile}</span>
                            <button
                                onClick={saveCurrentFile}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                            >
                                <FiSave className="h-4 w-4" />
                                Save
                            </button>
                        </div>
                        <textarea
                            className="code-editor-textarea flex-grow p-4 bg-gray-900 text-white border-none outline-none resize-none font-mono text-sm"
                            value={fileTree[currentFile]?.file?.contents || ''}
                            onChange={handleFileChange}
                            placeholder="Start coding..."
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <FiCode className="h-16 w-16 mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No file selected</h3>
                            <p>Select a file from the explorer to start editing</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Console Component
const Console = ({ logs, showConsole, setShowConsole }) => {
    const consoleRef = useRef(null)

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight
        }
    }, [logs])

    if (!showConsole) return null

    return (
        <div className="h-48 bg-gray-800 text-white flex flex-col border-t border-gray-700">
            <div className="flex items-center justify-between p-2 bg-gray-900">
                <h3 className="text-sm font-medium flex items-center">
                    <FiTerminal className="h-4 w-4 mr-2" />
                    Console
                </h3>
                <button 
                    onClick={() => setShowConsole(false)} 
                    className="p-1 rounded hover:bg-gray-700"
                >
                    <FiX className="h-4 w-4" />
                </button>
            </div>
            <div 
                ref={consoleRef}
                className="flex-grow overflow-auto p-3 text-xs font-mono whitespace-pre-wrap"
            >
                {logs.length === 0 ? (
                    <div className="text-gray-500">Console output will appear here...</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="mb-1">{log}</div>
                    ))
                )}
            </div>
        </div>
    )
}

// Main Project Component
const ProjectImproved = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useContext(UserContext)
    const messageBoxRef = useRef(null)

    // State
    const [project, setProject] = useState(location.state?.project || {})
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [unsavedChanges, setUnsavedChanges] = useState({})
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [logs, setLogs] = useState([])
    const [showConsole, setShowConsole] = useState(false)
    const [runProcess, setRunProcess] = useState(null)

    // Modals
    const [showCollaborators, setShowCollaborators] = useState(false)
    const [showAddCollaborators, setShowAddCollaborators] = useState(false)
    const [showCreateFile, setShowCreateFile] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState(new Set())
    const [newFileName, setNewFileName] = useState('')
    const [newFileContent, setNewFileContent] = useState('')

    // AI Message renderer
    const WriteAiMessage = (message) => {
        try {
            const messageObject = JSON.parse(message)
            return (
                <div className='overflow-auto bg-gray-900 text-white rounded-lg p-3'>
                    <Markdown
                        children={messageObject.text}
                        options={{
                            overrides: {
                                code: SyntaxHighlightedCode,
                            },
                        }}
                    />
                </div>
            )
        } catch (error) {
            return <div className='text-red-500'>Error parsing AI message</div>
        }
    }

    // Handlers
    const send = (e) => {
        e?.preventDefault()
        if (!message.trim()) return
        
        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prev => [...prev, { sender: user, message }])
        setMessage("")
        setTimeout(() => {
            if (messageBoxRef.current) {
                messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight
            }
        }, 100)
    }

    const saveFileTree = (ft) => {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(() => {
            console.log("File tree saved")
        }).catch(err => {
            console.error("Error saving file tree:", err)
        })
    }

    const createNewFile = () => {
        if (!newFileName.trim()) return
        
        const newTree = { ...fileTree }
        newTree[newFileName] = {
            file: {
                contents: newFileContent
            }
        }
        
        setFileTree(newTree)
        saveFileTree(newTree)
        setCurrentFile(newFileName)
        
        if (!openFiles.includes(newFileName)) {
            setOpenFiles([...openFiles, newFileName])
        }
        
        setShowCreateFile(false)
        setNewFileName('')
        setNewFileContent('')
    }

    const deleteFile = (fileName) => {
        const newTree = { ...fileTree }
        delete newTree[fileName]
        
        setFileTree(newTree)
        saveFileTree(newTree)
        
        if (openFiles.includes(fileName)) {
            const newOpenFiles = openFiles.filter(file => file !== fileName)
            setOpenFiles(newOpenFiles)
            
            if (currentFile === fileName) {
                setCurrentFile(newOpenFiles.length > 0 ? newOpenFiles[0] : null)
            }
        }
    }

    const runProject = async () => {
        try {
            setIsLoading(true)
            setLogs([])
            setShowConsole(true)
            
            if (!webContainer) {
                setLogs(prev => [...prev, "❌ WebContainer not initialized"])
                setIsLoading(false)
                return
            }
            
            await webContainer.mount(fileTree)
            setLogs(prev => [...prev, "📦 Installing dependencies..."])
            
            const installProcess = await webContainer.spawn("npm", ["install"])
            
            const installWriter = new WritableStream({
                write(chunk) {
                    setLogs(prev => [...prev, chunk])
                }
            })
            
            await installProcess.output.pipeTo(installWriter)
            
            if (runProcess) {
                runProcess.kill()
            }
            
            setLogs(prev => [...prev, "🚀 Starting development server..."])
            
            const tempRunProcess = await webContainer.spawn("npm", ["start"])
            
            const runWriter = new WritableStream({
                write(chunk) {
                    setLogs(prev => [...prev, chunk])
                }
            })
            
            tempRunProcess.output.pipeTo(runWriter)
            setRunProcess(tempRunProcess)

            webContainer.on('server-ready', (port, url) => {
                setLogs(prev => [...prev, `✅ Server ready at ${url}`])
                setIsLoading(false)
            })
        } catch (err) {
            console.error("Error running project:", err)
            setLogs(prev => [...prev, `❌ Error: ${err.message}`])
            setIsLoading(false)
        }
    }

    const addCollaborators = () => {
        setIsLoading(true)
        axios.put("/projects/add-user", {
            projectId: project._id,
            users: Array.from(selectedUsers)
        }).then(res => {
            setProject(res.data.project)
            setShowAddCollaborators(false)
            setSelectedUsers(new Set())
            setIsLoading(false)
        }).catch(err => {
            console.error(err)
            setIsLoading(false)
        })
    }

    // Effects
    useEffect(() => {
        if (!project._id) {
            navigate('/dashboard')
            return
        }

        const socket = initializeSocket(project._id)

        // Initialize WebContainer
        if (!webContainer) {
            // Dynamic import to avoid build issues
            import('../config/webcontainer.js').then(module => {
                module.getWebContainer().then(container => {
                    setWebContainer(container)
                })
            }).catch(err => {
                console.error("Error initializing container:", err)
                setLogs(prev => [...prev, `❌ Error initializing WebContainer: ${err.message}`])
            })
        }

        // Message handler
        const handleMessage = (data) => {
            if (data.sender._id === 'ai') {
                try {
                    const message = JSON.parse(data.message)
                    
                    if (message.fileTree) {
                        webContainer?.mount(message.fileTree)
                        setFileTree(message.fileTree)
                    }
                    
                    setMessages(prev => [...prev, data])
                } catch (error) {
                    console.error("Error handling AI message:", error)
                }
            } else {
                setMessages(prev => [...prev, data])
            }
        }

        receiveMessage('project-message', handleMessage)

        // Fetch project data
        axios.get(`/projects/get-project/${project._id}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        }).catch(err => {
            console.error("Error fetching project:", err)
        })

        // Fetch users
        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.error("Error fetching users:", err)
        })

        // Keyboard shortcuts
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                // Save current file
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault()
                runProject()
            }
        }
        
        document.addEventListener('keydown', handleKeyDown)

        // Cleanup
        return () => {
            if (socket) {
                socket.off('project-message', handleMessage)
            }
            if (runProcess) {
                runProcess.kill()
            }
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [project._id])

    return (
        <main className="h-screen w-screen flex bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <section className="w-96 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <button 
                            onClick={() => navigate('/dashboard')} 
                            className="mr-3 p-2 rounded-full hover:bg-gray-100"
                            title="Back to Dashboard"
                        >
                            <FiArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-800">{project.name}</h1>
                            <p className="text-sm text-gray-500">{project.description || "No description"}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setShowAddCollaborators(true)} 
                            className="p-2 rounded-full hover:bg-gray-100"
                            title="Add collaborators"
                        >
                            <FiPlusCircle className="h-5 w-5 text-blue-600" />
                        </button>
                        <button 
                            onClick={() => setShowCollaborators(!showCollaborators)} 
                            className={`p-2 rounded-full ${showCollaborators ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            title="View collaborators"
                        >
                            <FiUsers className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                {showCollaborators ? (
                    <div className="flex-grow p-4">
                        <h2 className="text-lg font-semibold mb-4">Collaborators</h2>
                        <div className="space-y-2">
                            {project.users?.map((collaborator, index) => (
                                <div key={index} className="flex items-center p-2 rounded-lg bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                        {collaborator.email?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="ml-3">
                                        <div className="font-medium text-sm">{collaborator.email}</div>
                                        <div className="text-xs text-gray-500">
                                            {collaborator._id === project.creator ? 'Owner' : 'Collaborator'}
                                        </div>
                                    </div>
                                </div>
                            )) || (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No collaborators yet</p>
                                    <button 
                                        onClick={() => setShowAddCollaborators(true)} 
                                        className="mt-2 text-blue-600 hover:underline"
                                    >
                                        Add collaborators
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <ChatPanel 
                        messages={messages}
                        message={message}
                        setMessage={setMessage}
                        send={send}
                        user={user}
                        WriteAiMessage={WriteAiMessage}
                        messageBoxRef={messageBoxRef}
                    />
                )}
            </section>

            {/* Main Content */}
            <section className="flex-grow flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-3 bg-gray-800 text-white">
                    <div className="flex items-center space-x-4">
                        <h2 className="font-medium">Project Files</h2>
                        <button
                            onClick={() => setShowCreateFile(true)}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                        >
                            <FiPlus className="h-4 w-4" />
                            New File
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={runProject}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <FiRefreshCw className="h-4 w-4 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                <>
                                    <FiPlay className="h-4 w-4" />
                                    Run Project
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-grow flex overflow-hidden">
                    {/* File Explorer */}
                    <div className="w-64">
                        <FileTree 
                            fileTree={fileTree}
                            currentFile={currentFile}
                            setCurrentFile={setCurrentFile}
                            openFiles={openFiles}
                            setOpenFiles={setOpenFiles}
                            deleteFile={deleteFile}
                            saveFileTree={saveFileTree}
                            unsavedChanges={unsavedChanges}
                        />
                    </div>

                    {/* Code Editor */}
                    <CodeEditor 
                        currentFile={currentFile}
                        fileTree={fileTree}
                        setFileTree={setFileTree}
                        saveFileTree={saveFileTree}
                        unsavedChanges={unsavedChanges}
                        setUnsavedChanges={setUnsavedChanges}
                        openFiles={openFiles}
                        setOpenFiles={setOpenFiles}
                        setCurrentFile={setCurrentFile}
                    />
                </div>

                {/* Console */}
                <Console 
                    logs={logs}
                    showConsole={showConsole}
                    setShowConsole={setShowConsole}
                />
            </section>

            {/* Modals */}
            
            {/* Add Collaborators Modal */}
            {showAddCollaborators && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-96 max-h-96">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold">Add Collaborators</h2>
                            <button 
                                onClick={() => setShowAddCollaborators(false)} 
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 max-h-64 overflow-auto">
                            <div className="space-y-2">
                                {users.map((user) => (
                                    <div 
                                        key={user._id} 
                                        className={`flex items-center p-2 rounded-lg cursor-pointer ${
                                            selectedUsers.has(user._id) ? 'bg-blue-100' : 'hover:bg-gray-100'
                                        }`}
                                        onClick={() => {
                                            const newSelected = new Set(selectedUsers)
                                            if (newSelected.has(user._id)) {
                                                newSelected.delete(user._id)
                                            } else {
                                                newSelected.add(user._id)
                                            }
                                            setSelectedUsers(newSelected)
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                            {user.email?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="ml-3">
                                            <div className="font-medium text-sm">{user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end items-center p-4 border-t">
                            <button 
                                onClick={() => setShowAddCollaborators(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={addCollaborators} 
                                className="ml-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
                                disabled={selectedUsers.size === 0 || isLoading}
                            >
                                {isLoading ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create File Modal */}
            {showCreateFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-96">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold">Create New File</h2>
                            <button 
                                onClick={() => setShowCreateFile(false)} 
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    File name
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., App.jsx, styles.css"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Initial content (optional)
                                </label>
                                <textarea 
                                    placeholder="Enter file content..."
                                    value={newFileContent}
                                    onChange={(e) => setNewFileContent(e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                                    rows="4"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end items-center p-4 border-t">
                            <button 
                                onClick={() => setShowCreateFile(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={createNewFile} 
                                className="ml-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
                                disabled={!newFileName.trim()}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Tooltip id="main-tooltip" />
        </main>
    )
}

export default ProjectImproved
