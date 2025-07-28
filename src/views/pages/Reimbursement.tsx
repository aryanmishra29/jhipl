import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaCheck,
  FaTimes,
  FaClock,
  FaFilter,
  FaEye,
  FaDownload,
} from "react-icons/fa";
import Modal from "react-modal";
import axios from "axios";
import { Search } from "lucide-react";
import SearchableDropdown from "../../components/SearchableDropdown.tsx";
import toast from "react-hot-toast";
import { isBlockedDate, getBlockedDateMessage } from "../../utils/dateUtils";

interface Reimbursement {
  reimbursementId: string;
  name: string;
  glCode: string;
  costCenter: string;
  date: string;
  generatedDate: string;
  dateOfPayment: string;
  amount: number;
  advance: number;
  status: string;
  remarks: string;
  utrNo: string;
  userId: string;
  description: string;
  comments: string;
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
    padding: "20px",
    width: "800px",
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

const detailsModalStyles = {
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

const ReimbursementTable: React.FC = () => {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [filteredReimbursements, setFilteredReimbursements] = useState<
    Reimbursement[]
  >([]);
  const [searchedFilteredReimbursements, setSearchedFilteredReimbursements] =
    useState<Reimbursement[]>(filteredReimbursements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<
    Reimbursement | undefined
  >(undefined);
  const [costCenterDetails, setCostCenterDetails] = useState<
    { costCenter: string; amount: number }[]
  >([]);
  const [formData, setFormData] = useState({
    nameOfEmployee: "",
    glCode: "",
    costCenter: "",
    date: "",
    amount: "",
    advance: "",
    receipt: null,
    approvalDoc: null,
    description: "",
  });

  const [costCenterRows, setCostCenterRows] = useState([
    { costCenter: "", amount: "" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown data states
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [glCodes, setGlCodes] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [glCodeFilter, setGlCodeFilter] = useState("");
  const [costCenterFilter, setCostCenterFilter] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const baseUrl = "https://jhipl.grobird.in";
  const user_id = localStorage.getItem("userId") || "";

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

    setFormData((prev) => ({
      ...prev,
      amount: totalAmount.toFixed(2),
    }));
  };

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

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [costCenterRes, vendorRes, glCodeRes] = await Promise.all([
          axios.get(`${baseUrl}/info/cost-centers`),
          axios.get(`${baseUrl}/info/vendors`),
          axios.get(`${baseUrl}/info/gl-codes`),
          fetchReimbursements(),
        ]);
        setCostCenters(costCenterRes.data);
        setVendors(vendorRes.data);
        setGlCodes(glCodeRes.data);
        // Use the reimbursement data fetched
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchData();
  }, []);

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

      // Filter invoices based on date range
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

  // Fetch reimbursements
  const fetchReimbursements = async () => {
    try {
      const response = await fetch(`${baseUrl}/reimbursements/user/${user_id}`);
      console.log(response);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data: Reimbursement[] = await response.json();
      setReimbursements(data);
      setFilteredReimbursements(data);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
    }
  };

  const openModal = () => {
    // Check if the current date is a blocked date
    if (isBlockedDate()) {
      // Show toast notification instead of opening the modal
      toast.error(getBlockedDateMessage("reimbursement requests"));
      return;
    }

    // If not a blocked date, proceed with opening the modal
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset cost center rows
    setCostCenterRows([{ costCenter: "", amount: "" }]);
    // Reset form data
    setFormData({
      nameOfEmployee: "",
      glCode: "",
      costCenter: "",
      date: "",
      amount: "",
      advance: "",
      receipt: null,
      approvalDoc: null,
      description: "",
    });
  };

  const openDetailsModal = async (reimbursement: Reimbursement) => {
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
          setCostCenterDetails([
            {
              costCenter: costCenterArray[0] || reimbursement.costCenter,
              amount: reimbursement.amount,
            },
          ]);
        } else {
          // Create cost center details with split amounts
          const details = costCenterArray.map((costCenter, index) => ({
            costCenter: costCenter.trim(),
            amount: amountArray[index] || 0,
          }));

          setCostCenterDetails(details);
        }
      } else {
        // Fallback to single cost center if detailed data fetch fails
        setCostCenterDetails([
          {
            costCenter: reimbursement.costCenter.split(";")[0] || "",
            amount: reimbursement.amount,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching detailed reimbursement data:", error);
      // Fallback to single cost center
      setCostCenterDetails([
        {
          costCenter: reimbursement.costCenter.split(";")[0] || "",
          amount: reimbursement.amount,
        },
      ]);
    }

    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedReimbursement(undefined);
    setCostCenterDetails([]);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>
  ) => {
    const files = (e.target as HTMLInputElement).files;
    const { name, value } = e.target;

    if (name === "amount") {
      setFormData((prev) => ({
        ...prev,
        amount: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files && files.length > 0 ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const {
      nameOfEmployee,
      glCode,
      date,
      amount,
      advance,
      receipt,
      approvalDoc,
      description,
    } = formData;

    // Validate cost center rows
    const hasValidCostCenters = costCenterRows.every(
      (row) => row.costCenter && row.amount
    );
    if (!hasValidCostCenters) {
      alert("Please fill in all cost centers and amounts.");
      setIsSubmitting(false);
      return;
    }

    if (!nameOfEmployee || !glCode || !date || !amount) {
      alert("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    // Prepare cost center data
    const costCenterString = costCenterRows
      .map((row) => row.costCenter)
      .join(";");
    const baseAmountForCostCenters = costCenterRows.map((row) =>
      parseFloat(row.amount)
    );

    // Create FormData to handle file uploads
    const form = new FormData();
    form.append("name", nameOfEmployee);
    form.append("glCode", glCode);
    form.append("costCenter", costCenterString);
    form.append("date", date);
    form.append("amount", amount);
    form.append("advance", advance);
    form.append("userId", user_id);
    form.append("description", description);

    // Send array elements individually
    baseAmountForCostCenters.forEach((amount) => {
      form.append("baseAmountSplitForCostCenters", amount.toString());
    });

    if (receipt) form.append("receipts", receipt);
    if (approvalDoc) form.append("approvals", approvalDoc);

    try {
      await axios.post(`${baseUrl}/reimbursements`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchReimbursements();
      closeModal();
    } catch (error) {
      console.error("Error submitting form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 px-6 h-full">
      <div className="mb-6 space-y-6">
        <h1 className="text-3xl text-black font-bold">Reimbursements</h1>
        <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
          <div className="w-auto">
            <button
              onClick={openModal}
              className="w-full md:w-auto bg-[#D7E6C5] text-black font-bold px-6 py-1.5 rounded-xl flex items-center justify-center"
            >
              <FaPlus className="mr-2" /> New reimbursement
            </button>
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
                    onChange={(e) => setStatusFilter(e.target.value as string)}
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
                    onChange={(e) => setGlCodeFilter(e.target.value as string)}
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
      {/* table */}
      <div className="overflow-auto scroll-smooth max-h-[70vh] ">
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
                Name of Employee
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Amount
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                GL Code
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                UTR No.
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Cost Center
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Comments
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
            {searchedFilteredReimbursements.map((reimbursement) => {
              const amountColor =
                reimbursement.amount > 0 ? "text-green-500" : "text-red-500";
              return (
                <tr
                  key={reimbursement.reimbursementId}
                  className="text-[#252525]"
                >
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
                    {reimbursement.name}
                  </td>
                  <td
                    className={`py-2 px-4 text-start border-b ${amountColor}`}
                  >{`${reimbursement.amount.toFixed(2)}`}</td>
                  <td className="py-2 px-4 text-start border-b">
                    {reimbursement.glCode}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {reimbursement.utrNo}
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
                      onClick={() => openDetailsModal(reimbursement)}
                      className="bg-blue-500 text-white px-3 py-1 rounded flex items-center hover:bg-blue-600 transition-colors"
                    >
                      Details
                      <FaEye className="ml-1" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Reimbursement Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Add Reimbursement Modal"
      >
        <h2 className="text-2xl font-bold mb-6">Add New Reimbursement</h2>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Employee Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Employee Name
                </label>
                <SearchableDropdown
                  name="nameOfEmployee"
                  options={vendors.length > 0 ? vendors : ["N/A"]}
                  value={formData.nameOfEmployee}
                  onChange={handleChange}
                  placeholder="Select Employee Name"
                  required={true}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  GL Code
                </label>
                <SearchableDropdown
                  name="glCode"
                  options={glCodes.length > 0 ? glCodes : ["N/A"]}
                  value={formData.glCode}
                  onChange={handleChange}
                  placeholder="Select GL Code"
                  required={true}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  className="w-full border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  value={formData.date}
                  onChange={handleChange}
                  required
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
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full border rounded p-2 bg-white"
                      value={row.amount}
                      onChange={(e) =>
                        updateCostCenterRow(index, "amount", e.target.value)
                      }
                      required
                    />
                  </div>
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
                    className="w-full border rounded p-3 bg-white text-lg font-semibold"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Auto-calculated or enter manually"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Documents and Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Receipt Document
                  </label>
                  <input
                    type="file"
                    name="receipt"
                    className="w-full border rounded p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Approval Document
                  </label>
                  <input
                    type="file"
                    name="approvalDoc"
                    className="w-full border rounded p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter reimbursement description or notes..."
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-[#636C59] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#5a6350] transition-colors ${
                isSubmitting
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 text-white mr-2"
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
                  Saving...
                </div>
              ) : (
                "Add Reimbursement"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onRequestClose={closeDetailsModal}
        style={detailsModalStyles}
        contentLabel="Reimbursement Details"
      >
        <h2 className="text-2xl font-bold mb-6">Reimbursement Details</h2>
        {selectedReimbursement && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Employee Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Employee Name
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700">
                    {selectedReimbursement.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    GL Code
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700">
                    {selectedReimbursement.glCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Date Information Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Date Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Document Date
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700">
                    {selectedReimbursement.date}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Entry Date
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700">
                    {selectedReimbursement.generatedDate &&
                    selectedReimbursement.generatedDate.trim() !== ""
                      ? selectedReimbursement.generatedDate
                      : "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Payment Date
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700">
                    {selectedReimbursement.dateOfPayment &&
                    selectedReimbursement.dateOfPayment.trim() !== ""
                      ? selectedReimbursement.dateOfPayment
                      : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Center Details Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Cost Center Allocation
              </h3>
              <div className="space-y-2">
                {costCenterDetails.map((detail, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="font-medium text-gray-800">
                      {detail.costCenter}
                    </div>
                    <div className="font-semibold text-green-600">
                      ₹{detail.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {costCenterDetails.length > 1 && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-bold text-gray-800">Total Amount</div>
                    <div className="font-bold text-blue-600">
                      ₹
                      {costCenterDetails
                        .reduce((sum, detail) => sum + detail.amount, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Financial Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Amount
                  </label>
                  <div
                    className={`w-full border rounded p-3 bg-gray-50 font-semibold ${
                      selectedReimbursement.amount > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ₹{selectedReimbursement.amount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Advance
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700">
                    ₹
                    {selectedReimbursement.advance
                      ? selectedReimbursement.advance.toFixed(2)
                      : "0.00"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    UTR No.
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700">
                    {selectedReimbursement.utrNo || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Additional Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Status & Additional Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50">
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        selectedReimbursement.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : selectedReimbursement.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedReimbursement.status === "APPROVED" ? (
                        <FaCheck className="mr-1" />
                      ) : selectedReimbursement.status === "PENDING" ? (
                        <FaClock className="mr-1" />
                      ) : (
                        <FaTimes className="mr-1" />
                      )}
                      {selectedReimbursement.status}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Description
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700 min-h-[60px]">
                    {selectedReimbursement.description || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Comments
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-50 text-gray-700 min-h-[60px]">
                    {selectedReimbursement.comments || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Downloads */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Documents
              </h3>
              <div className="flex space-x-4">
                <button
                  onClick={() =>
                    handleDownloadFile(
                      selectedReimbursement.reimbursementId,
                      "receipts"
                    )
                  }
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
                >
                  <FaDownload className="mr-2" />
                  Download Receipts
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      selectedReimbursement.reimbursementId,
                      "approvals"
                    )
                  }
                  className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition-colors"
                >
                  <FaDownload className="mr-2" />
                  Download Approvals
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={closeDetailsModal}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReimbursementTable;
