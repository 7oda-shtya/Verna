import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Sign from './passenger/pages/Sign';
import ClientSignIn from './passenger/pages/ClientSignIn';
import ClientSignUp from './passenger/pages/ClientSignUp';
import DriverSignIn from './driver/pages/DriverSignIn';
import DriverSignUp from './driver/pages/DriverSignUp';
import ClientHome from './passenger/pages/ClientHome';
import ClientProfile from './passenger/pages/ClientProfile';
import Favorites from './passenger/pages/ClientFavorites';
import History from './passenger/pages/ClientHistory';
import RequestTrip from './passenger/pages/RequestTrip';
import EditProfile from './passenger/pages/ClientEditProfile';
import 'leaflet/dist/leaflet.css';

// ScrollToTop يراقب pathname القادم من react-router ويعيد التمرير لأعلى عند تغيير الصفحة.
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// App هو الجذر الرئيسي للتطبيق ويجمع كل routes العامة الخاصة بالعميل والسائق.
function App() {
  return (
    <div className='main-app min-h-screen w-full bg-client-app text-white relative'>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<ClientHome />} />
        <Route path='/profile' element={<ClientProfile />} />
        <Route path='/profile/edit' element={<EditProfile />} />
        <Route path='/request-trip' element={<RequestTrip />} />
        <Route path='/bookmarks' element={<Favorites />} />
        <Route path='/history' element={<History />} />
        <Route path='/sign' element={<Sign />} />
        <Route path='/client/sign-in' element={<ClientSignIn />} />
        <Route path='/client/sign-up' element={<ClientSignUp />} />
        <Route path='/driver/sign-in' element={<DriverSignIn />} />
        <Route path='/driver/sign-up' element={<DriverSignUp />} />
      </Routes>
    </div>
  );
}

export default App;
