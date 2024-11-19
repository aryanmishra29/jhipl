import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import Modal from "react-modal";
import axios from "axios";

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
    overflow: "auto",
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
};

const Purchase: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    requisitionForm: null as File | null,
    comparativeForm: null as File | null,
    quotation1: null as File | null,
    quotation2: null as File | null,
    quotation3: null as File | null,
    comments: ""
  });

  const baseUrl = "https://jhipl.grobird.in";
  // const baseUrl = "http://localhost:8080";
  const user_id = localStorage.getItem("userId") || "";

  const fetchPurchaseOrders = async () => {
    try {
      const response = await axios.get(
        `${baseUrl}/purchase-orders/user/${user_id}`
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch purchase orders");
      }
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
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
    setFormData({
      requisitionForm: null,
      comparativeForm: null,
      quotation1: null,
      quotation2: null,
      quotation3: null,
      comments: ""
    });
  };

  const handleFileChange = (
    e:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;
    setFormData((prev) => ({
      ...prev,
      comments: name === "comments" ? value : prev.comments,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("userId", user_id);
    formDataToSubmit.append(
      "requisitionForm",
      formData.requisitionForm as Blob
    );
    formDataToSubmit.append(
      "comparativeForm",
      formData.comparativeForm as Blob
    );
    formDataToSubmit.append("quotation1", formData.quotation1 as Blob);
    formDataToSubmit.append("quotation2", formData.quotation2 as Blob);
    formDataToSubmit.append("quotation3", formData.quotation3 as Blob);
    formDataToSubmit.append("comments", formData.comments);

    try {
      const response = await axios.post(
        `${baseUrl}/purchase-orders/request`,
        formDataToSubmit,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        closeModal();
        fetchPurchaseOrders();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 px-6 h-full">
      <div className="mb-6 space-y-6">
        <h1 className="text-3xl text-black font-bold">Purchase </h1>
        <div className="flex flex-wrap justify-between space-y-2 md:space-y-0 md:space-x-2">
          <div className="w-auto relative inline-block">
            <button
              onClick={openModal}
              className="w-full md:w-auto bg-[#D7E6C5] font-bold px-6 py-1.5 rounded-xl flex items-center text-black justify-center"
            >
              <FaPlus className="mr-2" /> New PO Request
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-auto scroll-smooth max-h-[70vh]">
        <table className="w-full h-full text-[#8E8F8E] bg-white">
          <thead className="min-w-full">
            <tr>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                PO Number
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Date
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Remaining Amount
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Final Amount
              </th>
              <th className="py-2 text-start px-4 border-b sticky top-0 bg-white z-10">
                Payment Type
              </th>
            </tr>
          </thead>
          <tbody className="w-full">
            {purchaseOrders.map((po) => (
              <tr key={po.poId} className="text-[#252525]">
                <td className="py-2 px-4 text-start border-b">{po.poNumber}</td>
                <td className="py-2 px-4 text-start border-b">{po.date}</td>
                <td className="py-2 px-4 text-start border-b">
                  {po.remainingAmount}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {po.finalAmount.toFixed(4)}
                </td>
                <td className="py-2 px-4 text-start border-b">
                  {po.paymentType}
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
          <div className="grid grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="requisitionForm" className="block font-bold mb-1">
                Requisition Form
              </label>
              <input
                type="file"
                id="requisitionForm"
                name="requisitionForm"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="comparativeForm" className="block font-bold mb-1">
                Comparative Form
              </label>
              <input
                type="file"
                id="comparativeForm"
                name="comparativeForm"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quotation1" className="block font-bold mb-1">
                Quotation 1
              </label>
              <input
                type="file"
                id="quotation1"
                name="quotation1"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quotation2" className="block font-bold mb-1">
                Quotation 2
              </label>
              <input
                type="file"
                id="quotation2"
                name="quotation2"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quotation3" className="block font-bold mb-1">
                Quotation 3
              </label>
              <input
                type="file"
                id="quotation3"
                name="quotation3"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="comments" className="block font-bold mb-1">
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded bg-transparent"
              />
            </div>
          </div>
          <br />
          <button
            type="submit"
            className={`bg-green-600 flex justify-center w-full max-w-sm px-6 py-2 rounded-lg ${
              isSubmitting ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <svg
                className="animate-spin h-5 w-5 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Purchase;
