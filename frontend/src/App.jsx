import { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import CampaignList from './components/CampaignList';
import CreateCampaign from './components/CreateCampaign';
import CampaignDetail from './components/CampaignDetail';
import MyCampaigns from './components/MyCampaigns';
import MyDonations from './components/MyDonations';

function AppInner() {
  const { account } = useWallet();
  const [view, setView] = useState('browse');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Reset to browse whenever a wallet connects
  useEffect(() => {
    if (account) setView('browse');
  }, [account]);

  function openCampaign(address) {
    setSelectedCampaign(address);
    setView('detail');
  }

  function handleNavChange(newView) {
    setView(newView);
    if (newView !== 'detail') setSelectedCampaign(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header view={view} setView={handleNavChange} />

      {!account ? (
        <LandingPage />
      ) : (
        <main className="max-w-5xl mx-auto px-4 py-8">
          {view === 'browse' && <CampaignList onSelect={openCampaign} />}
          {view === 'create' && (
            <CreateCampaign onCreated={() => handleNavChange('browse')} />
          )}
          {view === 'detail' && selectedCampaign && (
            <CampaignDetail
              address={selectedCampaign}
              onBack={() => handleNavChange('browse')}
            />
          )}
          {view === 'my-campaigns' && <MyCampaigns onSelect={openCampaign} />}
          {view === 'my-donations' && <MyDonations onSelect={openCampaign} />}
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppInner />
    </WalletProvider>
  );
}
