import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import Modal from "react-modal";
import axios from "axios";

interface Reimbursement {
  reimbursementId: string;
  name: string;
  glCode: string;
  costCenter: string;
  date: string;
  amount: number;
  advance: number;
  status: string;
  remarks: string;
  utrNo: string;
  userId: string;
  description: string;
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
    width: "600px",
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
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown data states
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [glCodes, setGlCodes] = useState<string[]>([]);

  const baseUrl = "https://jhipl.grobird.in";
  const user_id = localStorage.getItem("userId") || "";
  console.log();

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
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>
  ) => {
    const files = e.currentTarget.files;
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(isSubmitting) return;

    setIsSubmitting(true);

    const {
      nameOfEmployee,
      glCode,
      costCenter,
      date,
      amount,
      advance,
      receipt,
      approvalDoc,
      description,
    } = formData;

    if (!nameOfEmployee || !glCode || !costCenter || !date || !amount) {
      alert("Please fill in all required fields.");
      return;
    }

    // Create FormData to handle file uploads
    const form = new FormData();
    form.append("name", nameOfEmployee);
    form.append("glCode", glCode);
    form.append("costCenter", costCenter);
    form.append("date", date);
    form.append("amount", amount);
    form.append("advance", advance);
    form.append("userId", user_id);
    form.append("description", description);
    if (receipt) form.append("receipts", receipt);
    if (approvalDoc) form.append("approvals", approvalDoc);

    try {
      await axios.post(`${baseUrl}/reimbursements`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));

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
        </div>
      </div>
      {/* table */}
      <div className="overflow-auto scroll-smooth max-h-[70vh] ">
        <table className="w-full h-full text-[#8E8F8E] bg-white">
          <thead className="min-w-full">
            <tr>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Date
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Amount
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                UTR No.
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Cost Center
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Name of Employee
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="w-full">
            {reimbursements.map((reimbursement) => {
              const amountColor =
                reimbursement.amount > 0 ? "text-green-500" : "text-red-500";
              return (
                <tr
                  key={reimbursement.reimbursementId}
                  className="text-[#252525]"
                >
                  <td className="py-2 px-4 text-start border-b">
                    {reimbursement.date}
                  </td>
                  <td
                    className={`py-2 px-4 text-start border-b ${amountColor}`}
                  >{`${reimbursement.amount.toFixed(2)}`}</td>
                  <td className="py-2 px-4 text-start border-b">
                    {reimbursement.utrNo}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {reimbursement.costCenter}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {reimbursement.name}
                  </td>
                  <td className="py-2 px-4 text-center border-b">
                    <div
                      className={`w-fit rounded-full px-2 ${
                        reimbursement.status === "APPROVED"
                          ? "bg-[#636C59] text-white"
                          : reimbursement.status === "PENDING"
                          ? "bg-[#FEC400] text-[#252525]"
                          : "bg-[#E7E7E7] text-[#C2C2C2]"
                      } py-1`}
                    >
                      {reimbursement.status}
                    </div>
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
        <h2 className="text-2xl font-bold mb-4">Add New Reimbursement</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <select
              name="nameOfEmployee"
              className="w-full border rounded p-2 bg-white"
              value={formData.nameOfEmployee}
              onChange={handleChange}
              required
            >
              <option value="">Select Vendor (Employee Name)</option>
              {(Array.isArray(vendors)
                ? vendors
                : ["Dummy Vendor 1", "Dummy Vendor 2"]
              ).map((vendor, index) => (
                <option key={index} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
            <select
              name="glCode"
              className="w-full border rounded p-2 bg-white"
              value={formData.glCode}
              onChange={handleChange}
              required
            >
              <option value="">Select GL Code</option>
              {(Array.isArray(glCodes)
                ? glCodes
                : ["Dummy GL Code 1", "Dummy GL Code 2"]
              ).map((code, index) => (
                <option key={index} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <select
              name="costCenter"
              className="w-full border rounded p-2 bg-white"
              value={formData.costCenter}
              onChange={handleChange}
              required
            >
              <option value="">Select Cost Center</option>
              {(Array.isArray(costCenters)
                ? costCenters
                : ["Dummy Cost Center 1", "Dummy Cost Center 2"]
              ).map((center, index) => (
                <option key={index} value={center}>
                  {center}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="date"
              className="w-full border rounded p-2 bg-white"
              value={formData.date}
              onChange={handleChange}
              required
            />
            <div className="sm:flex sm:space-x-4 sm:space-y-0 space-y-4">
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                className="w-full sm:w-1/2 border rounded p-2 bg-white"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>
            <input
              type="file"
              name="receipt"
              className="w-full border rounded p-2 bg-white"
              onChange={handleChange}
            />
            <input
              type="file"
              name="approvalDoc"
              className="w-full border rounded p-2 bg-white"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col max-w-xl w-full">
            <label className="text-gray-500 ">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="bg-transparent border border-gray-300 p-2 rounded-lg "
            />
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-[#636C59] text-white px-4 py-2 rounded ${
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
                "Add Reimbursement"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReimbursementTable;
