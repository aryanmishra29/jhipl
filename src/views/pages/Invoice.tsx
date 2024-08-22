import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaPlus, FaFilter, FaCheck, FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import axios from 'axios';
import parseTax from '../../utils/parseTax';

// Define the Invoice interface
interface Invoice {
  invoiceId: string;
  number: string;
  date: string;
  costCenter: string;
  finalAmount: number;
  status: string;
}

// Define the PO details interface
interface PoDetails {
  paymentType: string;
  sgst: string;
  igst: string;
  cgst: string;
  poId: string;
  baseAmount: number
}

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    color: '#000000',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '1000px',
    maxWidth: '90%',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
};

const InvoiceTable: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    poNumber: '',
    currency: '',
    companyName: '',
    baseAmount: '',
    paymentType: '',
    igst: '0',
    sgst: '0',
    cgst: '0',
    total: '',
    glCode: '',
    costCenter: '',
    receipt: null as File | null,
    approvalDoc: null as File | null,
    description: ''
  });
  const [poDetails, setPoDetails] = useState<Map<string, PoDetails>>(new Map());
  const [currentPoId, setCurrentPoId] = useState<string>('')
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [glCodes, setGlCodes] = useState<string[]>([]);
  const [pos, setPos] = useState<string[]>([]);
  const [cgsts, setCgsts] = useState<string[]>([]);

  const [sgsts, setSgsts] = useState<string[]>([]);
  const [igsts, setIgsts] = useState<string[]>([]);

  const baseUrl = 'https://jhipl.grobird.in';
  const user_id = localStorage.getItem("userId");
 

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const costCentersResponse = await axios.get(`${baseUrl}/info/cost-centers`);
        const vendorsResponse = await axios.get(`${baseUrl}/info/vendors`);
        const glCodesResponse = await axios.get(`${baseUrl}/info/gl-codes`);
        const poResponse = await axios.get(`${baseUrl}/purchase-orders`);
        const sgstResponse = await axios.get(`${baseUrl}/info/sgst`);
        const igstResponse = await axios.get(`${baseUrl}/info/igst`)
        const cgstResponse = await axios.get(`${baseUrl}/info/cgst`)
        sgstResponse.data.push('0')
        igstResponse.data.push('0')
        cgstResponse.data.push('0')
        setCostCenters(Array.isArray(costCentersResponse.data) ? costCentersResponse.data : []);
        setVendors(Array.isArray(vendorsResponse.data) ? vendorsResponse.data : []);
        setGlCodes(Array.isArray(glCodesResponse.data) ? glCodesResponse.data : []);
        setSgsts(Array.isArray(sgstResponse.data) ? sgstResponse.data : []);
        setIgsts(Array.isArray(igstResponse.data) ? igstResponse.data : []);
        setCgsts(Array.isArray(cgstResponse.data) ? cgstResponse.data : []);

        setPos(Array.isArray(poResponse.data) ? poResponse.data.map((po: any) => po.poNumber) : []);

        // Update PO details in the state
        const poDetailsMap = new Map<string, PoDetails>();
        poResponse.data.forEach((po: any) => {
          poDetailsMap.set(po.poNumber, {
            paymentType: po.paymentType,
            sgst: po.sgst,
            igst: po.igst,
            cgst: po.cgst,
            poId: po.poId,
            baseAmount: po.baseAmount,
          });
        });
        setPoDetails(poDetailsMap);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        setCostCenters([]);
        setVendors([]);
        setGlCodes([]);
        setIgsts([])
        setCgsts([])
        setSgsts([])
        setPos([]);
      }
    };
    fetchDropdownData();
  }, []);


  const calcTotalTaxAmount = (baseAmount: number, sgst: string, igst: string, cgst: string) => {
    const SGST = parseTax(sgst)
    const CGST = parseTax(cgst)
    const IGST = parseTax(igst)

    return (((CGST + SGST + IGST) * baseAmount) / 100) + baseAmount;
  }


  const fetchInvoices = async () => {
    try {
      console.log(user_id)
      const response = await axios.get(`${baseUrl}/invoices/user/${user_id}`);
      if (response.status !== 200) {
        throw new Error('Failed to fetch invoices');
      }
      const data: Invoice[] = response.data.map((invoice: any) => ({
        invoiceId: invoice.invoiceId,
        number: invoice.number,
        date: invoice.date,
        costCenter: invoice.costCenter,
        finalAmount: invoice.finalAmount,
        status: invoice.status,
      }));
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>) => {
    const { name, value } = e.target;
    const files = e.currentTarget.files;


    if (name === 'poNumber') {
      const selectedPoDetails = poDetails.get(value);
      if (selectedPoDetails) {
        setCurrentPoId(selectedPoDetails.poId)
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          paymentType: selectedPoDetails.paymentType,
          sgst: selectedPoDetails.sgst,
          igst: selectedPoDetails.igst,
          cgst: selectedPoDetails.cgst,
          baseAmount: (selectedPoDetails.baseAmount).toFixed(4),
          total: (calcTotalTaxAmount(selectedPoDetails.baseAmount, selectedPoDetails.cgst, selectedPoDetails.igst, selectedPoDetails.sgst)).toFixed(4),
          description: value,
          [name]: files ? files[0] : value,
        }));
      } else {
        setCurrentPoId('')
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          paymentType: '',
          sgst: '',
          igst: '',
          cgst: '',
          baseAmount: '',
          total: '',
          companyName: '',
          [name]: files ? files[0] : value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      invoiceNumber,
      invoiceDate,
      poNumber,
      companyName,
      baseAmount,
      paymentType,
      igst,
      sgst,
      cgst,
      total,
      glCode,
      costCenter,
      receipt,
      approvalDoc,
      description
    } = formData;

    if (!invoiceNumber || !invoiceDate || !poNumber || !companyName || !baseAmount || !igst || !sgst || !cgst || !total || !glCode || !costCenter || !receipt || !approvalDoc || !paymentType) {
      alert('Please fill in all required fields.');
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('userId', user_id ?? '');
    formDataToSubmit.append('number', invoiceNumber);
    formDataToSubmit.append('costCenter', costCenter);
    formDataToSubmit.append('glCode', glCode);
    formDataToSubmit.append('poId', currentPoId);
    formDataToSubmit.append('date', invoiceDate);
    formDataToSubmit.append('baseAmount', baseAmount);
    formDataToSubmit.append('finalAmount', total);
    formDataToSubmit.append('vendor', companyName);
    formDataToSubmit.append('sgst', sgst);
    formDataToSubmit.append('cgst', cgst);
    formDataToSubmit.append('igst', igst);
    formDataToSubmit.append('description', description);
    formDataToSubmit.append('paymentType', paymentType);
    if (receipt) formDataToSubmit.append('receipts', receipt);
    if (approvalDoc) formDataToSubmit.append('approvals', approvalDoc);

    try {
      formDataToSubmit.forEach(item => console.log(item));
      await axios.post(`${baseUrl}/invoices`, formDataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      closeModal();
      fetchInvoices();
    } catch (error) {
      console.error("Error submitting form:", error);
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
          <div className="flex gap-2">
            <div className="w-auto relative inline-block">
              <button className="w-full md:w-auto bg-[#636C59] font-bold px-8 py-1.5 rounded-xl flex items-center text-white justify-center">
                All time
                <FaChevronDown className="ml-2" />
              </button>
            </div>
            <div className="w-auto relative inline-block">
              <button className="w-full md:w-auto bg-[#636C59] text-white px-6 font-bold py-1.5 rounded-xl flex items-center justify-center">
                Filter <FaFilter className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto noscroll-bar scroll-smooth">
        <table className="w-full h-full text-[#8E8F8E] bg-white">
          <thead className="min-w-full">
            <tr>
              <th className="py-2 text-start px-4 border-b">
                <input type="checkbox" className="custom-checkbox" />
              </th>
              <th className="py-2 text-start px-4 border-b">Invoice nr.</th>
              <th className="py-2 text-start px-4 border-b">Date</th>
              <th className="py-2 text-start px-4 border-b">Cost Center</th>
              <th className="py-2 text-start px-4 border-b">Amount</th>
              <th className="py-2 text-start px-4 border-b">Status</th>
            </tr>
          </thead>
          <tbody className="w-full">
            {invoices.map((invoice) => (
              <tr key={invoice.invoiceId} className="text-[#252525]">
                <td className="py-2 text-start px-4 border-b">
                  <input type="checkbox" className="custom-checkbox" />
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.number}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.date}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {invoice.costCenter}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  €{invoice.finalAmount.toFixed(2)}
                </td>
                <td className="py-2 px-4 text-center border-b">
                  <div
                    className={`w-fit rounded-full px-2 ${invoice.status === "APPROVED"
                      ? "bg-[#636C59] text-white"
                      : "bg-[#D7E6C5]"
                      }`}
                  >
                    {invoice.status === "APPROVED" ? (
                      <FaCheck />
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
              <select
                name="glCode"
                className="w-full border rounded p-2 bg-white"
                value={formData.glCode}
                onChange={handleChange}
                required
              >
                <option value="">Select GL Code</option>
                {(glCodes.length > 0
                  ? glCodes
                  : ["GL001", "GL002", "GL003"]
                ).map((code, index) => (
                  <option key={index} value={code}>
                    {code}
                  </option>
                ))}
              </select>
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
              <select
                name="costCenter"
                className="w-full border rounded p-2 bg-white"
                value={formData.costCenter}
                onChange={handleChange}
                required
              >
                <option value="">Select Cost Center</option>
                {(costCenters.length > 0
                  ? costCenters
                  : ["CC001", "CC002", "CC003"]
                ).map((center, index) => (
                  <option key={index} value={center}>
                    {center}
                  </option>
                ))}
              </select>
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
                {(pos?.length > 0 ? pos : ["PO001", "PO002", "PO003"]).map((po, index) => (
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
                {(["HALF", "FULL", "PARTIAL"]
                ).map((center, index) => (
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
              <select
                name="companyName"
                className="w-full border rounded p-2 mt-1 bg-white"
                value={formData.companyName}
                onChange={handleChange}
                required
              >
                <option value="">Select Vendor</option>
                {(vendors.length > 0
                  ? vendors
                  : ["Vendor A", "Vendor B", "Vendor C"]
                ).map((vendor, index) => (
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
          <div className='flex flex-col max-w-xl w-full'>
            <label className="text-gray-500 ">Description</label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              className='bg-transparent border border-gray-300 p-2 rounded-lg '
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
              className="bg-[#D7E6C5] text-black p-2 rounded"
            >
              Save invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


export default InvoiceTable;
