import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  FaFilter,
  FaEdit,
  FaDownload,
  FaCheck,
  FaTimes,
  FaClock,
  FaPlus,
} from "react-icons/fa";
import Modal from "react-modal";
import axios from "axios";
import { Search } from "lucide-react";
import SearchableDropdown from "../../../components/SearchableDropdown";
import {
  isRestrictedAdmin,
  getRestrictedAdminEmail,
  getRestrictedAdminUserIds,
} from "../../../utils/adminUtils";

interface Reimbursement {
  userId: string;
  reimbursementId: string;
  voucherNo: string;
  name: string;
  glCode: string;
  costCenter: string;
  date: string;
  generatedDate: string;
  dateOfPayment: string;
  amount: number;
  advance: number;
  utrNo: string;
  status: string;
  description: string;
  narration: string;
  comments: string;
}
interface ExcelItem {
  voucherType: string;
  voucherNumber: string;
  voucherDate: string;
  invoiceNo: string;
  invoiceDate: string;
  ledgerHead: string;
  drcr: string;
  amount: number;
  costCenter: string;
  description: string;
  narration: string;
  [key: string]: string | number;
}

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#ffffff",
    color: "#000000",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    padding: "40px",
    width: "1000px",
    maxWidth: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
};

const AdminReimbursementTable: React.FC = () => {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [filteredReimbursements, setFilteredReimbursements] = useState<
    Reimbursement[]
  >([]);
  const [searchedFilteredReimbursements, setSearchedFilteredReimbursements] =
    useState<Reimbursement[]>(filteredReimbursements);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<
    Reimbursement | undefined
  >(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [glCodeFilter, setGlCodeFilter] = useState("");
  const [costCenterFilter, setCostCenterFilter] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [glCodes, setGlCodes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [costCenterRows, setCostCenterRows] = useState([
    { costCenter: "", amount: "" },
  ]);

  const baseUrl = "https://jhipl.grobird.in";

  useEffect(() => {
    fetchReimbursements();
    fetchAdditionalData();
  }, []);
  useEffect(() => {
    const newSearchedFilteredReimbursements = filteredReimbursements.filter(
      (reimbursement) =>
        reimbursement.glCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reimbursement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reimbursement.costCenter
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setSearchedFilteredReimbursements(newSearchedFilteredReimbursements);
  }, [searchTerm, filteredReimbursements]);

  const handleFilter = () => {
    let filtered: Reimbursement[] = reimbursements;

    if (
      (statusFilter === "" || statusFilter === "Select Status") &&
      (fromDate === "" || toDate === "") &&
      glCodeFilter === "" &&
      costCenterFilter === ""
    ) {
      setShowPopup(false);
      return;
    }

    if (fromDate !== "" && toDate !== "") {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // Filter reimbursements based on date range
      filtered = filtered.filter((reimbursement) => {
        const reimbursementDate = new Date(reimbursement.date);
        return reimbursementDate >= from && reimbursementDate <= to;
      });
    }

    if (statusFilter !== "" && statusFilter !== "Select Status") {
      filtered = filtered.filter(
        (reimbursement) => reimbursement.status === statusFilter
      );
    }

    if (glCodeFilter !== "") {
      filtered = filtered.filter(
        (reimbursement) => reimbursement.glCode === glCodeFilter
      );
    }

    if (costCenterFilter !== "") {
      filtered = filtered.filter(
        (reimbursement) => reimbursement.costCenter === costCenterFilter
      );
    }

    setFilteredReimbursements(filtered);
    setShowPopup(false);
  };
  const handleClearFilter = () => {
    setFilteredReimbursements(reimbursements);
    setFromDate("");
    setToDate("");
    setStatusFilter("");
    setGlCodeFilter("");
    setCostCenterFilter("");
    setShowPopup(false);
  };
  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const fetchReimbursements = async () => {
    try {
      const response = await fetch(`${baseUrl}/reimbursements`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let data: Reimbursement[] = await response.json();

      if (isRestrictedAdmin()) {
        const adminEmail = getRestrictedAdminEmail();
        if (adminEmail) {
          const allowedUserIds = getRestrictedAdminUserIds(adminEmail);
          data = data.filter((reimbursement) =>
            allowedUserIds.includes(reimbursement.userId)
          );
        }
      }

      setReimbursements(data);
      setFilteredReimbursements(data);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
    }
  };

  const fetchAdditionalData = async () => {
    try {
      const [costCentersResponse, vendorsResponse, glCodesResponse] =
        await Promise.all([
          axios.get(`${baseUrl}/info/cost-centers`),
          axios.get(`${baseUrl}/info/vendors`),
          axios.get(`${baseUrl}/info/gl-codes`),
        ]);

      setCostCenters(costCentersResponse.data);
      setVendors(vendorsResponse.data);
      setGlCodes(glCodesResponse.data);
    } catch (error) {
      console.error("Error fetching additional data:", error);
    }
  };

  // Function to add a new cost center row
  const addCostCenterRow = () => {
    setCostCenterRows([...costCenterRows, { costCenter: "", amount: "" }]);
  };

  // Function to remove a cost center row
  const removeCostCenterRow = (index: number) => {
    if (costCenterRows.length > 1) {
      const newRows = costCenterRows.filter((_, i) => i !== index);
      setCostCenterRows(newRows);
      updateAmountFromCostCenters(newRows);
    }
  };

  // Function to update cost center row
  const updateCostCenterRow = (index: number, field: string, value: string) => {
    const newRows = [...costCenterRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setCostCenterRows(newRows);
    if (field === "amount") {
      updateAmountFromCostCenters(newRows);
    }
  };

  // Function to calculate total amount from cost center amounts
  const updateAmountFromCostCenters = (rows: typeof costCenterRows) => {
    const totalAmount = rows.reduce((sum, row) => {
      const amount = parseFloat(row.amount) || 0;
      return sum + amount;
    }, 0);

    setSelectedReimbursement((prev) =>
      prev
        ? {
            ...prev,
            amount: totalAmount,
          }
        : undefined
    );
  };

  const openModal = async (reimbursement: Reimbursement) => {
    setSelectedReimbursement(reimbursement);

    // Get detailed reimbursement data to fetch baseAmountSplitForCostCenters
    try {
      const response = await fetch(
        `${baseUrl}/reimbursements/${reimbursement.reimbursementId}`
      );
      if (response.ok) {
        const detailedReimbursement = await response.json();

        // Parse cost centers and amounts
        const costCenterArray = reimbursement.costCenter
          .split(";")
          .filter((cc) => cc.trim() !== "");
        const amountArray =
          detailedReimbursement.baseAmountSplitForCostCenters || [];

        // If baseAmountSplitForCostCenters is null/empty, use total amount for single cost center
        if (!amountArray || amountArray.length === 0) {
          setCostCenterRows([
            {
              costCenter: costCenterArray[0] || reimbursement.costCenter,
              amount: reimbursement.amount.toString(),
            },
          ]);
        } else {
          // Create cost center rows with split amounts
          const rows = costCenterArray.map((costCenter, index) => ({
            costCenter: costCenter.trim(),
            amount: amountArray[index] ? amountArray[index].toString() : "",
          }));

          // Ensure at least one row
          setCostCenterRows(
            rows.length > 0 ? rows : [{ costCenter: "", amount: "" }]
          );
        }
      } else {
        // Fallback to single cost center if detailed data fetch fails
        setCostCenterRows([
          {
            costCenter: reimbursement.costCenter.split(";")[0] || "",
            amount: reimbursement.amount.toString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching detailed reimbursement data:", error);
      // Fallback to single cost center
      setCostCenterRows([
        {
          costCenter: reimbursement.costCenter.split(";")[0] || "",
          amount: reimbursement.amount.toString(),
        },
      ]);
    }

    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedReimbursement(undefined);
    // Reset cost center rows
    setCostCenterRows([{ costCenter: "", amount: "" }]);
  };

  const handleUpdateReimbursement = async () => {
    if (isSubmitting) return;

    // Validate cost center rows
    const hasValidCostCenters = costCenterRows.every(
      (row) => row.costCenter && row.amount
    );
    if (!hasValidCostCenters) {
      alert("Please fill in all cost centers and amounts.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedReimbursement) {
        // Prepare cost center data
        const costCenterString = costCenterRows
          .map((row) => row.costCenter)
          .join(";");
        const baseAmountSplitForCostCenters = costCenterRows.map((row) =>
          parseFloat(row.amount)
        );

        // Prepare update request, excluding generatedDate as it should not be modified
        const { generatedDate, ...reimbursementData } = selectedReimbursement;
        const updateRequest = {
          ...reimbursementData,
          costCenter: costCenterString,
          baseAmountSplitForCostCenters: baseAmountSplitForCostCenters,
        };

        const response = await fetch(`${baseUrl}/reimbursements/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        await fetchReimbursements();
        handleFilter();
        closeModal();
      }
    } catch (error) {
      console.error("Error updating reimbursement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // If admin is restricted and trying to change fields other than status or description, prevent it
    const restrictedAdmin = isRestrictedAdmin();
    if (restrictedAdmin && name !== "status" && name !== "description") {
      return;
    }

    setSelectedReimbursement((prev) =>
      prev
        ? {
            ...prev,
            [name]: value,
          }
        : undefined
    );
    console.log(selectedReimbursement);
  };

  const handleDownloadExcel = async () => {
    try {
      if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
      }
      const response = await fetch(
        `${baseUrl}/reimbursements/excel?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log(data);
      const keyOrder: (keyof ExcelItem)[] = [
        "voucherType",
        "voucherNumber",
        "voucherDate",
        "invoiceNo",
        "invoiceDate",
        "ledgerHead",
        "drcr",
        "amount",
        "costCenter",
        "description",
        "narration",
      ];

      // Create a new array with reordered keys
      const reorderedData = data.map((item: ExcelItem) => {
        const reorderedItem: ExcelItem = {} as ExcelItem;
        keyOrder.forEach((key) => {
          if (key in item) {
            reorderedItem[key] = item[key];
          }
        });
        return reorderedItem;
      });

      // Create the worksheet using the reordered data
      const worksheet = XLSX.utils.json_to_sheet(reorderedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reimbursements");
      XLSX.writeFile(workbook, "Reimbursements.xlsx");
    } catch (error) {
      console.error("Error fetching or exporting data:", error);
    }
  };

  const handleDownloadFile = async (
    reimbursementId: string,
    fileType: "receipts" | "approvals"
  ) => {
    try {
      const response = await fetch(
        `${baseUrl}/reimbursements/${reimbursementId}/${fileType}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileType}-${reimbursementId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Error downloading ${fileType}:`, error);
    }
  };

  return (
    <div>
      <div className="mt-6 px-6 h-full">
        <div className="mb-6 space-y-6">
          <h1 className="text-3xl text-black font-bold">Reimbursements</h1>
          <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
            <div className="flex justify-between items-center">
              <div className="flex  items-center gap-6">
                <div className="flex space-x-2 items-center">
                  <label
                    htmlFor="startDate"
                    className="text-black font-semibold"
                  >
                    Start Date:
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  />
                </div>
                <div className="flex space-x-2 items-center">
                  <label htmlFor="endDate" className="text-black font-semibold">
                    End Date:
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleDownloadExcel}
                  className="bg-[#D7E6C5] text-black font-bold px-6 py-1.5 rounded-xl flex items-center"
                >
                  Download as Excel
                </button>
              </div>
            </div>
            <div className="w-auto relative inline-flex">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by GL Code, Name or Cost Center"
                className="w-80 bg-white border border-black text-black pl-9 pr-2 py-1 rounded-xl"
              />
            </div>
            <div className="w-auto relative inline-block">
              <button
                onClick={togglePopup}
                className="w-full md:w-auto bg-[#636C59] text-white px-6 font-bold py-1.5 rounded-xl flex items-center justify-center"
              >
                Filter <FaFilter className="ml-2" />
              </button>
              {showPopup && (
                <div className="absolute z-20 top-full mt-2 right-0 bg-white shadow-2xl sm:w-[400px] w-full rounded-lg p-4">
                  <label className="block text-sm font-bold mb-2 text-black">
                    From Date:
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  />

                  <label className="block text-sm font-bold mb-2 text-black mt-2">
                    To Date:
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  />

                  <label className="block text-sm font-bold mb-2 text-black mt-2">
                    Status
                  </label>
                  <div className="w-full">
                    <SearchableDropdown
                      options={["PENDING", "APPROVED", "REJECTED"]}
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as string)
                      }
                      placeholder="Select Status"
                      name="statusFilter"
                      required={false}
                    />
                  </div>

                  <label className="block text-sm font-bold mb-2 text-black mt-2">
                    GL Code
                  </label>
                  <div className="w-full">
                    <SearchableDropdown
                      options={glCodes}
                      value={glCodeFilter}
                      onChange={(e) =>
                        setGlCodeFilter(e.target.value as string)
                      }
                      placeholder="Select GL Code"
                      name="glCodeFilter"
                      required={false}
                    />
                  </div>

                  <label className="block text-sm font-bold mb-2 text-black mt-2">
                    Cost Center
                  </label>
                  <div className="w-full">
                    <SearchableDropdown
                      options={costCenters}
                      value={costCenterFilter}
                      onChange={(e) =>
                        setCostCenterFilter(e.target.value as string)
                      }
                      placeholder="Select Cost Center"
                      name="costCenterFilter"
                      required={false}
                    />
                  </div>

                  <div className="flex justify-between gap-2 mt-4">
                    <button
                      onClick={handleFilter}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleClearFilter}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto scroll-smooth max-h-[65vh] scrollbar-visible">
          <style>
            {`
          .scrollbar-visible::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          .scrollbar-visible::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 5px;
            cursor: pointer;
          }
          .scrollbar-visible::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
        `}
          </style>
          <table className="w-full h-full text-[#8E8F8E] bg-white">
            <thead className="min-w-full">
              <tr>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Entry Date
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Document Date
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Payment Date
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Name
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Amount
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  GL Code
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Cost Center
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Comments
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  UTR No
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Status
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              {searchedFilteredReimbursements.map((reimbursement, index) => {
                const amountColor =
                  reimbursement.amount > 0 ? "text-green-500" : "text-red-500";
                return (
                  <tr key={index} className="text-[#252525]">
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.generatedDate &&
                      reimbursement.generatedDate.trim() !== ""
                        ? reimbursement.generatedDate
                        : "-"}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.date}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.dateOfPayment}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.name}
                    </td>
                    <td
                      className={`py-2 px-4 text-start border-b ${amountColor}`}
                    >
                      {reimbursement.amount}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.glCode}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.costCenter.replace(/;/g, ", ")}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.comments &&
                      reimbursement.comments.trim() !== ""
                        ? reimbursement.comments
                        : "-"}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {reimbursement.utrNo || "-"}
                    </td>
                    <td className="py-2 px-4 text-center border-b">
                      <div
                        className={`w-fit rounded-full px-2 ${
                          reimbursement.status === "APPROVED"
                            ? "bg-[#636C59] text-white"
                            : "bg-[#D7E6C5]"
                        }`}
                      >
                        {reimbursement.status === "APPROVED" ? (
                          <FaCheck />
                        ) : reimbursement.status === "PENDING" ? (
                          <FaClock />
                        ) : (
                          <FaTimes />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      <button
                        onClick={() => openModal(reimbursement)}
                        className="bg-red-400 text-white px-3 py-1 rounded flex items-center"
                      >
                        Edit
                        <FaEdit className="ml-1" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Edit Reimbursement"
        style={customStyles}
      >
        <h2 className="text-2xl font-bold mb-4">Edit Reimbursement</h2>
        {isRestrictedAdmin() && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p>
              You have limited permissions. You can only edit the Status and
              Description fields.
            </p>
          </div>
        )}
        <form className="max-h-[80vh] overflow-y-auto">
          {/* Employee Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Employee Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Employee Name
                </label>
                <select
                  name="name"
                  value={selectedReimbursement?.name || ""}
                  onChange={handleInputChange}
                  className={`w-full border bg-transparent rounded p-2 ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  required
                  disabled={isRestrictedAdmin()}
                >
                  <option value="">Select Employee</option>
                  {vendors.map((vendor, index) => (
                    <option key={index} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  GL Code
                </label>
                <select
                  name="glCode"
                  value={selectedReimbursement?.glCode || ""}
                  onChange={handleInputChange}
                  className={`w-full border bg-transparent rounded p-2 ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isRestrictedAdmin()}
                >
                  <option value="">Select GL Code</option>
                  {glCodes.map((code, index) => (
                    <option key={index} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Date Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Document Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={selectedReimbursement?.date || ""}
                  onChange={handleInputChange}
                  className={`w-full border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Entry Date{" "}
                  <span className="text-xs text-gray-400">(Read-only)</span>
                </label>
                <input
                  type="date"
                  name="generatedDate"
                  value={selectedReimbursement?.generatedDate || ""}
                  className="w-full border bg-gray-100 text-black rounded p-2 cursor-not-allowed [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="dateOfPayment"
                  value={selectedReimbursement?.dateOfPayment || ""}
                  onChange={handleInputChange}
                  className={`w-full border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isRestrictedAdmin()}
                />
              </div>
            </div>
          </div>

          {/* Cost Centers Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Cost Center Allocation
            </h3>
            <div className="space-y-3">
              {costCenterRows.map((row, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-end p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Cost Center
                    </label>
                    {isRestrictedAdmin() ? (
                      <input
                        type="text"
                        className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed"
                        value={row.costCenter}
                        disabled
                      />
                    ) : (
                      <SearchableDropdown
                        name={`costCenter-${index}`}
                        options={costCenters.length > 0 ? costCenters : ["N/A"]}
                        value={row.costCenter}
                        onChange={(e) =>
                          updateCostCenterRow(
                            index,
                            "costCenter",
                            e.target.value as string
                          )
                        }
                        placeholder="Select Cost Center"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full border rounded p-2 bg-white ${
                        isRestrictedAdmin()
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      value={row.amount}
                      onChange={(e) =>
                        updateCostCenterRow(index, "amount", e.target.value)
                      }
                      disabled={isRestrictedAdmin()}
                      required
                    />
                  </div>
                  {!isRestrictedAdmin() && (
                    <div className="flex gap-2">
                      {index === 0 && (
                        <button
                          type="button"
                          onClick={addCostCenterRow}
                          className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors"
                          title="Add Cost Center"
                        >
                          <FaPlus />
                        </button>
                      )}
                      {costCenterRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCostCenterRow(index)}
                          className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors"
                          title="Remove Cost Center"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Total Amount{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-calculated from cost centers, but editable)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    className={`w-full border rounded p-3 bg-white text-lg font-semibold ${
                      isRestrictedAdmin()
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    value={selectedReimbursement?.amount || ""}
                    onChange={handleInputChange}
                    placeholder="Auto-calculated or enter manually"
                    disabled={isRestrictedAdmin()}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Advance
                </label>
                <input
                  type="number"
                  name="advance"
                  value={selectedReimbursement?.advance || ""}
                  onChange={handleInputChange}
                  placeholder="Advance"
                  className={`w-full border bg-transparent rounded p-2 ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  UTR No.
                </label>
                <input
                  type="text"
                  name="utrNo"
                  value={selectedReimbursement?.utrNo || ""}
                  onChange={handleInputChange}
                  placeholder="UTR No."
                  className={`w-full border bg-transparent rounded p-2 ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={selectedReimbursement?.status || ""}
                  onChange={handleInputChange}
                  className="w-full border bg-transparent rounded p-2"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={selectedReimbursement?.description || ""}
                  onChange={handleInputChange}
                  placeholder="Description"
                  className="w-full border bg-transparent rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Narration
                </label>
                <input
                  type="text"
                  name="narration"
                  value={selectedReimbursement?.narration || ""}
                  onChange={handleInputChange}
                  placeholder="Narration"
                  className={`w-full border bg-transparent rounded p-2 ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Comments
                </label>
                <textarea
                  name="comments"
                  value={selectedReimbursement?.comments || ""}
                  onChange={handleInputChange}
                  placeholder="Comments"
                  className="w-full border bg-transparent rounded p-2 h-24 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </form>
        <div className="py-2 flex space-x-2 mt-4">
          <button
            onClick={() =>
              handleDownloadFile(
                selectedReimbursement?.reimbursementId
                  ? selectedReimbursement?.reimbursementId
                  : "",
                "receipts"
              )
            }
            className="bg-blue-500 text-white px-3 py-1 rounded flex items-center"
          >
            Receipts
            <FaDownload className="ml-1" />
          </button>
          <button
            onClick={() =>
              handleDownloadFile(
                selectedReimbursement?.reimbursementId
                  ? selectedReimbursement?.reimbursementId
                  : "",
                "approvals"
              )
            }
            className="bg-green-500 text-white px-3 py-1 rounded flex items-center"
          >
            Approvals
            <FaDownload className="ml-1" />
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpdateReimbursement}
            className={`bg-green-500 text-white px-4 py-2 rounded ${
              isSubmitting ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <svg
                className="animate-spin h-5 w-5 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Submit"
            )}
          </button>
          <button
            onClick={closeModal}
            className="bg-red-500 text-white px-4 py-2 rounded ml-2"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReimbursementTable;
