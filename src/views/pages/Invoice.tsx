import React, { useState } from 'react';
import { FaChevronDown, FaPlus, FaFilter, FaCheck, FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';

interface Invoice {
    invoiceNr: string;
    date: string;
    dueDate: string;
    amount: string;
    status: string;
}

const Invoices: Invoice[] = [
    { invoiceNr: "872346", date: "14/11/23", dueDate: "14 days", amount: "€2.011", status: "Accepted" },
    { invoiceNr: "563821", date: "14/11/23", dueDate: "7 days", amount: "€2300", status: "Rejected" },
    { invoiceNr: "198475", date: "15/11/23", dueDate: "14 days", amount: "€650", status: "Accepted" },
    { invoiceNr: "624930", date: "15/11/23", dueDate: "14 days", amount: "€1.380", status: "Rejected" },
    { invoiceNr: "357219", date: "15/11/23", dueDate: "7 days", amount: "€8.900", status: "Accepted" },
    { invoiceNr: "789502", date: "16/11/23", dueDate: "14 days", amount: "€5.931", status: "Accepted" },
    { invoiceNr: "432186", date: "16/11/23", dueDate: "7 days", amount: "€340", status: "Rejected" },
    { invoiceNr: "105739", date: "17/11/23", dueDate: "14 days", amount: "€1.200", status: "Rejected" },
    { invoiceNr: "269843", date: "17/11/23", dueDate: "7 days", amount: "€8.305", status: "Accepted" },
    { invoiceNr: "615472", date: "17/11/23", dueDate: "14 days", amount: "€450", status: "Rejected" },
    { invoiceNr: "943628", date: "18/11/23", dueDate: "7 days", amount: "€250", status: "Accepted" },
    { invoiceNr: "938117", date: "18/11/23", dueDate: "14 days", amount: "€1.380", status: "Rejected" },
    { invoiceNr: "502891", date: "19/11/23", dueDate: "7 days", amount: "€460", status: "Accepted" },
];

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
        padding: '20px',
        width: '1000px',
        maxWidth: '90%',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
};

const InvoiceTable: React.FC = () => {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { invoiceNumber, invoiceDate, poNumber, currency, companyName, baseAmount, igst, sgst, cgst, total, glCode, costCenter } = formData;

        if (!invoiceNumber || !invoiceDate || !poNumber || !currency || !companyName || !baseAmount || !igst || !sgst || !cgst || !total || !glCode || !costCenter) {
            alert('Please fill in all required fields.');
            return;
        }
        closeModal();
    };

    return (
        <div className='mt-6 px-6 h-full'>
            <div className="mb-6 space-y-6">
                <h1 className="text-3xl text-black font-bold">Invoices</h1>
                <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
                    <div className="w-auto relative inline-block">
                        <button onClick={openModal} className="w-full md:w-auto bg-[#D7E6C5] font-bold px-6 py-1.5 rounded-xl flex items-center text-black justify-center">
                            <FaPlus className="mr-2" /> New Invoice
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
            <div className="overflow-x-auto scroll-smooth">
                <table className="w-full h-full text-[#8E8F8E] bg-white">
                    <thead className='min-w-full'>
                        <tr>
                            <th className="py-2 text-start px-4 border-b">
                                <input type="checkbox" className="custom-checkbox" />
                            </th>
                            <th className="py-2 text-start px-4 border-b">Invoice nr.</th>
                            <th className="py-2 text-start px-4 border-b">Date</th>
                            <th className="py-2 text-start px-4 border-b">Due date</th>
                            <th className="py-2 text-start px-4 border-b">Amount</th>
                            <th className="py-2 text-start px-4 border-b">Status</th>
                        </tr>
                    </thead>
                    <tbody className='w-full'>
                        {Invoices.map((invoice, index) => {
                            // const amountValue = parseFloat(invoice.amount.replace(/[^0-9.-]+/g, ""));
                            // const amountColor = amountValue > 0 ? 'text-green-500' : 'text-red-500';
                            return (
                                <tr key={index} className='text-[#252525]'>
                                    <td className="py-2 text-start px-4 border-b">
                                        <input type="checkbox" className="custom-checkbox" />
                                    </td>
                                    <td className="py-2 px-4 text-start border-b">{invoice.invoiceNr}</td>
                                    <td className="py-2 px-4 text-start border-b">{invoice.date}</td>
                                    <td className="py-2 px-4 text-start border-b">{invoice.dueDate}</td>
                                    <td className={`py-2 px-4 text-start border-b `}>{invoice.amount}</td>
                                    <td className='py-2 px-4 text-center border-b'>
                                        <div className={`w-fit rounded-full px-2 ${invoice.status === 'Accepted' ? 'bg-[#636C59] text-white' : 'bg-[#D7E6C5]'}`}>
                                            {invoice.status === 'Accepted' ? <FaCheck /> : <FaTimes />}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="New Invoice Modal"
                ariaHideApp={false}
            >
                <h2 className="text-2xl font-bold mb-4">New invoice</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-36 gap-y-4 ">
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
                            <input
                                type="text"
                                name="glCode"
                                placeholder="GL Code"
                                className="w-full border rounded p-2 bg-white"
                                value={formData.glCode}
                                onChange={handleChange}
                                required
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
                            <input
                                type="text"
                                name="costCenter"
                                placeholder="Cost Center"
                                className="w-full border rounded p-2 bg-white"
                                value={formData.costCenter}
                                onChange={handleChange}
                                required
                            />
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
                        <div className=' col-span-2'>
                            <label className="text-gray-500">Company name</label>
                            <input
                                type="text"
                                name="companyName"
                                className="w-full border rounded p-2 mt-1 bg-white"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-gray-500">Base Amount</label>
                            <input
                                type="number"
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
                                placeholder='Receipt'
                                className="w-full border rounded p-2 mt-1 bg-white"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mt-4">
                            <label className="text-gray-500">Approval document</label>
                            <input
                                type="file"
                                name="approvalDoc"
                                placeholder='Approval document'
                                className="w-full border rounded p-2 mt-1 bg-white"
                                onChange={handleChange}
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
