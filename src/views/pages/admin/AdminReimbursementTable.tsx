import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FaDownload } from 'react-icons/fa';
import Modal from 'react-modal';
import axios from 'axios';

interface Reimbursement {
    userId: string;
    reimbursementId: string;
    voucherNo: string;
    name: string;
    glCode: string;
    costCenter: string;
    date: string;
    amount: number;
    advance: number;
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

const AdminReimbursementTable: React.FC = () => {
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | undefined>(undefined);

    const [costCenters, setCostCenters] = useState<string[]>([]);
    const [vendors, setVendors] = useState<string[]>([]);
    const [glCodes, setGlCodes] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const baseUrl = 'https://jhipl.grobird.in';

    useEffect(() => {
        fetchReimbursements();
        fetchAdditionalData();
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

    const fetchAdditionalData = async () => {
        try {
            const [costCentersResponse, vendorsResponse, glCodesResponse] = await Promise.all([
                axios.get(`${baseUrl}/info/cost-centers`),
                axios.get(`${baseUrl}/info/vendors`),
                axios.get(`${baseUrl}/info/gl-codes`),
            ]);

            setCostCenters(costCentersResponse.data);
            setVendors(vendorsResponse.data);
            setGlCodes(glCodesResponse.data);
        } catch (error) {
            console.error("Error fetching additional data:", error);
        }
    };

    const openModal = (reimbursement: Reimbursement) => {
        setSelectedReimbursement(reimbursement);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedReimbursement(undefined);
    };

    const handleUpdateReimbursement = async () => {
        try {
            if (selectedReimbursement) {
                // const { reimbursementId } = selectedReimbursement;
                const response = await fetch(`${baseUrl}/reimbursements/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(selectedReimbursement),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                fetchReimbursements();
                closeModal();
            }
        } catch (error) {
            console.error("Error updating reimbursement:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSelectedReimbursement((prev) => prev ? {
            ...prev,
            [name]: value,
        } : undefined);
        console.log(selectedReimbursement)
    };

    const handleDownloadExcel = async () => {
        try {
            if (!startDate || !endDate) {
                alert('Please select both start and end dates.');
                return;
            }
            const response = await fetch(`${baseUrl}/reimbursements/excel?startDate=${startDate}&endDate=${endDate}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log(data)
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
        <div>
            <div className='mt-6 px-6 h-full'>
                <div className="mb-6 space-y-6">
                    <h1 className="text-3xl text-black font-bold">Reimbursements</h1>
                    <div className="flex justify-between items-center">
                        <div className="flex  items-center gap-6">
                            <div className="flex space-x-2 items-center">
                                <label htmlFor="startDate" className="text-black font-semibold">Start Date:</label>
                                <input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border bg-transparent text-black rounded p-2"
                                />
                            </div>
                            <div className="flex space-x-2 items-center">
                                <label htmlFor="endDate" className="text-black font-semibold">End Date:</label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border bg-transparent text-black rounded p-2"
                                />
                            </div>
                            <button onClick={handleDownloadExcel} className="bg-[#D7E6C5] text-black font-bold px-6 py-1.5 rounded-xl flex items-center">
                                Download as Excel
                            </button>
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
                                <th className="py-2 text-start px-4 border-b">Date</th>
                                <th className="py-2 text-start px-4 border-b">Amount</th>
                                <th className="py-2 text-start px-4 border-b">Account (UTR, Ref)</th>
                                <th className="py-2 text-start px-4 border-b">Cost Center</th>
                                <th className="py-2 text-start px-4 border-b">Status</th>
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
                                        <td className="py-2 px-4 text-start border-b">{reimbursement.status}</td>
                                        <td className="py-2 px-4 text-start border-b">
                                            <button
                                                onClick={() => openModal(reimbursement)}
                                                className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Edit Reimbursement"
                style={customStyles}
            >
                <h2 className="text-2xl font-bold mb-4">Edit Reimbursement</h2>
                <div className="grid grid-cols-2 gap-6">
                    <select
                        name="companyName"
                        value={selectedReimbursement?.name || ''}
                        onChange={handleInputChange}
                        className="border bg-transparent rounded p-2 w-full"
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
                    <select
                        name="glCode"
                        value={selectedReimbursement?.glCode || ''}
                        onChange={handleInputChange}
                        className="border bg-transparent rounded p-2 w-full"
                    >
                        <option value="">Select GL Code</option>
                        {glCodes.map((code, index) => (
                            <option key={index} value={code}>
                                {code}
                            </option>
                        ))}
                    </select>
                    <select
                        name="costCenter"
                        value={selectedReimbursement?.costCenter || ''}
                        onChange={handleInputChange}
                        className="border bg-transparent rounded p-2 w-full"
                    >
                        <option value="">Select Cost Center</option>
                        {costCenters.map((center, index) => (
                            <option key={index} value={center}>
                                {center}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        name="date"
                        value={selectedReimbursement?.date || ''}
                        onChange={handleInputChange}
                        className="border bg-transparent rounded p-2 w-full"
                    />
                    <input
                        type="number"
                        name="amount"
                        value={selectedReimbursement?.amount || ''}
                        onChange={handleInputChange}
                        placeholder="Amount"
                        className="border bg-transparent rounded p-2 w-full"
                    />
                    <input
                        type="number"
                        name="advance"
                        value={selectedReimbursement?.advance || ''}
                        onChange={handleInputChange}
                        placeholder="Advance"
                        className="border bg-transparent rounded p-2 w-full"
                    />
                    <input
                        type="text"
                        name="utrNo"
                        value={selectedReimbursement?.utrNo || ''}
                        onChange={handleInputChange}
                        placeholder="UTR No."
                        className="border bg-transparent rounded p-2 w-full"
                    />
                    <select
                        name="status"
                        value={selectedReimbursement?.status || ''}
                        onChange={handleInputChange}
                        className="border bg-transparent rounded p-2 w-full"
                    >
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <input
                        type="text"
                        name="description"
                        value={selectedReimbursement?.description || ''}
                        onChange={handleInputChange}
                        placeholder="Description"
                        className="border bg-transparent rounded p-2 w-full"
                    />
                    <input
                        type="text"
                        name="narration"
                        value={selectedReimbursement?.narration || ''}
                        onChange={handleInputChange}
                        placeholder="Narration"
                        className="border bg-transparent rounded p-2 w-full"
                    />
                </div>
                <div className="py-2 flex space-x-2 mt-4">
                    <button
                        onClick={() => handleDownloadFile(selectedReimbursement?.reimbursementId ? selectedReimbursement?.reimbursementId : "", 'receipts')}
                        className="bg-blue-500 text-white px-3 py-1 rounded flex items-center"
                    >
                        Receipts
                        <FaDownload className="ml-1" />
                    </button>
                    <button
                        onClick={() => handleDownloadFile(selectedReimbursement?.reimbursementId ? selectedReimbursement?.reimbursementId : "", 'approvals')}
                        className="bg-green-500 text-white px-3 py-1 rounded flex items-center"
                    >
                        Approvals
                        <FaDownload className="ml-1" />
                    </button>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleUpdateReimbursement} className="bg-green-500 text-white px-4 py-2 rounded">
                        Submit
                    </button>
                    <button onClick={closeModal} className="bg-red-500 text-white px-4 py-2 rounded ml-2">
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminReimbursementTable;
