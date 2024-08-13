import AccountSummary from "./AccountSummary";

export default function AdminDashboard() {
    return (
        <div className="z-50 py-6 px-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
            <AccountSummary bankAccount={23.826} vaults={34.109} cash={10.320} />
            {/* Additional admin-specific sections can be added here */}
        </div>
    );
}
