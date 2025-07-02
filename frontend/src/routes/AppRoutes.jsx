import React from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Login from '../screens/Login'
import Register from '../screens/Register'
import Home from '../screens/Home'
import Project from '../screens/Project'
import ProjectImproved from '../screens/ProjectImproved'
import ProjectSimple from '../screens/ProjectSimple'
import UserAuth from '../auth/UserAuth'

const AppRoutes = () => {
    return (
        <BrowserRouter>

            <Routes>
                <Route path="/" element={<UserAuth><Home /></UserAuth>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/project" element={<UserAuth><Project /></UserAuth>} />
                <Route path="/project-improved" element={<UserAuth><ProjectImproved /></UserAuth>} />
                <Route path="/project-simple" element={<UserAuth><ProjectSimple /></UserAuth>} />
            </Routes>

        </BrowserRouter>
    )
}

export default AppRoutes