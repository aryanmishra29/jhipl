import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaPlus, FaFilter, FaCheck, FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import axios from 'axios';

interface Invoice {
    invoiceId: string;
    number: string;
    date: string;
    costCenter: string;
    finalAmount: number;
    status: string;
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
        igst: '',
        sgst: '',
        cgst: '',
        total: '',
        glCode: '',
        costCenter: '',
        receipt: null,
        approvalDoc: null,
    });

    const [costCenters, setCostCenters] = useState<string[]>([]);
    const [vendors, setVendors] = useState<string[]>([]);
    const [glCodes, setGlCodes] = useState<string[]>([]);
    const baseUrl = 'http://45.249.132.81';


    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const costCentersResponse = await axios.get(`${baseUrl}/info/cost-centers`);
                const vendorsResponse = await axios.get(`${baseUrl}/info/vendors`);
                const glCodesResponse = await axios.get(`${baseUrl}/info/gl-codes`);

                setCostCenters(Array.isArray(costCentersResponse.data) ? costCentersResponse.data : []);
                setVendors(Array.isArray(vendorsResponse.data) ? vendorsResponse.data : []);
                setGlCodes(Array.isArray(glCodesResponse.data) ? glCodesResponse.data : []);
            } catch (error) {
                console.error("Error fetching dropdown data:", error);
                setCostCenters([]);
                setVendors([]);
                setGlCodes([]);
            }
        };

        fetchDropdownData();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(`${baseUrl}/invoices`);

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
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const {
            invoiceNumber,
            invoiceDate,
            poNumber,
            companyName,
            baseAmount,
            igst,
            sgst,
            cgst,
            total,
            glCode,
            costCenter,
            receipt,
            approvalDoc
        } = formData;
    
        if (!invoiceNumber || !invoiceDate || !poNumber || !companyName || !baseAmount || !igst || !sgst || !cgst || !total || !glCode || !costCenter || !receipt || !approvalDoc) {
            alert('Please fill in all required fields.');
            return;
        }
    
        const formDataToSubmit = new FormData();
        formDataToSubmit.append('number', invoiceNumber);
        formDataToSubmit.append('costCenter', costCenter);
        formDataToSubmit.append('glCode', glCode);
        formDataToSubmit.append('poNumber', poNumber);
        formDataToSubmit.append('date', invoiceDate);
        formDataToSubmit.append('baseAmount', baseAmount);
        formDataToSubmit.append('finalAmount', total);
        formDataToSubmit.append('vendor', companyName);
        formDataToSubmit.append('sgst', sgst);
        formDataToSubmit.append('cgst', cgst);
        formDataToSubmit.append('igst', igst);
        formDataToSubmit.append('receipts', receipt);  
        formDataToSubmit.append('approvals', approvalDoc); 
    
        try {
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
        <div className='mt-6 px-6 h-full'>
            <div className="mb-6 space-y-6">
                <h1 className="text-3xl text-black font-bold">Invoices</h1>
                <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
                    <div className="w-auto relative inline-block">
                        <button onClick={openModal} className="w-full md:w-auto bg-[#D7E6C5] font-bold px-6 py-1.5 rounded-xl flex items-center text-black justify-center">
                            <FaPlus className="mr-2" /> New invoice
                        </button>
                    </div>
                    <div className='flex gap-2'>
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
                    <thead className='min-w-full'>
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
                    <tbody className='w-full'>
                        {invoices.map((invoice) => (
                            <tr key={invoice.invoiceId} className='text-[#252525]'>
                                <td className="py-2 text-start px-4 border-b">
                                    <input type="checkbox" className="custom-checkbox" />
                                </td>
                                <td className="py-2 px-4 text-start border-b">{invoice.number}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.date}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.costCenter}</td>
                                <td className="py-2 px-4 text-start border-b">€{invoice.finalAmount.toFixed(2)}</td>
                                <td className='py-2 px-4 text-center border-b'>
                                    <div className={`w-fit rounded-full px-2 ${invoice.status === 'APPROVED' ? 'bg-[#636C59] text-white' : 'bg-[#D7E6C5]'}`}>
                                        {invoice.status === 'APPROVED' ? <FaCheck /> : <FaTimes />}
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
                                {(glCodes.length > 0 ? glCodes : ["GL001", "GL002", "GL003"]).map((code, index) => (
                                    <option key={index} value={code}>{code}</option>
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
                                {(costCenters.length > 0 ? costCenters : ["CC001", "CC002", "CC003"]).map((center, index) => (
                                    <option key={index} value={center}>{center}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <input
                                type="text"
                                name="poNumber"
                                placeholder="PO Number"
                                className="w-full border rounded p-2 bg-white"
                                value={formData.poNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className='col-span-2'>
                            <label className="text-gray-500">Company name</label>
                            <select
                                name="companyName"
                                className="w-full border rounded p-2 mt-1 bg-white"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Vendor</option>
                                {(vendors.length > 0 ? vendors : ["Vendor A", "Vendor B", "Vendor C"]).map((vendor, index) => (
                                    <option key={index} value={vendor}>{vendor}</option>
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
                            <input
                                type="number"
                                name="igst"
                                className="w-full border rounded p-2 mt-1 bg-white"
                                value={formData.igst}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-gray-500">SGST</label>
                            <input
                                type="number"
                                name="sgst"
                                className="w-full border rounded p-2 mt-1 bg-white"
                                value={formData.sgst}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-gray-500">CGST</label>
                            <input
                                type="number"
                                name="cgst"
                                className="w-full border rounded p-2 mt-1 bg-white"
                                value={formData.cgst}
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
                    <div className='flex gap-4'>
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
                        <button type="submit" className="bg-[#D7E6C5] text-black p-2 rounded">Save invoice</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};


export default InvoiceTable;
