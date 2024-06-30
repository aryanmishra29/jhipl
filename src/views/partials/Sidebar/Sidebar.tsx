// import { MainLogo } from "@/assets";
import SideNavBar from "./SideNavBar";

const SideBar = () => {
  return (
    <section className="hidden lg:flex flex-col  w-80 bg-transparentBG relative h-full px-2  rounded-2xl">
    
      <SideNavBar />
      <div className="mt-auto">
        {/* <HelpSection /> */}
      </div>
    </section>
  );
};

export default SideBar;