import React, { useState } from 'react';
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

function App() {
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
    setIsLoggedIn(true);
    setUser(mockUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('home');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([outputText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `humanized-text-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRewrite = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to humanize.');
      return;
    }

    if (inputText.length > 15000) {
      alert('Text exceeds the maximum limit of 15,000 characters. Please reduce the text length.');
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(10);
    
    try {
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
          model: "v11"
        }),
      });

      setProcessingProgress(30);

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json().catch(() => ({}));
        if (submitResponse.status === 402) {
          throw new Error('Insufficient credits in your account. Please upgrade your plan.');
        }
        throw new Error(`API Error: ${submitResponse.status} - ${errorData.error || submitResponse.statusText}`);
      }

      const submitData = await submitResponse.json();
      const documentId = submitData.id;

      setProcessingProgress(50);

      let attempts = 0;
      const maxAttempts = 40;
      
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

          if (retrieveData.output && retrieveData.output.trim()) {
            setProcessingProgress(100);
            setOutputText(retrieveData.output);
            
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
            setIsProcessing(false);
            return;
          }

          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, 3000);
          } else {
            throw new Error('Processing timeout. Please try again with shorter text.');
          }
        } catch (pollError) {
          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, 3000);
          } else {
            throw pollError;
          }
        }
      };

      setTimeout(pollForCompletion, 3000);
      
    } catch (error) {
      console.error('API Error:', error);
      setProcessingProgress(0);
      setIsProcessing(false);
      
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
    }
  };

  // 只在Home页面时渲染
  if (currentPage !== 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <Zap className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">HumanizeAI</span>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-8">
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="text-gray-700 hover:text-blue-600"
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
            </div>
          </div>
        </nav>
        
        {currentPage === 'pricing' && (
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
            </div>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-600 mt-2">Welcome back! Please sign in to your account</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleLogin('', ''); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 其他页面类似处理... */}
      </div>
    );
  }

  // Home页面 - 独立渲染
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Zap className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">HumanizeAI</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-blue-600"
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentPage('pricing')}
                className="text-gray-700 hover:text-blue-600"
              >
                Pricing
              </button>
              <button 
                onClick={() => setCurrentPage('contact')}
                className="text-gray-700 hover:text-blue-600"
              >
                Contact
              </button>
              
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setCurrentPage('dashboard')}
                    className="text-gray-700 hover:text-blue-600"
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
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Make AI Text More <span className="text-blue-600">Human</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Transform AI-generated content into natural, engaging human writing with our advanced AI humanizer
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">AI Text Humanizer Tool</h2>
            
            <div className="mb-6 text-center">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAdvancedSettings ? '← Hide Advanced Settings' : 'Advanced Settings →'}
              </button>
            </div>

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
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Text
                </label>
                <textarea
                  key="input-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your AI-generated text here to humanize it..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-2 text-sm text-gray-500">
                  Character limit: 15,000 characters maximum
                </div>
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
                disabled={!inputText.trim() || isProcessing}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Humanizing...' : 'Humanize Text'}
              </button>
              {!user && (
                <div className="mt-3 text-sm text-gray-500">
                  <button onClick={() => setCurrentPage('login')} className="text-blue-600 hover:text-blue-800">
                    Sign in
                  </button> to access higher character limits and save your work
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
    </div>
  );
}

export default App;