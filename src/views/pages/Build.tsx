

const Build = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#FBFCF7] to-[#D7E6C5]">
      <div className="text-center p-8 bg-[#F57E07] shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🚧 Under Construction 🚧</h1>
        <p className="text-lg text-gray-600 mb-6">
          We're currently working on this page.
        </p>
        <button
          className="px-6 py-3 bg-[#D7E6C5] text-black font-semibold rounded-lg hover:bg-[#FBFCF7] transition duration-300"
          onClick={() => window.location.href = "/"}
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default Build;
