import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    userType: string | null;
    requiredType: string;
}


function ProtectedRoute({ children, userType, requiredType }: ProtectedRouteProps) {
    if (userType !== requiredType ) {
        return <Navigate to="/login" />;
    }

    return children;
}

export default ProtectedRoute;
