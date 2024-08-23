import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';

const transactions: { [key: string]: string[] } = {
    '2024-06-03': ['+3,400'],
    '2024-06-04': ['-4,500'],
    '2024-06-10': ['+13,500', '+4,900'],
    '2024-06-11': ['+19,000'],
    '2024-06-17': ['-3,200'],
    '2024-06-15': ['+4,690', '-3,500'],
    '2024-06-21': ['+45,900', '+11,230'],
    '2024-06-25': ['-23,500', '-19,000'],
    '2024-06-27': ['+12,300', '+9,700'],
};

const CalendarSection: React.FC = () => {
    const [date, setDate] = useState(new Date());

    const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
        const dateString = date.toISOString().split('T')[0];
        const dayTransactions = transactions[dateString];

        if (view === 'month' && dayTransactions) {
            return (
                <ul className="transactions">
                    {dayTransactions.map((transaction, index) => (
                        <li key={index} className={transaction.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                            {transaction}
                        </li>
                    ))}
                </ul>
            );
        }
        return null;
    };

    return (
        <div className="p-6 bg-white rounded-lg">
            <h1 className="text-3xl text-black font-bold mb-4">Calendar</h1>
            <Calendar
                onChange={setDate as any}
                value={date}
                tileContent={renderTileContent}
                className="react-calendar border-none"
            />
        </div>
    );
};

export default CalendarSection;