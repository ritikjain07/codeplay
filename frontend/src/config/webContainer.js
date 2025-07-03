// WebContainer configuration for CodePlay
let webContainerInstance = null;

export const getWebContainer = async () => {
    if (webContainerInstance === null) {
        try {
            // Dynamic import to handle potential loading issues
            const { WebContainer } = await import('@webcontainer/api');
            webContainerInstance = await WebContainer.boot();
            console.log('WebContainer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize WebContainer:', error);
            // Return a mock container for development/fallback
            webContainerInstance = {
                mount: async () => {
                    console.log('Mock: Files mounted');
                    return Promise.resolve();
                },
                spawn: async (command, args) => {
                    console.log(`Mock: Running ${command} ${args?.join(' ') || ''}`);
                    return {
                        output: {
                            pipeTo: (stream) => {
                                console.log('Mock: Process output piped');
                                return Promise.resolve();
                            }
                        },
                        exit: Promise.resolve(0)
                    };
                },
                on: (event, callback) => {
                    console.log(`Mock: Event listener added for ${event}`);
                    // Simulate server-ready event for development
                    if (event === 'server-ready') {
                        setTimeout(() => callback(3000, 'http://localhost:3000'), 1000);
                    }
                }
            };
        }
    }
    return webContainerInstance;
}

export const resetWebContainer = () => {
    webContainerInstance = null;
}