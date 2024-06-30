import React, { useState } from 'react';
import { FaSearch, FaChevronDown, FaPlus, FaFilter } from 'react-icons/fa';
import Modal from 'react-modal';

interface Reimbursement {
    date: string;
    amount: string;
    account: string;
    costCenter: string;
    status: string;
}

const Reimbursements: Reimbursement[] = [
    { date: "14/11/23", amount: "+€2.011", account: "UTR1234567890, Ref: 001", costCenter: "Company Co.", status: "Accepted" },
    { date: "14/11/23", amount: "+€198", account: "UTR1234567891, Ref: 002", costCenter: "Acme", status: "Rejected" },
    { date: "15/11/23", amount: "-€690", account: "UTR1234567892, Ref: 003", costCenter: "Streamio", status: "Rejected" },
    { date: "15/11/23", amount: "+€1.380", account: "UTR1234567893, Ref: 004", costCenter: "Cafio", status: "Accepted" },
    { date: "15/11/23", amount: "-€8.900", account: "UTR1234567894, Ref: 005", costCenter: "Insurance Co.", status: "Rejected" },
    { date: "16/11/23", amount: "+€5.931", account: "UTR1234567895, Ref: 006", costCenter: "-", status: "Accepted" },
    { date: "16/11/23", amount: "-€340", account: "UTR1234567896, Ref: 007", costCenter: "-", status: "Rejected" },
    { date: "17/11/23", amount: "-€1.200", account: "UTR1234567897, Ref: 008", costCenter: "Supply Co.", status: "Rejected" },
    { date: "17/11/23", amount: "+€8.305", account: "UTR1234567898, Ref: 009", costCenter: "Insurance Co.", status: "Accepted" },
    { date: "17/11/23", amount: "-€450", account: "UTR1234567899, Ref: 010", costCenter: "Post Office", status: "Rejected" },
    { date: "18/11/23", amount: "-€250", account: "UTR1234567810, Ref: 011", costCenter: "Client", status: "Rejected" },
    { date: "18/11/23", amount: "+€1.380", account: "UTR1234567811, Ref: 012", costCenter: "Cafio", status: "Accepted" },
    { date: "18/11/23", amount: "-€460", account: "UTR1234567812, Ref: 013", costCenter: "Insurance Co.", status: "Rejected" },
    { date: "17/11/23", amount: "-€450", account: "UTR1234567899, Ref: 010", costCenter: "Post Office", status: "Rejected" },
    { date: "18/11/23", amount: "-€250", account: "UTR1234567810, Ref: 011", costCenter: "Client", status: "Rejected" },
    { date: "18/11/23", amount: "+€1.380", account: "UTR1234567811, Ref: 012", costCenter: "Cafio", status: "Accepted" },
    { date: "18/11/23", amount: "-€460", account: "UTR1234567812, Ref: 013", costCenter: "Insurance Co.", status: "Rejected" },
    
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
        width: '600px',
        maxWidth: '90%',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
};

const ReimbursementTable: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        nameOfReimbursement: '',
        glCode: '',
        costCenter: '',
        date: '',
        amount: '',
        advance: '',
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
        const files = e.currentTarget.files;
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { nameOfReimbursement, glCode, costCenter, date, amount } = formData;

        if (!nameOfReimbursement || !glCode || !costCenter || !date || !amount) {
            alert('Please fill in all required fields.');
            return;
        }
        closeModal();
    };

    return (
        <div className='mt-6 px-6  h-full '>
            <div className="mb-6 space-y-6">
                <h1 className="text-3xl text-black font-bold">Reimbursements</h1>
                <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
                    <div className="w-auto relative inline-block">
                        <button className="w-full md:w-auto bg-[#636C59] font-bold px-8 py-1.5 rounded-xl flex items-center text-white justify-center">
                            All time
                            <FaChevronDown className="ml-2" />
                        </button>
                    </div>
                    <div className="w-full md:flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search Reimbursements and actions"
                            className="w-full border bg-transparent text-black px-2 py-1.5 rounded"
                        />
                        <FaSearch className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="w-auto">
                        <button onClick={openModal} className="w-full md:w-auto bg-[#D7E6C5] text-black font-bold px-6 py-1.5 rounded-xl flex items-center justify-center">
                            <FaPlus className="mr-2" /> Add income
                        </button>
                    </div>
                    <div className="w-auto">
                        <button className="w-full md:w-auto bg-[#636C59] text-white px-6 font-bold py-1.5 rounded-xl flex items-center justify-center">
                            Filter <FaFilter className="ml-2" />
                        </button>
                    </div>
                </div>
            </div>
            {/* table */}
            <div className="overflow-x-auto scroll-smooth">
                <table className="w-full h-full  text-[#8E8F8E] bg-white">
                    <thead className='min-w-full'>
                        <tr>
                            <th className="py-2 text-start px-4 border-b">
                                <input type="checkbox" className="custom-checkbox" />
                            </th>
                            <th className="py-2 text-start px-4 border-b">Date</th>
                            <th className="py-2 text-start px-4 border-b">Amount</th>
                            <th className="py-2 text-start px-4 border-b">Account (UTR, Ref)</th>
                            <th className="py-2 text-start px-4 border-b">Cost Center</th>
                            <th className="py-2 text-start px-4 border-b">Status</th>
                        </tr>
                    </thead>
                    <tbody className='w-full'>
                        {Reimbursements.map((reimbursement, index) => {
                            const amountValue = parseFloat(reimbursement.amount.replace(/[^0-9.-]+/g,""));
                            const amountColor = amountValue > 0 ? 'text-green-500' : 'text-red-500';
                            return (
                                <tr key={index} className='text-[#252525]'>
                                    <td className="py-2 text-start px-4 border-b">
                                        <input type="checkbox" className="custom-checkbox" />
                                    </td>
                                    <td className="py-2 px-4 text-start border-b">{reimbursement.date}</td>
                                    <td className={`py-2 px-4 text-start border-b ${amountColor}`}>{reimbursement.amount}</td>
                                    <td className="py-2 px-4 text-start border-b">{reimbursement.account}</td>
                                    <td className="py-2 px-4 text-start border-b">{reimbursement.costCenter}</td>
                                    <td className='py-2 px-4 text-center border-b'>
                                        <div className={`w-fit rounded-full px-2 ${reimbursement.status === 'Accepted' ? 'bg-[#636C59] text-white' : 'bg-[#D7E6C5]'}`}>
                                            {reimbursement.status}
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
                contentLabel="New Income Modal"
                ariaHideApp={false}
            >
                <h2 className="text-2xl font-bold  mb-4">New income</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="nameOfReimbursement"
                            placeholder="Name of reimbursement"
                            className="w-full border rounded p-2 bg-white"
                            value={formData.nameOfReimbursement}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="glCode"
                            placeholder="GL Code"
                            className="w-full border rounded p-2 bg-white"
                            value={formData.glCode}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="text"
                            name="costCenter"
                            placeholder="Cost Center"
                            className="w-full border rounded p-2 bg-white"
                            value={formData.costCenter}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="date"
                            name="date"
                            className="w-full border rounded p-2 bg-white"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                        <div className="sm:flex  sm:space-x-4 sm:space-y-0 space-y-4">
                            <input
                                type="number"
                                name="amount"
                                placeholder="Amount"
                                className="flex-1 border rounded p-2 bg-white"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                pattern="[0-9]*"
                            />
                            <input
                                type="number"
                                name="advance"
                                placeholder="Advance (optional)"
                                className="flex-1 border rounded p-2 bg-white"
                                value={formData.advance}
                                onChange={handleChange}
                                pattern="[0-9]*"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Receipt:</label>
                            <input
                                type="file"
                                name="receipt"
                                className="w-full border rounded p-2 bg-white"
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Approval Document:</label>
                            <input
                                type="file"
                                name="approvalDoc"
                                className="w-full border rounded p-2 bg-white"
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded mt-4">Save</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ReimbursementTable;
