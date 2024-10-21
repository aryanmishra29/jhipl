import React, { useState, useEffect } from "react";
import { FaPlus, FaCheck, FaTimes, FaClock, FaFilter } from "react-icons/fa";
import { Search } from "lucide-react";
import Modal from "react-modal";
import axios from "axios";
import parseTax from "../../utils/parseTax";
import SearchableDropdown from "../../components/SearchableDropdown.tsx";

// Define the Invoice interface
interface Invoice {
  invoiceId: string;
  number: string;
  vendor: string;
  date: string;
  costCenter: string;
  glCode:string;
  gst: string;
  finalAmount: number;
  status: string;
  utrNo: string;
}

// Define the PO details interface
interface PoDetails {
  vendor: string;
  paymentType: string;
  sgst: string;
  sgstAmount: number;
  igst: string;
  igstAmount: number;
  cgst: string;
  cgstAmount: number;
  poId: string;
  baseAmount: number;
  finalAmount: number;
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

const InvoiceTable: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    poNumber: "",
    currency: "",
    companyName: "",
    baseAmount: "",
    paymentType: "",
    igst: "0",
    igstAmount: "0",
    sgst: "0",
    sgstAmount: "0",
    cgst: "0",
    cgstAmount: "0",
    total: "",
    glCode: "",
    costCenter: "",
    receipt: null as File | null,
    approvalDoc: null as File | null,
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poDetails, setPoDetails] = useState<Map<string, PoDetails>>(new Map());
  const [currentPoId, setCurrentPoId] = useState<string>("");
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [glCodes, setGlCodes] = useState<string[]>([]);
  const [pos, setPos] = useState<string[]>([]);
  const [cgsts, setCgsts] = useState<string[]>([]);

  const [sgsts, setSgsts] = useState<string[]>([]);
  const [igsts, setIgsts] = useState<string[]>([]);

  const baseUrl = "https://jhipl.grobird.in";
  // const baseUrl = 'http://localhost:8080';
  const user_id = localStorage.getItem("userId");

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
        const poResponse = await axios.get(`${baseUrl}/purchase-orders`);
        const sgstResponse = await axios.get(`${baseUrl}/info/sgst`);
        const igstResponse = await axios.get(`${baseUrl}/info/igst`);
        const cgstResponse = await axios.get(`${baseUrl}/info/cgst`);
        sgstResponse.data.push("0");
        igstResponse.data.push("0");
        cgstResponse.data.push("0");
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

        setPos(
          Array.isArray(poResponse.data)
            ? poResponse.data.map((po: any) => po.poNumber)
            : []
        );

        // Update PO details in the state
        const poDetailsMap = new Map<string, PoDetails>();
        poResponse.data.forEach((po: any) => {
          poDetailsMap.set(po.poNumber, {
            vendor: po.vendor,
            paymentType: po.paymentType,
            sgst: po.sgst,
            sgstAmount: po.sgstAmount,
            igst: po.igst,
            igstAmount: po.igstAmount,
            cgst: po.cgst,
            cgstAmount: po.cgstAmount,
            poId: po.poId,
            baseAmount: po.baseAmount,
            finalAmount: po.finalAmount,
          });
        });
        setPoDetails(poDetailsMap);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        setCostCenters([]);
        setVendors([]);
        setGlCodes([]);
        setIgsts([]);
        setCgsts([]);
        setSgsts([]);
        setPos([]);
      }
    };
    fetchDropdownData();
  }, []);

  const fetchInvoices = async () => {
    try {
      console.log(user_id);
      const response = await axios.get(`${baseUrl}/invoices/user/${user_id}`);
      if (response.status !== 200) {
        throw new Error("Failed to fetch invoices");
      }
      const data: Invoice[] = response.data.map((invoice: any) => ({
        invoiceId: invoice.invoiceId,
        number: invoice.number,
        vendor: invoice.vendor,
        date: invoice.date,
        costCenter: invoice.costCenter,
        glCode: invoice.glCode,
        gst: invoice.sgstAmount + invoice.igstAmount + invoice.cgstAmount,
        finalAmount: invoice.finalAmount,
        status: invoice.status,
        utrNo: invoice.utrNo,
      }));
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
   const handleClearFilter = () =>{
     setFilteredInvoices(invoices); // Reset to original invoices
     setFromDate(""); // Clear the date fields
     setToDate("");
     setStatusFilter(""); // Clear the status filter
     setShowPopup(false); // Close the popup
   };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>
  ) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;

    if (name === "poNumber") {
      const selectedPoDetails = poDetails.get(value);
      if (selectedPoDetails) {
        setCurrentPoId(selectedPoDetails.poId);
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          companyName: selectedPoDetails.vendor,
          paymentType: selectedPoDetails.paymentType,
          sgst: selectedPoDetails.sgst,
          sgstAmount: selectedPoDetails.sgstAmount.toFixed(4),
          igst: selectedPoDetails.igst,
          igstAmount: selectedPoDetails.igstAmount.toFixed(4),
          cgst: selectedPoDetails.cgst,
          cgstAmount: selectedPoDetails.cgstAmount.toFixed(4),
          baseAmount: selectedPoDetails.baseAmount.toFixed(4),
          total: selectedPoDetails.finalAmount.toFixed(4),
          [name]: files ? files[0] : value,
        }));
      } else {
        setCurrentPoId("");
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          companyName: "",
          paymentType: "",
          sgst: "",
          sgstAmount: "",
          igst: "",
          igstAmount: "",
          cgst: "",
          cgstAmount: "",
          baseAmount: "",
          total: "",
          [name]: files ? files[0] : value,
        }));
      }
    } else if (name === "igst") {
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
        [name]: (files && files.length>0) ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const {
      invoiceNumber,
      invoiceDate,
      poNumber,
      companyName,
      baseAmount,
      paymentType,
      igst,
      igstAmount,
      sgst,
      sgstAmount,
      cgst,
      cgstAmount,
      total,
      glCode,
      costCenter,
      receipt,
      approvalDoc,
      description,
    } = formData;

    if (
      !invoiceNumber ||
      !invoiceDate ||
      !poNumber ||
      !companyName ||
      !baseAmount ||
      !igst ||
      !sgst ||
      !cgst ||
      !total ||
      !glCode ||
      !costCenter ||
      !receipt ||
      !approvalDoc ||
      !paymentType ||
      !igstAmount ||
      !sgstAmount ||
      !cgstAmount
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("userId", user_id ?? "");
    formDataToSubmit.append("number", invoiceNumber);
    formDataToSubmit.append("costCenter", costCenter);
    formDataToSubmit.append("glCode", glCode);
    formDataToSubmit.append("poId", currentPoId);
    formDataToSubmit.append("date", invoiceDate);
    formDataToSubmit.append("baseAmount", baseAmount);
    formDataToSubmit.append("finalAmount", total);
    formDataToSubmit.append("vendor", companyName);
    formDataToSubmit.append("sgst", sgst);
    formDataToSubmit.append("sgstAmount", sgstAmount);
    formDataToSubmit.append("cgst", cgst);
    formDataToSubmit.append("cgstAmount", cgstAmount);
    formDataToSubmit.append("igst", igst);
    formDataToSubmit.append("igstAmount", igstAmount);
    formDataToSubmit.append("description", description);
    formDataToSubmit.append("paymentType", paymentType);
    if (receipt) formDataToSubmit.append("receipts", receipt);
    if (approvalDoc) formDataToSubmit.append("approvals", approvalDoc);

    try {
      await axios.post(`${baseUrl}/invoices`, formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // formDataToSubmit.forEach((value, key) => console.log(key, value));
      closeModal();
      fetchInvoices();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 px-6 h-full">
      <div className="mb-6 space-y-6">
        <h1 className="text-3xl text-black font-bold">Invoices</h1>
        <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
          <div className="w-auto relative inline-block">
            <button
              onClick={openModal}
              className="w-full md:w-auto bg-[#D7E6C5] font-bold px-6 py-1.5 rounded-xl flex items-center text-black justify-center"
            >
              <FaPlus className="mr-2" /> New invoice
            </button>
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
      <div className="overflow-auto scroll-smooth max-h-[70vh]">
        <table className="w-full h-full text-[#8E8F8E] bg-white">
          <thead className="min-w-full">
            <tr>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Invoice nr.
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Vendor
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Date
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                GL Code
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Cost Center
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                GST
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Amount
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                UTR No.
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="w-full">
            {searchFilteredInvoices.map((invoice) => (
              <tr key={invoice.invoiceId} className="text-[#252525]">
                <td className="py-2 px-4 text-start border-b">
                  {invoice.number}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.vendor}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.date}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.glCode}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.costCenter}
                </td>
                <td className="py-2 px-4 text-start border-b">{invoice.gst}</td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.finalAmount.toFixed(2)}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.utrNo}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Invoice Modal"
      >
        <h2 className="text-2xl font-bold mb-4">Add New Invoice</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-36 gap-y-4">
            <div>
              <input
                type="text"
                name="invoiceNumber"
                placeholder="Invoice number"
                className="w-full border rounded p-2 bg-white"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <SearchableDropdown
                name="glCode"
                options={glCodes.length > 0 ? glCodes : ["N/A"]}
                value={formData.glCode}
                onChange={handleChange}
                placeholder="Select GL Code"
              />
            </div>
            <div>
              <input
                type="date"
                name="invoiceDate"
                placeholder="Invoice date"
                className="w-full border rounded p-2 bg-white"
                value={formData.invoiceDate}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <SearchableDropdown
                name="costCenter"
                options={costCenters.length > 0 ? costCenters : ["N/A"]}
                value={formData.costCenter}
                onChange={handleChange}
                placeholder="Select Cost Center"
              />
            </div>

            <div>
              <select
                name="poNumber"
                className="w-full border rounded p-2 bg-white"
                value={formData.poNumber}
                onChange={handleChange}
                required
              >
                <option value="">Select PO Number</option>
                <option value="n/a">N/A</option>
                {(pos?.length > 0 ? pos : []).map((po, index) => (
                  <option key={index} value={po}>
                    {po}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                name="paymentType"
                className="w-full border rounded p-2 bg-white"
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
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="col-span-2">
              <label className="text-gray-500">Company name</label>
              <SearchableDropdown
                name="companyName"
                options={vendors.length > 0 ? vendors : ["N/A"]}
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Select Vendor"
                required
              />
            </div>
            <div>
              <label className="text-gray-500">Base Amount</label>
              <input
                type="number"
                name="baseAmount"
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.baseAmount}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-gray-500">IGST</label>
              <select
                name="igst"
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.igst}
                onChange={handleChange}
                required
              >
                <option value="">Select IGST</option>
                {(igsts.length > 0
                  ? igsts
                  : ["IGST 5%", "IGST 12%", "IGST 18%", "IGST 28%"]
                ).map((gst, index) => (
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
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.igstAmount}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-gray-500">SGST</label>
              <select
                name="sgst"
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.sgst}
                onChange={handleChange}
                required
              >
                <option value="">Select SGST</option>
                {(sgsts.length > 0
                  ? sgsts
                  : ["SGST 5%", "SGST 12%", "SGST 18%", "SGST 28%"]
                ).map((gst, index) => (
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
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.sgstAmount}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-gray-500">CGST</label>
              <select
                name="cgst"
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.cgst}
                onChange={handleChange}
                required
              >
                <option value="">Select CGST</option>
                {(cgsts.length > 0
                  ? cgsts
                  : ["CGST 5%", "CGST 12%", "CGST 18%", "CGST 28%"]
                ).map((gst, index) => (
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
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.cgstAmount}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-gray-500">Total</label>
              <input
                type="number"
                name="total"
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.total}
                onChange={handleChange}
                required
              />
            </div>
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
          <div className="flex gap-4">
            <div className="mt-4">
              <label className="text-gray-500">Receipt</label>
              <input
                type="file"
                name="receipt"
                className="w-full border rounded p-2 mt-1 bg-white"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mt-4">
              <label className="text-gray-500">Approval document</label>
              <input
                type="file"
                name="approvalDoc"
                className="w-full border rounded p-2 mt-1 bg-white"
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between">
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
  );
};

export default InvoiceTable;
