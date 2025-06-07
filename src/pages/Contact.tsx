import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Flame, Mail, Phone, MapPin, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from './shared/footer';
import { Navigation } from './shared/navigation';
import emailjs from '@emailjs/browser';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Valid email is required';
    if (!formData.subject.trim()) return 'Subject is required';
    if (!formData.message.trim()) return 'Message is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setModalMessage(validationError);
      setIsError(true);
      setShowModal(true);
      return;
    }

    setIsSubmitting(true);

    // Generate timestamp
    const time = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    try {
      await emailjs.send(
        'service_xqj1rde', // Hardcoded Service ID
        'template_2clhklz', // Hardcoded Template ID
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          time: time
        },
        'rKYTzMh8VZOobc2fi' // Hardcoded User ID
      );

      setModalMessage('Your message has been sent successfully! We’ll get back to you soon.');
      setIsError(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('EmailJS Error:', error);
      setModalMessage('Failed to send message. Please try again later.');
      setIsError(true);
    } finally {
      setIsSubmitting(false);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-orange-50">
      <Navigation activePage="contact" />
      
      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-12">
        <FadeInSection delay={100}>
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Contact Us</h1>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium">Email</h4>
                        <p className="text-sm text-muted-foreground">vfireinspectval@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium">Phone</h4>
                        <p className="text-sm text-muted-foreground">+63 9876543210</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium">Office</h4>
                        <p className="text-sm text-muted-foreground">
                          Valenzuela City Fire Station,<br />
                          ALERT Center Compound,<br />
                          MacArthur Highway, Malinta, <br />
                          Valenzuela City
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Office Hours</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-medium">Mon - Fri</dt>
                      <dd className="text-muted-foreground">8:00 AM - 5:00 PM</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Saturday</dt>
                      <dd className="text-muted-foreground">8:00 AM - 12:00 PM</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Sunday & Holidays</dt>
                      <dd className="text-muted-foreground">Closed</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Send us a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleChange} 
                          required 
                          aria-required="true"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={formData.email} 
                          onChange={handleChange} 
                          required 
                          aria-required="true"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input 
                        id="subject" 
                        name="subject" 
                        value={formData.subject} 
                        onChange={handleChange} 
                        required 
                        aria-required="true"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        name="message" 
                        rows={6} 
                        value={formData.message} 
                        onChange={handleChange} 
                        required 
                        aria-required="true"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 
                id="modal-title"
                className={`text-lg font-semibold ${isError ? 'text-red-600' : 'text-orange-600'}`}
              >
                {isError ? 'Submission Error' : 'Message Sent'}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <Button
              onClick={closeModal}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Contact;