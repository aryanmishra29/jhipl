import logo from '../../../assets/logo.jpg';
import exit from '../../../assets/exit.png';
import user from '../../../assets/user.png';
import question from '../../../assets/question.png';
import settings from '../../../assets/settings.png';

const Header = () => {
    return (
      <div className=" p-6 z-10 flex items-center justify-between   w-full top-0 left-0 pr-4 bg-[#D7E6C5]">
        <div className="flex flex-row gap-2  sm:gap-4 lg:ml-0 ml-6 items-center self-start text-white">
          <img src={logo} alt="logo" className="w-10 h-10" />
          <div className="text-xl leading-6">
            <span className=" font-semibold  leading-6 text-[#000300cb]">
              Johns Hopkins India Pvt Ltd. Finance & Operations Department.
            </span>
          </div>
        </div>
        <div className="flex sm:gap-6 text-white sm:pr-6 justify-center items-center font-sans">
          <img
            src={question}
            alt="question"
            className="sm:w-9 sm:h-9 w-6 h-6 stroke-black stroke-2"
          />

          <img
            src={user}
            alt="user"
            className="sm:w-9 sm:h-9 w-6 h-6 stroke-black stroke-2"
          />
          <img
            src={settings}
            alt="settings"
            className="sm:w-9 sm:h-9 w-6 h-6 stroke-black stroke-2"
          />

          <img
            src={exit}
            alt="exit"
            className="sm:w-9 sm:h-9 w-6 h-6 stroke-black stroke-2"
          />
        </div>
      </div>
    );
};

export default Header;
