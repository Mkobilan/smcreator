import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Make API request
        const { data } = await axios.get('/api/contact');

        console.log('Contact messages received:', data);
        setMessages(data.messages || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching contact messages:', err);
        setError('Failed to load contact messages. Please try again later.');
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const updateMessageStatus = async (id, status) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/contact/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Update local state
      setMessages(messages.map(msg =>
        msg.id === id ? { ...msg, status } : msg
      ));

      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (err) {
      console.error('Error updating message status:', err);
      alert('Failed to update message status. Please try again.');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-yellow-100 text-yellow-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="loader"></div></div>;

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Messages</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          View and manage customer inquiries
        </p>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Message List */}
        <div className="w-full md:w-1/3 border-r border-gray-200">
          <div className="overflow-y-auto max-h-[600px]">
            {messages.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No messages found</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedMessage?.id === message.id ? 'bg-gray-50' : ''
                      }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium text-gray-900 truncate">{message.name}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(message.status)}`}>
                        {message.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{message.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(message.createdAt), 'MMM d, yyyy')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="w-full md:w-2/3 p-4">
          {selectedMessage ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-medium">{selectedMessage.subject}</h4>
                  <p className="text-sm text-gray-500">
                    From: {selectedMessage.name} ({selectedMessage.email})
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(selectedMessage.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                    className={`px-3 py-1 text-xs rounded-full ${selectedMessage.status === 'read'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-yellow-100 hover:text-yellow-800'
                      }`}
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'replied')}
                    className={`px-3 py-1 text-xs rounded-full ${selectedMessage.status === 'replied'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-green-100 hover:text-green-800'
                      }`}
                  >
                    Mark as Replied
                  </button>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="mt-4">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactMessages;
