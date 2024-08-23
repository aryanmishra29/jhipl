import React, { useState, useEffect } from "react";
import { FaChevronDown, FaFilter, FaEdit, FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";
import Modal from "react-modal";
import axios from "axios";

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
  cgst: string;
  igst: string;
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
    overflow: "auto"
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const AdminInvoiceTable: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const baseUrl = "https://jhipl.grobird.in";
  // const baseUrl = "http://localhost:8080";
  useEffect(() => {
    fetchInvoices();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setSelectedInvoice] = useState<Invoice | null>(null);
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
    sgst: "",
    cgst: "",
    total: "",
    withholdingTax: "",
    description: "",
    narration: "",
    status: "",
    utrNo: "",
  });

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
      baseAmount: invoice.baseAmount.toString(),
      igst: invoice.igst,
      sgst: invoice.sgst,
      cgst: invoice.cgst,
      withholdingTax: invoice.withholdingTax,
      total: invoice.finalAmount.toString(),
      description: invoice.description,
      narration: invoice.narration,
      status: invoice.status,
      utrNo: invoice.utrNo,
    });
    setIsModalOpen(true);
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
      const keyOrder : (keyof ExcelItem)[] = [
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
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
        cgst: formData.cgst,
        igst: formData.igst,
        withholdingTax: formData.withholdingTax,
        utrNo: formData.utrNo,
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
        location.reload();
      } catch (error) {
        console.error("Error updating invoice:", error);
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
          <div className="flex gap-2">
            <div className="w-auto">
              <button className="w-full md:w-auto bg-[#636C59] font-bold px-8 py-1.5 rounded-xl flex items-center text-white justify-center">
                All time
                <FaChevronDown className="ml-2" />
              </button>
            </div>
            <div className="w-auto">
              <button className="w-full md:w-auto bg-[#636C59] text-white px-6 font-bold py-1.5 rounded-xl flex items-center justify-center">
                Filter <FaFilter className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto noscroll-bar scroll-smooth">
        <table className="w-full h-full text-[#8E8F8E] bg-white border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 text-start px-4 border-b">
                <input type="checkbox" className="custom-checkbox" />
              </th>
              <th className="py-2 text-start px-4 border-b">Invoice nr.</th>
              <th className="py-2 text-start px-4 border-b">GL Code</th>
              <th className="py-2 text-start px-4 border-b">PO Number</th>
              <th className="py-2 text-start px-4 border-b">Date</th>
              <th className="py-2 text-start px-4 border-b">Final Amount</th>
              <th className="py-2 text-start px-4 border-b">Vendor</th>
              <th className="py-2 text-start px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="w-full">
            {invoices.map((invoice, index) => (
              <tr key={index} className="text-[#252525]">
                <td className="py-2 text-start px-4 border-b">
                  <input type="checkbox" className="custom-checkbox" />
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.number}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.glCode}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.poId}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.date}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.finalAmount}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.vendor}
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
                  required
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
                  required
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
                className="bg-[#D7E6C5] text-black px-4 py-2 rounded"
              >
                Save Invoice
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default AdminInvoiceTable;
