import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../config/axios';

// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in (token exists)
        const token = localStorage.getItem('token');
        if (token) {
            // Verify token by fetching user profile
            axios.get('/users/profile')
                .then((res) => {
                    setUser(res.data.user);
                })
                .catch((err) => {
                    console.log('Token invalid, clearing storage');
                    localStorage.removeItem('token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};


