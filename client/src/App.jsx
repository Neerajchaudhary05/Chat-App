import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from './Pages/HomePage.jsx'
import LoginPage from './Pages/LoginPage.jsx'
import ProfilePage from './Pages/ProfilePage.jsx'

const App = () => {
  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain ">
      <Routes >
        <Route path='/' element={<HomePage />} />
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/profile' element={<ProfilePage />} />
      </Routes>
    </div>
  )
}

export default App