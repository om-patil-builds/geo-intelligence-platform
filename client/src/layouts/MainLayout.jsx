import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';


const MainLayout = () => {
  const location = useLocation();
  const isFullWidthPage = ['/', '/faq', '/pricing'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${isFullWidthPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
