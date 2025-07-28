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
import { Search } from "lucide-react";
import Modal from "react-modal";
import axios from "axios";
import parseTax from "../../utils/parseTax";
import SearchableDropdown from "../../components/SearchableDropdown.tsx";
import toast from "react-hot-toast";
import { isBlockedDate, getBlockedDateMessage } from "../../utils/dateUtils";

// Define the Invoice interface
interface Invoice {
  invoiceId: string;
  number: string;
  vendor: string;
  date: string;
  generatedDate: string;
  dateOfPayment: string;
  costCenter: string;
  glCode: string;
  gst: string;
  baseAmount: number;
  finalAmount: number;
  paymentType: string;
  poId: string;
  sgst: string;
  sgstAmount: number;
  cgst: string;
  cgstAmount: number;
  igst: string;
  igstAmount: number;
  sgst2: string;
  sgstAmount2: number;
  cgst2: string;
  cgstAmount2: number;
  igst2: string;
  igstAmount2: number;
  withholdingTax: string;
  status: string;
  utrNo: string;
  description: string;
  narration: string;
  comments: string;
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
    width: "1200px",
    maxWidth: "95%",
    maxHeight: "95vh",
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
  const [glCodeFilter, setGlCodeFilter] = useState("");
  const [costCenterFilter, setCostCenterFilter] = useState("");
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
    igst2: "0",
    igstAmount2: "0",
    sgst2: "0",
    sgstAmount2: "0",
    cgst2: "0",
    cgstAmount2: "0",
    total: "",
    glCode: "",
    costCenter: "",
    receipt: null as File | null,
    approvalDoc: null as File | null,
    description: "",
  });

  const [costCenterRows, setCostCenterRows] = useState([
    { costCenter: "", amount: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingInvoiceNumber, setIsCheckingInvoiceNumber] = useState(false);
  const [invoiceNumberError, setInvoiceNumberError] = useState("");
  const [invoiceNumberValid, setInvoiceNumberValid] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(
    undefined
  );
  const [costCenterDetails, setCostCenterDetails] = useState<
    { costCenter: string; amount: number }[]
  >([]);
  const [idToPo, setIdToPo] = useState<Map<string, string>>(new Map());

  const getWithholdingTaxAmount = (tax: string, baseAmount: number) => {
    const taxPercentage = parseTax(tax) / 100;
    return (baseAmount * taxPercentage).toFixed(2);
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
      updateBaseAmountFromCostCenters(newRows);
    }
  };

  // Function to update cost center row
  const updateCostCenterRow = (index: number, field: string, value: string) => {
    const newRows = [...costCenterRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setCostCenterRows(newRows);
    if (field === "amount") {
      updateBaseAmountFromCostCenters(newRows);
    }
  };

  // Function to calculate base amount from cost center amounts
  const updateBaseAmountFromCostCenters = (rows: typeof costCenterRows) => {
    const totalAmount = rows.reduce((sum, row) => {
      const amount = parseFloat(row.amount) || 0;
      return sum + amount;
    }, 0);

    setFormData((prev) => ({
      ...prev,
      baseAmount: totalAmount.toFixed(2),
    }));

    // Recalculate tax amounts based on new base amount
    recalculateTaxes(totalAmount);
  };

  // Function to recalculate all tax amounts when base amount changes
  const recalculateTaxes = (baseAmount: number) => {
    const igstPercentage = parseTax(formData.igst) / 100;
    const igstAmount = (baseAmount * igstPercentage).toFixed(4);
    const sgstPercentage = parseTax(formData.sgst) / 100;
    const sgstAmount = (baseAmount * sgstPercentage).toFixed(4);
    const cgstPercentage = parseTax(formData.cgst) / 100;
    const cgstAmount = (baseAmount * cgstPercentage).toFixed(4);
    const igstPercentage2 = parseTax(formData.igst2) / 100;
    const igstAmount2 = (baseAmount * igstPercentage2).toFixed(4);
    const sgstPercentage2 = parseTax(formData.sgst2) / 100;
    const sgstAmount2 = (baseAmount * sgstPercentage2).toFixed(4);
    const cgstPercentage2 = parseTax(formData.cgst2) / 100;
    const cgstAmount2 = (baseAmount * cgstPercentage2).toFixed(4);

    setFormData((prev) => ({
      ...prev,
      igstAmount: igstAmount,
      sgstAmount: sgstAmount,
      cgstAmount: cgstAmount,
      igstAmount2: igstAmount2,
      sgstAmount2: sgstAmount2,
      cgstAmount2: cgstAmount2,
      total: (
        baseAmount +
        parseFloat(igstAmount) +
        parseFloat(sgstAmount) +
        parseFloat(cgstAmount) +
        parseFloat(igstAmount2) +
        parseFloat(sgstAmount2) +
        parseFloat(cgstAmount2)
      ).toFixed(4),
    }));
  };
  const [poDetails, setPoDetails] = useState<Map<string, PoDetails>>(new Map());
  const [currentPoId, setCurrentPoId] = useState<string>("");
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [glCodes, setGlCodes] = useState<string[]>([]);
  const [pos, setPos] = useState<string[]>([]);
  const [cgsts, setCgsts] = useState<string[]>([]);

  const [sgsts, setSgsts] = useState<string[]>([]);
  const [igsts, setIgsts] = useState<string[]>([]);

  // Function to check if invoice number is unique
  const checkInvoiceNumberUniqueness = async (invoiceNumber: string) => {
    if (!invoiceNumber.trim()) {
      setInvoiceNumberError("");
      setInvoiceNumberValid(false);
      return;
    }

    setIsCheckingInvoiceNumber(true);
    setInvoiceNumberError("");

    try {
      const response = await axios.get(`${baseUrl}/invoices/number/used`, {
        params: { invoiceNumber },
      });

      if (response.data === true) {
        setInvoiceNumberError(
          "This invoice number is already used. Please choose a different number."
        );
        setInvoiceNumberValid(false);
      } else {
        setInvoiceNumberError("");
        setInvoiceNumberValid(true);
      }
    } catch (error) {
      console.error("Error checking invoice number:", error);
      setInvoiceNumberError(
        "Error validating invoice number. Please try again."
      );
      setInvoiceNumberValid(false);
    } finally {
      setIsCheckingInvoiceNumber(false);
    }
  };

  // Debounced invoice number check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.invoiceNumber) {
        checkInvoiceNumberUniqueness(formData.invoiceNumber);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [formData.invoiceNumber]);

  const baseUrl = "https://jhipl.grobird.in";
  // const baseUrl = 'http://localhost:8080';
  const user_id = localStorage.getItem("userId");

  const [searchFilteredInvoices, setSearchFilteredInvoices] =
    useState<Invoice[]>(filteredInvoices);

  useEffect(() => {
    const newSearchFilteredInvoices = filteredInvoices.filter(
      (invoice) =>
        invoice.glCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.costCenter.toLowerCase().includes(searchTerm.toLowerCase())
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
        const idToPoMap = new Map<string, string>();
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
        generatedDate: invoice.generatedDate || "",
        dateOfPayment: invoice.dateOfPayment || "",
        costCenter: invoice.costCenter,
        glCode: invoice.glCode,
        gst:
          invoice.sgstAmount +
          invoice.igstAmount +
          invoice.cgstAmount +
          invoice.igstAmount2 +
          invoice.sgstAmount2 +
          invoice.cgstAmount2,
        baseAmount: invoice.baseAmount,
        finalAmount: invoice.finalAmount,
        paymentType: invoice.paymentType || "",
        poId: invoice.poId || "",
        sgst: invoice.sgst || "",
        sgstAmount: invoice.sgstAmount || 0,
        cgst: invoice.cgst || "",
        cgstAmount: invoice.cgstAmount || 0,
        igst: invoice.igst || "",
        igstAmount: invoice.igstAmount || 0,
        sgst2: invoice.sgst2 || "",
        sgstAmount2: invoice.sgstAmount2 || 0,
        cgst2: invoice.cgst2 || "",
        cgstAmount2: invoice.cgstAmount2 || 0,
        igst2: invoice.igst2 || "",
        igstAmount2: invoice.igstAmount2 || 0,
        withholdingTax: invoice.withholdingTax || "",
        status: invoice.status,
        utrNo: invoice.utrNo || "",
        description: invoice.description || "",
        narration: invoice.narration || "",
        comments: invoice.comments || "",
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
    // Check if the current date is a blocked date
    if (isBlockedDate()) {
      // Show toast notification instead of opening the modal
      toast.error(getBlockedDateMessage("invoices"));
      return;
    }

    // If not a blocked date, proceed with opening the modal
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset cost center rows
    setCostCenterRows([{ costCenter: "", amount: "" }]);
    // Reset invoice number validation states
    setInvoiceNumberError("");
    setInvoiceNumberValid(false);
    setIsCheckingInvoiceNumber(false);
    // Reset form data
    setFormData({
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
      igst2: "0",
      igstAmount2: "0",
      sgst2: "0",
      sgstAmount2: "0",
      cgst2: "0",
      cgstAmount2: "0",
      total: "",
      glCode: "",
      costCenter: "",
      receipt: null,
      approvalDoc: null,
      description: "",
    });
  };

  const openDetailsModal = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);

    // Get detailed invoice data to fetch baseAmountSplitForCostCenters
    try {
      const response = await fetch(`${baseUrl}/invoices/${invoice.invoiceId}`);
      if (response.ok) {
        const detailedInvoice = await response.json();

        // Parse cost centers and amounts
        const costCenterArray = invoice.costCenter
          .split(";")
          .filter((cc) => cc.trim() !== "");
        const amountArray = detailedInvoice.baseAmountSplitForCostCenters || [];

        // If baseAmountSplitForCostCenters is null/empty, use total amount for single cost center
        if (!amountArray || amountArray.length === 0) {
          setCostCenterDetails([
            {
              costCenter: costCenterArray[0] || invoice.costCenter,
              amount: invoice.finalAmount,
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
            costCenter: invoice.costCenter.split(";")[0] || "",
            amount: invoice.finalAmount,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching detailed invoice data:", error);
      // Fallback to single cost center
      setCostCenterDetails([
        {
          costCenter: invoice.costCenter.split(";")[0] || "",
          amount: invoice.finalAmount,
        },
      ]);
    }

    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedInvoice(undefined);
    setCostCenterDetails([]);
  };

  const handleDownloadFile = async (
    invoiceId: string,
    fileType: "receipts" | "approvals"
  ) => {
    try {
      const response = await fetch(
        `${baseUrl}/invoices/${invoiceId}/${fileType}`
      );
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

  const handleFilter = () => {
    let filtered: Invoice[] = invoices;

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
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= from && invoiceDate <= to;
      });
    }

    if (statusFilter !== "" && statusFilter !== "Select Status") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    if (glCodeFilter !== "") {
      filtered = filtered.filter((invoice) => invoice.glCode === glCodeFilter);
    }

    if (costCenterFilter !== "") {
      filtered = filtered.filter(
        (invoice) => invoice.costCenter === costCenterFilter
      );
    }

    setFilteredInvoices(filtered);
    setShowPopup(false);
  };

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };
  const handleClearFilter = () => {
    setFilteredInvoices(invoices); // Reset to original invoices
    setFromDate(""); // Clear the date fields
    setToDate("");
    setStatusFilter(""); // Clear the status filter
    setGlCodeFilter(""); // Clear the GL code filter
    setCostCenterFilter(""); // Clear the cost center filter
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
        total: (
          baseAmount +
          parseFloat(igstAmount) +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(4),
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
        total: (
          baseAmount +
          parseFloat(sgstAmount) +
          cgstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(4),
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
        total: (
          baseAmount +
          parseFloat(cgstAmount) +
          sgstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(4),
      }));
    } else if (name === "baseAmount") {
      const baseAmount = parseFloat(value);
      const igstPercentage = parseTax(formData.igst) / 100;
      const igstAmount = (baseAmount * igstPercentage).toFixed(4);
      const sgstPercentage = parseTax(formData.sgst) / 100;
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(4);
      const cgstPercentage = parseTax(formData.cgst) / 100;
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(4);
      const igstPercentage2 = parseTax(formData.igst2) / 100;
      const igstAmount2 = (baseAmount * igstPercentage2).toFixed(4);
      const sgstPercentage2 = parseTax(formData.sgst2) / 100;
      const sgstAmount2 = (baseAmount * sgstPercentage2).toFixed(4);
      const cgstPercentage2 = parseTax(formData.cgst2) / 100;
      const cgstAmount2 = (baseAmount * cgstPercentage2).toFixed(4);

      setFormData((prev) => ({
        ...prev,
        baseAmount: value,
        igstAmount: igstAmount,
        sgstAmount: sgstAmount,
        cgstAmount: cgstAmount,
        igstAmount2: igstAmount2,
        sgstAmount2: sgstAmount2,
        cgstAmount2: cgstAmount2,
        total: (
          baseAmount +
          parseFloat(igstAmount) +
          parseFloat(sgstAmount) +
          parseFloat(cgstAmount) +
          parseFloat(igstAmount2) +
          parseFloat(sgstAmount2) +
          parseFloat(cgstAmount2)
        ).toFixed(4),
      }));
    } else if (name === "igstAmount") {
      const igstAmount = parseFloat(value);

      setFormData((prev) => ({
        ...prev,
        igstAmount: value,
        sgstAmount: "0",
        cgstAmount: "0",
        total: (
          parseFloat(formData.baseAmount) +
          igstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(4),
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
          cgstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
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
          sgstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(4),
      }));
    } else if (name === "igst2") {
      const igstPercentage2 = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const igstAmount2 = (baseAmount * igstPercentage2).toFixed(4);

      setFormData((prev) => ({
        ...prev,
        igst2: value,
        sgst2: "0",
        cgst2: "0",
        sgstAmount2: "0",
        cgstAmount2: "0",
        igstAmount2: igstAmount2,
        total: (
          baseAmount +
          parseFloat(igstAmount2) +
          parseFloat(formData.igstAmount) +
          parseFloat(formData.cgstAmount) +
          parseFloat(formData.sgstAmount)
        ).toFixed(4),
      }));
    } else if (name === "sgst2") {
      const sgstPercentage2 = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const sgstAmount2 = (baseAmount * sgstPercentage2).toFixed(4);
      const cgstAmount2 = parseFloat(formData.cgstAmount2);

      setFormData((prev) => ({
        ...prev,
        sgst2: value,
        sgstAmount2: sgstAmount2,
        igst2: "0",
        igstAmount2: "0",
        total: (
          baseAmount +
          parseFloat(sgstAmount2) +
          cgstAmount2 +
          parseFloat(formData.igstAmount) +
          parseFloat(formData.cgstAmount) +
          parseFloat(formData.sgstAmount)
        ).toFixed(4),
      }));
    } else if (name === "cgst2") {
      const cgstPercentage2 = parseTax(value) / 100;
      const baseAmount = parseFloat(formData.baseAmount);
      const cgstAmount2 = (baseAmount * cgstPercentage2).toFixed(4);
      const sgstAmount2 = parseFloat(formData.sgstAmount2);

      setFormData((prev) => ({
        ...prev,
        cgst2: value,
        igst2: "0",
        igstAmount2: "0",
        cgstAmount2: cgstAmount2,
        total: (
          baseAmount +
          parseFloat(cgstAmount2) +
          sgstAmount2 +
          parseFloat(formData.igstAmount) +
          parseFloat(formData.cgstAmount) +
          parseFloat(formData.sgstAmount)
        ).toFixed(4),
      }));
    } else if (name === "igstAmount2") {
      const igstAmount2 = parseFloat(value);

      setFormData((prev) => ({
        ...prev,
        igstAmount2: value,
        sgstAmount2: "0",
        cgstAmount2: "0",
        total: (
          parseFloat(formData.baseAmount) +
          igstAmount2 +
          parseFloat(formData.igstAmount) +
          parseFloat(formData.cgstAmount) +
          parseFloat(formData.sgstAmount)
        ).toFixed(4),
      }));
    } else if (name === "sgstAmount2") {
      const sgstAmount2 = parseFloat(value);
      const cgstAmount2 = parseFloat(formData.cgstAmount2);

      setFormData((prev) => ({
        ...prev,
        sgstAmount2: value,
        igstAmount2: "0",
        total: (
          parseFloat(formData.baseAmount) +
          sgstAmount2 +
          cgstAmount2 +
          parseFloat(formData.igstAmount) +
          parseFloat(formData.cgstAmount) +
          parseFloat(formData.sgstAmount)
        ).toFixed(4),
      }));
    } else if (name === "cgstAmount2") {
      const cgstAmount2 = parseFloat(value);
      const sgstAmount2 = parseFloat(formData.sgstAmount2);

      setFormData((prev) => ({
        ...prev,
        cgstAmount2: value,
        igstAmount2: "0",
        total: (
          parseFloat(formData.baseAmount) +
          cgstAmount2 +
          sgstAmount2 +
          parseFloat(formData.igstAmount) +
          parseFloat(formData.cgstAmount) +
          parseFloat(formData.sgstAmount)
        ).toFixed(4),
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
      igst2,
      igstAmount2,
      sgst2,
      sgstAmount2,
      cgst2,
      cgstAmount2,
      total,
      glCode,
      receipt,
      approvalDoc,
      description,
    } = formData;

    // Validate invoice number uniqueness
    if (invoiceNumberError || !invoiceNumberValid) {
      alert("Please enter a valid and unique invoice number.");
      setIsSubmitting(false);
      return;
    }

    // Validate cost center rows
    const hasValidCostCenters = costCenterRows.every(
      (row) => row.costCenter && row.amount
    );
    if (!hasValidCostCenters) {
      alert("Please fill in all cost centers and amounts.");
      setIsSubmitting(false);
      return;
    }

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
      !receipt ||
      !approvalDoc ||
      !paymentType ||
      !igstAmount ||
      !sgstAmount ||
      !cgstAmount
    ) {
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

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("userId", user_id ?? "");
    formDataToSubmit.append("number", invoiceNumber);
    formDataToSubmit.append("costCenter", costCenterString);

    // Send array elements individually
    baseAmountForCostCenters.forEach((amount) => {
      formDataToSubmit.append(
        "baseAmountSplitForCostCenters",
        amount.toString()
      );
    });
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
    formDataToSubmit.append("sgst2", sgst2);
    formDataToSubmit.append("sgstAmount2", sgstAmount2);
    formDataToSubmit.append("cgst2", cgst2);
    formDataToSubmit.append("cgstAmount2", cgstAmount2);
    formDataToSubmit.append("igst2", igst2);
    formDataToSubmit.append("igstAmount2", igstAmount2);
    formDataToSubmit.append("description", description);
    formDataToSubmit.append("paymentType", paymentType);
    if (receipt) formDataToSubmit.append("receipts", receipt);
    if (approvalDoc) formDataToSubmit.append("approvals", approvalDoc);

    try {
      formDataToSubmit.forEach((value, key) => console.log(key, value));
      await axios.post(`${baseUrl}/invoices`, formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
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
              placeholder="Search by GL Code, Vendor or Cost Center"
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
      <div className="overflow-y-auto scroll-smooth max-h-[70vh]">
        <table className="w-full h-full text-[#8E8F8E] bg-white">
          <thead className="min-w-full">
            <tr>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Entry Date
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Invoice nr.
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Vendor
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Document Date
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                GL Code
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Cost Center
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Amount
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
            {searchFilteredInvoices.map((invoice) => (
              <tr key={invoice.invoiceId} className="text-[#252525]">
                <td className="py-2 px-4 text-start border-b">
                  {invoice.generatedDate && invoice.generatedDate.trim() !== ""
                    ? invoice.generatedDate
                    : "-"}
                </td>
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
                  {invoice.costCenter.replace(/;/g, ", ")}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.finalAmount.toFixed(2)}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.comments && invoice.comments.trim() !== ""
                    ? invoice.comments
                    : "-"}
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
                <td className="py-2 px-4 text-start border-b">
                  <button
                    onClick={() => openDetailsModal(invoice)}
                    className="bg-blue-500 text-white px-3 py-1 rounded flex items-center hover:bg-blue-600 transition-colors"
                  >
                    Details
                    <FaEye className="ml-1" />
                  </button>
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
        <h2 className="text-2xl font-bold mb-6">Add New Invoice</h2>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
          {/* Basic Invoice Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Invoice Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Invoice Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="invoiceNumber"
                    placeholder="Enter invoice number"
                    className={`w-full border rounded p-2 bg-white pr-10 ${
                      invoiceNumberError
                        ? "border-red-500 bg-red-50"
                        : invoiceNumberValid
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300"
                    }`}
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    required
                  />
                  {isCheckingInvoiceNumber && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="animate-spin h-4 w-4 text-blue-500"
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
                    </div>
                  )}
                  {!isCheckingInvoiceNumber && invoiceNumberValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FaCheck className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {!isCheckingInvoiceNumber && invoiceNumberError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FaTimes className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {invoiceNumberError && (
                  <p className="mt-1 text-sm text-red-600">
                    {invoiceNumberError}
                  </p>
                )}
                {invoiceNumberValid && !invoiceNumberError && (
                  <p className="mt-1 text-sm text-green-600">
                    ✓ Invoice number is available
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="invoiceDate"
                  className="w-full border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
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
                />
              </div>
            </div>
          </div>

          {/* Vendor and PO Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Vendor & Purchase Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Company Name
                </label>
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
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  PO Number
                </label>
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
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Payment Type
                </label>
                <select
                  name="paymentType"
                  className="w-full border rounded p-2 bg-white"
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
          </div>

          {/* Cost Centers Section */}
          <div className="mb-8">
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
                    Base Amount{" "}
                    <span className="text-xs text-gray-500">
                      (Auto-calculated from cost centers, but editable)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="baseAmount"
                    className="w-full border rounded p-3 bg-white text-lg font-semibold"
                    value={formData.baseAmount}
                    onChange={handleChange}
                    placeholder="Auto-calculated or enter manually"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Tax Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Tax Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Tax Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-600 mb-3">
                  Primary Tax
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      IGST
                    </label>
                    <select
                      name="igst"
                      className="w-full border rounded p-2 bg-white"
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      IGST Amount
                    </label>
                    <input
                      type="number"
                      name="igstAmount"
                      className={`w-full border rounded p-2 ${
                        formData.igst === "0" || formData.igst === ""
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      value={formData.igstAmount}
                      onChange={handleChange}
                      disabled={formData.igst === "0" || formData.igst === ""}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      SGST
                    </label>
                    <select
                      name="sgst"
                      className="w-full border rounded p-2 bg-white"
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      SGST Amount
                    </label>
                    <input
                      type="number"
                      name="sgstAmount"
                      className={`w-full border rounded p-2 ${
                        formData.sgst === "0" || formData.sgst === ""
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      value={formData.sgstAmount}
                      onChange={handleChange}
                      disabled={formData.sgst === "0" || formData.sgst === ""}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      CGST
                    </label>
                    <select
                      name="cgst"
                      className="w-full border rounded p-2 bg-white"
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      CGST Amount
                    </label>
                    <input
                      type="number"
                      name="cgstAmount"
                      className={`w-full border rounded p-2 ${
                        formData.cgst === "0" || formData.cgst === ""
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      value={formData.cgstAmount}
                      onChange={handleChange}
                      disabled={formData.cgst === "0" || formData.cgst === ""}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Tax Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-600 mb-3">
                  Secondary Tax
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      IGST 2
                    </label>
                    <select
                      name="igst2"
                      className="w-full border rounded p-2 bg-white"
                      value={formData.igst2}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select IGST 2</option>
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      IGST Amount 2
                    </label>
                    <input
                      type="number"
                      name="igstAmount2"
                      className={`w-full border rounded p-2 ${
                        formData.igst2 === "0" || formData.igst2 === ""
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      value={formData.igstAmount2}
                      onChange={handleChange}
                      disabled={formData.igst2 === "0" || formData.igst2 === ""}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      SGST 2
                    </label>
                    <select
                      name="sgst2"
                      className="w-full border rounded p-2 bg-white"
                      value={formData.sgst2}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select SGST 2</option>
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      SGST Amount 2
                    </label>
                    <input
                      type="number"
                      name="sgstAmount2"
                      className={`w-full border rounded p-2 ${
                        formData.sgst2 === "0" || formData.sgst2 === ""
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      value={formData.sgstAmount2}
                      onChange={handleChange}
                      disabled={formData.sgst2 === "0" || formData.sgst2 === ""}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      CGST 2
                    </label>
                    <select
                      name="cgst2"
                      className="w-full border rounded p-2 bg-white"
                      value={formData.cgst2}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select CGST 2</option>
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
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      CGST Amount 2
                    </label>
                    <input
                      type="number"
                      name="cgstAmount2"
                      className={`w-full border rounded p-2 ${
                        formData.cgst2 === "0" || formData.cgst2 === ""
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      value={formData.cgstAmount2}
                      onChange={handleChange}
                      disabled={formData.cgst2 === "0" || formData.cgst2 === ""}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="w-full">
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Final Total Amount{" "}
                  <span className="text-sm text-gray-500">
                    (Auto-calculated from base + taxes, but editable)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="total"
                  className="w-full border rounded p-3 bg-white text-xl font-bold"
                  value={formData.total}
                  onChange={handleChange}
                  placeholder="Auto-calculated or enter manually"
                  required
                />
              </div>
            </div>
          </div>
          {/* Description and Documents */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter invoice description or notes..."
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white resize-none"
                  rows={3}
                />
              </div>
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
                    required
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
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className={`bg-[#D7E6C5] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#c9d9b8] transition-colors ${
                isSubmitting
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 text-black mr-2"
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
                "Save Invoice"
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
        contentLabel="Invoice Details"
      >
        <h2 className="text-2xl font-bold mb-6">Invoice Details</h2>
        {selectedInvoice && (
          <div className="max-h-[80vh] overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-gray-500">Invoice Number</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.number}
                </div>
              </div>
              <div>
                <label className="text-gray-500">GL Code</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.glCode}
                </div>
              </div>
              <div>
                <label className="text-gray-500">Document Date</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.date}
                </div>
              </div>
              <div>
                <label className="text-gray-500">Entry Date</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.generatedDate &&
                  selectedInvoice.generatedDate.trim() !== ""
                    ? selectedInvoice.generatedDate
                    : "-"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">Payment Date</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.dateOfPayment &&
                  selectedInvoice.dateOfPayment.trim() !== ""
                    ? selectedInvoice.dateOfPayment
                    : "-"}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-gray-500 block mb-2">Cost Centers</label>
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
                      <div className="font-bold text-gray-800">
                        Total Base Amount
                      </div>
                      <div className="font-bold text-blue-600">
                        ₹
                        {costCenterDetails
                          .reduce((sum, detail) => sum + detail.amount, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Base Amount
                    </label>
                    <div className="w-full border rounded p-3 bg-gray-100 text-lg font-semibold text-gray-700">
                      {selectedInvoice.baseAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-gray-500">PO Number</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {idToPo.get(selectedInvoice.poId) === undefined
                    ? "-"
                    : idToPo.get(selectedInvoice.poId)}
                </div>
              </div>
              <div>
                <label className="text-gray-500">Payment Type</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.paymentType || "-"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-gray-500">Company Name</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.vendor}
                </div>
              </div>

              <div>
                <label className="text-gray-500">IGST</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.igst || "-"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">IGST Amount</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.igstAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-gray-500">SGST</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.sgst || "-"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">SGST Amount</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.sgstAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="text-gray-500">CGST</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.cgst || "-"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">CGST Amount</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.cgstAmount.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-gray-500">IGST 2</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.igst2 || "-"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">IGST Amount 2</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.igstAmount2
                    ? selectedInvoice.igstAmount2.toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">SGST 2</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.sgst2 || "-"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">SGST Amount 2</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.sgstAmount2
                    ? selectedInvoice.sgstAmount2.toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">CGST 2</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.cgst2 || "-"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">CGST Amount 2</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.cgstAmount2
                    ? selectedInvoice.cgstAmount2.toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div>
                <label className="text-gray-500">Withholding Tax</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.withholdingTax || "-"}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Withholding Tax Amount:{" "}
                  {getWithholdingTaxAmount(
                    selectedInvoice.withholdingTax || "0",
                    selectedInvoice.baseAmount
                  )}
                </p>
              </div>

              {/* Total Amount Display */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg col-span-2">
                <div className="w-full">
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Final Total Amount
                  </label>
                  <div className="w-full border rounded p-3 bg-gray-100 text-xl font-bold text-gray-700">
                    {selectedInvoice.finalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-6">
              <div className="flex-1">
                <label className="text-gray-500">Status</label>
                <div className="w-full border rounded p-2 bg-gray-100">
                  <div
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      selectedInvoice.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : selectedInvoice.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedInvoice.status === "APPROVED" ? (
                      <FaCheck className="mr-1" />
                    ) : selectedInvoice.status === "PENDING" ? (
                      <FaClock className="mr-1" />
                    ) : (
                      <FaTimes className="mr-1" />
                    )}
                    {selectedInvoice.status}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-gray-500">UTR Number</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700">
                  {selectedInvoice.utrNo || "-"}
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-6">
              <div className="flex-1">
                <label className="text-gray-500">Description</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700 min-h-[60px]">
                  {selectedInvoice.description || "-"}
                </div>
              </div>
              <div className="flex-1">
                <label className="text-gray-500">Narration</label>
                <div className="w-full border rounded p-2 bg-gray-100 text-gray-700 min-h-[60px]">
                  {selectedInvoice.narration || "-"}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-gray-500">Comments</label>
              <div className="w-full border rounded p-2 bg-gray-100 text-gray-700 min-h-[60px]">
                {selectedInvoice.comments || "-"}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() =>
                  handleDownloadFile(selectedInvoice.invoiceId, "receipts")
                }
                className="bg-blue-500 text-white px-3 py-1 rounded flex items-center hover:bg-blue-600 transition-colors"
              >
                Receipts
                <FaDownload className="ml-1" />
              </button>
              <button
                onClick={() =>
                  handleDownloadFile(selectedInvoice.invoiceId, "approvals")
                }
                className="bg-green-500 text-white px-3 py-1 rounded flex items-center hover:bg-green-600 transition-colors"
              >
                Approvals
                <FaDownload className="ml-1" />
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

export default InvoiceTable;
