

const Build = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-50 to-[#FBFCF7]">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🚧 Under Construction 🚧</h1>
        <p className="text-lg text-gray-600 mb-6">
          We're currently working on this page.
        </p>
        <button
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
          onClick={() => window.location.href = "/"}
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default Build;
