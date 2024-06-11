// import { MainLogo } from "@/assets";
import SideNavBar from "./SideNavBar";

const SideBar = () => {
  return (
    <section className="hidden lg:flex flex-col  w-80 bg-transparentBG relative h-full pl-2  py-8 rounded-2xl">
      <div className="h-12">
      </div>
      <SideNavBar />
      <div className="mt-auto">
        {/* <HelpSection /> */}
      </div>
    </section>
  );
};

export default SideBar;
