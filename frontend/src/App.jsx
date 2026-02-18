import { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import Header from './components/Header';
import CampaignList from './components/CampaignList';
import CreateCampaign from './components/CreateCampaign';
import CampaignDetail from './components/CampaignDetail';
import MyDonations from './components/MyDonations';
import MyCampaigns from './components/MyCampaigns';

export default function App() {
  const [view, setView] = useState('browse');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  function openCampaign(address) {
    setSelectedCampaign(address);
    setView('detail');
  }

  function handleNavChange(newView) {
    setView(newView);
    if (newView !== 'detail') setSelectedCampaign(null);
  }

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50">
        <Header view={view} setView={handleNavChange} />
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
      </div>
    </WalletProvider>
  );
}
