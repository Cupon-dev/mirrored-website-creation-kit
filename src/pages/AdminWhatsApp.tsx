
import AdminWhatsAppPanel from "@/components/AdminWhatsAppPanel";

const AdminWhatsApp = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Admin Panel</h1>
          <p className="text-gray-600 mt-1">Send WhatsApp messages to customers manually</p>
        </div>
      </header>
      
      <main className="py-8">
        <AdminWhatsAppPanel />
      </main>
    </div>
  );
};

export default AdminWhatsApp;
