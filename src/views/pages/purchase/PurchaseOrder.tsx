import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaPlus, FaFilter, FaCheck, FaTimes } from 'react-icons/fa';
import Modal from 'react-modal';
import axios from 'axios';

interface PurchaseOrder {
    poId: string;
    poNumber: string;
    date: string;
    costCenter: string;
    finalAmount: number;
    status: string;
    vendor: string;
    remarks?: string; // Added remarks field
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

const PurchaseOrder: React.FC = () => {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        poNumber: '',
        date: '',
        companyName: '',
        baseAmount: '',
        igst: '',
        sgst: '',
        cgst: '',
        total: '',
        glCode: '',
        costCenter: '',
        remarks: '' // Added remarks field
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

    const fetchPurchaseOrders = async () => {
        try {
            const response = await axios.get(`${baseUrl}/purchase-orders`);

            if (response.status !== 200) {
                throw new Error('Failed to fetch purchase orders');
            }
            const data: PurchaseOrder[] = response.data.map((po: any) => ({
                poId: po.poId,
                poNumber: po.poNumber,
                date: po.date,
                costCenter: po.costCenter,
                finalAmount: po.finalAmount,
                status: po.status,
                vendor: po.vendor,
                remarks: po.remarks // Include remarks in the data
            }));
            setPurchaseOrders(data);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
    }, []);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const {
            poNumber,
            date,
            companyName,
            baseAmount,
            igst,
            sgst,
            cgst,
            total,
            glCode,
            costCenter,
            remarks 
        } = formData;

        if (!poNumber || !date || !companyName || !baseAmount || !igst || !sgst || !cgst || !total || !glCode || !costCenter) {
            alert('Please fill in all required fields.');
            return;
        }

        const formDataToSubmit = {
            poNumber,
            vendor: companyName,
            date,
            costCenter,
            glCode,
            baseAmount: parseFloat(baseAmount),
            finalAmount: parseFloat(total),
            sgst: parseFloat(sgst),
            cgst: parseFloat(cgst),
            igst: parseFloat(igst),
            remarks // Include remarks in POST request
        };

        try {
            await axios.post(`${baseUrl}/purchase-orders`, formDataToSubmit);
            closeModal();
            fetchPurchaseOrders();
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <div className='mt-6 px-6 h-full'>
            <div className="mb-6 space-y-6">
                <h1 className="text-3xl text-black font-bold">Purchase Orders</h1>
                <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
                    <div className="w-auto relative inline-block">
                        <button onClick={openModal} className="w-full md:w-auto bg-[#D7E6C5] font-bold px-6 py-1.5 rounded-xl flex items-center text-black justify-center">
                            <FaPlus className="mr-2" /> New PO
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
                            <th className="py-2 text-start px-4 border-b">PO Number</th>
                            <th className="py-2 text-start px-4 border-b">Date</th>
                            <th className="py-2 text-start px-4 border-b">Cost Center</th>
                            <th className="py-2 text-start px-4 border-b">Amount</th>
                            <th className="py-2 text-start px-4 border-b">Status</th>
                        </tr>
                    </thead>
                    <tbody className='w-full'>
                        {purchaseOrders.map((po) => (
                            <tr key={po.poId} className='text-[#252525]'>
                                <td className="py-2 text-start px-4 border-b">
                                    <input type="checkbox" className="custom-checkbox" />
                                </td>
                                <td className="py-2 px-4 text-start border-b">{po.poNumber}</td>
                                <td className="py-2 px-4 text-start border-b">{po.date}</td>
                                <td className="py-2 px-4 text-start border-b">{po.costCenter}</td>
                                <td className="py-2 px-4 text-start border-b">€{po.finalAmount.toFixed(2)}</td>
                                <td className='py-2 px-4 text-center border-b'>
                                    <div className={`w-fit rounded-full px-2 ${po.status === 'APPROVED' ? 'bg-[#636C59] text-white' : 'bg-[#D7E6C5]'}`}>
                                        {po.status === 'APPROVED' ? <FaCheck /> : <FaTimes />}
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
                contentLabel="Purchase Order Modal"
            >
                <h2 className="text-2xl font-bold mb-4">Add New Purchase Order</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label htmlFor="poNumber" className="block font-bold mb-1">PO Number</label>
                            <input
                                type="text"
                                id="poNumber"
                                name="poNumber"
                                value={formData.poNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="date" className="block font-bold mb-1">Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="companyName" className="block font-bold mb-1">Vendor</label>
                            <select
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            >
                                {vendors.map(vendor => (
                                    <option key={vendor} value={vendor}>{vendor}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="baseAmount" className="block font-bold mb-1">Base Amount</label>
                            <input
                                type="number"
                                id="baseAmount"
                                name="baseAmount"
                                value={formData.baseAmount}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="igst" className="block font-bold mb-1">IGST</label>
                            <input
                                type="number"
                                id="igst"
                                name="igst"
                                value={formData.igst}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="sgst" className="block font-bold mb-1">SGST</label>
                            <input
                                type="number"
                                id="sgst"
                                name="sgst"
                                value={formData.sgst}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="cgst" className="block font-bold mb-1">CGST</label>
                            <input
                                type="number"
                                id="cgst"
                                name="cgst"
                                value={formData.cgst}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="total" className="block font-bold mb-1">Total</label>
                            <input
                                type="number"
                                id="total"
                                name="total"
                                value={formData.total}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="glCode" className="block font-bold mb-1">GL Code</label>
                            <select
                                id="glCode"
                                name="glCode"
                                value={formData.glCode}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            >
                                {glCodes.map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="costCenter" className="block font-bold mb-1">Cost Center</label>
                            <select
                                id="costCenter"
                                name="costCenter"
                                value={formData.costCenter}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                                required
                            >
                                {costCenters.map(center => (
                                    <option key={center} value={center}>{center}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="remarks" className="block font-bold mb-1">Remarks</label>
                            <input
                                type="text"
                                id="remarks"
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded bg-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={closeModal} type="button" className="bg-gray-300 px-6 py-2 rounded text-black">Cancel</button>
                        <button type="submit" className="bg-[#636C59] px-6 py-2 rounded text-white">Submit</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PurchaseOrder;
