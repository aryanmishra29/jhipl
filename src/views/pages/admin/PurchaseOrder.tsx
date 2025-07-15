import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaEdit } from "react-icons/fa";
import { Search } from "lucide-react";
import Modal from "react-modal";
import axios from "axios";
import { Download } from "lucide-react";
import parseTax from "../../../utils/parseTax";
import {
  isRestrictedAdmin,
  getRestrictedAdminEmail,
  getRestrictedAdminUserIds,
} from "../../../utils/adminUtils";

interface PurchaseOrder {
  poId: string;
  poNumber: string;
  remainingAmount: number;
  finalAmount: number;
  poRequestId: string;
  vendor: string;
  userId: string;
  date: string;
  paymentType: string;
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

const PurchaseOrder: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState<
    PurchaseOrder[]
  >([]);
  const [filteredFilesData, setFilteredFilesData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] =
    useState<boolean>(false);
  const [selectedPO, setSelectedPO] = useState<string>("");
  const [formData, setFormData] = useState({
    poRequestId: "",
    poNumber: "",
    vendor: "",
    paymentType: "",
    quotationAmount: "",
    baseAmount: "",
    igst: "",
    igstAmount: "",
    sgst: "",
    sgstAmount: "",
    cgst: "",
    cgstAmount: "",
    total: "",
    narration: "",
    poFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<string[]>([]);
  const baseUrl = "https://jhipl.grobird.in";
  // const baseUrl = "http://localhost:8080";
  const [filesData, setFilesData] = useState<any[]>([]);
  const [cgsts, setCgsts] = useState<string[]>([]);
  const [sgsts, setSgsts] = useState<string[]>([]);
  const [igsts, setIgsts] = useState<string[]>([]);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState<"requests" | "orders">("requests");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [, setSelectedPOForEdit] = useState<PurchaseOrder | null>(null);
  const [editFormData, setEditFormData] = useState({
    poId: "",
    poNumber: "",
    vendor: "",
    paymentType: "",
    quotationAmount: "",
    baseAmount: "",
    remainingAmount: "",
    finalAmount: "",
    sgst: "",
    sgstAmount: "",
    cgst: "",
    cgstAmount: "",
    igst: "",
    igstAmount: "",
    narration: "",
    date: "",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Search functionality
  useEffect(() => {
    const filteredRequests = filesData.filter((request) => {
      if (request.requisitionNumber || request.requisitionNumber === "") {
        return request.requisitionNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
      return true;
    });
    setFilteredFilesData(filteredRequests);

    const filteredOrders = purchaseOrders.filter(
      (order) =>
        order.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ""
    );
    setFilteredPurchaseOrders(filteredOrders);
  }, [searchTerm, filesData, purchaseOrders]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const vendorsResponse = await axios.get(`${baseUrl}/info/vendors`);
        const sgstResponse = await axios.get(`${baseUrl}/info/sgst`);
        const igstResponse = await axios.get(`${baseUrl}/info/igst`);
        const cgstResponse = await axios.get(`${baseUrl}/info/cgst`);
        sgstResponse.data.push("0");
        igstResponse.data.push("0");
        cgstResponse.data.push("0");

        setVendors(
          Array.isArray(vendorsResponse.data) ? vendorsResponse.data : []
        );

        setSgsts(Array.isArray(sgstResponse.data) ? sgstResponse.data : []);
        setIgsts(Array.isArray(igstResponse.data) ? igstResponse.data : []);
        setCgsts(Array.isArray(cgstResponse.data) ? cgstResponse.data : []);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);

        setVendors([]);

        setIgsts([]);
        setCgsts([]);
        setSgsts([]);
      }
    };

    fetchDropdownData();
  }, []);
  const fetchPendingPORequests = async () => {
    const response = await axios.get(
      `${baseUrl}/purchase-orders/request/pending`
    );
    if (response.status !== 200) {
      throw new Error("Failed to fetch purchase orders");
    }
    let mappedData = response.data.map((item: any) => ({
      poRequestId: item.poRequestId,
      comments: item.comments,
      userId: item.userId,
      date: item.date,
      requisitionNumber: item.requisitionNumber,
    }));

    if (isRestrictedAdmin()) {
      const adminEmail = getRestrictedAdminEmail();
      if (adminEmail) {
        const allowedUserIds = getRestrictedAdminUserIds(adminEmail);
        mappedData = mappedData.filter((po: any) =>
          allowedUserIds.includes(po.userId)
        );
      }
    }

    // Sort by date in descending order (newest first), put null/empty dates last
    const sortedData = mappedData.sort((a: any, b: any) => {
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

    setFilesData(sortedData);
    setFilteredFilesData(sortedData);
  };
  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(`${baseUrl}/purchase-orders`);

      if (response.status !== 200) {
        throw new Error("Failed to fetch purchase orders");
      }
      let data: PurchaseOrder[] = response.data.map((po: any) => ({
        poId: po.poId,
        poRequestId: po.poRequestId,
        poNumber: po.poNumber,
        remainingAmount: po.remainingAmount,
        finalAmount: po.finalAmount,
        vendor: po.vendor,
        userId: po.userId,
        date: po.date,
        paymentType: po.paymentType,
      }));
      if (isRestrictedAdmin()) {
        const adminEmail = getRestrictedAdminEmail();
        if (adminEmail) {
          const allowedUserIds = getRestrictedAdminUserIds(adminEmail);
          data = data.filter((po) => allowedUserIds.includes(po.userId));
        }
      }

      // Sort by date in descending order (newest first), put null/empty dates last
      const sortedData = data.sort((a: PurchaseOrder, b: PurchaseOrder) => {
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

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    fetchPendingPORequests();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsAcceptModalOpen(false);
    setIsRejectModalOpen(false);
    setIsEditModalOpen(false);
    setRejectReason("");
    setSelectedPOForEdit(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>
  ) => {
    const { name, value } = e.target;
    const files = e.currentTarget.files;

    if (name === "igst") {
      const igstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const igstAmount = (baseAmount * igstPercentage).toFixed(4);

      setFormData((prev) => ({
        ...prev,
        igst: value,
        sgst: "0",
        cgst: "0",
        sgstAmount: "0",
        cgstAmount: "0",
        igstAmount: igstAmount,
        total: (baseAmount + parseFloat(igstAmount)).toFixed(4),
      }));
    } else if (name === "sgst") {
      const sgstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(4);
      const cgstAmount = parseFloat(formData.cgstAmount);

      setFormData((prev) => ({
        ...prev,
        sgst: value,
        sgstAmount: sgstAmount,
        igst: "0",
        igstAmount: "0",
        total: (baseAmount + parseFloat(sgstAmount) + cgstAmount).toFixed(4),
      }));
    } else if (name === "cgst") {
      const cgstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(4);
      const sgstAmount = parseFloat(formData.sgstAmount);

      setFormData((prev) => ({
        ...prev,
        cgst: value,
        igst: "0",
        igstAmount: "0",
        cgstAmount: cgstAmount,
        total: (baseAmount + parseFloat(cgstAmount) + sgstAmount).toFixed(4),
      }));
    } else if (name === "baseAmount") {
      const baseAmount = parseFloat(value);
      const igstPercentage = parseTax(formData.igst) / 100;
      const igstAmount = (baseAmount * igstPercentage).toFixed(4);
      const sgstPercentage = parseTax(formData.sgst) / 100;
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(4);
      const cgstPercentage = parseTax(formData.cgst) / 100;
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(4);

      setFormData((prev) => ({
        ...prev,
        baseAmount: value,
        igstAmount: igstAmount,
        sgstAmount: sgstAmount,
        cgstAmount: cgstAmount,
        total: (
          baseAmount +
          parseFloat(igstAmount) +
          parseFloat(sgstAmount) +
          parseFloat(cgstAmount)
        ).toFixed(4),
      }));
    } else if (name === "igstAmount") {
      const igstAmount = parseFloat(value);

      setFormData((prev) => ({
        ...prev,
        igstAmount: value,
        sgstAmount: "0",
        cgstAmount: "0",
        total: (parseFloat(formData.baseAmount) + igstAmount).toFixed(4),
      }));
    } else if (name === "sgstAmount") {
      const sgstAmount = parseFloat(value);
      const cgstAmount = parseFloat(formData.cgstAmount);

      setFormData((prev) => ({
        ...prev,
        sgstAmount: value,
        igstAmount: "0",
        total: (
          parseFloat(formData.baseAmount) +
          sgstAmount +
          cgstAmount
        ).toFixed(4),
      }));
    } else if (name === "cgstAmount") {
      const cgstAmount = parseFloat(value);
      const sgstAmount = parseFloat(formData.sgstAmount);

      setFormData((prev) => ({
        ...prev,
        cgstAmount: value,
        igstAmount: "0",
        total: (
          parseFloat(formData.baseAmount) +
          cgstAmount +
          sgstAmount
        ).toFixed(4),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    const {
      poNumber,
      paymentType,
      vendor,
      quotationAmount,
      baseAmount,
      igst,
      igstAmount,
      sgst,
      sgstAmount,
      cgst,
      cgstAmount,
      total,
      narration,
      poFile,
    } = formData;

    console.log(formData);

    if (
      !poNumber ||
      !paymentType ||
      !vendor ||
      !quotationAmount ||
      !baseAmount ||
      !igst ||
      !igstAmount ||
      !sgst ||
      !sgstAmount ||
      !cgst ||
      !cgstAmount ||
      !total ||
      !narration ||
      !poFile
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    console.log(selectedPoId);
    const formDataToSubmit = {
      poRequestId: selectedPoId,
      poNumber,
      vendor,
      paymentType,
      quotationAmount: parseFloat(quotationAmount),
      baseAmount: parseFloat(baseAmount),
      finalAmount: parseFloat(total),
      sgst,
      sgstAmount: parseFloat(sgstAmount),
      cgst,
      cgstAmount: parseFloat(cgstAmount),
      igst,
      igstAmount: parseFloat(igstAmount),
      narration,
      po: poFile,
    };

    try {
      const response = await axios.post(
        `${baseUrl}/purchase-orders`,
        formDataToSubmit,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response);

      if (response.status === 200) {
        closeModal();
        fetchPurchaseOrders();
        fetchPendingPORequests();
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

  const handleDownload = async (poRequestId: string, fileType: string) => {
    if (fileType === "purchase-order") {
      try {
        const response = await fetch(
          `${baseUrl}/purchase-orders/${poRequestId}/file`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileType}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error(`Error downloading ${fileType}:`, error);
      }
    }
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
      link.download = `${fileType}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Error downloading ${fileType}:`, error);
    }
  };

  const handleAccept = (poId: string) => {
    setSelectedPoId(poId);
    setIsAcceptModalOpen(true);
  };

  const handleReject = (poRequestId: string) => {
    setSelectedPoId(poRequestId);
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      const response = await axios.post(
        `${baseUrl}/purchase-orders/request/reject/${selectedPoId}?reason=${encodeURIComponent(
          rejectReason
        )}`
      );
      if (response.status === 200) {
        await fetchPendingPORequests();
        closeModal();
      }
    } catch (error) {
      console.error("Error rejecting PO request:", error);
      alert("Error rejecting PO request. Please try again.");
    }
  };

  const handleDownloadClick = (poRequestId: string, poId: string) => {
    setSelectedPoId(poRequestId);
    // setSelectedPO(po);
    setSelectedPO(poId);
    setIsPurchaseModalOpen(true);
  };

  const handleEditClick = (po: PurchaseOrder) => {
    setSelectedPOForEdit(po);
    setEditFormData({
      poId: po.poId,
      poNumber: po.poNumber,
      vendor: po.vendor,
      paymentType: po.paymentType,
      quotationAmount: po.finalAmount.toString(), // Using finalAmount as quotationAmount
      baseAmount: po.finalAmount.toString(), // Using finalAmount as baseAmount
      remainingAmount: po.remainingAmount.toString(),
      finalAmount: po.finalAmount.toString(),
      sgst: "0", // Default values as they're not in the interface
      sgstAmount: "0",
      cgst: "0",
      cgstAmount: "0",
      igst: "0",
      igstAmount: "0",
      narration: "",
      date: po.date,
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "igst") {
      const igstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(editFormData.baseAmount);
      const igstAmount = (baseAmount * igstPercentage).toFixed(4);

      setEditFormData((prev) => ({
        ...prev,
        igst: value,
        sgst: "0",
        cgst: "0",
        sgstAmount: "0",
        cgstAmount: "0",
        igstAmount: igstAmount,
        finalAmount: (baseAmount + parseFloat(igstAmount)).toFixed(4),
      }));
    } else if (name === "sgst") {
      const sgstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(editFormData.baseAmount);
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(4);
      const cgstAmount = parseFloat(editFormData.cgstAmount);

      setEditFormData((prev) => ({
        ...prev,
        sgst: value,
        sgstAmount: sgstAmount,
        igst: "0",
        igstAmount: "0",
        finalAmount: (baseAmount + parseFloat(sgstAmount) + cgstAmount).toFixed(
          4
        ),
      }));
    } else if (name === "cgst") {
      const cgstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(editFormData.baseAmount);
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(4);
      const sgstAmount = parseFloat(editFormData.sgstAmount);

      setEditFormData((prev) => ({
        ...prev,
        cgst: value,
        igst: "0",
        igstAmount: "0",
        cgstAmount: cgstAmount,
        finalAmount: (baseAmount + parseFloat(cgstAmount) + sgstAmount).toFixed(
          4
        ),
      }));
    } else if (name === "baseAmount") {
      const baseAmount = parseFloat(value);
      const igstPercentage = parseTax(editFormData.igst) / 100;
      const igstAmount = (baseAmount * igstPercentage).toFixed(4);
      const sgstPercentage = parseTax(editFormData.sgst) / 100;
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(4);
      const cgstPercentage = parseTax(editFormData.cgst) / 100;
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(4);

      setEditFormData((prev) => ({
        ...prev,
        baseAmount: value,
        igstAmount: igstAmount,
        sgstAmount: sgstAmount,
        cgstAmount: cgstAmount,
        finalAmount: (
          baseAmount +
          parseFloat(igstAmount) +
          parseFloat(sgstAmount) +
          parseFloat(cgstAmount)
        ).toFixed(4),
      }));
    } else if (name === "igstAmount") {
      const igstAmount = parseFloat(value);

      setEditFormData((prev) => ({
        ...prev,
        igstAmount: value,
        sgstAmount: "0",
        cgstAmount: "0",
        finalAmount: (parseFloat(editFormData.baseAmount) + igstAmount).toFixed(
          4
        ),
      }));
    } else if (name === "sgstAmount") {
      const sgstAmount = parseFloat(value);
      const cgstAmount = parseFloat(editFormData.cgstAmount);

      setEditFormData((prev) => ({
        ...prev,
        sgstAmount: value,
        igstAmount: "0",
        finalAmount: (
          parseFloat(editFormData.baseAmount) +
          sgstAmount +
          cgstAmount
        ).toFixed(4),
      }));
    } else if (name === "cgstAmount") {
      const cgstAmount = parseFloat(value);
      const sgstAmount = parseFloat(editFormData.sgstAmount);

      setEditFormData((prev) => ({
        ...prev,
        cgstAmount: value,
        igstAmount: "0",
        finalAmount: (
          parseFloat(editFormData.baseAmount) +
          cgstAmount +
          sgstAmount
        ).toFixed(4),
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditSubmitting) return;
    setIsEditSubmitting(true);

    const updateRequest = {
      poId: editFormData.poId,
      poNumber: editFormData.poNumber,
      vendor: editFormData.vendor,
      paymentType: editFormData.paymentType,
      quotationAmount: parseFloat(editFormData.quotationAmount),
      baseAmount: parseFloat(editFormData.baseAmount),
      remainingAmount: parseFloat(editFormData.remainingAmount),
      finalAmount: parseFloat(editFormData.finalAmount),
      sgst: editFormData.sgst,
      sgstAmount: parseFloat(editFormData.sgstAmount),
      cgst: editFormData.cgst,
      cgstAmount: parseFloat(editFormData.cgstAmount),
      igst: editFormData.igst,
      igstAmount: parseFloat(editFormData.igstAmount),
      narration: editFormData.narration,
      date: editFormData.date,
    };

    try {
      console.log("Sending PO update request:", updateRequest);
      const response = await axios.post(
        `${baseUrl}/purchase-orders/update`,
        updateRequest,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setIsEditModalOpen(false);
        setSelectedPOForEdit(null);
        await fetchPurchaseOrders();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating PO:", error);
      alert("Error updating PO. Please check the console for details.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="mb-6 mt-6">
        <div className="flex flex-wrap justify-between items-center space-y-2 md:space-y-0 md:space-x-2">
          <div className="border-b border-gray-200 flex-1">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "requests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                PO Requests ({filteredFilesData.length})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "orders"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Purchase Orders ({filteredPurchaseOrders.length})
              </button>
            </nav>
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

      {/* Tab Content */}
      {activeTab === "requests" && (
        <div className="overflow-x-auto h-[85vh] overflow-y-scroll scroll-smooth">
          <div>
            <h1 className="text-3xl text-black font-semibold sticky top-0 backdrop-blur-xl p-3">
              PO Requests
            </h1>
            <table className="w-full h-full text-[#8E8F8E]  bg-white">
              <thead className="min-w-full sticky top-14 backdrop-blur-xl">
                <tr>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Date
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Requisition Number
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Requisition Form
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Comparative Form
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Quotation 1
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Quotation 2
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Quotation 3
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Comments
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="w-full">
                {filteredFilesData.map((file) => (
                  <tr key={file.poRequestId} className="text-[#252525]">
                    <td className="py-2 px-4 text-start border-b">
                      {file.date && file.date.trim() !== "" ? file.date : "-"}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {file.requisitionNumber &&
                      file.requisitionNumber.trim() !== ""
                        ? file.requisitionNumber
                        : "-"}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      <button
                        onClick={() =>
                          handleDownload(file.poRequestId, "requisition-form")
                        }
                        className="flex gap-2"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                        <div className="text-gray-600 font-semibold">
                          Download
                        </div>
                      </button>
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      <button
                        onClick={() =>
                          handleDownload(file.poRequestId, "comparative-form")
                        }
                        className="flex gap-2"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                        <div className="text-gray-600 font-semibold">
                          Download
                        </div>
                      </button>
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      <button
                        onClick={() =>
                          handleDownload(file.poRequestId, "quotation1")
                        }
                        className="flex gap-2"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                        <div className="text-gray-600 font-semibold">
                          Download
                        </div>
                      </button>
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      <button
                        onClick={() =>
                          handleDownload(file.poRequestId, "quotation2")
                        }
                        className="flex gap-2"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                        <div className="text-gray-600 font-semibold">
                          Download
                        </div>
                      </button>
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      <button
                        onClick={() =>
                          handleDownload(file.poRequestId, "quotation3")
                        }
                        className="flex gap-2"
                      >
                        <Download className="w-5 h-5 text-gray-600" />
                        <div className="text-gray-600 font-semibold">
                          Download
                        </div>
                      </button>
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {file.comments}
                    </td>
                    <td className="py-2 px-4 text-start flex border-b items-center h-full">
                      <button
                        className="px-4 flex gap-1 items-center py-2 bg-green-500 text-white rounded-md"
                        onClick={() => handleAccept(file.poRequestId)}
                      >
                        <FaCheck />
                        <div className="text-white font-semibold">Accept</div>
                      </button>
                      <button
                        className="px-4 py-2 bg-red-500 flex items-center gap-1 text-white rounded-md ml-2"
                        onClick={() => handleReject(file.poRequestId)}
                      >
                        <FaTimes />
                        <div className="text-white font-semibold">Reject</div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="overflow-x-auto h-[85vh] overflow-y-scroll scroll-smooth">
          <div>
            <h1 className="text-3xl text-black font-semibold sticky top-0 backdrop-blur-xl p-3">
              Purchase Orders
            </h1>
            <table className="w-full h-full text-[rgb(142,143,142)] bg-white">
              <thead className="min-w-full sticky top-14 backdrop-blur-xl">
                <tr>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    Date
                  </th>
                  <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                    PO Number
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
                    Documents
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
                      {po.date && po.date.trim() !== "" ? po.date : "-"}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {po.poNumber}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {po.vendor}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {po.remainingAmount}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      {po.finalAmount.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-start border-b">
                      <button
                        className="bg-gray-200 px-4 rounded-lg py-2"
                        onClick={() =>
                          handleDownloadClick(po.poRequestId, po.poId)
                        }
                      >
                        Download
                      </button>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleEditClick(po)}
                        className="bg-red-400 text-white px-3 py-1 rounded flex items-center"
                      >
                        Edit
                        <FaEdit className="ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add PO Modal */}
      <Modal
        isOpen={isAcceptModalOpen}
        onRequestClose={() => setIsAcceptModalOpen(false)}
        style={customStyles}
        contentLabel="Accept PO Modal"
      >
        <h2 className="text-lg font-bold mb-4">Add Purchase Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                PO Number
              </label>
              <input
                type="text"
                name="poNumber"
                value={formData.poNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <select
                name="paymentType"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
                value={formData.paymentType}
                onChange={handleChange}
                required
              >
                <option value="">Select Payment Type</option>
                {["HALF", "FULL", "PARTIAL"].map((center, index) => (
                  <option key={index} value={center}>
                    {center}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vendor
              </label>
              <select
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quotation Amount
              </label>
              <input
                type="number"
                name="quotationAmount"
                value={formData.quotationAmount}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base Amount
              </label>
              <input
                type="number"
                name="baseAmount"
                value={formData.baseAmount}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                IGST
              </label>
              <select
                name="igst"
                value={formData.igst}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select IGST</option>
                {igsts.map((igst) => (
                  <option key={igst} value={igst}>
                    {igst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                IGST Amount
              </label>
              <input
                type="number"
                name="igstAmount"
                value={formData.igstAmount}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SGST
              </label>
              <select
                name="sgst"
                value={formData.sgst}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select SGST</option>
                {sgsts.map((sgst) => (
                  <option key={sgst} value={sgst}>
                    {sgst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SGST Amount
              </label>
              <input
                type="number"
                name="sgstAmount"
                value={formData.sgstAmount}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CGST
              </label>
              <select
                name="cgst"
                value={formData.cgst}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select CGST</option>
                {cgsts.map((cgst) => (
                  <option key={cgst} value={cgst}>
                    {cgst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CGST Amount
              </label>
              <input
                type="number"
                name="cgstAmount"
                value={formData.cgstAmount}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total
              </label>
              <input
                type="number"
                name="total"
                value={formData.total}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Narration
              </label>
              <textarea
                name="narration"
                value={formData.narration}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <input
              type="file"
              name="poFile"
              className="w-full border rounded p-2 bg-white"
              onChange={handleChange}
            />
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
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
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded-md ml-2"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject PO Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onRequestClose={() => setIsRejectModalOpen(false)}
        style={customStyles}
        contentLabel="Reject PO Modal"
      >
        <h2 className="text-lg font-bold mb-4 text-red-600">
          Reject Purchase Order Request
        </h2>
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Are you sure you want to reject this PO request?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Please provide a reason for rejection:
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm bg-transparent resize-none min-h-[100px]"
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            onClick={handleRejectSubmit}
          >
            Reject PO Request
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isPurchaseModalOpen}
        onRequestClose={() => setIsPurchaseModalOpen(false)}
        style={customStyles}
        contentLabel="Purchase Modal"
      >
        <h2 className="text-lg font-bold mb-4">Download Documents for PO </h2>
        <div className="flex flex-col  space-y-2">
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(
                selectedPoId ? selectedPoId : "",
                "requisition-form"
              )
            }
          >
            Download Requisition Form
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(
                selectedPoId ? selectedPoId : "",
                "comparative-form"
              )
            }
          >
            Download Comparative Form
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(selectedPoId ? selectedPoId : "", "quotation1")
            }
          >
            Download Quotation 1
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(selectedPoId ? selectedPoId : "", "quotation2")
            }
          >
            Download Quotation 2
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(selectedPoId ? selectedPoId : "", "quotation3")
            }
          >
            Download Quotation 3
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => handleDownload(selectedPO, "purchase-order")}
          >
            Download Purchase Order
          </button>
        </div>
      </Modal>

      {/* Edit PO Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        style={customStyles}
        contentLabel="Edit PO Modal"
      >
        <h2 className="text-2xl font-bold mb-6">Edit Purchase Order</h2>
        <form
          onSubmit={handleEditSave}
          className="max-h-[80vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO Number
              </label>
              <input
                type="text"
                name="poNumber"
                value={editFormData.poNumber}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                name="vendor"
                value={editFormData.vendor}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type
              </label>
              <select
                name="paymentType"
                value={editFormData.paymentType}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              >
                <option value="">Select Payment Type</option>
                {["HALF", "FULL", "PARTIAL"].map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={editFormData.date}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="quotationAmount"
                value={editFormData.quotationAmount}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="baseAmount"
                value={editFormData.baseAmount}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remaining Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="remainingAmount"
                value={editFormData.remainingAmount}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IGST
              </label>
              <select
                name="igst"
                value={editFormData.igst}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              >
                <option value="">Select IGST</option>
                {igsts.map((igst) => (
                  <option key={igst} value={igst}>
                    {igst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IGST Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="igstAmount"
                value={editFormData.igstAmount}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SGST
              </label>
              <select
                name="sgst"
                value={editFormData.sgst}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              >
                <option value="">Select SGST</option>
                {sgsts.map((sgst) => (
                  <option key={sgst} value={sgst}>
                    {sgst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SGST Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="sgstAmount"
                value={editFormData.sgstAmount}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CGST
              </label>
              <select
                name="cgst"
                value={editFormData.cgst}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              >
                <option value="">Select CGST</option>
                {cgsts.map((cgst) => (
                  <option key={cgst} value={cgst}>
                    {cgst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CGST Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="cgstAmount"
                value={editFormData.cgstAmount}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Final Amount
              </label>
              <input
                type="number"
                step="0.01"
                name="finalAmount"
                value={editFormData.finalAmount}
                onChange={handleEditChange}
                required
                className="w-full border border-gray-300 rounded p-2 bg-white text-lg font-semibold"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narration
              </label>
              <textarea
                name="narration"
                value={editFormData.narration}
                onChange={handleEditChange}
                className="w-full border border-gray-300 rounded p-2 bg-white resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
                isEditSubmitting
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
              disabled={isEditSubmitting}
            >
              {isEditSubmitting ? (
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
                "Save Purchase Order"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default PurchaseOrder;
