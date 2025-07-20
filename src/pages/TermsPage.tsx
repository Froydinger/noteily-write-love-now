import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen p-4" 
      style={{
        background: 'linear-gradient(180deg, hsl(215, 55%, 18%) 0%, hsl(218, 50%, 14%) 30%, hsl(220, 55%, 10%) 70%, hsl(222, 60%, 7%) 100%) !important',
        backgroundAttachment: 'fixed',
        backgroundColor: 'hsl(215, 45%, 12%) !important'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6"
          style={{ color: 'hsl(210, 40%, 95%) !important' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card 
          style={{
            backgroundColor: 'hsl(215, 45%, 14%) !important',
            borderColor: 'hsl(215, 45%, 20%) !important',
            color: 'hsl(210, 40%, 95%) !important',
            border: '1px solid hsl(215, 45%, 20%) !important'
          }}
        >
          <CardHeader>
            <CardTitle className="text-3xl font-serif" style={{ color: 'hsl(210, 40%, 95%) !important' }}>
              Terms of Service
            </CardTitle>
            <CardDescription style={{ color: 'hsl(210, 20%, 70%) !important' }}>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-6">
            <div style={{ color: 'hsl(210, 40%, 95%) !important' }}>
              <h2 className="text-xl font-semibold mb-3">Welcome to Noteily</h2>
              <p className="mb-4">
                By using Noteily, you agree to these terms of service. Please read them carefully.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Service Description</h2>
              <p className="mb-4">
                Noteily is a note-taking application that allows you to create, edit, and sync notes across your devices. Our service is provided free of charge with the commitment to remain ad-free.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Your Account</h2>
              <p className="mb-4">
                To use Noteily, you must:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Keep your login credentials secure</li>
                <li>Be responsible for all activity that occurs under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3 mt-6">Acceptable Use</h2>
              <p className="mb-4">
                You agree not to use Noteily to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with or disrupt our service</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Share your account with others</li>
              </ul>
              <p className="mb-4">
                We don't monitor or judge the content of your notes. Your notes are private and we respect your freedom to write whatever you want, as long as it doesn't violate the law.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Your Content</h2>
              <p className="mb-4">
                You retain full ownership of all content you create in Noteily. We do not claim any rights to your notes or personal information. You are responsible for maintaining backups of your important content.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Service Availability</h2>
              <p className="mb-4">
                While we strive to provide reliable service, we cannot guarantee 100% uptime. We may need to perform maintenance or updates that temporarily affect service availability.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Our Commitments</h2>
              <p className="mb-4">
                We promise to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Keep Noteily completely ad-free</li>
                <li>Never sell your personal data</li>
                <li>Never share your data with third parties</li>
                <li>Maintain the privacy and security of your information</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3 mt-6">Limitation of Liability</h2>
              <p className="mb-4">
                Noteily is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including loss of data.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Termination</h2>
              <p className="mb-4">
                You may delete your account at any time through the settings page. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Changes to Terms</h2>
              <p className="mb-4">
                We may update these terms from time to time. We will notify users of significant changes via email.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Contact Us</h2>
              <p className="mb-4">
                If you have questions about these terms, please contact us at:
              </p>
              <p className="mb-4">
                <strong>Email:</strong> <a href="mailto:contact@winthenight.org" className="text-blue-400 hover:text-blue-300">contact@winthenight.org</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;