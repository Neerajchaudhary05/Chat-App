import { createContext } from "react";
import axios from 'axios'
import { useState } from "react";
import toast from 'react-hot-toast'
import { useEffect } from "react";
import { io } from 'socket.io-client'


const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;

// Attach token to every request (both `Authorization: Bearer <token>` and legacy `token` header)
if (typeof window !== 'undefined') {
    if (!window.__axiosInterceptorInstalled) {
        axios.interceptors.request.use((config) => {
            try {
                const localToken = localStorage.getItem('token');
                if (localToken) {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${localToken}`;
                    config.headers['token'] = localToken;
                }
            } catch (e) {
                // ignore
            }
            return config;
        }, (error) => Promise.reject(error));
        window.__axiosInterceptorInstalled = true;
    }
}


export const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(null);
    const [socket, setSocket] = useState(null);

    //check if user is authenticated and if so , set user data and connect the socket

    const checkAuth = async () => {
        try {
            const { data } = await axios.get('/api/auth/check');
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }

        } catch (error) {
            toast.error(error.message)

        }

    }

    //Login function to handle user auhentication and socket connetion

    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem('token', data.token);
                toast.success(data.message);
            }
            else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);

        }
    }

    //Logout function to handle user logout and socket disconection

    const logout = async () => {
        localStorage.removeItem('token');
        // disconnect socket first (if present), then clear client state
        try {
            if (socket && socket.disconnect) {
                socket.disconnect();
            }
        } catch (e) {
            // ignore
        }

        setSocket(null);
        setAuthUser(null);
        setOnlineUsers([]);
        setToken(null);

        // remove any default axios headers we set earlier
        try {
            if (axios.defaults && axios.defaults.headers && axios.defaults.headers.common) {
                delete axios.defaults.headers.common['token'];
                delete axios.defaults.headers.common['Authorization'];
            }
        } catch (e) {
            // ignore
        }

        toast.success("Logged out successfully ");

    }

    //update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success('Profile updated successfully');
            }


        } catch (error) {
            toast.error(error.message);

        }
    }

    //connect socket function to handle socket connection and online users updates

    const connectSocket = (userData) => {
        if (!userData) return;
        if (socket?.connected) return;

        const localToken = localStorage.getItem('token');

        const newSocket = io(backendUrl, {
            auth: { token: localToken },
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => console.log('client socket connected', newSocket.id));
        newSocket.on('connect_error', (err) => console.error('socket connect_error', err));
        newSocket.on('disconnect', (reason) => console.log('client socket disconnected', reason));

        newSocket.on('getOnlineUsers', (userIds) => {
            setOnlineUsers(userIds);
        });
    }

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['token'] = token;
            checkAuth();
        }
    }, [token])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,

    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>

    )
}