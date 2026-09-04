import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investigation from './pages/Investigation';
import MuleGraph from './pages/MuleGraph';
import Simulator from './pages/Simulator';
import Analytics from './pages/Analytics';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTxnId, setSelectedTxnId] = useState('TXN-1002');

  const handleSelectTransaction = (txnId) => {
    setSelectedTxnId(txnId);
    setActiveTab('investigation');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard onSelectTransaction={handleSelectTransaction} />
          )}

          {activeTab === 'transactions' && (
            <Transactions onSelectTransaction={handleSelectTransaction} />
          )}

          {activeTab === 'investigation' && (
            <Investigation 
              selectedTxnId={selectedTxnId} 
              onBack={() => setActiveTab('transactions')} 
            />
          )}

          {activeTab === 'mulegraph' && (
            <MuleGraph />
          )}

          {activeTab === 'simulator' && (
            <Simulator onTransactionCreated={() => setActiveTab('transactions')} />
          )}

          {activeTab === 'analytics' && (
            <Analytics />
          )}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
