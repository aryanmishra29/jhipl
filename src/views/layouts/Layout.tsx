import Header from "../partials/Header/Header";
import SideBar from "../partials/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import SideNavBar from "../partials/Sidebar/SideNavBar";
import { cn } from "../../lib/utils";

const Layout = () => {
    const [openNav, setOpenNav] = useState(false);


    const handleOpen = () => {
        setOpenNav((prev) => !(prev));
    };

    return (
        <div className="lg:h-screen lg:overflow-y-hidden">
            <Header />
            <div className="relative  flex " >
                <div className=" bg-[#FBFCF7] w-fit">
                    <SideBar />
                </div>
                <div className="w-full  scroll-smooth  lg:overflow-scroll">
                    <div className="relative flex z-10 items-center my-auto gap-4 lg:hidden">
                        <div
                            onClick={handleOpen}
                            className={cn(
                                "fixed inset-0 z-20 hidden bg-black/10 backdrop-blur-sm",
                                openNav && "block"
                            )}
                        ></div>
                        <div
                            className={cn(
                                "fixed top-0 bottom-0 left-0 z-30 w-2/3 py-8 -translate-x-full transition-transform duration-150 bg-gradientBG",
                                openNav && "translate-x-0"
                            )}
                        >
                            <div className="flex justify-between px-4">

                                <button onClick={handleOpen}>
                                    <X className="w-8 h-8 text-black" />
                                </button>
                            </div>
                            <SideNavBar handleOpen={handleOpen} />
                        </div>
                        <button className="mt-7 ml-2" onClick={handleOpen}>
                            <Menu className="w-8 h-8 text-black" />
                        </button>

                    </div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
