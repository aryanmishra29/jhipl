import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import Modal from "react-modal";
import axios from "axios";
import { Download } from "lucide-react";

interface PurchaseOrder {
  poId: string;
  poNumber: string;
  remainingAmount: number;
  finalAmount: number;
  poRequestId: string;
  vendor: string;
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
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const PurchaseOrder: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] =
    useState<boolean>(false);
  const [selectedPO, setSelectedPO] = useState<string>("");
  const [formData, setFormData] = useState({
    poRequestId: "",
    poNumber: "",
    vendor: "",
    paymentType: "",
    quotationAmount: "",
    baseAmount: "",
    igst: "",
    sgst: "",
    cgst: "",
    total: "",
    narration: "",
    poFile: null
  });

  const [vendors, setVendors] = useState<string[]>([]);
  const baseUrl = "https://jhipl.grobird.in";
  const [filesData, setFilesData] = useState<any[]>([]);
  const [cgsts, setCgsts] = useState<string[]>([]);
  const [sgsts, setSgsts] = useState<string[]>([]);
  const [igsts, setIgsts] = useState<string[]>([]);

  useEffect(() => {
    const fetchPendingPORequests = async () => {
      const response = await axios.get(
        `${baseUrl}/purchase-orders/request/pending`
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch purchase orders");
      }
      const mappedData = response.data.map((item: any) => ({
        poRequestId: item.poRequestId,
      }));

      setFilesData(mappedData);
      console.log(filesData);
    };
    fetchPendingPORequests();
  }, []);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const vendorsResponse = await axios.get(`${baseUrl}/info/vendors`);
        const sgstResponse = await axios.get(`${baseUrl}/info/sgst`);
        const igstResponse = await axios.get(`${baseUrl}/info/igst`);
        const cgstResponse = await axios.get(`${baseUrl}/info/cgst`);
        sgstResponse.data.push("0");
        igstResponse.data.push("0");
        cgstResponse.data.push("0");

        setVendors(
          Array.isArray(vendorsResponse.data) ? vendorsResponse.data : []
        );

        setSgsts(Array.isArray(sgstResponse.data) ? sgstResponse.data : []);
        setIgsts(Array.isArray(igstResponse.data) ? igstResponse.data : []);
        setCgsts(Array.isArray(cgstResponse.data) ? cgstResponse.data : []);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);

        setVendors([]);

        setIgsts([]);
        setCgsts([]);
        setSgsts([]);
      }
    };

    fetchDropdownData();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(`${baseUrl}/purchase-orders`);

      if (response.status !== 200) {
        throw new Error("Failed to fetch purchase orders");
      }
      const data: PurchaseOrder[] = response.data.map((po: any) => ({
        poId: po.poId,
        poRequestId: po.poRequestId,
        poNumber: po.poNumber,
        remainingAmount: po.remainingAmount,
        finalAmount: po.finalAmount,
        vendor: po.vendor,
      }));
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setIsAcceptModalOpen(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      poNumber,
      paymentType,
      vendor,
      quotationAmount,
      baseAmount,
      igst,
      sgst,
      cgst,
      total,
      narration,
      poFile,
    } = formData;

    console.log(formData);

    if (
      !poNumber ||
      !paymentType ||
      !vendor ||
      !quotationAmount ||
      !baseAmount ||
      !igst ||
      !sgst ||
      !cgst ||
      !total ||
      !narration ||
      !poFile
    ) {
      alert("Please fill in all required fields.");
      return;
    }
 console.log(selectedPoId)
    const formDataToSubmit = {
      poRequestId: selectedPoId,
      poNumber,
      vendor,
      paymentType,
      quotationAmount: parseFloat(quotationAmount),
      baseAmount: parseFloat(baseAmount),
      finalAmount: parseFloat(total),
      sgst,
      cgst,
      igst,
      narration,
      po: poFile,
    };


    try {
      const response = await axios.post(
        `${baseUrl}/purchase-orders`,
        formDataToSubmit,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
        },
        }
      );
      console.log(response)

      if (response.status === 200) {
        closeModal();
        fetchPurchaseOrders();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please check the console for details.");
    }
  };

  const handleDownload = async (poRequestId: string, fileType: string) => {
    if (fileType === "purchase-order") {
      try {
        const response = await fetch(
          `${baseUrl}/purchase-orders/${poRequestId}/file`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileType}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error(`Error downloading ${fileType}:`, error);
      }
    }
    try {
      const response = await fetch(
        `${baseUrl}/purchase-orders/request/${poRequestId}/${fileType}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileType}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Error downloading ${fileType}:`, error);
    }
  };

  const handleAccept = (poId: string) => {
    setSelectedPoId(poId);
    setIsAcceptModalOpen(true);
  };

  const handleReject = async (poRequestId: string) => {
    try {
      const response = await axios.post(
        `${baseUrl}/purchase-orders/request/reject/${poRequestId}`
      );
      if (response.status === 200) {
        location.reload();
      }
    } catch { }
  };

  const handleDownloadClick = (poRequestId: string, poId: string) => {
    setSelectedPoId(poRequestId);
    // setSelectedPO(po);
    setSelectedPO(poId);
    setIsPurchaseModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto h-[50vh] overflow-y-scroll noscroll-bar scroll-smooth">
        <div>
          <h1 className="text-3xl text-black font-semibold sticky top-0 backdrop-blur-xl p-3">
            PO Requests
          </h1>
          <table className="w-full h-full text-[#8E8F8E]  bg-white">
            <thead className="min-w-full sticky top-14 backdrop-blur-xl">
              <tr>
                <th className="py-2 text-start px-4 border-b">
                  Requisition Form
                </th>
                <th className="py-2 text-start px-4 border-b">
                  Comparative Form
                </th>
                <th className="py-2 text-start px-4 border-b">Quotation 1</th>
                <th className="py-2 text-start px-4 border-b">Quotation 2</th>
                <th className="py-2 text-start px-4 border-b">Quotation 3</th>
                <th className="py-2 text-start px-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody className="w-full">
              {filesData.map((file) => (
                <tr key={file.poRequestId} className="text-[#252525]">
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      onClick={() =>
                        handleDownload(file.poRequestId, "requisition-form")
                      }
                      className="flex gap-2"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                      <div className="text-gray-600 font-semibold">
                        Download
                      </div>
                    </button>
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      onClick={() =>
                        handleDownload(file.poRequestId, "comparative-form")
                      }
                      className="flex gap-2"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                      <div className="text-gray-600 font-semibold">
                        Download
                      </div>
                    </button>
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      onClick={() =>
                        handleDownload(file.poRequestId, "quotation1")
                      }
                      className="flex gap-2"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                      <div className="text-gray-600 font-semibold">
                        Download
                      </div>
                    </button>
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      onClick={() =>
                        handleDownload(file.poRequestId, "quotation2")
                      }
                      className="flex gap-2"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                      <div className="text-gray-600 font-semibold">
                        Download
                      </div>
                    </button>
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      onClick={() =>
                        handleDownload(file.poRequestId, "quotation3")
                      }
                      className="flex gap-2"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                      <div className="text-gray-600 font-semibold">
                        Download
                      </div>
                    </button>
                  </td>
                  <td className="py-2 px-4 text-start flex  border-b">
                    <button
                      className="px-4 flex gap-1 items-center py-2 bg-green-500 text-white rounded-md"
                      onClick={() => handleAccept(file.poRequestId)}
                    >
                      <FaCheck />
                      <div className="text-white font-semibold">Accept</div>
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 flex items-center gap-1 text-white rounded-md ml-2"
                      onClick={() => handleReject(file.poRequestId)}
                    >
                      <FaTimes />
                      <div className="text-white font-semibold">Reject</div>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add PO Modal */}
      <Modal
        isOpen={isAcceptModalOpen}
        onRequestClose={() => setIsAcceptModalOpen(false)}
        style={customStyles}
        contentLabel="Accept PO Modal"
      >
        <h2 className="text-lg font-bold mb-4">Add Purchase Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                PO Number
              </label>
              <input
                type="text"
                name="poNumber"
                value={formData.poNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <select
                name="paymentType"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
                value={formData.paymentType}
                onChange={handleChange}
                required
              >
                <option value="">Select Payment Type</option>
                {["HALF", "FULL", "PARTIAL"].map((center, index) => (
                  <option key={index} value={center}>
                    {center}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vendor
              </label>
              <select
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quotation Amount
              </label>
              <input
                type="number"
                name="quotationAmount"
                value={formData.quotationAmount}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base Amount
              </label>
              <input
                type="number"
                name="baseAmount"
                value={formData.baseAmount}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                IGST
              </label>
              <select
                name="igst"
                value={formData.igst}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select IGST</option>
                {igsts.map((igst) => (
                  <option key={igst} value={igst}>
                    {igst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SGST
              </label>
              <select
                name="sgst"
                value={formData.sgst}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select SGST</option>
                {sgsts.map((sgst) => (
                  <option key={sgst} value={sgst}>
                    {sgst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CGST
              </label>
              <select
                name="cgst"
                value={formData.cgst}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              >
                <option value="">Select CGST</option>
                {cgsts.map((cgst) => (
                  <option key={cgst} value={cgst}>
                    {cgst}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total
              </label>
              <input
                type="number"
                name="total"
                value={formData.total}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Narration
              </label>
              <textarea
                name="narration"
                value={formData.narration}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-transparent border p-2"
              />
            </div>
            <input
              type="file"
              name="poFile"
              className="w-full border rounded p-2 bg-white"
              onChange={handleChange}
            />
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Submit
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded-md ml-2"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      <div className="overflow-x-auto h-[50vh] overflow-y-scroll noscroll-bar scroll-smooth">
        <div>
          <h1 className="text-3xl text-black font-semibold sticky top-0 backdrop-blur-xl  p-3">
            Purchase Orders
          </h1>
          <table className="w-full h-full text-[rgb(142,143,142)] bg-white">
            <thead className="min-w-full sticky top-14 backdrop-blur-xl">
              <tr>
                <th className="py-2 text-start px-4 border-b">
                  <input type="checkbox" className="custom-checkbox" />
                </th>
                <th className="py-2 text-start px-4 border-b">PO Number</th>
                <th className="py-2 text-start px-4 border-b">Vendor</th>
                <th className="py-2 text-start px-4 border-b">
                  Remaining Amount
                </th>
                <th className="py-2 text-start px-4 border-b">Final Amount</th>
                <th className="py-2 text-start px-4 border-b">Documents</th>
              </tr>
            </thead>
            <tbody className="w-full">
              {purchaseOrders.map((po) => (
                <tr key={po.poId} className="text-[#252525]">
                  <td className="py-2 text-start px-4 border-b">
                    <input type="checkbox" className="custom-checkbox" />
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    {po.poNumber}
                  </td>
                  <td className="py-2 px-4 text-start border-b">{po.vendor}</td>
                  <td className="py-2 px-4 text-start border-b">
                    {po.remainingAmount}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    €{po.finalAmount.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-start border-b">
                    <button
                      className="bg-gray-200 px-4 rounded-lg py-2"
                      onClick={() =>
                        handleDownloadClick(po.poRequestId, po.poId)
                      }
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isPurchaseModalOpen}
        onRequestClose={() => setIsPurchaseModalOpen(false)}
        style={customStyles}
        contentLabel="Purchase Modal"
      >
        <h2 className="text-lg font-bold mb-4">Download Documents for PO </h2>
        <div className="flex flex-col  space-y-2">
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(
                selectedPoId ? selectedPoId : "",
                "requisition-form"
              )
            }
          >
            Download Requisition Form
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(
                selectedPoId ? selectedPoId : "",
                "comparative-form"
              )
            }
          >
            Download Comparative Form
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(selectedPoId ? selectedPoId : "", "quotation1")
            }
          >
            Download Quotation 1
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(selectedPoId ? selectedPoId : "", "quotation2")
            }
          >
            Download Quotation 2
          </button>
          <button
            className="bg-blue-500  text-white px-4 py-2 rounded"
            onClick={() =>
              handleDownload(selectedPoId ? selectedPoId : "", "quotation3")
            }
          >
            Download Quotation 3
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => handleDownload(selectedPO, "purchase-order")}
          >
            Download Purchase Order
          </button>
        </div>
      </Modal>
    </>
  );
};

export default PurchaseOrder;
