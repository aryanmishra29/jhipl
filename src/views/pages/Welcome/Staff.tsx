import AccountSummary from "./AccountSummary";

export default function Welcome() {
    return (
        <div className=" z-50 mt-20  py-6 px-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome!</h1>
            <AccountSummary bankAccount={23.826} vaults={34.109} cash={10.320} />
        </div>
    )
}