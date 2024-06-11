import React from 'react';
import { FaSearch, FaChevronDown, FaPlus, FaFilter } from 'react-icons/fa';

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

const ReimbursementTable: React.FC = () => {
    return (
        <div className='mt-28 px-6 overflow-y-scroll h-full'>
            <div className="mb-6 space-y-6">
                <h1 className="text-3xl text-black font-bold">Reimbursements</h1>
                <div className="flex w-full justify-between space-x-2">
                    <div className="relative inline-block">
                        <button className="bg-[#636C59] font-bold px-8 py-1.5 rounded-full flex items-center">
                            All time
                            <FaChevronDown className="ml-2" />
                        </button>
                        {/* Dropdown content can be added here */}
                    </div>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search Reimbursements and actions"
                            className="border bg-transparent text-black px-2 py-1.5 rounded w-full"
                        />
                        <FaSearch className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button className="bg-[#D7E6C5] text-black font-bold px-6 py-1.5 rounded-full flex items-center">
                        <FaPlus className="mr-2" /> Add income
                    </button>
                    <button className="bg-[#636C59] text-white px-6 font-bold py-1.5 rounded-full flex items-center">
                        <FaFilter className="mr-2" /> Filter
                    </button>
                </div>
            </div>
            <table className="w-full text-[#8E8F8E] bg-white">
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
                    {Reimbursements.map((reimbursement, index) => (
                        <tr key={index} className='text-[#252525]'>
                            <td className="py-2 text-start px-4 border-b">
                                <input type="checkbox" className="custom-checkbox" />
                            </td>
                            <td className="py-2 px-4 text-start border-b">{reimbursement.date}</td>
                            <td className="py-2 px-4 text-start border-b">{reimbursement.amount}</td>
                            <td className="py-2 px-4 text-start border-b">{reimbursement.account}</td>
                            <td className="py-2 px-4 text-start border-b">{reimbursement.costCenter}</td>
                            <td className='py-2 px-4 text-center border-b'>
                            <div className={`w-fit rounded-full px-2 ${reimbursement.status === 'Accepted' ? 'bg-[#636C59] text-white' : 'bg-[#D7E6C5]'}`}>
                                    {reimbursement.status}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReimbursementTable;
