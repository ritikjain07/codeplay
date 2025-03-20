return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <button 
                        onClick={() => navigate('/home')} 
                        className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {project.description || "No description"}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Collaborators
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Add Collaborator
                    </button>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Chat & Collaboration */}
            <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="font-medium text-gray-700 dark:text-gray-300">Project Chat</h2>
                    <div className="flex space-x-1">
                        <button 
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className={`p-1.5 rounded-full ${isSidePanelOpen ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            title="Show Collaborators"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div ref={messageBox} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-center">No messages yet. Start a conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`max-w-3/4 ${msg.sender._id === user._id.toString() ? 'ml-auto' : ''}`}
                            >
                                <div className={`flex items-start ${msg.sender._id === user._id.toString() ? 'flex-row-reverse' : ''}`}>
                                    <div 
                                        className={`px-4 py-2 rounded-lg ${
                                            msg.sender._id === 'ai' 
                                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' 
                                                : msg.sender._id === user._id.toString()
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                        }`}
                                    >
                                        <div className="text-xs font-medium mb-1">
                                            {msg.sender._id === user._id.toString() ? 'You' : msg.sender._id === 'ai' ? 'AI Assistant' : msg.sender.email.split('@')[0]}
                                        </div>
                                        <div className="text-sm">
                                            {msg.sender._id === 'ai' ? (
                                                WriteAiMessage(msg.message)
                                            ) : (
                                                <p>{msg.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div 
                                    className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                                        msg.sender._id === user._id.toString() ? 'text-right' : 'text-left'
                                    }`}
                                >
                                    {/* Add timestamp if available */}
                                </div>
                            </div>
                        ))
                    )}
                </div>