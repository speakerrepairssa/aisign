import Link from "next/link";
import { FileText, PenTool, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <PenTool className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">AiSign</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
              Sign Documents
              <span className="block text-primary-600">Anywhere, Anytime</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              The easiest way to send, sign, and manage documents online. 
              Secure, legally binding, and incredibly simple.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/signup"
                className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              Everything you need to sign documents
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful features to streamline your document workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-primary-600" />}
              title="Easy Document Upload"
              description="Drag and drop your PDFs or upload from your device. Support for multiple file formats."
            />
            <FeatureCard
              icon={<PenTool className="h-10 w-10 text-primary-600" />}
              title="Digital Signatures"
              description="Create and apply legally binding electronic signatures with ease."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary-600" />}
              title="Secure & Encrypted"
              description="Bank-level encryption ensures your documents are always secure and private."
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary-600" />}
              title="Real-time Updates"
              description="Get instant notifications when documents are viewed or signed."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who trust AiSign for their document signing needs.
          </p>
          <Link
            href="/signup"
            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all inline-block"
          >
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <PenTool className="h-6 w-6 text-primary-400" />
            <span className="ml-2 text-xl font-bold">AiSign</span>
          </div>
          <p className="text-gray-400">
            © 2025 AiSign. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
