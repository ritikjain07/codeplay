import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        axios.post('/users/login', {
            email,
            password
        }).then((res) => {
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
            console.log(err.response?.data)
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4">
            <div className="relative w-full max-w-md overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-blue-500 bg-opacity-30 blur-xl"></div>
                <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-purple-500 bg-opacity-30 blur-xl"></div>
                
                <div className="relative bg-gray-800 backdrop-blur-sm bg-opacity-90 p-8 rounded-2xl shadow-2xl border border-gray-700">
                    <div className="flex items-center justify-center mb-8">
                        <div className="bg-blue-600 rounded-full p-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome Back</h2>
                    <p className="text-gray-400 text-center mb-6">Enter your credentials to access your account</p>
                    
                    {error && (
                        <div className="mb-4 bg-red-500 bg-opacity-20 border border-red-400 text-red-300 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={submitHandler} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    id="email"
                                    className="w-full pl-10 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-600 transition duration-200"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-gray-400 text-sm font-medium" htmlFor="password">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    id="password"
                                    className="w-full pl-10 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-600 transition duration-200"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transform hover:scale-[1.02] transition-all duration-200"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                    
                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login