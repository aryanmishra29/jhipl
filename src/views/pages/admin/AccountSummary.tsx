import React from 'react';

interface AccountSummaryProps {
    bankAccount: number;
    vaults: number;
    cash: number;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ bankAccount, vaults, cash }) => {
    const total = bankAccount + vaults + cash;

    return (
        <div className="text-black max-w-screen-sm p-6 space-y-4 mt-8 border py-8 bg-[#FBFCF7] rounded-lg">
            <h2 className="text-xl font-semibold mb-4">My Accounts</h2>
            <div className="flex justify-between">
                <span>Bank Account</span>
                <span className="font-bold">{bankAccount.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
                <span>Vaults</span>
                <span className="font-bold">{vaults.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
                <span>Cash</span>
                <span className="font-bold">{cash.toFixed(3)}</span>
            </div>
            <div className="flex justify-between mt-4">
                <span>Total</span>
                <span className="font-bold">{total.toFixed(3)}</span>
            </div>
        </div>
    );
};

export default AccountSummary;
