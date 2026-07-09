import axios from "../api/axios";
import useAuth from "./useAuth";

const useLogout = () => {
    const { setAuth } = useAuth();

    const logout = async () => {
        setAuth({});
        
        try {
            // Call logout endpoint to clear httpOnly cookie on server
            await axios.post('/auth/logout', {}, {
                withCredentials: true
            });
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with logout even if server request fails
        }
    };

    return logout;
};

export default useLogout;