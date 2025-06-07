import React from 'react';
import { Link } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Button } from '@/components/ui/button';
import { Building, ClipboardCheck, Shield, FileText, MapPin, HelpCircle, PhoneCall } from 'lucide-react';
import { Footer } from './shared/footer';
import { Navigation } from './shared/navigation';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-orange-50">
      <Navigation activePage="home" />
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24">
        <FadeInSection delay={100}>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gray-900">
            Fire Safety Establishment Inspection <br /><span className="text-orange-600">Management System</span>
          </h1>
        </FadeInSection>
        
        <FadeInSection delay={300}>
          <p className="text-xl text-muted-foreground max-w-3xl mb-10">
            A comprehensive platform for monitoring, managing, and improving fire safety compliance
            for businesses and inspection authorities.
          </p>
        </FadeInSection>
        
        <FadeInSection delay={500}>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/owner-signup">
              <Button size="lg" className="px-8 bg-orange-600 hover:bg-orange-700">Get Started</Button>
            </Link>
          </div>
        </FadeInSection>
      </section>
      
      <Footer />
    </div>
  );
};

export default Home;