import { NavLink } from "react-router-dom";
import { cn } from "../../../lib/utils";
import transactionGray from "../../../assets/transactionGray.png";
import transactionBlack from "../../../assets/transactionBlack.png";
import invoiceGray from "../../../assets/invoiceGray.png";
import invoiceBlack from "../../../assets/invoiceBlack.png";
import reportGray from "../../../assets/reportGray.png";
import reportBlack from "../../../assets/reportBlack.png";
import calendarGray from "../../../assets/calendarGray.png";
import calendarBlack from "../../../assets/calendarBlack.png";

const NavLinks = (userType: string) => {
  // Determine if the user is an admin
  const isAdmin = userType === "ADMIN";

  return [
    {
      title: "Staff Reimbursement",
      url: `${isAdmin ? "/admin" : ""}/reimbursement`,
      iconGray: transactionGray,
      iconBlack: transactionBlack,
    },
    {
      title: "Invoices",
      url: `${isAdmin ? "/admin" : ""}/invoices`,
      iconGray: invoiceGray,
      iconBlack: invoiceBlack,
    },
    {
      title: "Purchase Orders",
      url: `${isAdmin ? "/admin" : ""}/purchase-orders`,
      iconGray: reportGray,
      iconBlack: reportBlack,
    },
    {
      title: "Calendar",
      url: `${isAdmin ? "/admin" : ""}/calendar`,
      iconGray: calendarGray,
      iconBlack: calendarBlack,
    },
  ];
};

const SideNavBar = ({ handleOpen }: { handleOpen: () => void }) => {
  const userType = localStorage.getItem("userType") || ""; // Retrieve userType from localStorage

  return (
    <nav className="h-full sm:p-6 p-2 flex flex-col">
      <ul className="flex flex-col font-medium space-y-8 pt-6">
        {NavLinks(userType).map((link, index) => (
          <li key={index}>
            <NavLink
              onClick={handleOpen}
              to={link.url}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 sm:px-4 pl-2 py-3 text-base rounded-lg transition-colors duration-200",
                  isActive ? "bg-[#EAF1DF] text-black" : "text-[#5F605E] hover:bg-[#EAF1DF]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <img
                    src={isActive ? link.iconBlack : link.iconGray}
                    alt={`${link.title} icon`}
                    className="w-6 h-6"
                  />
                  <div className="flex-auto font-semibold text-lg">{link.title}</div>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-y-2 py-5 text-gray-900 font-bold mt-8">
        <p className="text-gray-600">Total on your accounts</p>
        <p className="text-3xl font-extrabold mt-2">€35.927</p>
      </div>
    </nav>
  );
};

export default SideNavBar;
