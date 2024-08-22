import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const isDevelopment = false;
    const baseUrl = 'https://jhipl.grobird.in';

    useEffect(() => {
        // Check if userId and userType are already in local storage
        const userType = localStorage.getItem("userType");
        const userId = localStorage.getItem("userId");

        if (userType && userId) {
            // Redirect to the appropriate page based on userType
            if (userType === "ADMIN") {
                navigate("/admin");
            } else {
                navigate("/");
            }
        }
    }, [navigate]);

    const handleLogin = async (e: any) => {
        e.preventDefault();

        if (isDevelopment) {
            let simulatedResponse = { UserType: "", userId: "" };

            if (email === "admin@example.com" && password === "admin123") {
                simulatedResponse.UserType = "ADMIN";
                simulatedResponse.userId = "simulated-admin-id";
            } else if (email === "user@example.com" && password === "user123") {
                simulatedResponse.UserType = "USER";
                simulatedResponse.userId = "simulated-user-id";
            }

            if (simulatedResponse.UserType) {
                localStorage.setItem("userType", simulatedResponse.UserType);
                localStorage.setItem("userId", simulatedResponse.userId);
                if (simulatedResponse.UserType === "ADMIN") {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            } else {
                alert("Invalid credentials");
            }
        } else {
            try {
                const params = new URLSearchParams({ email, password });
                const response = await fetch(`${baseUrl}/auth/login?${params.toString()}`, {
                    method: 'GET',
                });
                const data = await response.json();

                if (data.type && data.userId) {
                    localStorage.setItem("userType", data.type);
                    localStorage.setItem("userId", data.userId);
                    if (data.type === "ADMIN") {
                        navigate("/admin");
                    } else {
                        navigate("/");
                    }
                } else {
                    alert("Invalid credentials");
                }
            } catch (error) {
                console.error("Error during login:", error);
                alert("An error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FBFCF7]">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full">
                <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-600 mb-2">Email</label>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-600 mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition duration-300"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
