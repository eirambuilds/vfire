import React from 'react';
import { Link } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Shield, ArrowLeft, Users, Flame, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from './shared/footer';
import { Navigation } from './shared/navigation';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-orange-50">
      <Navigation activePage="about" />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 py-16 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeInSection delay={100}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About V-FIRE Inspect</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Revolutionizing fire safety management through innovation, transparency, and collaboration.
            </p>
          </FadeInSection>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <FadeInSection delay={200}>
          <div className="prose prose-orange max-w-none">
            <p className="lead text-xl mb-10">
              V-FIRE Inspect is dedicated to revolutionizing fire safety management through 
              a comprehensive digital platform that connects establishment owners, fire inspectors, 
              and administrative authorities.
            </p>
            
            {/* Key Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
              <div className="bg-white rounded-lg p-6 shadow-md text-center transform transition-transform hover:scale-105">
                <div className="bg-orange-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">500+</h3>
                <p className="text-gray-600">Businesses Protected</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md text-center transform transition-transform hover:scale-105">
                <div className="bg-orange-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Flame className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">99%</h3>
                <p className="text-gray-600">Safety Compliance Rate</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md text-center transform transition-transform hover:scale-105">
                <div className="bg-orange-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">72 hrs</h3>
                <p className="text-gray-600">Average Processing Time</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
            <p>
              Our mission is to enhance public safety by streamlining the fire safety inspection process, 
              ensuring compliance with regulations   ensuring compliance with regulations, and fostering a culture of proactive safety measures 
              among business establishments in Valenzuela City.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
            <p>
              We envision a future where every establishment maintains the highest standards of fire safety, 
              reducing incidents and protecting lives and property through efficient management, 
              transparent processes, and collaborative approaches to safety.
            </p>
            
            {/* Timeline Section */}
            <h2 className="text-2xl font-semibold mt-12 mb-6">Our Journey</h2>
            <div className="relative border-l-2 border-orange-300 pl-8 space-y-10 ml-4 mb-12">
              <div className="relative">
                <div className="absolute -left-10 mt-1.5 h-6 w-6 rounded-full border-2 border-orange-300 bg-white flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                </div>
                <h3 className="text-xl font-medium text-orange-700">1991</h3>
                <p className="mt-2">The Bureau of Fire Protection (BFP) was established under Republic Act No. 6975, laying the foundation for modern fire safety management in the Philippines.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 mt-1.5 h-6 w-6 rounded-full border-2 border-orange-300 bg-white flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                </div>
                <h3 className="text-xl font-medium text-orange-700">2024</h3>
                <p className="mt-2">Conducted research for capstone project, collaborating with Valenzuela City Fire Department to understand fire safety management needs.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 mt-1.5 h-6 w-6 rounded-full border-2 border-orange-300 bg-white flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                </div>
                <h3 className="text-xl font-medium text-orange-700">2025</h3>
                <p className="mt-2">Ongoing development of V-FIRE Inspect Management System, with planned launch and integration with Valenzuela City’s business permit system in 2025.</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Safety First</h3>
                </div>
                <p className="text-sm ml-10">We prioritize the protection of life and property above all else.</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Award className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Excellence</h3>
                </div>
                <p className="text-sm ml-10">We strive for excellence in every aspect of our service delivery.</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Collaboration</h3>
                </div>
                <p className="text-sm ml-10">We believe in working together to achieve common safety goals.</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Efficiency</h3>
                </div>
                <p className="text-sm ml-10">We optimize processes to reduce unnecessary bureaucracy.</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-12 mb-4">Our Team</h2>
            <p>
              V-FIRE Inspect is developed and maintained by a dedicated team of professionals with expertise in fire safety, 
              technology, and public administration. Our diverse backgrounds and shared commitment to public safety 
              drive us to create a platform that truly serves the needs of our community.
            </p>
            
            {/* CTA Section */}
            <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 my-10 rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-3">Ready to enhance fire safety in your establishment?</h3>
              <p className="mb-4">Join our growing community of safety-conscious business owners.</p>
              <Link to="/owner-signup">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">Get Started Today</Button>
              </Link>
            </div>
          </div>
        </FadeInSection>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;