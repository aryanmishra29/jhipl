import React, { useState, useEffect } from "react";
import { FaPlus, FaDownload, FaEye } from "react-icons/fa";
import { Search } from "lucide-react";
import Modal from "react-modal";
import axios from "axios";
import toast from "react-hot-toast";
import { isBlockedDate, getBlockedDateMessage } from "../../../utils/dateUtils";

interface DetailedPurchaseOrder {
  poId: string;
  poNumber: string;
  vendor: string;
  paymentType: string;
  date: string;
  generatedDate: string;
  quotationAmount: number;
  baseAmount: number;
  remainingAmount: number;
  finalAmount: number;
  sgst: string;
  sgstAmount: number;
  cgst: string;
  cgstAmount: number;
  igst: string;
  igstAmount: number;
  narration: string;
  poRequestId: string;
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

const Purchase: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poRequests, setPORequests] = useState<any[]>([]);
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState<any[]>(
    []
  );
  const [filteredPORequests, setFilteredPORequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPoRequestId, setSelectedPoRequestId] = useState<string>("");
  const [selectedPO, setSelectedPO] = useState<DetailedPurchaseOrder | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"requests" | "orders">("requests");
  const [formData, setFormData] = useState({
    requisitionNumber: "",
    requisitionForm: null as File | null,
    comparativeForm: null as File | null,
    quotation1: null as File | null,
    quotation2: null as File | null,
    quotation3: null as File | null,
    comments: "",
  });

  const baseUrl = "https://jhipl.grobird.in";
  // const baseUrl = "http://localhost:8080";
  const user_id = localStorage.getItem("userId") || "";

  const handleDownload = async (poRequestId: string, fileType: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/purchase-orders/request/${poRequestId}/${fileType}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileType}-${poRequestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Error downloading ${fileType}:`, error);
    }
  };

  const handleDownloadDocsClick = (poRequestId: string) => {
    setSelectedPoRequestId(poRequestId);
    setIsDownloadModalOpen(true);
  };

  const closeDownloadModal = () => {
    setIsDownloadModalOpen(false);
    setSelectedPoRequestId("");
  };

  const handleDetailsClick = async (po: any) => {
    try {
      // Fetch detailed PO data
      const response = await axios.get(`${baseUrl}/purchase-orders/${po.poId}`);
      if (response.status === 200) {
        setSelectedPO(response.data);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching PO details:", error);
      // Fallback to basic data if detailed fetch fails
      setSelectedPO({
        poId: po.poId,
        poNumber: po.poNumber,
        vendor: po.vendor,
        paymentType: po.paymentType,
        date: po.date,
        generatedDate: po.generatedDate || "",
        quotationAmount: po.finalAmount || 0,
        baseAmount: po.finalAmount || 0,
        remainingAmount: po.remainingAmount || 0,
        finalAmount: po.finalAmount || 0,
        sgst: "0",
        sgstAmount: 0,
        cgst: "0",
        cgstAmount: 0,
        igst: "0",
        igstAmount: 0,
        narration: "",
        poRequestId: po.poRequestId || "",
      });
      setIsDetailsModalOpen(true);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPO(null);
  };

  const handleDownloadPODoc = async (poId: string) => {
    try {
      // First try to download the purchase order file
      const response = await fetch(`${baseUrl}/purchase-orders/${poId}/file`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-order-${poId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading purchase order:", error);
    }
  };

  // Search functionality
  useEffect(() => {
    const filteredRequests = poRequests.filter((request) => {
      if (request.requisitionNumber || request.requisitionNumber === "") {
        return request.requisitionNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
      return true;
    });
    setFilteredPORequests(filteredRequests);

    const filteredOrders = purchaseOrders.filter(
      (order) =>
        order.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ""
    );
    setFilteredPurchaseOrders(filteredOrders);
  }, [searchTerm, poRequests, purchaseOrders]);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/purchase-orders/user/${user_id}`
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch purchase orders");
      }
      // Sort by date in descending order (newest first), put null/empty dates last
      const sortedData = response.data.sort((a: any, b: any) => {
        // Handle null, empty, or invalid dates
        const dateA = a.date && a.date.trim() !== "" ? new Date(a.date) : null;
        const dateB = b.date && b.date.trim() !== "" ? new Date(b.date) : null;

        // If both dates are null/empty, maintain original order
        if (!dateA && !dateB) return 0;

        // If only dateA is null/empty, put it after dateB
        if (!dateA) return 1;

        // If only dateB is null/empty, put it after dateA
        if (!dateB) return -1;

        // If both dates are valid, sort in descending order (newest first)
        return dateB.getTime() - dateA.getTime();
      });
      setPurchaseOrders(sortedData);
      setFilteredPurchaseOrders(sortedData);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    }
  };

  const fetchPORequests = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/purchase-orders/request/user/${user_id}`
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch PO requests");
      }
      // Sort by date in descending order (newest first), put null/empty dates last
      const sortedData = response.data.sort((a: any, b: any) => {
        // Handle null, empty, or invalid dates
        const dateA = a.date && a.date.trim() !== "" ? new Date(a.date) : null;
        const dateB = b.date && b.date.trim() !== "" ? new Date(b.date) : null;

        // If both dates are null/empty, maintain original order
        if (!dateA && !dateB) return 0;

        // If only dateA is null/empty, put it after dateB
        if (!dateA) return 1;

        // If only dateB is null/empty, put it after dateA
        if (!dateB) return -1;

        // If both dates are valid, sort in descending order (newest first)
        return dateB.getTime() - dateA.getTime();
      });
      setPORequests(sortedData);
      setFilteredPORequests(sortedData);
    } catch (error) {
      console.error("Error fetching PO requests:", error);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchPORequests();
  }, []);

  const openModal = () => {
    // Check if the current date is a blocked date
    if (isBlockedDate()) {
      // Show toast notification instead of opening the modal
      toast.error(getBlockedDateMessage("PO requests"));
      return;
    }

    // If not a blocked date, proceed with opening the modal
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      requisitionNumber: "",
      requisitionForm: null,
      comparativeForm: null,
      quotation1: null,
      quotation2: null,
      quotation3: null,
      comments: "",
    });
  };

  const handleFileChange = (
    e:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("userId", user_id);
    formDataToSubmit.append("requisitionNumber", formData.requisitionNumber);
    formDataToSubmit.append(
      "requisitionForm",
      formData.requisitionForm as Blob
    );
    formDataToSubmit.append(
      "comparativeForm",
      formData.comparativeForm as Blob
    );
    formDataToSubmit.append("quotation1", formData.quotation1 as Blob);
    formDataToSubmit.append("quotation2", formData.quotation2 as Blob);
    formDataToSubmit.append("quotation3", formData.quotation3 as Blob);
    formDataToSubmit.append("comments", formData.comments);

    try {
      const response = await axios.post(
        `${baseUrl}/purchase-orders/request`,
        formDataToSubmit,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        closeModal();
        fetchPurchaseOrders();
        fetchPORequests();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 px-6 h-full">
      <div className="mb-6 space-y-6">
        <h1 className="text-3xl text-black font-bold">Purchase </h1>
        <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
          <div className="w-auto relative inline-block">
            <button
              onClick={openModal}
              className="w-full md:w-auto bg-[#D7E6C5] font-bold px-6 py-1.5 rounded-xl flex items-center text-black justify-center"
            >
              <FaPlus className="mr-2" /> New PO Request
            </button>
          </div>
          <div className="w-auto relative inline-flex">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === "requests"
                  ? "Search by Requisition Number"
                  : "Search by Vendor or PO Number"
              }
              className="w-80 bg-white border border-black text-black pl-9 pr-2 py-1 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("requests")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "requests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My PO Requests ({filteredPORequests.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Purchase Orders ({filteredPurchaseOrders.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="overflow-auto scroll-smooth max-h-[70vh]">
        {activeTab === "requests" && (
          <table className="w-full h-full text-[#8E8F8E] bg-white">
            <thead className="min-w-full sticky top-0 backdrop-blur-xl">
              <tr>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Entry Date
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Requisition Number
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Status
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Comments
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Reason of Rejection
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              {filteredPORequests.map((request) => (
                <tr key={request.poRequestId} className="text-[#252525]">
                  <td className="py-2 px-4 text-start border-b">
                    {request.date && request.date.trim() !== ""
                      ? request.date
                      : "-"}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {request.requisitionNumber &&
                    request.requisitionNumber.trim() !== ""
                      ? request.requisitionNumber
                      : "-"}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        request.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : request.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {request.comments || "-"}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {request.reasonOfRejection &&
                    request.reasonOfRejection.trim() !== ""
                      ? request.reasonOfRejection
                      : "-"}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      onClick={() =>
                        handleDownloadDocsClick(request.poRequestId)
                      }
                      className="bg-blue-500 text-white px-3 py-1 rounded flex items-center hover:bg-blue-600 transition-colors"
                    >
                      <FaDownload className="mr-1" />
                      Download Docs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "orders" && (
          <table className="w-full h-full text-[#8E8F8E] bg-white">
            <thead className="min-w-full sticky top-0 backdrop-blur-xl">
              <tr>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Entry Date
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  PO Number
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Document Date
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Vendor
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Remaining Amount
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Final Amount
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Payment Type
                </th>
                <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="w-full">
              {filteredPurchaseOrders.map((po) => (
                <tr key={po.poId} className="text-[#252525]">
                  <td className="py-2 px-4 text-start border-b">
                    {po.generatedDate && po.generatedDate.trim() !== ""
                      ? po.generatedDate
                      : "-"}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {po.poNumber}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {po.date && po.date.trim() !== "" ? po.date : "-"}
                  </td>
                  <td className="py-2 px-4 text-start border-b">{po.vendor}</td>
                  <td className="py-2 px-4 text-start border-b">
                    {po.remainingAmount}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {po.finalAmount.toFixed(4)}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {po.paymentType}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      onClick={() => handleDetailsClick(po)}
                      className="bg-blue-500 text-white px-3 py-1 rounded flex items-center hover:bg-blue-600 transition-colors"
                    >
                      <FaEye className="mr-1" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Purchase Order Modal"
      >
        <h2 className="text-2xl font-bold mb-4">Add New Purchase Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            <div className="form-group">
              <label
                htmlFor="requisitionNumber"
                className="block font-bold mb-1"
              >
                Requisition Number
              </label>
              <input
                type="text"
                id="requisitionNumber"
                name="requisitionNumber"
                value={formData.requisitionNumber}
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                placeholder="Enter requisition number"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="requisitionForm" className="block font-bold mb-1">
                Requisition Form
              </label>
              <input
                type="file"
                id="requisitionForm"
                name="requisitionForm"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="comparativeForm" className="block font-bold mb-1">
                Comparative Form
              </label>
              <input
                type="file"
                id="comparativeForm"
                name="comparativeForm"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quotation1" className="block font-bold mb-1">
                Quotation 1
              </label>
              <input
                type="file"
                id="quotation1"
                name="quotation1"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quotation2" className="block font-bold mb-1">
                Quotation 2
              </label>
              <input
                type="file"
                id="quotation2"
                name="quotation2"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quotation3" className="block font-bold mb-1">
                Quotation 3
              </label>
              <input
                type="file"
                id="quotation3"
                name="quotation3"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="comments" className="block font-bold mb-1">
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
              />
            </div>
          </div>
          <br />
          <button
            type="submit"
            className={`bg-green-600 flex justify-center w-full max-w-sm px-6 py-2 rounded-lg ${
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
        </form>
      </Modal>

      {/* Download Documents Modal */}
      <Modal
        isOpen={isDownloadModalOpen}
        onRequestClose={closeDownloadModal}
        style={customStyles}
        contentLabel="Download Documents Modal"
      >
        <h2 className="text-2xl font-bold mb-6">Download Documents</h2>
        <p className="text-gray-600 mb-4">
          Download all documents for PO Request ID: {selectedPoRequestId}
        </p>
        <div className="flex flex-col space-y-3">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            onClick={() =>
              handleDownload(selectedPoRequestId, "requisition-form")
            }
          >
            <FaDownload className="mr-2" />
            Download Requisition Form
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            onClick={() =>
              handleDownload(selectedPoRequestId, "comparative-form")
            }
          >
            <FaDownload className="mr-2" />
            Download Comparative Form
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            onClick={() => handleDownload(selectedPoRequestId, "quotation1")}
          >
            <FaDownload className="mr-2" />
            Download Quotation 1
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            onClick={() => handleDownload(selectedPoRequestId, "quotation2")}
          >
            <FaDownload className="mr-2" />
            Download Quotation 2
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            onClick={() => handleDownload(selectedPoRequestId, "quotation3")}
          >
            <FaDownload className="mr-2" />
            Download Quotation 3
          </button>
        </div>
        <div className="flex justify-end pt-6 border-t mt-6">
          <button
            onClick={closeDownloadModal}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Purchase Order Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onRequestClose={closeDetailsModal}
        style={customStyles}
        contentLabel="Purchase Order Details Modal"
      >
        <h2 className="text-2xl font-bold mb-6">Purchase Order Details</h2>
        {selectedPO && (
          <div className="max-h-[80vh] overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Number
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.poNumber}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.vendor}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.paymentType}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Date
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.date || "-"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Date
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.generatedDate || "-"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quotation Amount
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.quotationAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Amount
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.baseAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remaining Amount
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.remainingAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IGST
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.igst || "-"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IGST Amount
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.igstAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SGST
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.sgst || "-"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SGST Amount
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.sgstAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CGST
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.cgst || "-"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CGST Amount
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700">
                  {selectedPO.cgstAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Amount
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-lg font-semibold text-gray-700">
                  {selectedPO.finalAmount.toFixed(2)}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Narration
                </label>
                <div className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-700 min-h-[60px]">
                  {selectedPO.narration || "-"}
                </div>
              </div>
            </div>

            {/* Download Document Button */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Documents
              </h3>
              <button
                onClick={() =>
                  handleDownloadPODoc(selectedPO.poId)
                }
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition-colors"
              >
                <FaDownload className="mr-2" />
                Download Purchase Order
              </button>
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

export default Purchase;
