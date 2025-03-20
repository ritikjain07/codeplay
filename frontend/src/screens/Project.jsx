import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { getWebContainer } from '../config/webcontainer'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

// Icons - you may need to install react-icons first: npm install react-icons
import { 
  FiSend, FiX, FiCode, FiPlay, FiUsers, FiPlusCircle, 
  FiFile, FiFolder, FiDownload, FiUpload, FiSave, 
  FiPlus, FiSettings, FiTrash2, FiAlertCircle, FiEdit,
  FiCopy, FiArrowLeft, FiRefreshCw, FiLogOut 
} from 'react-icons/fi'

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

const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()
    
    // State variables
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state.project)
    const [message, setMessage] = useState('')
    const { user } = useContext(UserContext)
    const messageBoxRef = useRef(null)

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})

    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [unsavedChanges, setUnsavedChanges] = useState({})

    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [logs, setLogs] = useState([])
    const [showConsole, setShowConsole] = useState(false)

    const [runProcess, setRunProcess] = useState(null)
    
    const [newFileName, setNewFileName] = useState('')
    const [newFileContent, setNewFileContent] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    // Handlers
    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }

    function addCollaborators() {
        setIsLoading(true)
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            setProject(res.data.project)
            setIsModalOpen(false)
            setIsLoading(false)
            setSelectedUserId(new Set())
        }).catch(err => {
            console.log(err)
            setIsLoading(false)
        })
    }

    const send = (e) => {
        e?.preventDefault()
        if (!message.trim()) return
        
        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [...prevMessages, { sender: user, message }])
        setMessage("")
        setTimeout(scrollToBottom, 100)
    }

    function WriteAiMessage(message) {
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

    function scrollToBottom() {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight
        }
    }

    async function runProject() {
        try {
            setIsLoading(true)
            setLogs([])
            setShowConsole(true)
            
            await webContainer.mount(fileTree)
            
            addToLogs("📦 Installing dependencies...")
            
            const installProcess = await webContainer.spawn("npm", ["install"])
            
            const installWriter = new WritableStream({
                write(chunk) {
                    addToLogs(chunk)
                    console.log(chunk)
                }
            })
            
            await installProcess.output.pipeTo(installWriter)
            
            if (runProcess) {
                runProcess.kill()
            }
            
            addToLogs("🚀 Starting development server...")
            
            let tempRunProcess = await webContainer.spawn("npm", ["start"])
            
            const runWriter = new WritableStream({
                write(chunk) {
                    addToLogs(chunk)
                    console.log(chunk)
                }
            })
            
            tempRunProcess.output.pipeTo(runWriter)
            setRunProcess(tempRunProcess)

            webContainer.on('server-ready', (port, url) => {
                addToLogs(`✅ Server ready at ${url}`)
                setIframeUrl(url)
                setIsLoading(false)
            })
        } catch (err) {
            console.error("Error running project:", err)
            addToLogs(`❌ Error: ${err.message}`)
            setIsLoading(false)
        }
    }

    function addToLogs(message) {
        setLogs(prev => [...prev, message])
        setTimeout(() => {
            const consoleElement = document.getElementById('console-output')
            if (consoleElement) {
                consoleElement.scrollTop = consoleElement.scrollHeight
            }
        }, 10)
    }

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log("File tree saved")
        }).catch(err => {
            console.error("Error saving file tree:", err)
        })
    }

    function createNewFile() {
        if (!newFileName.trim()) return
        
        const newTree = {...fileTree}
        newTree[newFileName] = {
            file: {
                contents: newFileContent
            }
        }
        
        setFileTree(newTree)
        saveFileTree(newTree)
        setIsCreateFileModalOpen(false)
        setNewFileName('')
        setNewFileContent('')
        
        // Open the newly created file
        setCurrentFile(newFileName)
        if (!openFiles.includes(newFileName)) {
            setOpenFiles([...openFiles, newFileName])
        }
    }
    
    function deleteFile(fileName) {
        const newTree = {...fileTree}
        delete newTree[fileName]
        
        setFileTree(newTree)
        saveFileTree(newTree)
        
        if (openFiles.includes(fileName)) {
            closeFile(fileName)
        }
    }

    function closeFile(fileToClose) {
        // Check for unsaved changes
        if (unsavedChanges[fileToClose]) {
            if (!confirm("You have unsaved changes. Are you sure you want to close this file?")) {
                return
            }
            const newUnsavedChanges = {...unsavedChanges}
            delete newUnsavedChanges[fileToClose]
            setUnsavedChanges(newUnsavedChanges)
        }
        
        setOpenFiles(openFiles.filter(file => file !== fileToClose))
        if (currentFile === fileToClose) {
            setCurrentFile(openFiles.length > 1 ? openFiles.filter(file => file !== fileToClose)[0] : null)
        }
    }
    
    function saveCurrentFile() {
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
        const newUnsavedChanges = {...unsavedChanges}
        delete newUnsavedChanges[currentFile]
        setUnsavedChanges(newUnsavedChanges)
        
        // Show temporary save indicator
        const saveIndicator = document.getElementById('save-indicator')
        if (saveIndicator) {
            saveIndicator.classList.remove('opacity-0')
            setTimeout(() => {
                saveIndicator.classList.add('opacity-0')
            }, 2000)
        }
    }
    
    function handleFileChange(e) {
        if (!currentFile) return
        
        const updatedContent = e.target.value
        const currentContent = fileTree[currentFile]?.file?.contents || ''
        
        if (updatedContent !== currentContent) {
            setUnsavedChanges({...unsavedChanges, [currentFile]: true})
        } else {
            const newUnsavedChanges = {...unsavedChanges}
            delete newUnsavedChanges[currentFile]
            setUnsavedChanges(newUnsavedChanges)
        }
    }
    
    function exportProject() {
        try {
            const projectData = JSON.stringify(fileTree, null, 2)
            const blob = new Blob([projectData], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-export.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("Error exporting project:", err)
            alert("Failed to export project")
        }
    }
    
    function handleImportFiles(e) {
        const file = e.target.files[0]
        if (!file) return
        
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const importedFileTree = JSON.parse(event.target.result)
                const newTree = {...fileTree, ...importedFileTree}
                setFileTree(newTree)
                saveFileTree(newTree)
                alert("Files imported successfully!")
            } catch (err) {
                console.error("Error parsing imported files:", err)
                alert("Failed to import files. Please make sure the file is in the correct format.")
            }
        }
        reader.readAsText(file)
    }
    
    function handleDeleteProject() {
        if (deleteConfirmation !== project.name) return
        
        axios.delete(`/projects/delete/${project._id}`)
            .then(() => {
                navigate('/dashboard')
            })
            .catch(err => {
                console.error("Error deleting project:", err)
                alert("Failed to delete project")
            })
    }
    
    function getFileLanguage(fileName) {
        if (fileName.endsWith('.js')) return 'javascript'
        if (fileName.endsWith('.jsx')) return 'javascript'
        if (fileName.endsWith('.ts')) return 'typescript'
        if (fileName.endsWith('.tsx')) return 'typescript'
        if (fileName.endsWith('.html')) return 'html'
        if (fileName.endsWith('.css')) return 'css'
        if (fileName.endsWith('.json')) return 'json'
        if (fileName.endsWith('.md')) return 'markdown'
        return 'plaintext'
    }
    
    function askAI(prompt) {
        const message = `Help me with this: ${prompt}`
        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [...prevMessages, { sender: user, message }])
        setMessage("")
    }

    // Effects
    useEffect(() => {
        const socket = initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
            }).catch(err => {
                console.error("Error initializing container:", err)
                addToLogs(`❌ Error initializing WebContainer: ${err.message}`)
            })
        }

        // Create message handler OUTSIDE the listener setup
        const handleMessage = (data) => {
            if (data.sender._id === 'ai') {
                try {
                    const message = JSON.parse(data.message)
                    
                    if (message.fileTree) {
                        webContainer?.mount(message.fileTree)
                        setFileTree(message.fileTree)
                    }
                    
                    setMessages(prevMessages => [...prevMessages, data])
                    setTimeout(scrollToBottom, 100)
                } catch (error) {
                    console.error("Error handling AI message:", error)
                }
            } else {
                setMessages(prevMessages => [...prevMessages, data])
                setTimeout(scrollToBottom, 100)
            }
        }

        // Register the message handler for the event
        receiveMessage('project-message', handleMessage)

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        }).catch(err => {
            console.error("Error fetching project:", err)
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.error("Error fetching users:", err)
        })
        
        // Prevent closing browser tab if there are unsaved changes
        const handleBeforeUnload = (e) => {
            if (Object.keys(unsavedChanges).length > 0) {
                e.preventDefault()
                e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
                return "You have unsaved changes. Are you sure you want to leave?"
            }
        }
        
        window.addEventListener('beforeunload', handleBeforeUnload)
        
        // Cleanup function - VERY IMPORTANT
        return () => {
            // Remove the event listener to prevent duplicates
            if (socket) {
                socket.off('project-message', handleMessage)
            }
            
            if (runProcess) {
                runProcess.kill()
            }
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, []) // Empty dependency array to only run once on mount

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Save file with Ctrl+S or Cmd+S
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                saveCurrentFile()
            }
            
            // Run project with Ctrl+R or Cmd+R
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault()
                runProject()
            }
        }
        
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [currentFile, fileTree])
    
    // Filter files by search term
    const filteredFiles = Object.keys(fileTree).filter(file => 
        file.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <main className="h-screen w-screen flex bg-gray-100 overflow-hidden">
            {/* Project Sidebar */}
            <section className="left relative flex flex-col h-screen w-96 border-r border-gray-200 bg-white shadow-sm">
                {/* Header */}
                <header className="flex justify-between items-center p-3 border-b border-gray-200 bg-white">
                    <div className="flex items-center">
                        <button 
                            onClick={() => navigate('/dashboard')} 
                            className="mr-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Back to Dashboard"
                        >
                            <FiArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800 truncate">{project.name}</h1>
                            <p className="text-sm text-gray-500">{project.description || "No description"}</p>
                        </div>
                    </div>
                    <div className="flex">
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="p-2 mr-2 rounded-full hover:bg-gray-100 transition-colors"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Add collaborators"
                        >
                            <FiPlusCircle className="h-5 w-5 text-blue-600" />
                        </button>
                        <button 
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                            className={`p-2 rounded-full ${isSidePanelOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'} transition-colors`}
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="View collaborators"
                        >
                            <FiUsers className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                            className={`p-2 ml-2 rounded-full ${isSettingsOpen ? 'bg-gray-200' : 'hover:bg-gray-100'} transition-colors`}
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Project settings"
                        >
                            <FiSettings className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </header>
                
                {/* Settings dropdown */}
                {isSettingsOpen && (
                    <div className="absolute right-3 top-14 z-30 bg-white shadow-lg rounded-lg border border-gray-200 w-64 py-1 overflow-hidden">
                        <div className="p-2 hover:bg-gray-100 text-sm cursor-pointer flex items-center" onClick={exportProject}>
                            <FiDownload className="mr-2 text-gray-600" /> Export project
                        </div>
                        <label className="p-2 hover:bg-gray-100 text-sm cursor-pointer flex items-center">
                            <FiUpload className="mr-2 text-gray-600" /> Import files
                            <input 
                                type="file" 
                                accept=".json" 
                                className="hidden"
                                onChange={handleImportFiles}
                            />
                        </label>
                        <div 
                            className="p-2 hover:bg-red-50 text-sm text-red-600 cursor-pointer flex items-center"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <FiTrash2 className="mr-2" /> Delete project
                        </div>
                    </div>
                )}
                
                {/* Messages area */}
                <div className="conversation-area flex-grow flex flex-col h-full relative px-2">
                    <div
                        ref={messageBoxRef}
                        className="message-box flex-grow flex flex-col gap-2 overflow-auto py-3 px-1 scrollbar-thin scrollbar-thumb-gray-300"
                    >
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <FiCode className="h-12 w-12 mb-3" />
                                <p className="text-center">No messages yet. Start collaborating!</p>
                                <div className="flex gap-2 mt-4">
                                    <button 
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full transition-colors"
                                        onClick={() => askAI("How do I get started with this project?")}
                                    >
                                        Get started
                                    </button>
                                    <button 
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full transition-colors"
                                        onClick={() => askAI("Generate a sample React component")}
                                    >
                                        Create sample component
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`${msg.sender._id === 'ai' ? 'max-w-[85%]' : 'max-w-[70%]'} ${msg.sender._id === user._id.toString() ? 'ml-auto' : 'mr-auto'} message flex flex-col p-3 ${msg.sender._id === 'ai' ? 'bg-gray-800 text-white' : msg.sender._id === user._id.toString() ? 'bg-blue-100' : 'bg-gray-100'} rounded-xl shadow-sm`}
                            >
                                <div className="flex items-center mb-1">
                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold mr-2">
                                        {msg.sender._id === 'ai' ? 'AI' : msg.sender.email?.[0].toUpperCase() || '?'}
                                    </div>
                                    <small className="text-xs opacity-75">
                                        {msg.sender._id === 'ai' ? 'AI Assistant' : msg.sender.email || 'Unknown'}
                                    </small>
                                </div>
                                <div className={`text-sm ${msg.sender._id === 'ai' ? 'prose prose-invert max-w-full' : ''}`}>
                                    {msg.sender._id === 'ai' ? WriteAiMessage(msg.message) : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message input */}
                    <form 
                        onSubmit={send}
                        className="input-area sticky bottom-0 bg-white p-3 border-t border-gray-200 shadow-md"
                    >
                        <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="py-2 px-4 border-none outline-none flex-grow bg-transparent"
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
                
                {/* Collaborators panel */}
                <div 
                    className={`sidePanel w-full h-full flex flex-col bg-white absolute z-20 transition-transform duration-300 ease-in-out ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 border-r border-gray-200 shadow-md`}
                >
                    <header className="flex justify-between items-center p-3 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Collaborators</h2>
                        <button 
                            onClick={() => setIsSidePanelOpen(false)} 
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <FiX className="h-5 w-5" />
                        </button>
                    </header>
                    
                    <div className="users-list flex flex-col gap-1 p-2 overflow-auto">
                        {project.users && project.users.length > 0 ? project.users.map((collaborator, index) => (
                            <div key={index} className="user p-2 flex gap-3 items-center rounded-lg hover:bg-gray-100">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                    {collaborator.email?.[0].toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h3 className="font-medium">{collaborator.email}</h3>
                                    <p className="text-xs text-gray-500">{collaborator._id === project.creator ? 'Owner' : 'Collaborator'}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No collaborators yet</p>
                                <button 
                                    onClick={() => {
                                        setIsSidePanelOpen(false)
                                        setIsModalOpen(true)
                                    }} 
                                    className="mt-2 text-blue-600 hover:underline"
                                >
                                    Add collaborators
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Code editor and preview */}
            <section className="right flex-grow h-full flex flex-col">
                {/* Toolbar */}
                <div className="flex justify-between items-center p-2 bg-gray-800 text-white">
                    <div className="flex items-center">
                        <h2 className="font-medium px-3">Project Files</h2>
                        <button
                            onClick={() => setIsCreateFileModalOpen(true)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-md"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Create new file"
                        >
                            <FiPlus className="h-3 w-3" />
                            New File
                        </button>
                        <div className="mx-2 text-gray-600">|</div>
                        <div id="save-indicator" className="text-green-500 text-xs opacity-0 transition-opacity duration-300">
                            File saved ✓
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentFile && (
                            <button
                                onClick={saveCurrentFile}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                                data-tooltip-id="main-tooltip"
                                data-tooltip-content="Save file (Ctrl+S)"
                            >
                                <FiSave className="h-4 w-4" />
                                Save
                            </button>
                        )}
                        <button
                            onClick={runProject}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
                            data-tooltip-id="main-tooltip"
                            data-tooltip-content="Run project (Ctrl+R)"
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
                
                {/* Main editor area */}
                <div className="flex flex-grow overflow-hidden">
                    {/* File explorer */}
                    <div className="explorer h-full w-64 bg-gray-900 text-white overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-gray-700">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search files..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full py-1 px-3 pr-8 bg-gray-800 text-white text-sm rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                                />
                                <FiX 
                                    className={`absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 cursor-pointer ${!searchTerm && 'hidden'}`}
                                    onClick={() => setSearchTerm('')}
                                />
                            </div>
                        </div>
                        
                        <div className="p-2 flex-grow overflow-auto">
                            <div className="p-2 flex-grow overflow-auto">
    <div className="flex justify-between items-center mb-3 px-2">
        <h3 className="text-xs uppercase text-gray-400 font-semibold flex items-center">
            <FiFolder className="h-3.5 w-3.5 mr-1.5" />
            <span>Files</span> 
        </h3>
        <div className="flex items-center">
            <span className="text-gray-500 text-xs">{Object.keys(fileTree).length}</span>
            <div className="flex ml-2">
                <button 
                    onClick={() => setIsCreateFileModalOpen(true)}
                    className="p-1 hover:bg-gray-800 rounded"
                    data-tooltip-id="file-tooltip"
                    data-tooltip-content="New file"
                >
                    <FiPlus className="h-3.5 w-3.5 text-gray-400 hover:text-blue-400" />
                </button>
            </div>
        </div>
    </div>
    
    <div className="file-tree space-y-1">
        {filteredFiles.length === 0 && searchTerm ? (
            <div className="text-center py-6">
                <div className="text-gray-500 text-sm">No files match "{searchTerm}"</div>
                <button 
                    onClick={() => setSearchTerm('')}
                    className="text-blue-500 text-xs hover:underline mt-2"
                >
                    Clear search
                </button>
            </div>
        ) : filteredFiles.length === 0 ? (
            <div className="text-center py-6">
                <div className="text-gray-500 text-sm">No files yet</div>
                <button 
                    onClick={() => setIsCreateFileModalOpen(true)}
                    className="mt-2 text-blue-500 text-xs hover:underline"
                >
                    Create your first file
                </button>
            </div>
        ) : (
            <>
                {/* Group files by type */}
                {(() => {
                    // Group files by extension/type
                    const groupedFiles = {
                        js: filteredFiles.filter(file => file.endsWith('.js') || file.endsWith('.jsx')),
                        html: filteredFiles.filter(file => file.endsWith('.html')),
                        css: filteredFiles.filter(file => file.endsWith('.css')),
                        other: filteredFiles.filter(file => 
                            !file.endsWith('.js') && 
                            !file.endsWith('.jsx') && 
                            !file.endsWith('.html') && 
                            !file.endsWith('.css')
                        )
                    };
                    
                    return Object.entries(groupedFiles).map(([type, files]) => {
                        if (files.length === 0) return null;
                        
                        return (
                            <div key={type} className="mb-3">
                                {files.length > 0 && (
                                    <div className="text-gray-500 text-xs mb-1 px-2 py-1">
                                        {type === 'js' && 'JavaScript'}
                                        {type === 'html' && 'HTML'}
                                        {type === 'css' && 'CSS'}
                                        {type === 'other' && 'Other Files'}
                                    </div>
                                )}
                                {files.map((file, index) => {
                                    // Determine file icon based on extension
                                    const getFileIcon = (fileName) => {
                                        if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) 
                                            return <span className="text-yellow-400">JS</span>;
                                        if (fileName.endsWith('.html')) 
                                            return <span className="text-orange-400">HTML</span>;
                                        if (fileName.endsWith('.css')) 
                                            return <span className="text-blue-400">CSS</span>;
                                        if (fileName.endsWith('.json')) 
                                            return <span className="text-green-400">JSON</span>;
                                        if (fileName.endsWith('.md')) 
                                            return <span className="text-purple-400">MD</span>;
                                        return <span className="text-gray-400">FILE</span>;
                                    };
                                    
                                    return (
                                        <div 
                                            key={index}
                                            className={`relative group flex items-center px-2 py-1.5 rounded ${
                                                currentFile === file ? 'bg-gray-700' : 'hover:bg-gray-800'
                                            }`}
                                        >
                                            <div 
                                                className="flex-grow flex items-center cursor-pointer"
                                                onClick={() => {
                                                    setCurrentFile(file);
                                                    if (!openFiles.includes(file)) {
                                                        setOpenFiles([...openFiles, file]);
                                                    }
                                                }}
                                            >
                                                <div className="w-5 h-5 flex items-center justify-center text-xs mr-2 font-mono">
                                                    {getFileIcon(file)}
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm truncate">{file}</span>
                                                    {unsavedChanges[file] && (
                                                        <span className="h-1.5 w-1.5 ml-2 bg-blue-500 rounded-full"></span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* File actions - visible on hover */}
                                            <div className="hidden group-hover:flex absolute right-2 items-center space-x-1">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(fileTree[file]?.file?.contents || '');
                                                        // Show temporary copy notification
                                                        const tempElement = document.createElement('div');
                                                        tempElement.className = 'absolute right-0 -top-8 bg-gray-700 text-white text-xs px-2 py-1 rounded';
                                                        tempElement.innerText = 'Copied!';
                                                        document.querySelector(`[data-file="${file}"]`).appendChild(tempElement);
                                                        setTimeout(() => tempElement.remove(), 1000);
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    data-tooltip-id="file-tooltip"
                                                    data-tooltip-content="Copy content"
                                                >
                                                    <FiCopy className="h-3 w-3 text-gray-400 hover:text-white" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newName = prompt('Rename file:', file);
                                                        if (newName && newName !== file) {
                                                            const newTree = {...fileTree};
                                                            newTree[newName] = {...newTree[file]};
                                                            delete newTree[file];
                                                            
                                                            // Update open files
                                                            const updatedOpenFiles = openFiles.map(f => f === file ? newName : f);
                                                            setOpenFiles(updatedOpenFiles);
                                                            
                                                            // Update current file
                                                            if (currentFile === file) {
                                                                setCurrentFile(newName);
                                                            }
                                                            
                                                            // Update unsaved changes
                                                            if (unsavedChanges[file]) {
                                                                const newUnsaved = {...unsavedChanges};
                                                                newUnsaved[newName] = true;
                                                                delete newUnsaved[file];
                                                                setUnsavedChanges(newUnsaved);
                                                            }
                                                            
                                                            setFileTree(newTree);
                                                            saveFileTree(newTree);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    data-tooltip-id="file-tooltip"
                                                    data-tooltip-content="Rename"
                                                >
                                                    <FiEdit className="h-3 w-3 text-gray-400 hover:text-white" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to delete ${file}?`)) {
                                                            deleteFile(file);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    data-tooltip-id="file-tooltip"
                                                    data-tooltip-content="Delete"
                                                >
                                                    <FiTrash2 className="h-3 w-3 text-gray-400 hover:text-red-400" />
                                                </button>
                                            </div>
                                            {/* Invisible element for copy notification */}
                                            <div data-file={file} className="relative"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    });
                })()}

                {/* Common templates section */}
                <div className="mt-5">
                    <h4 className="text-xs text-gray-500 mb-1 px-2 py-1">Templates</h4>
                    <div className="space-y-1">
                        <button 
                            className="w-full flex items-center px-2 py-1.5 hover:bg-gray-800 rounded"
                            onClick={() => {
                                const newFileName = `component-${Object.keys(fileTree).length + 1}.jsx`;
                                const newContent = `import React from 'react'\n\nfunction Component() {\n  return (\n    <div>\n      <h1>New Component</h1>\n    </div>\n  )\n}\n\nexport default Component`;
                                
                                const newTree = {...fileTree};
                                newTree[newFileName] = {
                                    file: { contents: newContent }
                                };
                                
                                setFileTree(newTree);
                                saveFileTree(newTree);
                                setCurrentFile(newFileName);
                                
                                if (!openFiles.includes(newFileName)) {
                                    setOpenFiles([...openFiles, newFileName]);
                                }
                            }}
                        >
                            <div className="w-5 h-5 flex items-center justify-center text-xs mr-2 font-mono text-yellow-400">
                                JSX
                            </div>
                            <span className="text-sm">React Component</span>
                        </button>
                        <button 
                            className="w-full flex items-center px-2 py-1.5 hover:bg-gray-800 rounded"
                            onClick={() => {
                                const newFileName = `styles-${Object.keys(fileTree).length + 1}.css`;
                                const newContent = `/* Basic styles */\n\nbody {\n  font-family: 'Inter', sans-serif;\n  line-height: 1.5;\n  color: #333;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 1rem;\n}`;
                                
                                const newTree = {...fileTree};
                                newTree[newFileName] = {
                                    file: { contents: newContent }
                                };
                                
                                setFileTree(newTree);
                                saveFileTree(newTree);
                                setCurrentFile(newFileName);
                                
                                if (!openFiles.includes(newFileName)) {
                                    setOpenFiles([...openFiles, newFileName]);
                                }
                            }}
                        >
                            <div className="w-5 h-5 flex items-center justify-center text-xs mr-2 font-mono text-blue-400">
                                CSS
                            </div>
                            <span className="text-sm">Stylesheet</span>
                        </button>
                    </div>
                </div>
            </>
        )}
    </div>
    
    {/* File tooltips */}
    <Tooltip id="file-tooltip" />
</div>
                        </div>
                    </div>
                    
                    {/* Open files tabs */}
                    <div className="tabs flex-shrink-0 bg-gray-800 text-white flex items-center overflow-x-auto">
                        {openFiles.map((file, index) => (
                            <div 
                                key={index} 
                                className={`tab flex items-center px-3 py-2 cursor-pointer ${currentFile === file ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                                onClick={() => setCurrentFile(file)}
                            >
                                <span className="text-sm truncate">{file}</span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        closeFile(file)
                                    }} 
                                    className="ml-2 p-1 rounded hover:bg-gray-600"
                                >
                                    <FiX className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    {/* Code editor */}
                    <div className="editor flex-grow flex flex-col bg-gray-900 text-white">
                        {currentFile ? (
                            <textarea
                                className="code-editor-textarea flex-grow p-4 bg-transparent border-none outline-none resize-none font-mono text-sm"
                                value={fileTree[currentFile]?.file?.contents || ''}
                                onChange={handleFileChange}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Select a file to start editing</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Console */}
                {showConsole && (
                    <div className="console h-48 bg-gray-800 text-white flex flex-col">
                        <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700">
                            <h3 className="text-sm font-medium">Console</h3>
                            <button 
                                onClick={() => setShowConsole(false)} 
                                className="p-1 rounded hover:bg-gray-700"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        </div>
                        <div 
                            id="console-output" 
                            className="flex-grow overflow-auto p-2 text-xs font-mono whitespace-pre-wrap"
                        >
                            {logs.map((log, index) => (
                                <div key={index}>{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
            
            {/* Add Collaborators Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-96">
                        <header className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Add Collaborators</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </header>
                        <div className="p-4">
                            <div className="flex flex-col gap-2">
                                {users.map((user) => (
                                    <div 
                                        key={user._id} 
                                        className={`flex items-center p-2 rounded-lg cursor-pointer ${selectedUserId.has(user._id) ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                                        onClick={() => handleUserClick(user._id)}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                            {user.email?.[0].toUpperCase() || '?'}
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="font-medium">{user.email}</h3>
                                            <p className="text-xs text-gray-500">{user._id}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <footer className="flex justify-end items-center p-4 border-t border-gray-200">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={addCollaborators} 
                                className="ml-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                                disabled={selectedUserId.size === 0}
                            >
                                {isLoading ? 'Adding...' : 'Add'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            
            {/* Create File Modal */}
            {isCreateFileModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-96">
                        <header className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Create New File</h2>
                            <button 
                                onClick={() => setIsCreateFileModalOpen(false)} 
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </header>
                        <div className="p-4">
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="text" 
                                    placeholder="File name (e.g., index.js)" 
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                />
                                <textarea 
                                    placeholder="File content (optional)" 
                                    value={newFileContent}
                                    onChange={(e) => setNewFileContent(e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 resize-none"
                                    rows="5"
                                />
                            </div>
                        </div>
                        <footer className="flex justify-end items-center p-4 border-t border-gray-200">
                            <button 
                                onClick={() => setIsCreateFileModalOpen(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={createNewFile} 
                                className="ml-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                                disabled={!newFileName.trim()}
                            >
                                Create
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            
            {/* Delete Project Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-96">
                        <header className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-red-600">Delete Project</h2>
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)} 
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </header>
                        <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to delete this project? This action cannot be undone.
                            </p>
                            <input 
                                type="text" 
                                placeholder={`Type "${project.name}" to confirm`} 
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:border-red-500"
                            />
                        </div>
                        <footer className="flex justify-end items-center p-4 border-t border-gray-200">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteProject} 
                                className="ml-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md"
                                disabled={deleteConfirmation !== project.name}
                            >
                                Delete
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            
            {/* Main tooltip */}
            <Tooltip id="main-tooltip" />
        </main>
    )
}

export default Project