import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FaDownload } from 'react-icons/fa';

interface Reimbursement {
    reimbursementId: string;
    name: string;
    glCode: string;
    costCenter: string;
    date: string;
    amount: number;
    advance: number;
    UtrNo: string;
    status: string;
    remarks: string;
}

const AdminReimbursementTable: React.FC = () => {
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const baseUrl = 'http://45.249.132.81';

    useEffect(() => {
        fetchReimbursements();
    }, []);

    const fetchReimbursements = async () => {
        try {
            const response = await fetch(`${baseUrl}/reimbursements`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data: Reimbursement[] = await response.json();
            setReimbursements(data);
        } catch (error) {
            console.error("Error fetching reimbursements:", error);
        }
    };

    const handleUpdateReimbursement = async (reimbursementId: string, updatedData: Partial<Reimbursement>) => {
        try {
            const response = await fetch(`${baseUrl}/reimbursements/${reimbursementId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            fetchReimbursements();
        } catch (error) {
            console.error("Error updating reimbursement:", error);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const paymentCycle = "Aug 2024-2";
            const response = await fetch(`${baseUrl}/reimbursements/excel?paymentCycle=${paymentCycle}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Reimbursements");
            XLSX.writeFile(workbook, "Reimbursements.xlsx");
        } catch (error) {
            console.error("Error fetching or exporting data:", error);
        }
    };

    const handleDownloadFile = async (reimbursementId: string, fileType: 'receipts' | 'approvals') => {
        try {
            const response = await fetch(`${baseUrl}/reimbursements/${reimbursementId}/${fileType}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileType}-${reimbursementId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(`Error downloading ${fileType}:`, error);
        }
    };

    return (
        <div className='mt-6 px-6 h-full'>
            <div className="mb-6 space-y-6">
                <h1 className="text-3xl text-black font-bold">Reimbursements</h1>
                <div className="flex justify-between items-center">
                    <button onClick={handleDownloadExcel} className="bg-[#D7E6C5] text-black font-bold px-6 py-1.5 rounded-xl flex items-center">
                        Download as Excel
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto noscroll-bar scroll-smooth">
                <table className="w-full h-full text-[#8E8F8E] bg-white">
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
                            <th className="py-2 text-start px-4 border-b">UTR No.</th>
                            <th className="py-2 text-start px-4 border-b">Remarks</th>
                            <th className="py-2 text-start px-4 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody className='w-full'>
                        {reimbursements.map((reimbursement, index) => {
                            const amountColor = reimbursement.amount > 0 ? 'text-green-500' : 'text-red-500';
                            return (
                                <tr key={index} className='text-[#252525]'>
                                    <td className="py-2 text-start px-4 border-b">
                                        <input type="checkbox" className="custom-checkbox" />
                                    </td>
                                    <td className="py-2 px-4 text-start border-b">{reimbursement.date}</td>
                                    <td className={`py-2 px-4 text-start border-b ${amountColor}`}>{reimbursement.amount}</td>
                                    <td className="py-2 px-4 text-start border-b">{reimbursement.glCode}</td>
                                    <td className="py-2 px-4 text-start border-b">{reimbursement.costCenter}</td>
                                    <td className="py-2 px-4 text-start border-b">
                                        <select
                                            value={reimbursement.status}
                                            onChange={(e) => handleUpdateReimbursement(reimbursement.reimbursementId, { status: e.target.value })}
                                            className="border rounded p-1 bg-white w-full"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </td>
                                    <td className="py-2 px-4 text-start border-b">
                                        <input
                                            type="text"
                                            value={reimbursement.UtrNo}
                                            onChange={(e) => handleUpdateReimbursement(reimbursement.reimbursementId, { UtrNo: e.target.value })}
                                            className="border rounded p-1 bg-white w-full"
                                        />
                                    </td>
                                    <td className="py-2 px-4 text-start border-b">
                                        <input
                                            type="text"
                                            value={reimbursement.remarks}
                                            onChange={(e) => handleUpdateReimbursement(reimbursement.reimbursementId, { remarks: e.target.value })}
                                            className="border rounded p-1 bg-white w-full"
                                        />
                                    </td>
                                    <td className="py-2 px-4 text-start border-b flex space-x-2">
                                        <button
                                            onClick={() => handleDownloadFile(reimbursement.reimbursementId, 'receipts')}
                                            className="bg-blue-500 text-white px-3 py-1 rounded flex items-center"
                                        >
                                            Receipts
                                            <FaDownload className="ml-1" />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadFile(reimbursement.reimbursementId, 'approvals')}
                                            className="bg-green-500 text-white px-3 py-1 rounded flex items-center"
                                        >
                                            Approvals
                                            <FaDownload className="ml-1" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminReimbursementTable;
