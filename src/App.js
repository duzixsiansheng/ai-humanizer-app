import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Zap, 
  Shield, 
  Star,
  Check,
  Mail,
  Phone,
  MapPin,
  Upload,
  Download,
  Trash2,
  Eye,
  Copy,
  CheckCircle
} from 'lucide-react';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Advanced settings
  const [readabilityLevel, setReadabilityLevel] = useState('High School');
  const [purposeType, setPurposeType] = useState('General Writing');
  const [strengthLevel, setStrengthLevel] = useState('More Human');

  // Copy to clipboard function
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Download as text file
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([outputText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `humanized-text-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Character limits for different plans (API maximum is 15,000)
  const getCharacterLimit = (plan) => {
    switch (plan) {
      case 'Free': return 5000;
      case 'Pro': return 15000; // API maximum
      case 'Business': return 15000; // API maximum  
      default: return 1000; // For non-logged-in users
    }
  };

  const characterLimit = user ? getCharacterLimit(user.plan) : 1000;

  // Mock user data
  const mockUser = {
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'Pro',
    creditsUsed: 1250,
    creditsTotal: 5000,
    projects: [
      { id: 1, name: 'Academic Paper Rewrite', date: '2025-05-20', content: 'The research methodology demonstrates significant...', credits: 150 },
      { id: 2, name: 'Blog Article Optimization', date: '2025-05-19', content: 'In today\'s digital world, content creation has become...', credits: 89 },
      { id: 3, name: 'Business Proposal', date: '2025-05-18', content: 'Our company proposes an innovative solution...', credits: 200 }
    ]
  };

  const plans = [
    {
      name: 'Free',
      price: 0,
      credits: 1000,
      characterLimit: 5000,
      features: ['1,000 credits/month', '5,000 character limit', 'Basic rewriting', 'Standard speed', 'Email support']
    },
    {
      name: 'Pro',
      price: 19,
      credits: 5000,
      characterLimit: 15000,
      features: ['5,000 credits/month', '15,000 character limit', 'Advanced AI algorithms', 'Priority processing', '24/7 support', 'Bulk processing']
    },
    {
      name: 'Business',
      price: 49,
      credits: 15000,
      characterLimit: 15000,
      features: ['15,000 credits/month', '15,000 character limit', 'Enterprise API', 'Custom models', 'Dedicated manager', 'Bulk processing', 'API access']
    }
  ];

  const handleLogin = (email, password) => {
    // Mock login logic
    setIsLoggedIn(true);
    setUser(mockUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('home');
  };

  const handleRewrite = async () => {
    if (!inputText.trim()) return;
    
    // Check minimum character requirement
    if (inputText.length < 50) {
      alert('Text must be at least 50 characters long for processing.');
      return;
    }

    // Check maximum character limit (API limit is 15,000)
    if (inputText.length > 15000) {
      alert('Text exceeds the maximum limit of 15,000 characters. Please reduce the text length.');
      return;
    }
    
    // Check character limit for user plan
    if (inputText.length > characterLimit) {
      alert(`Text exceeds the ${characterLimit} character limit for your plan. Please upgrade or reduce the text length.`);
      return;
    }

    // Check if user has enough credits
    if (user) {
      const creditsNeeded = Math.floor(inputText.length / 10);
      const creditsRemaining = user.creditsTotal - user.creditsUsed;
      
      if (creditsNeeded > creditsRemaining) {
        alert(`Insufficient credits. You need ${creditsNeeded} credits but only have ${creditsRemaining} remaining. Please upgrade your plan.`);
        return;
      }
    }
    
    setIsProcessing(true);
    setProcessingProgress(10);
    
    try {
      // Step 1: Submit document for humanization
      const submitResponse = await fetch('https://humanize.undetectable.ai/submit', {
        method: 'POST',
        headers: {
          'apikey': 'dd410c04-f157-4f4c-9e41-b7d125f2b339',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputText,
          readability: readabilityLevel,
          purpose: purposeType,
          strength: strengthLevel,
          model: "v11" // Using the latest model
        }),
      });

      setProcessingProgress(30);

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        if (submitResponse.status === 402) {
          throw new Error('Insufficient credits in your account. Please upgrade your plan.');
        }
        throw new Error(`API Error: ${submitResponse.status} - ${errorData.error || submitResponse.statusText}`);
      }

      const submitData = await submitResponse.json();
      const documentId = submitData.id;

      setProcessingProgress(50);

      // Step 2: Poll for completion (check every 3 seconds)
      let attempts = 0;
      const maxAttempts = 40; // Maximum 2 minutes waiting time
      
      const pollForCompletion = async () => {
        attempts++;
        setProcessingProgress(50 + (attempts / maxAttempts) * 40);

        try {
          const retrieveResponse = await fetch('https://humanize.undetectable.ai/document', {
            method: 'POST',
            headers: {
              'apikey': 'dd410c04-f157-4f4c-9e41-b7d125f2b339',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: documentId
            }),
          });

          if (!retrieveResponse.ok) {
            throw new Error(`Retrieval Error: ${retrieveResponse.status} ${retrieveResponse.statusText}`);
          }

          const retrieveData = await retrieveResponse.json();

          // Check if processing is complete
          if (retrieveData.output && retrieveData.output.trim()) {
            setProcessingProgress(100);
            setOutputText(retrieveData.output);
            
            // Update user credits and save to project history
            if (user) {
              const creditsUsed = Math.floor(inputText.length / 10);
              const newProject = {
                id: Date.now(),
                name: `Text Humanization ${new Date().toLocaleDateString()}`,
                date: new Date().toISOString().split('T')[0],
                content: retrieveData.output.substring(0, 100) + '...',
                originalContent: inputText,
                humanizedContent: retrieveData.output,
                credits: creditsUsed,
                readability: retrieveData.readability || 'High School',
                purpose: retrieveData.purpose || 'General Writing'
              };
              
              setUser(prev => ({
                ...prev,
                creditsUsed: prev.creditsUsed + creditsUsed,
                projects: [newProject, ...prev.projects]
              }));
            }
            return;
          }

          // Continue polling if not ready
          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, 3000); // Wait 3 seconds before next attempt
          } else {
            throw new Error('Processing timeout. Please try again with shorter text.');
          }
        } catch (pollError) {
          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, 3000); // Retry on error
          } else {
            throw pollError;
          }
        }
      };

      // Start polling
      setTimeout(pollForCompletion, 3000);
      
    } catch (error) {
      console.error('API Error:', error);
      setProcessingProgress(0);
      
      // Show user-friendly error message
      let errorMessage = 'Sorry, there was an error processing your text. ';
      
      if (error.message.includes('Insufficient credits')) {
        errorMessage = error.message;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('401')) {
        errorMessage += 'API authentication failed. Please contact support.';
      } else if (error.message.includes('429')) {
        errorMessage += 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.message.includes('500')) {
        errorMessage += 'Server error. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Processing took too long. Please try again with shorter text.';
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.';
      }
      
      setOutputText(errorMessage);
      setIsProcessing(false);
    }
  };

  const Navigation = () => (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">HumanizeAI</span>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`${currentPage === 'home' ? 'text-blue-600' : 'text-gray-700'} hover:text-blue-600`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage('pricing')}
              className={`${currentPage === 'pricing' ? 'text-blue-600' : 'text-gray-700'} hover:text-blue-600`}
            >
              Pricing
            </button>
            <button 
              onClick={() => setCurrentPage('contact')}
              className={`${currentPage === 'contact' ? 'text-blue-600' : 'text-gray-700'} hover:text-blue-600`}
            >
              Contact
            </button>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className={`${currentPage === 'dashboard' ? 'text-blue-600' : 'text-gray-700'} hover:text-blue-600`}
                >
                  Dashboard
                </button>
                <div className="text-sm text-gray-600">
                  Credits: {user?.creditsTotal - user?.creditsUsed}/{user?.creditsTotal}
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentPage('login')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button 
                onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-gray-700"
              >
                Home
              </button>
              <button 
                onClick={() => { setCurrentPage('pricing'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-gray-700"
              >
                Pricing
              </button>
              <button 
                onClick={() => { setCurrentPage('contact'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-gray-700"
              >
                Contact
              </button>
              {isLoggedIn ? (
                <>
                  <button 
                    onClick={() => { setCurrentPage('dashboard'); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-gray-700"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setCurrentPage('login'); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Make AI Text More <span className="text-blue-600">Human</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Transform AI-generated content into natural, engaging human writing with our advanced AI humanizer
          </p>
        </div>

        {/* Rewriter Tool */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">AI Text Humanizer Tool</h2>
          
          {/* Advanced Settings Toggle */}
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showAdvancedSettings ? '← Hide Advanced Settings' : 'Advanced Settings →'}
            </button>
          </div>

          {/* Advanced Settings Panel */}
          {showAdvancedSettings && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customization Options</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Readability Level
                  </label>
                  <select 
                    value={readabilityLevel}
                    onChange={(e) => setReadabilityLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="High School">High School</option>
                    <option value="University">University</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Journalist">Journalist</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Purpose
                  </label>
                  <select 
                    value={purposeType}
                    onChange={(e) => setPurposeType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="General Writing">General Writing</option>
                    <option value="Essay">Essay</option>
                    <option value="Article">Article</option>
                    <option value="Marketing Material">Marketing Material</option>
                    <option value="Story">Story</option>
                    <option value="Cover Letter">Cover Letter</option>
                    <option value="Report">Report</option>
                    <option value="Business Material">Business Material</option>
                    <option value="Legal Material">Legal Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Humanization Strength
                  </label>
                  <select 
                    value={strengthLevel}
                    onChange={(e) => setStrengthLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Quality">Quality (Conservative)</option>
                    <option value="Balanced">Balanced</option>
                    <option value="More Human">More Human (Aggressive)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Tip:</strong> Higher readability levels are better for academic content, while "More Human" strength provides maximum AI detection bypass.</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Text
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your AI-generated text here to humanize it..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={characterLimit}
              />
              <div className="mt-2 flex justify-between text-sm">
                <span className={`${inputText.length > characterLimit * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
                  Characters: {inputText.length.toLocaleString()} / {characterLimit.toLocaleString()}
                </span>
                <span className="text-gray-500">
                  Est. credits: {Math.floor(inputText.length / 10)}
                </span>
              </div>
              {inputText.length > characterLimit && (
                <div className="mt-2 text-sm text-red-500">
                  ⚠️ Text exceeds character limit. Please upgrade your plan or reduce text length.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Humanized Text
              </label>
              <textarea
                value={outputText}
                readOnly
                placeholder="Your humanized text will appear here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none bg-gray-50"
              />
              {outputText && (
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Output length: {outputText.length.toLocaleString()} characters
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleCopy}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="text-green-600 hover:text-green-800 text-sm flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 text-center">
            {isProcessing && (
              <div className="mb-4">
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600">
                  Processing your text... {Math.round(processingProgress)}%
                </div>
              </div>
            )}
            <button
              onClick={handleRewrite}
              disabled={!inputText.trim() || isProcessing || inputText.length > characterLimit}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Humanizing...' : 'Humanize Text'}
            </button>
            {!user && (
              <div className="mt-3 text-sm text-gray-500">
                <a href="#" onClick={() => setCurrentPage('login')} className="text-blue-600 hover:text-blue-800">
                  Sign in
                </a> to access higher character limits and save your work
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">High Quality Output</h3>
            <p className="text-gray-600">Advanced AI ensures natural, fluent text that reads like human writing</p>
          </div>
          <div className="text-center p-6">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Process your text in seconds and boost your productivity</p>
          </div>
          <div className="text-center p-6">
            <Star className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multiple Modes</h3>
            <p className="text-gray-600">Perfect for academic, business, creative, and casual writing</p>
          </div>
        </div>

        {/* Additional Marketing Sections */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose HumanizeAI?</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Bypass AI Detection</h3>
              <p className="text-gray-600 mb-6">
                Our advanced algorithms rewrite AI-generated content to make it undetectable by AI detection tools, 
                ensuring your content passes all AI checkers while maintaining quality and meaning.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Works with ChatGPT, GPT-4, Claude, and more</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Maintains original context and meaning</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Professional-grade quality</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600 mb-4">Success Rate</div>
              <div className="text-sm text-gray-500">
                Our AI humanizer successfully transforms AI text to pass detection tools in 99.9% of cases
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "HumanizeAI saved my academic career. My papers now pass all AI detection tools while maintaining quality."
              </p>
              <div className="font-semibold text-gray-900">Sarah Chen</div>
              <div className="text-sm text-gray-500">PhD Student</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "As a content creator, this tool is invaluable. It makes my AI-assisted writing sound completely natural."
              </p>
              <div className="font-semibold text-gray-900">Mike Rodriguez</div>
              <div className="text-sm text-gray-500">Content Creator</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The business plan feature helped our startup create professional documents that impressed investors."
              </p>
              <div className="font-semibold text-gray-900">Lisa Park</div>
              <div className="text-sm text-gray-500">Startup Founder</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PricingPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Flexible pricing for every need</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`bg-white rounded-2xl shadow-lg p-8 ${plan.name === 'Pro' ? 'ring-2 ring-blue-600 transform scale-105' : ''}`}>
              {plan.name === 'Pro' && (
                <div className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                ${plan.price}
                <span className="text-lg font-normal text-gray-600">/month</span>
              </div>
              <p className="text-gray-600 mb-6">{plan.credits.toLocaleString()} credits/month</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => setCurrentPage('payment')}
                className={`w-full py-3 px-4 rounded-lg font-semibold ${
                  plan.name === 'Pro' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What are credits?</h3>
              <p className="text-gray-600 mb-4">
                Credits are used to process your text. Approximately 10 characters = 1 credit. 
                A 1000-word document typically uses around 500-600 credits.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I upgrade or downgrade?</h3>
              <p className="text-gray-600 mb-4">
                Yes! You can change your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do credits roll over?</h3>
              <p className="text-gray-600 mb-4">
                Unused credits expire at the end of each billing cycle. We recommend choosing a plan that fits your monthly usage.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 mb-4">
                Yes! Our Free plan gives you 1,000 credits per month to try our service with no commitment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      handleLogin(email, password);
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-2">Welcome back! Please sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account? 
              <button className="text-blue-600 hover:text-blue-800 font-semibold ml-1">
                Sign up now
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const PaymentPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Complete Your Payment</h2>
          
          <div className="border rounded-xl p-6 mb-8 bg-blue-50">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro Plan</h3>
            <p className="text-gray-600 mb-4">5,000 credits/month, Advanced AI algorithms</p>
            <div className="text-3xl font-bold text-blue-600">$19/month</div>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123"
                />
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 font-semibold text-lg"
            >
              Complete Payment - $19
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <Shield className="h-4 w-4" />
              <span>256-bit SSL encryption</span>
            </div>
            <p>Your payment information is secure and encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );

  const ContactPage = () => (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">Have questions or feedback? We'd love to hear from you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-blue-600 mt-1 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">support@humanizeai.com</p>
                  <p className="text-sm text-gray-500 mt-1">We'll respond within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-6 w-6 text-blue-600 mt-1 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-sm text-gray-500 mt-1">Monday - Friday, 9AM - 6PM EST</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-6 w-6 text-blue-600 mt-1 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <p className="text-gray-600">
                    123 AI Innovation Drive<br />
                    San Francisco, CA 94105<br />
                    United States
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">Enterprise Solutions</h3>
              <p className="text-gray-600 text-sm mb-3">
                Looking for custom AI humanization solutions for your business?
              </p>
              <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                Contact our enterprise team →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Billing Question</option>
                  <option>Feature Request</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Common Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How accurate is the AI humanizer?</h3>
              <p className="text-gray-600 mb-4">
                Our AI humanizer has a 99.9% success rate in making AI text undetectable while maintaining quality and meaning.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What file formats do you support?</h3>
              <p className="text-gray-600 mb-4">
                We support plain text, Word documents (.docx), PDFs, and direct text input through our web interface.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-gray-600 mb-4">
                Yes, we use enterprise-grade security. Your text is processed securely and never stored permanently on our servers.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer API access?</h3>
              <p className="text-gray-600 mb-4">
                Yes! Our Business plan includes API access for seamless integration with your existing workflows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardPage = () => {
    const [selectedProject, setSelectedProject] = useState(null);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}</h1>
            <p className="text-gray-600">Manage your projects and track your usage</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Plan</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.plan}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Credits Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(user?.creditsTotal - user?.creditsUsed).toLocaleString()}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Credits Used</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.creditsUsed.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.projects.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Usage Progress */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Credit Usage</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Used {user?.creditsUsed.toLocaleString()} of {user?.creditsTotal.toLocaleString()} credits
              </span>
              <span className="text-sm text-gray-600">
                {Math.round((user?.creditsUsed / user?.creditsTotal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(user?.creditsUsed / user?.creditsTotal) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <button 
              onClick={() => setCurrentPage('home')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
            >
              <Zap className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Humanize Text</h3>
              <p className="text-gray-600 text-sm">Transform AI text to human-like content</p>
            </button>
            <button 
              onClick={() => setCurrentPage('pricing')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
            >
              <CreditCard className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade Plan</h3>
              <p className="text-gray-600 text-sm">Get more credits and advanced features</p>
            </button>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Settings className="h-8 w-8 text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Settings</h3>
              <p className="text-gray-600 text-sm">Manage your profile and preferences</p>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
              <button 
                onClick={() => setCurrentPage('home')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Project Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Credits Used</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {user?.projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{project.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {project.content}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{project.date}</td>
                      <td className="py-4 px-4 text-gray-600">{project.credits}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setSelectedProject(project)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Detail Modal */}
          {selectedProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{selectedProject.name}</h3>
                    <button 
                      onClick={() => setSelectedProject(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {selectedProject.date} | Credits Used: {selectedProject.credits}
                  </p>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedProject.content}</p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      Edit
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Reprocess
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'pricing':
        return <PricingPage />;
      case 'login':
        return <LoginPage />;
      case 'payment':
        return <PaymentPage />;
      case 'contact':
        return <ContactPage />;
      case 'dashboard':
        return isLoggedIn ? <DashboardPage /> : <LoginPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {renderCurrentPage()}
    </div>
  );
};

export default App;