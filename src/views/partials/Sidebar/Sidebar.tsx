import SideNavBar from "./SideNavBar";

const SideBar = () => {
  const handleOpen = () => {
    // Define your handleOpen function here
    console.log("SideNavBar opened");
  };

  return (
    <section className="hidden lg:flex flex-col w-80 bg-transparentBG relative h-full px-2 rounded-2xl">
      <SideNavBar handleOpen={handleOpen} />
      <div className="mt-auto">
        {/* <HelpSection /> */}
      </div>
    </section>
  );
};

export default SideBar;
