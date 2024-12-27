import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ReservaForm from './components/ReservaForm';
import AdminPanel from './components/AdminPanel';

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <ReservaForm />,
    },
    {
      path: "/admin",
      element: <AdminPanel />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

function App() {
  return (
    <RouterProvider router={router}>
      <div className="min-h-screen bg-[#292828] p-6">
        <div className="max-w-4xl mx-auto bg-[#e1e1e1] p-6 rounded-lg shadow-md">
          <h1 className="text-4xl font-bold mb-6 text-center">AMAU - Desayunos</h1>
        </div>
      </div>
    </RouterProvider>
  );
}

export default App;