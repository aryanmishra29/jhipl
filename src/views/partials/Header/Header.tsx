import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.jpg';
import exit from '../../../assets/exit.png';

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("userType");
        localStorage.removeItem("userId");

        navigate('/login');
    };

    return (
        <div className="p-6 z-10 flex items-center justify-between w-full top-0 left-0 pr-4 bg-[#D7E6C5]">
            <div className="flex flex-row gap-2 sm:gap-4 lg:ml-0 ml-6 items-center self-start text-white">
                <img src={logo} alt="logo" className="w-10 h-10" />
                <div className="text-xl leading-6">
                    <span className="font-semibold leading-6 text-[#000300cb]">
                        Johns Hopkins India Pvt Ltd. Finance & Operations Department.
                    </span>
                </div>
            </div>
            <div className="flex sm:gap-6 text-white sm:pr-6 justify-center items-center font-sans">
                <img
                    src={exit}
                    alt="exit"
                    className="sm:w-9 sm:h-9 w-6 h-6 stroke-black stroke-2 cursor-pointer"
                    onClick={handleLogout}
                />
            </div>
        </div>
    );
};

export default Header;
