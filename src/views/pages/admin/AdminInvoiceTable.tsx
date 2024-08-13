import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaFilter, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface Invoice {
    invoiceId: string;
    number: string;
    glCode: string;
    costCenter: string;
    poNumber: string;
    date: string;
    baseAmount: number;
    finalAmount: number;
    vendor: string;
    sgst: number;
    cgst: number;
    igst: number;
    UtrNo: string;
    status: string;
    remarks: string;
}

const AdminInvoiceTable: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const baseUrl = 'http://45.249.132.81';

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await fetch(`${baseUrl}/invoices`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data: Invoice[] = await response.json();
            setInvoices(data);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const paymentCycle = "Aug 2024-2";
            const response = await fetch(`${baseUrl}/invoices/excel?paymentCycle=${paymentCycle}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
            XLSX.writeFile(workbook, "Invoices.xlsx");
        } catch (error) {
            console.error("Error fetching or exporting data:", error);
        }
    };

    const handleDownloadFile = async (invoiceId: string, fileType: 'receipts' | 'approvals') => {
        try {
            const response = await fetch(`${baseUrl}/invoices/${invoiceId}/${fileType}`);
            console.log(response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileType}-${invoiceId}.pdf`;
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
                <h1 className="text-3xl text-black font-bold">Invoices</h1>
                <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
                    <div className="w-auto relative inline-block">
                        <button onClick={handleDownloadExcel} className="w-full md:w-auto bg-[#D7E6C5] font-bold px-6 py-1.5 rounded-xl flex items-center text-black justify-center">
                            Download as Excel
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
                            <th className="py-2 text-start px-4 border-b">GL Code</th>
                            <th className="py-2 text-start px-4 border-b">Cost Center</th>
                            <th className="py-2 text-start px-4 border-b">PO Number</th>
                            <th className="py-2 text-start px-4 border-b">Date</th>
                            <th className="py-2 text-start px-4 border-b">Base Amount</th>
                            <th className="py-2 text-start px-4 border-b">Final Amount</th>
                            <th className="py-2 text-start px-4 border-b">Vendor</th>
                            <th className="py-2 text-start px-4 border-b">SGST</th>
                            <th className="py-2 text-start px-4 border-b">CGST</th>
                            <th className="py-2 text-start px-4 border-b">IGST</th>
                            <th className="py-2 text-start px-4 border-b">UTR No.</th>
                            <th className="py-2 text-start px-4 border-b">Status</th>
                            <th className="py-2 text-start px-4 border-b">Remarks</th>
                            <th className="py-2 text-start px-4 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody className='w-full'>
                        {invoices.map((invoice, index) => (
                            <tr key={index} className='text-[#252525]'>
                                <td className="py-2 text-start px-4 border-b">
                                    <input type="checkbox" className="custom-checkbox" />
                                </td>
                                <td className="py-2 px-4 text-start border-b">{invoice.number}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.glCode}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.costCenter}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.poNumber}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.date}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.baseAmount}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.finalAmount}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.vendor}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.sgst}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.cgst}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.igst}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.UtrNo}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.status}</td>
                                <td className="py-2 px-4 text-start border-b">{invoice.remarks}</td>
                                <td className="py-2 px-4 flex text-start border-b">
                                    <button
                                        onClick={() => handleDownloadFile(invoice.invoiceId, 'receipts')}
                                        className="bg-blue-500 text-white px-3 py-1 rounded mr-2 flex items-center"
                                    >
                                        Receipts
                                        <FaDownload className="ml-1" />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadFile(invoice.invoiceId, 'approvals')}
                                        className="bg-green-500 text-white px-3 py-1 rounded flex items-center"
                                    >
                                        Approvals
                                        <FaDownload className="ml-1" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminInvoiceTable;
