// 'use client';

// import React, { useState } from 'react';
// import Button from '../../components/ui/Button';

// export default function PromptForm() {
//   const [prompt, setPrompt] = useState('');

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // Handle form submission
//     console.log('Prompt submitted:', prompt);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label htmlFor="prompt" className="block text-sm font-medium mb-2">
//           Enter your prompt:
//         </label>
//         <textarea
//           id="prompt"
//           value={prompt}
//           onChange={(e) => setPrompt(e.target.value)}
//           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           rows={4}
//           placeholder="Type your prompta here..."
//         />
//       </div>
//       <Button type="submit" variant="primary">
//         Submit
//       </Button>
//     </form>
//   );
// }

