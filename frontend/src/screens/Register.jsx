import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {
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

        axios.post('/users/register', {
            email,
            password
        }).then((res) => {
            console.log(res.data)
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            setError(err.response?.data?.message || 'Registration failed. Please try again.')
            console.log(err.response?.data)
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 p-4">
            <div className="relative w-full max-w-md overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full bg-blue-500 bg-opacity-30 blur-xl"></div>
                <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-purple-500 bg-opacity-30 blur-xl"></div>
                
                <div className="relative bg-gray-800 backdrop-blur-sm bg-opacity-90 p-8 rounded-2xl shadow-2xl border border-gray-700">
                    <div className="flex items-center justify-center mb-8">
                        <div className="bg-blue-600 rounded-full p-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Create Account</h2>
                    <p className="text-gray-400 text-center mb-6">Sign up to get started with our platform</p>
                    
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
                            <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="password">
                                Password
                            </label>
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
                            <p className="mt-1 text-xs text-gray-400">Must be at least 8 characters</p>
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
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                    
                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 border-t border-gray-700 pt-4">
                        <p className="text-xs text-center text-gray-400">
                            By creating an account, you agree to our{' '}
                            <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register