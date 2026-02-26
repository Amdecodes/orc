"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const mockPayments = [
  { id: "pm1", user: "amde@example.com", package: "Professional", amount: 180, credits: 10, status: "PENDING", proof: "/proof1.png", createdAt: "2026-02-26 18:30" },
  { id: "pm2", user: "john@example.com", package: "Basic", amount: 100, credits: 5, status: "PENDING", proof: "/proof2.png", createdAt: "2026-02-26 19:10" },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState(mockPayments);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: id, action: "APPROVE" }),
      });
      if (response.ok) {
        setPayments(payments.filter(p => p.id !== id));
        alert("Payment approved and credits added!");
      }
    } catch (error) {
      console.error("Approve failed:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: id, action: "REJECT" }),
      });
      if (response.ok) {
        setPayments(payments.filter(p => p.id !== id));
        alert("Payment rejected!");
      }
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-12">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2 font-light">Manage user payments and credit approvals.</p>
      </header>

      <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest">User</th>
              <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest">Package</th>
              <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest">Amount</th>
              <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-6 text-sm font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-8">
                  <div className="font-bold text-gray-900">{payment.user}</div>
                  <div className="text-xs text-gray-400 font-mono mt-1">ID: {payment.id}</div>
                </td>
                <td className="px-8 py-8">
                  <div className="font-medium text-gray-700">{payment.package}</div>
                  <div className="text-xs text-green-600 font-bold mt-1">{payment.credits} Credits</div>
                </td>
                <td className="px-8 py-8">
                  <div className="font-black text-gray-900">{payment.amount} ETB</div>
                </td>
                <td className="px-8 py-8 text-sm text-gray-500 font-light">
                  {payment.createdAt}
                </td>
                <td className="px-8 py-8 text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(payment.proof)}>View Proof</Button>
                  <Button variant="primary" size="sm" onClick={() => handleApprove(payment.id)}>Approve</Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleReject(payment.id)}>Reject</Button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-light italic text-lg">
                  No pending payments. Everything is caught up!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
