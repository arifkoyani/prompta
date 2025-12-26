'use client';

import React, { useState, useRef, useEffect } from 'react';

// Simple SVG Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

interface Message {
  id: string;
  type: 'user' | 'bot';
  text?: string;
  image?: string;
  timestamp: Date;
}

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<string>('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate random 6-digit number for dataset (only once when modal opens)
  useEffect(() => {
    if (isModalOpen && !dataset) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setDataset(`prompta-${randomNum}`);
    }
  }, [isModalOpen, dataset]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      window.scrollTo({
        top: messagesEndRef.current.offsetTop,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Copy message to clipboard
  const handleCopyMessage = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        setError('Please upload only JPG or PNG images');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setImage(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert image to base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!message.trim() && !image) {
      setError('Please enter a message or upload an image');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: message.trim() || undefined,
      image: imagePreview || undefined,
      timestamp: new Date(),
    };

    // Add user message to chat immediately
    setMessages((prev) => [...prev, userMessage]);

    // Clear input immediately after sending
    setMessage('');
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Prepare payload
      const payload: any = { dataset };
      
      if (message.trim()) {
        payload.message = message.trim();
      }

      if (image) {
        const base64Image = await convertImageToBase64(image);
        payload.image = base64Image;
      }

      // Send to API route
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send data: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Log response for debugging
      console.log('API Response:', JSON.stringify(data, null, 2));

      let botMessageText = '';

      // Handle response format: [{ "success": "true", "prompta": "string" }]
      if (Array.isArray(data) && data.length > 0) {
        // Get the first message from the array
        const responseMessage = data[0];
        if (responseMessage) {
          // Check for prompta field first (new format)
          if (responseMessage.prompta) {
            botMessageText = responseMessage.prompta;
          } else if (responseMessage.message) {
            botMessageText = responseMessage.message;
          } else {
            // Try to find message or prompta in any object in the array
            const messageObj = data.find((item: any) => item && (item.message || item.prompta));
            if (messageObj) {
              botMessageText = messageObj.prompta || messageObj.message;
            } else {
              throw new Error('Response array does not contain a valid message or prompta object');
            }
          }
        } else {
          throw new Error('Response array is empty');
        }
      } else if (data && typeof data === 'object') {
        // Handle various object formats
        if (data.prompta) {
          // Handle prompta format: { "prompta": "string" }
          botMessageText = data.prompta;
        } else if (data.message) {
          botMessageText = data.message;
        } else if (data.text) {
          botMessageText = data.text;
        } else if (Object.keys(data).length === 0) {
          // Empty object - webhook might be processing
          botMessageText = 'Request received. Waiting for response...';
        } else {
          // Try to stringify the object as a fallback
          botMessageText = JSON.stringify(data);
        }
      } else if (typeof data === 'string') {
        botMessageText = data;
      } else {
        console.error('Unexpected response format:', data);
        botMessageText = 'Received response but format is unexpected. Check console for details.';
      }

      // Add bot message to chat
      if (botMessageText) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          text: botMessageText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('No message content found in response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
      
      // Remove the user message if there was an error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMessage('');
    setImage(null);
    setImagePreview(null);
    setError(null);
    setMessages([]);
    setDataset('');
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 bg-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 bg-black">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600 mb-8">Create a new session to get started</p>

          {!isModalOpen ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 "
            >
              <PlusIcon />
              Create New Session
            </button>
          ) : (
            <div className="flex items-center justify-between bg-transparent">
              <div className="bg-transparent">
                <h2 className="text-2xl font-bold text-gray-800">New Session</h2>
                <p className="text-sm text-gray-600">Dataset: {dataset}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={isLoading}
              >
                <XIcon className="w-5 h-5" />
                Close Session
              </button>
            </div>
          )}
        </div>

        {/* Chat Interface - Shown when session is active */}
        {isModalOpen && (
          <div className="bg-transparent rounded-2xl flex flex-col">
            {/* Chat Messages Container */}
            <div className="p-6 space-y-4 bg-transparent min-h-[500px]">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-transparent">
                  <p className="text-lg">Start a conversation</p>
                  <p className="text-sm mt-2">Send a message or upload an image to begin</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 relative group ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-transparent text-gray-900 border border-gray-200'
                      }`}
                    >
                      {msg.image && (
                        <div className="mb-2">
                          <img
                            src={msg.image}
                            alt="Uploaded"
                            className="max-w-full h-auto rounded-lg max-h-48"
                          />
                        </div>
                      )}
                      {msg.text && (
                        <div className="flex items-start gap-2">
                          <p className="whitespace-pre-wrap break-words flex-1">{msg.text}</p>
                          {msg.type === 'bot' && (
                            <button
                              onClick={() => handleCopyMessage(msg.text || '', msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                              title="Copy message"
                            >
                              {copiedMessageId === msg.id ? (
                                <CheckIcon />
                              ) : (
                                <CopyIcon />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-transparent border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="ml-2 text-gray-500 text-sm">Waiting for response...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-6 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Input Area - Sticky */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-transparent p-4 backdrop-blur-sm bg-opacity-90">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-xs h-32 object-contain border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  {/* Image Upload Button */}
                  <label className="flex items-center justify-center px-4 py-3 border-2 border-gray-400 rounded-lg hover:bg-gray-100 hover:border-gray-500 cursor-pointer transition-colors h-[60px] bg-white min-w-[60px] shadow-sm">
                    <UploadIcon />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>

                  {/* Text Input */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 bg-white min-h-[60px]"
                    disabled={isLoading}
                    style={{ color: '#111827' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isLoading || (!message.trim() && !image)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-[60px]"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <SendIcon />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
