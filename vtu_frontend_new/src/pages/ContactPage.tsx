import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function ContactPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream px-6 py-8 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted mb-6 hover:text-ink transition-colors">
        <ArrowLeft size={20} /> Back
      </button>
      
      <h1 className="text-2xl font-bold mb-6">Contact Us</h1>
      
      <div className="space-y-5 text-sm text-muted leading-relaxed">
        <p>If you have any questions or need assistance, feel free to reach out to us.</p>
        
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">Email Us</h2>
          <p>Send us a message anytime at <a href="mailto:iaikademi@gmail.com" className="text-accent font-medium">iaikademi@gmail.com</a></p>
        </div>
        
        <div className="card">
          <h2 className="font-semibold text-ink mb-2">WhatsApp & Phone</h2>
          <p>Call us or send a message on WhatsApp at <a href="tel:09165369584" className="text-accent font-medium">09165369584</a></p>
        </div>
      </div>
    </div>
  );
}
