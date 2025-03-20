import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Add a request interceptor to dynamically set the token before each request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle authentication errors (e.g., token expired)
        if (error.response && error.response.status === 401) {
            console.log('Authentication error:', error.response.data);
            // You could redirect to login page or clear token
            // window.location.href = '/login';
            // localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;



// import axios from 'axios';


// const axiosInstance = axios.create({
//     baseURL: import.meta.env.VITE_API_URL,
//     headers: {
//         "Authorization": `Bearer ${localStorage.getItem('token')}`
//     }
// })


// export default axiosInstance;   