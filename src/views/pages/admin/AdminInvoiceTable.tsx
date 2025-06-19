import React, { useState, useEffect } from "react";
import {
  FaFilter,
  FaEdit,
  FaDownload,
  FaCheck,
  FaTimes,
  FaClock,
  FaPlus,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import Modal from "react-modal";
import axios from "axios";
import parseTax from "../../../utils/parseTax";
import { Search } from "lucide-react";
import SearchableDropdown from "../../../components/SearchableDropdown";
import {
  isRestrictedAdmin,
  getRestrictedAdminEmail,
  getRestrictedAdminUserIds,
} from "../../../utils/adminUtils";

interface Invoice {
  userId: string;
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
  sgst2: string;
  sgstAmount2: number;
  cgst2: string;
  cgstAmount2: number;
  igst2: string;
  igstAmount2: number;
  withholdingTax: string;
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
  const [glCodeFilter, setGlCodeFilter] = useState("");
  const [costCenterFilter, setCostCenterFilter] = useState("");
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
    igst2: "",
    igstAmount2: "",
    sgst2: "",
    sgstAmount2: "",
    cgst2: "",
    cgstAmount2: "",
    total: "",
    withholdingTax: "",
    description: "",
    narration: "",
    status: "",
    utrNo: "",
    comments: "",
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

  const [costCenterRows, setCostCenterRows] = useState([
    { costCenter: "", amount: "" },
  ]);

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

  const handleEditClick = async (invoice: Invoice) => {
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

        // If baseAmountSplitForCostCenters is null/empty, use baseAmount for single cost center
        if (!amountArray || amountArray.length === 0) {
          setCostCenterRows([
            {
              costCenter: costCenterArray[0] || invoice.costCenter,
              amount: invoice.baseAmount.toFixed(2),
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
            costCenter: invoice.costCenter,
            amount: invoice.baseAmount.toFixed(2),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching detailed invoice data:", error);
      // Fallback to single cost center
      setCostCenterRows([
        {
          costCenter: invoice.costCenter.split(";")[0] || "",
          amount: invoice.baseAmount.toFixed(2),
        },
      ]);
    }

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
      igst2: invoice.igst2 ? invoice.igst2 : "0",
      igstAmount2: invoice.igstAmount2
        ? invoice.igstAmount2.toFixed(2)
        : "0.00",
      sgst2: invoice.sgst2 ? invoice.sgst2 : "0",
      sgstAmount2: invoice.sgstAmount2
        ? invoice.sgstAmount2.toFixed(2)
        : "0.00",
      cgst2: invoice.cgst2 ? invoice.cgst2 : "0",
      cgstAmount2: invoice.cgstAmount2
        ? invoice.cgstAmount2.toFixed(2)
        : "0.00",
      withholdingTax: invoice.withholdingTax,
      total: invoice.finalAmount.toFixed(2),
      description: invoice.description,
      narration: invoice.narration,
      status: invoice.status,
      utrNo: invoice.utrNo,
      comments: invoice.comments || "",
    });
    setIsModalOpen(true);
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
  const handleClearFilter = async () => {
    setFilteredInvoices(invoices); // Reset to original invoices
    setFromDate(""); // Clear the date fields
    setToDate("");
    setStatusFilter(""); // Clear the status filter
    setGlCodeFilter(""); // Clear the GL code filter
    setCostCenterFilter(""); // Clear the cost center filter
    setShowPopup(false); // Close the popup
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
    // Reset cost center rows
    setCostCenterRows([{ costCenter: "", amount: "" }]);
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${baseUrl}/invoices`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let data: Invoice[] = await response.json();

      // Filter invoices for restricted admins
      if (isRestrictedAdmin()) {
        const adminEmail = getRestrictedAdminEmail();
        if (adminEmail) {
          const allowedUserIds = getRestrictedAdminUserIds(adminEmail);
          data = data.filter((invoice) =>
            allowedUserIds.includes(invoice.userId)
          );
        }
      }

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

    // If admin is restricted and trying to change fields other than status or description, prevent it
    const restrictedAdmin = isRestrictedAdmin();
    if (restrictedAdmin && name !== "status" && name !== "description") {
      return;
    }

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
        total: (
          baseAmount +
          parseFloat(igstAmount) +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(2),
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
        total: (
          baseAmount +
          parseFloat(sgstAmount) +
          cgstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(2),
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
        total: (
          baseAmount +
          parseFloat(cgstAmount) +
          sgstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(2),
      }));
    } else if (name === "baseAmount") {
      const baseAmount = parseFloat(value);
      const igstPercentage = parseTax(formData.igst) / 100;
      const igstAmount = (baseAmount * igstPercentage).toFixed(2);
      const sgstPercentage = parseTax(formData.sgst) / 100;
      const sgstAmount = (baseAmount * sgstPercentage).toFixed(2);
      const cgstPercentage = parseTax(formData.cgst) / 100;
      const cgstAmount = (baseAmount * cgstPercentage).toFixed(2);
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
        ).toFixed(2),
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
        ).toFixed(2),
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
          sgstAmount +
          parseFloat(formData.igstAmount2) +
          parseFloat(formData.cgstAmount2) +
          parseFloat(formData.sgstAmount2)
        ).toFixed(2),
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
    } else if (name === "withholdingTax") {
      const withholdingTax = value;
      const withholdingTaxAmount = getWithholdingTaxAmount(withholdingTax);
      setFormData((prev) => ({
        ...prev,
        withholdingTax: value,
        total: (
          parseFloat(formData.total) - parseFloat(withholdingTaxAmount)
        ).toFixed(2),
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

    // Validate cost center rows
    const hasValidCostCenters = costCenterRows.every(
      (row) => row.costCenter && row.amount
    );
    if (!hasValidCostCenters) {
      alert("Please fill in all cost centers and amounts.");
      setIsSubmitting(false);
      return;
    }

    if (formData) {
      // Prepare cost center data
      const costCenterString = costCenterRows
        .map((row) => row.costCenter)
        .join(";");
      const baseAmountSplitForCostCenters = costCenterRows.map((row) =>
        parseFloat(row.amount)
      );

      const updateRequest = {
        invoiceId: formData.invoiceId,
        number: formData.invoiceNumber,
        glCode: formData.glCode,
        costCenter: costCenterString,
        baseAmountSplitForCostCenters: baseAmountSplitForCostCenters, // Send as Double array
        poId: poDetails.get(formData.poNumber) || "",
        date: formData.invoiceDate,
        baseAmount: parseFloat(formData.baseAmount),
        finalAmount: parseFloat(formData.total),
        vendor: formData.companyName,
        paymentType: formData.paymentType,
        sgst: formData.sgst,
        sgstAmount: parseFloat(formData.sgstAmount),
        cgst: formData.cgst,
        cgstAmount: parseFloat(formData.cgstAmount),
        igst: formData.igst,
        igstAmount: parseFloat(formData.igstAmount),
        sgst2: formData.sgst2,
        sgstAmount2: parseFloat(formData.sgstAmount2),
        cgst2: formData.cgst2,
        cgstAmount2: parseFloat(formData.cgstAmount2),
        igst2: formData.igst2,
        igstAmount2: parseFloat(formData.igstAmount2),
        withholdingTax: formData.withholdingTax,
        utrNo: formData.utrNo || "",
        status: formData.status,
        description: formData.description,
        narration: formData.narration,
        comments: formData.comments,
      };

      try {
        console.log("Sending update request:", updateRequest);
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
                Comments
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                UTR No
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
                  {invoice.costCenter.replace(/;/g, ", ")}
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
                  {invoice.comments || "-"}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.utrNo || "-"}
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
          <h2 className="text-2xl font-bold mb-6">Edit Invoice</h2>
          {isRestrictedAdmin() && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
              <p>
                You have limited permissions. You can only edit the Status and
                Description fields.
              </p>
            </div>
          )}
          <form onSubmit={handleSave} className="max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-gray-500">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  placeholder="Invoice number"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="text-gray-500">GL Code</label>
                <select
                  name="glCode"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.glCode}
                  onChange={handleChange}
                  required
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
              <div>
                <label className="text-gray-500">Invoice Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  className={`w-full border bg-white text-black rounded p-2 [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:hover:cursor-pointer ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div className="col-span-2">
                <label className="text-gray-500 block mb-2">Cost Centers</label>
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
                            options={
                              costCenters.length > 0 ? costCenters : ["N/A"]
                            }
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
                </div>
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
                      className={`w-full border rounded p-3 bg-white text-lg font-semibold ${
                        isRestrictedAdmin()
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      value={formData.baseAmount}
                      onChange={handleChange}
                      placeholder="Auto-calculated or enter manually"
                      required
                      disabled={isRestrictedAdmin()}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-gray-500">PO Number</label>
                <select
                  name="poNumber"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.poNumber}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
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
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.paymentType}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-gray-500">Company Name</label>
                <select
                  name="companyName"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
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
                <label className="text-gray-500">IGST</label>
                <select
                  name="igst"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.igst}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
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
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.igstAmount}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="text-gray-500">SGST</label>
                <select
                  name="sgst"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.sgst}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
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
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.sgstAmount}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="text-gray-500">CGST</label>
                <select
                  name="cgst"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.cgst}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
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
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.cgstAmount}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
                />
              </div>

              <div>
                <label className="text-gray-500">IGST 2</label>
                <select
                  name="igst2"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.igst2}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
                >
                  <option value="">Select IGST 2</option>
                  {igsts.map((gst, index) => (
                    <option key={index} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">IGST Amount 2</label>
                <input
                  type="number"
                  name="igstAmount2"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.igstAmount2}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="text-gray-500">SGST 2</label>
                <select
                  name="sgst2"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.sgst2}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
                >
                  <option value="">Select SGST 2</option>
                  {sgsts.map((gst, index) => (
                    <option key={index} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">SGST Amount 2</label>
                <input
                  type="number"
                  name="sgstAmount2"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.sgstAmount2}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="text-gray-500">CGST 2</label>
                <select
                  name="cgst2"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.cgst2}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
                >
                  <option value="">Select CGST 2</option>
                  {cgsts.map((gst, index) => (
                    <option key={index} value={gst}>
                      {gst}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500">CGST Amount 2</label>
                <input
                  type="number"
                  name="cgstAmount2"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.cgstAmount2}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
                />
              </div>
              <div>
                <label className="text-gray-500">Withholding Tax</label>
                <select
                  name="withholdingTax"
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.withholdingTax}
                  onChange={handleChange}
                  required
                  disabled={isRestrictedAdmin()}
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

              {/* Total Amount Display */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg col-span-2">
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
                    className={`w-full border rounded p-3 bg-white text-xl font-bold ${
                      isRestrictedAdmin()
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    value={formData.total}
                    onChange={handleChange}
                    placeholder="Auto-calculated or enter manually"
                    required
                    disabled={isRestrictedAdmin()}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-6">
              <div className="flex-1">
                <label className="text-gray-500">Status</label>
                <select
                  name="status"
                  className="w-full border rounded p-2 bg-white"
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
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={formData.utrNo}
                  onChange={handleChange}
                  disabled={isRestrictedAdmin()}
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
                  className="w-full border rounded p-2 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-500">Narration</label>
                <textarea
                  name="narration"
                  value={formData.narration}
                  onChange={handleChange}
                  className={`w-full border rounded p-2 bg-white ${
                    isRestrictedAdmin() ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isRestrictedAdmin()}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-gray-500">Comments</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                placeholder="Add any comments here..."
                className="w-full border rounded p-2 bg-white h-24 resize-none"
                rows={3}
              />
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
      </div>
    </div>
  );
};

export default AdminInvoiceTable;

/**
 * AdminInvoiceTable Component
 *
 * Features:
 * - Multiple cost centers with individual amounts
 * - Auto-calculation of base amount from cost center totals
 * - Beautiful modal design similar to Invoice.tsx
 * - Form submission using FormData (similar to Invoice.tsx)
 * - Admin permission handling
 */
