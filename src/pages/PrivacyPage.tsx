import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
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
              Privacy Policy
            </CardTitle>
            <CardDescription style={{ color: 'hsl(210, 20%, 70%) !important' }}>
              Last updated: {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-6">
            <div style={{ color: 'hsl(210, 40%, 95%) !important' }}>
              <h2 className="text-xl font-semibold mb-3">Our Commitment to Your Privacy</h2>
              <p className="mb-4">
                At Noteily, we believe your personal information should remain personal. We are committed to protecting your privacy and being transparent about how we handle your data.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Data Collection</h2>
              <p className="mb-4">
                We collect only the minimum information necessary to provide our service:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Email address for account creation and authentication</li>
                <li>Notes and content you create within the app</li>
                <li>Basic usage analytics to improve our service</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3 mt-6">Data Use</h2>
              <p className="mb-4">
                We use your data solely to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide and maintain the Noteily service</li>
                <li>Sync your notes across devices</li>
                <li>Communicate important service updates</li>
                <li>Improve our app's functionality and user experience</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3 mt-6">What We Don't Do</h2>
              <p className="mb-4">
                We promise we will never:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Sell your data</strong> - Your information is not for sale, ever</li>
                <li><strong>Share your data</strong> - We don't share your personal information with third parties</li>
                <li><strong>Run ads</strong> - We will never display advertisements in our app</li>
                <li><strong>Read your notes</strong> - Your content is private and encrypted</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3 mt-6">Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your data, including encryption in transit and at rest.
              </p>

              <h2 className="text-xl font-semibold mb-3 mt-6">Your Rights</h2>
              <p className="mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your notes</li>
              </ul>

              <h2 className="text-xl font-semibold mb-3 mt-6">Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this privacy policy or your data, please contact us at:
              </p>
              <p className="mb-4">
                <strong>Email:</strong> <a href="mailto:help@noteily.app" className="text-blue-400 hover:text-blue-300">help@noteily.app</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPage;