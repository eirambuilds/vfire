import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Shield, Search, CheckCircle, AlertCircle, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Footer } from './shared/footer';
import { Navigation } from './shared/navigation';

const FAQCategory = ({ children, icon, title, count, className }) => (
  <div className={`bg-white p-5 rounded-lg border border-orange-100 hover:border-orange-300 transition-all shadow-sm hover:shadow flex flex-col items-center text-center ${className}`}>
    <div className="bg-orange-100 p-3 rounded-full mb-3">
      {icon}
    </div>
    <h3 className="font-semibold text-lg mb-1">{title}</h3>
    <p className="text-sm text-gray-500">{count} questions</p>
    {children}
  </div>
);

const FAQs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const allFaqs = [
    {
      category: "general",
      title: "General",
      icon: <HelpCircle className="h-6 w-6 text-orange-600" />,
      questions: [
        {
          question: "What is V-FIRE Inspect?",
          answer: "V-FIRE Inspect is a comprehensive fire safety management system designed to streamline the process of fire safety compliance for business establishments, fire inspectors, and administrative authorities in Valenzuela City."
        },
        {
          question: "Who can use this platform?",
          answer: "The platform serves three main user types: Establishment Owners, Fire Inspectors, and System Administrators. Each user type has specific functionalities tailored to their needs."
        },
        {
          question: "Is V-FIRE Inspect available on mobile devices?",
          answer: "Yes, V-FIRE Inspect is fully responsive and can be accessed on smartphones, tablets, and desktop computers."
        }
      ]
    },
    {
      category: "establishment",
      title: "Establishment Owners",
      icon: <FileText className="h-6 w-6 text-orange-600" />,
      questions: [
        {
          question: "How do I register my business?",
          answer: "After creating an account, you can add your establishment(s) from your dashboard. Each establishment will need to be registered by providing the required details and documentation."
        },
        {
          question: "What types of certifications can I apply for?",
          answer: "You can apply for Fire Safety Evaluation Clearance (FSEC), Fire Safety Inspection Certificate for Occupancy (FSIC-Occupancy), and Fire Safety Inspection Certificate for Business (FSIC-Business)."
        },
        {
          question: "How will I know when an inspection is scheduled?",
          answer: "Once an inspection is scheduled, you will receive a notification, and the appointment will appear in your calendar. You can view the details including date, time, and assigned inspector."
        },
        {
          question: "What happens after the inspection?",
          answer: "After the inspection, the inspector will submit their findings to the administrator. Based on the inspection results, your application will either be approved (with a certificate issued) or rejected (with reasons provided)."
        }
      ]
    },
    {
      category: "inspector",
      title: "For Fire Inspectors",
      icon: <CheckCircle className="h-6 w-6 text-orange-600" />,
      questions: [
        {
          question: "How do I view my assigned inspections?",
          answer: "Your dashboard will display all inspections assigned to you, including details about the establishments and scheduled dates/times."
        },
        {
          question: "Can I reschedule an inspection?",
          answer: "Inspectors cannot directly reschedule inspections. If rescheduling is necessary, please contact the administrator."
        },
        {
          question: "What information should I include in the inspection checklist?",
          answer: "The inspection checklist includes standard fire safety compliance items. You'll need to mark each item as compliant/non-compliant, provide comments, and upload supporting photos as required."
        }
      ]
    },
    {
      category: "technical",
      title: "Technical Support",
      icon: <AlertCircle className="h-6 w-6 text-orange-600" />,
      questions: [
        {
          question: "I forgot my password. How can I reset it?",
          answer: "Click on the 'Forgot Password' link on the login page, and follow the instructions sent to your registered email address."
        },
        {
          question: "The system is not working properly. Who should I contact?",
          answer: "Please use the Contact form to report any technical issues, or email support@vfireinspect.gov.ph directly."
        },
        {
          question: "How can I update my contact information?",
          answer: "Log in to your account, navigate to Settings, and update your profile information there."
        }
      ]
    }
  ];

  // Filter FAQs based on search term and active tab
  const filteredFaqs = allFaqs
    .filter(category => activeTab === 'all' || category.category === activeTab)
    .map(category => ({
      ...category,
      questions: category.questions.filter(
        q => !searchTerm || 
             q.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
             q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-orange-50">
      <Navigation activePage="faqs" />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 py-12 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeInSection delay={100}>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Find answers to common questions about our fire safety inspection system
            </p>
          </FadeInSection>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <FadeInSection delay={200}>
          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search FAQs..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* FAQ Categories */}
          {!searchTerm && activeTab === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {allFaqs.map((category) => (
                <FAQCategory 
                  key={category.category} 
                  icon={category.icon} 
                  title={category.title} 
                  count={category.questions.length}
                  className="flex flex-col h-full"
                >
                  <div className="flex-grow"></div> {/* Push button to bottom */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-auto text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => setActiveTab(category.category)}
                  >
                    View Questions
                  </Button>
                </FAQCategory>
              ))}
            </div>
          )}

          
          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap">
              <TabsTrigger value="all">All Categories</TabsTrigger>
              {allFaqs.map((category) => (
                <TabsTrigger key={category.category} value={category.category}>
                  {category.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* FAQ Content */}
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-orange-100">
              <HelpCircle className="h-12 w-12 text-orange-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No FAQs Found</h3>
              <p className="text-muted-foreground">No FAQs match your search. Try different keywords.</p>
              <Button 
                variant="outline"
                className="mt-4 border-orange-200"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('all');
                }}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            filteredFaqs.map((category, index) => (
              <div key={index} className="mb-8">
                <h2 className="flex items-center text-xl font-semibold mb-4">
                  {category.icon && <span className="mr-2">{category.icon}</span>}
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="border rounded-md bg-white shadow-sm">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`${index}-${faqIndex}`}>
                      <AccordionTrigger className="px-4 hover:text-orange-600">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <p>{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
          
          <div className="bg-white border border-orange-200 rounded-lg p-6 mt-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:flex-1">
                <h3 className="text-lg font-semibold mb-2">Didn't find what you're looking for?</h3>
                <p className="mb-4 text-gray-600">Our support team is ready to assist you with any questions.</p>
                <Link to="/contact">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">Contact Support</Button>
                </Link>
              </div>
              <div className="mt-6 md:mt-0 md:ml-6">
                <div className="bg-orange-100 p-4 rounded-full">
                  <HelpCircle className="h-10 w-10 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
      
      <Footer />
    </div>
  );
};

export default FAQs;