import React, { useState, useEffect } from "react";
import {
  FaFilter,
  FaEdit,
  FaDownload,
  FaCheck,
  FaTimes,
  FaClock,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import Modal from "react-modal";
import axios from "axios";
import parseTax from "../../../utils/parseTax";
import { Search } from "lucide-react";

interface Invoice {
  invoiceId: string;
  number: string;
  glCode: string;
  costCenter: string;
  paymentType: string;
  poId: string;
  date: string;
  baseAmount: number;
  finalAmount: number;
  vendor: string;
  sgst: string;
  sgstAmount: number;
  cgst: string;
  cgstAmount: number;
  igst: string;
  igstAmount: number;
  withholdingTax: string;
  utrNo: string;
  status: string;
  description: string;
  narration: string;
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

const AdminInvoiceTable: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const baseUrl = "https://jhipl.grobird.in";
  // const baseUrl = "http://localhost:8080";
  useEffect(() => {
    fetchInvoices();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setSelectedInvoice] = useState<Invoice | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    invoiceId: "",
    invoiceNumber: "",
    glCode: "",
    invoiceDate: "",
    costCenter: "",
    poNumber: "",
    paymentType: "",
    companyName: "",
    baseAmount: "",
    igst: "",
    igstAmount: "",
    sgst: "",
    sgstAmount: "",
    cgst: "",
    cgstAmount: "",
    total: "",
    withholdingTax: "",
    description: "",
    narration: "",
    status: "",
    utrNo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [glCodes, setGlCodes] = useState<string[]>([]);
  const [pos, setPos] = useState<string[]>([]);
  const [cgsts, setCgsts] = useState<string[]>([]);
  const [poDetails, setPoDetails] = useState<Map<string, string>>(new Map());
  const [idToPo, setIdToPo] = useState<Map<string, string>>(new Map());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [withholdingTaxes, setWithholdingTaxes] = useState<string[]>([]);
  const [sgsts, setSgsts] = useState<string[]>([]);
  const [igsts, setIgsts] = useState<string[]>([]);

  const [searchFilteredInvoices, setSearchFilteredInvoices] =
    useState<Invoice[]>(filteredInvoices);

  useEffect(() => {
    const newSearchFilteredInvoices = filteredInvoices.filter(
      (invoice) =>
        invoice.glCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchFilteredInvoices(newSearchFilteredInvoices);
  }, [searchTerm, filteredInvoices]);


  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const costCentersResponse = await axios.get(
          `${baseUrl}/info/cost-centers`
        );
        const vendorsResponse = await axios.get(`${baseUrl}/info/vendors`);
        const glCodesResponse = await axios.get(`${baseUrl}/info/gl-codes`);
        const sgstResponse = await axios.get(`${baseUrl}/info/sgst`);
        const igstResponse = await axios.get(`${baseUrl}/info/igst`);
        const cgstResponse = await axios.get(`${baseUrl}/info/cgst`);
        const withholdingTaxResponse = await axios.get(
          `${baseUrl}/info/withholding-taxes`
        );
        const poResponse = await axios.get(`${baseUrl}/purchase-orders`);
        sgstResponse.data.push("0");
        igstResponse.data.push("0");
        cgstResponse.data.push("0");
        withholdingTaxResponse.data.push("0");
        setCostCenters(
          Array.isArray(costCentersResponse.data)
            ? costCentersResponse.data
            : []
        );
        setVendors(
          Array.isArray(vendorsResponse.data) ? vendorsResponse.data : []
        );
        setGlCodes(
          Array.isArray(glCodesResponse.data) ? glCodesResponse.data : []
        );
        setSgsts(Array.isArray(sgstResponse.data) ? sgstResponse.data : []);
        setIgsts(Array.isArray(igstResponse.data) ? igstResponse.data : []);
        setCgsts(Array.isArray(cgstResponse.data) ? cgstResponse.data : []);
        setWithholdingTaxes(
          Array.isArray(withholdingTaxResponse.data)
            ? withholdingTaxResponse.data
            : []
        );
        setPos(
          Array.isArray(poResponse.data)
            ? poResponse.data.map((po: any) => po.poNumber)
            : []
        );
        const poDetailsMap = new Map<string, string>();
        poResponse.data.forEach((po: any) => {
          poDetailsMap.set(po.poNumber, po.poId);
        });
        const idToPoMap = new Map<string, string>();
        poResponse.data.forEach((po: any) => {
          idToPoMap.set(po.poId, po.poNumber);
        });
        setPoDetails(poDetailsMap);
        setIdToPo(idToPoMap);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        setCostCenters([]);
        setVendors([]);
        setGlCodes([]);
        setIgsts([]);
        setCgsts([]);
        setSgsts([]);
        setPos([]);
        setWithholdingTaxes([]);
      }
    };
    fetchDropdownData();
  }, []);

  const getWithholdingTaxAmount = (tax: string) => {
    const taxPercentage = parseTax(tax) / 100;
    const baseAmount = parseFloat(formData.baseAmount);
    return (baseAmount * taxPercentage).toFixed(2);
  };

  const handleEditClick = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.number,
      glCode: invoice.glCode,
      invoiceDate: invoice.date,
      costCenter: invoice.costCenter,
      poNumber: idToPo.get(invoice.poId) || "",
      paymentType: invoice.paymentType,
      companyName: invoice.vendor,
      baseAmount: invoice.baseAmount.toFixed(2),
      igst: invoice.igst,
      igstAmount: invoice.igstAmount.toFixed(2),
      sgst: invoice.sgst,
      sgstAmount: invoice.sgstAmount.toFixed(2),
      cgst: invoice.cgst,
      cgstAmount: invoice.cgstAmount.toFixed(2),
      withholdingTax: invoice.withholdingTax,
      total: invoice.finalAmount.toFixed(2),
      description: invoice.description,
      narration: invoice.narration,
      status: invoice.status,
      utrNo: invoice.utrNo,
    });
    setIsModalOpen(true);
  };
  const handleFilter = () => {
    let filtered: Invoice[] = invoices;

    if (
      (statusFilter === "" || statusFilter === "Select Status") &&
      (fromDate === "" || toDate === "")
    ) {
      setShowPopup(false);
      return;
    }

    if (fromDate !== "" && toDate !== "") {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // Filter invoices based on date range
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= from && invoiceDate <= to;
      });
    }

    if (statusFilter !== "" && statusFilter !== "Select Status") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
    setShowPopup(false);
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };
  const handleClearFilter = async () => {
    setFilteredInvoices(invoices); // Reset to original invoices
    setFromDate(""); // Clear the date fields
    setToDate("");
    setStatusFilter(""); // Clear the status filter
    setShowPopup(false); // Close the popup
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${baseUrl}/invoices`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data: Invoice[] = await response.json();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handleDownloadExcel = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    try {
      const response = await fetch(
        `${baseUrl}/invoices/excel?startDate=${startDate}&endDate=${endDate}`
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
      XLSX.writeFile(workbook, "Invoices.xlsx");
    } catch (error) {
      console.error("Error fetching or exporting data:", error);
    }
  };

  const handleDownloadFile = async (
    invoiceId: string,
    fileType: "receipts" | "approvals"
  ) => {
    console.log(invoiceId);
    try {
      const response = await fetch(
        `${baseUrl}/invoices/${invoiceId}/${fileType}`
      );
      console.log(response);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileType}-${invoiceId}.pdf`;
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
    const { name, value } = e.target;
    const files = e.currentTarget.files;

    if (name === "igst") {
      const igstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const igstAmount = (baseAmount * igstPercentage).toFixed(2);

      setFormData((prev) => ({
        ...prev,
        igst: value,
        sgst: "0",
        cgst: "0",
        sgstAmount: "0",
        cgstAmount: "0",
        igstAmount: igstAmount,
        total: (baseAmount + parseFloat(igstAmount)).toFixed(2),
      }));
    } else if (name === "sgst") {
      const sgstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(2);
      const cgstAmount = parseFloat(formData.cgstAmount);

      setFormData((prev) => ({
        ...prev,
        sgst: value,
        sgstAmount: sgstAmount,
        igst: "0",
        igstAmount: "0",
        total: (baseAmount + parseFloat(sgstAmount) + cgstAmount).toFixed(2),
      }));
    } else if (name === "cgst") {
      const cgstPercentage = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(2);
      const sgstAmount = parseFloat(formData.sgstAmount);

      setFormData((prev) => ({
        ...prev,
        cgst: value,
        igst: "0",
        igstAmount: "0",
        cgstAmount: cgstAmount,
        total: (baseAmount + parseFloat(cgstAmount) + sgstAmount).toFixed(2),
      }));
    } else if (name === "baseAmount") {
      const baseAmount = parseFloat(value);
      const igstPercentage = parseTax(formData.igst) / 100;
      const igstAmount = (baseAmount * igstPercentage).toFixed(2);
      const sgstPercentage = parseTax(formData.sgst) / 100;
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(2);
      const cgstPercentage = parseTax(formData.cgst) / 100;
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(2);

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
        ).toFixed(2),
      }));
    } else if (name === "igstAmount") {
      const igstAmount = parseFloat(value);

      setFormData((prev) => ({
        ...prev,
        igstAmount: value,
        sgstAmount: "0",
        cgstAmount: "0",
        total: (parseFloat(formData.baseAmount) + igstAmount).toFixed(2),
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
        ).toFixed(2),
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
        ).toFixed(2),
      }));
    } else if (name === "withholdingTax"){
      const withholdingTax = value;
      const withholdingTaxAmount = getWithholdingTaxAmount(withholdingTax);
      setFormData((prev) => ({
        ...prev,
        withholdingTax: value,
        total: (parseFloat(formData.total) - parseFloat(withholdingTaxAmount)).toFixed(2), 
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (formData) {
      const updateRequest = {
        invoiceId: formData.invoiceId,
        number: formData.invoiceNumber,
        glCode: formData.glCode,
        costCenter: formData.costCenter,
        paymentType: formData.paymentType,
        poId: poDetails.get(formData.poNumber),
        date: formData.invoiceDate,
        baseAmount: Number(formData.baseAmount),
        finalAmount: Number(formData.total),
        vendor: formData.companyName,
        sgst: formData.sgst,
        sgstAmount: parseFloat(formData.sgstAmount),
        cgst: formData.cgst,
        cgstAmount: parseFloat(formData.cgstAmount),
        igst: formData.igst,
        igstAmount: parseFloat(formData.igstAmount),
        withholdingTax: formData.withholdingTax,
        utrNo: formData.utrNo || "",
        status: formData.status,
        description: formData.description,
        narration: formData.narration,
      };

      try {
        const response = await fetch(`${baseUrl}/invoices/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateRequest),
        });

        if (!response.ok) {
          throw new Error("Failed to update invoice");
        }
        console.log(response);

        setIsModalOpen(false);
        setSelectedInvoice(null);
        await fetchInvoices();
        handleFilter();
      } catch (error) {
        console.error("Error updating invoice:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="mt-6 px-6 h-full">
      <div className="mb-6 space-y-6">
        <h1 className="text-3xl text-black font-bold">Invoices</h1>
        <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
          <div className="flex justify-between items-center">
            <div className="flex  items-center gap-6">
              <div className="flex space-x-2 items-center">
                <label htmlFor="startDate" className="text-black font-semibold">
                  Start Date:
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border bg-transparent text-black rounded p-2"
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
                  className="border bg-transparent text-black rounded p-2"
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
              placeholder="Search by GL Code or Vendor"
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
              <div className="absolute z-20 top-full mt-2 right-0 bg-white shadow-2xl rounded-lg p-4">
                <label className="block text-sm font-bold mb-2 text-black">
                  From Date:
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border bg-transparent text-black rounded p-2"
                />

                <label className="block text-sm font-bold mb-2 text-black mt-2">
                  To Date:
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border bg-transparent text-black rounded p-2"
                />

                <label className="block text-sm font-bold mb-2 text-black mt-2">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full border rounded p-2 bg-white text-black "
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Select Status</option>
                  {["PENDING", "APPROVED", "REJECTED"].map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <div className="flex justify-between gap-2 mt-2">
                  <button
                    onClick={async () => await handleFilter()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  >
                    Apply
                  </button>
                  <button
                    onClick={async () => await handleClearFilter()}
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
      <div className="overflow-x-auto overflow-y-scroll scroll-smooth max-h-[65vh] scrollbar-visible">
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
        <table className="w-full h-full text-[#8E8F8E] bg-white border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Invoice#
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Date
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Vendor
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                GL Code
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                PO Number
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Final Amount
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Cost Center
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
            {searchFilteredInvoices.map((invoice, index) => (
              <tr key={index} className="text-[#252525]">
                <td className="py-2 px-4 text-start border-b">
                  {invoice.number}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.date}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.vendor}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.glCode}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {idToPo.get(invoice.poId) === undefined
                    ? "-"
                    : idToPo.get(invoice.poId)}
                </td>

                <td className="py-2 px-4 text-start border-b">
                  {invoice.finalAmount}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.costCenter}
                </td>
                <td className="py-2 px-4 text-center border-b">
                  <div
                    className={`w-fit rounded-full px-2 ${
                      invoice.status === "APPROVED"
                        ? "bg-[#636C59] text-white"
                        : "bg-[#D7E6C5]"
                    }`}
                  >
                    {invoice.status === "APPROVED" ? (
                      <FaCheck />
                    ) : invoice.status === "PENDING" ? (
                      <FaClock />
                    ) : (
                      <FaTimes />
                    )}
                  </div>
                </td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleEditClick(invoice)}
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
        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal}
          style={customStyles}
          contentLabel="Invoice Modal"
        >
          <h2 className="text-2xl font-bold mb-4">Edit Invoice</h2>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-gray-500">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  placeholder="Invoice number"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-gray-500">GL Code</label>
                <select
                  name="glCode"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.glCode}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select GL Code</option>
                  {glCodes.map((code, index) => (
                    <option key={index} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">Invoice Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-gray-500">Cost Center</label>
                <select
                  name="costCenter"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.costCenter}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Cost Center</option>
                  {costCenters.map((center, index) => (
                    <option key={index} value={center}>
                      {center}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">PO Number</label>
                <select
                  name="poNumber"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.poNumber}
                  onChange={handleChange}
                >
                  <option value="">Select PO Number</option>
                  <option value="n/a">N/A</option>
                  {pos.map((po, index) => (
                    <option key={index} value={po}>
                      {po}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">Payment Type</label>
                <select
                  name="paymentType"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.paymentType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Payment Type</option>
                  {["HALF", "FULL", "PARTIAL"].map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="  grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-gray-500">Company Name</label>
                <select
                  name="companyName"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor, index) => (
                    <option key={index} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">Base Amount</label>
                <input
                  type="number"
                  name="baseAmount"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.baseAmount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-gray-500">IGST</label>
                <select
                  name="igst"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.igst}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select IGST</option>
                  {igsts.map((gst, index) => (
                    <option key={index} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">IGST Amount</label>
                <input
                  type="number"
                  name="igstAmount"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.igstAmount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-gray-500">SGST</label>
                <select
                  name="sgst"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.sgst}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select SGST</option>
                  {sgsts.map((gst, index) => (
                    <option key={index} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">SGST Amount</label>
                <input
                  type="number"
                  name="sgstAmount"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.sgstAmount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-gray-500">CGST</label>
                <select
                  name="cgst"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.cgst}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select CGST</option>
                  {cgsts.map((gst, index) => (
                    <option key={index} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">CGST Amount</label>
                <input
                  type="number"
                  name="cgstAmount"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.cgstAmount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-gray-500">Withholding Tax</label>
                <select
                  name="withholdingTax"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.withholdingTax}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Withholding Tax</option>
                  {withholdingTaxes.map((gst, index) => (
                    <option key={index} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Withholding Tax Amount:{" "}
                  {getWithholdingTaxAmount(formData.withholdingTax)}
                </p>
              </div>

              <div>
                <label className="text-gray-500">Total</label>
                <input
                  type="number"
                  name="total"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.total}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="flex justify-between gap-6">
              <div className="flex-1">
                <label className="text-gray-500">Status</label>
                <select
                  name="status"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Status</option>
                  {["PENDING", "APPROVED", "REJECTED"].map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-gray-500">UTR Number</label>
                <input
                  type="text"
                  name="utrNo"
                  placeholder="UTR number"
                  className="w-full border rounded p-2 bg-white "
                  value={formData.utrNo}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex justify-between gap-6">
              <div className="flex-1">
                <label className="text-gray-500">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded p-2 bg-white "
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-500">Narration</label>
                <textarea
                  name="narration"
                  value={formData.narration}
                  onChange={handleChange}
                  className="w-full border rounded p-2 bg-white "
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() =>
                  handleDownloadFile(formData.invoiceId, "receipts")
                }
                className="bg-blue-500 text-white px-3 py-1 rounded flex items-center"
              >
                Receipts
                <FaDownload className="ml-1" />
              </button>
              <button
                onClick={() =>
                  handleDownloadFile(formData.invoiceId, "approvals")
                }
                className="bg-green-500 text-white px-3 py-1 rounded flex items-center"
              >
                Approvals
                <FaDownload className="ml-1" />
              </button>
            </div>
            <div className=" flex justify-end">
              <button
                type="submit"
                className={`bg-[#D7E6C5] text-black px-4 py-2 rounded ${
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
                  "Save Invoice"
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default AdminInvoiceTable;
