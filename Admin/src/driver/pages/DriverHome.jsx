import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faWallet, faUser, faPlus, faGear, faHistory, faBell } from '@fortawesome/free-solid-svg-icons';
import Setting from '../../passenger/components/Setting';

/*
 * ملف DriverHome هو الصفحة الرئيسية للسائق ويعرض شريط علوي وواجهة تنقل سريعة.
 */
const DriverHome = () => {
  const [isSettingOpen, setIsSettingOpen] = React.useState(false);

  return (
    <div className='min-h-screen w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white relative'>
      <div className='text-white fixed top-0 left-0 right-0 flex justify-between p-4 items-center z-50'>
        <div className='relative z-20 flex-1 max-w-[75%]'>
          <button className='text-white bg-zinc-800 rounded-full h-14 w-14 max-w-full min-w-[3.5rem] flex items-center justify-start px-4 gap-4 overflow-hidden transition-all duration-500 ease-in-out hover:w-full group shadow-2xl hover:bg-blue-600'>
            <FontAwesomeIcon icon={faBell} className='shrink-0 text-xl' />

            <span className='whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-medium delay-100'>تم قبول كابتن أحمد لرحلتك!</span>
          </button>
        </div>

        <h1 className='absolute left-1/2 -translate-x-1/2 text-base font-medium z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0'>مرحبا بك عمرو</h1>

        <button className='text-white bg-zinc-800 rounded-full px-4 h-14 flex items-center justify-center gap-2 shadow-lg z-20 active:scale-95 transition-all shrink-0'>
          <FontAwesomeIcon icon={faWallet} className='text-green-400' />
          <span className='font-semibold'>$100</span>
        </button>
      </div>

      <div className='fixed -bottom-8 left-0 right-0 shadow-md flex justify-around items-center py-2 z-50'>
        <button onClick={() => setIsSettingOpen(true)} className={`text-white bg-zinc-800 rounded-full w-14 h-14 flex items-center justify-center ${isSettingOpen ? '-mb-12' : 'mb-0'} transition-all duration-700`}>
          <FontAwesomeIcon icon={faGear} />
        </button>
        <button className={`text-white bg-zinc-800 rounded-full w-14 h-14 flex items-center justify-center ${isSettingOpen ? '-mb-12' : 'mb-16'} transition-all duration-500`}>
          <FontAwesomeIcon icon={faHistory} />
        </button>
        <button className={`text-white bg-green-500 rounded-full w-14 h-14 flex items-center justify-center ${isSettingOpen ? '-mb-12' : 'mb-20'} transition-all duration-500`}>
          <FontAwesomeIcon icon={faPlus} />
        </button>
        <button className={`text-white bg-zinc-800 rounded-full w-14 h-14 flex items-center justify-center ${isSettingOpen ? '-mb-12' : 'mb-16'} transition-all duration-500`}>
          <FontAwesomeIcon icon={faBookmark} />
        </button>
        <button className={`text-white bg-zinc-800 rounded-full w-14 h-14 flex items-center justify-center ${isSettingOpen ? '-mb-12' : 'mb-0'} transition-all duration-700`}>
          <FontAwesomeIcon icon={faUser} />
        </button>
      </div>
      {isSettingOpen && <div onClick={() => setIsSettingOpen(false)} className='fixed inset-0 bg-black/10 backdrop-blur-sm z-40 transition-opacity duration-500 ease-in-out' />}
      <Setting isOpen={isSettingOpen} onClose={() => setIsSettingOpen(false)} />
    </div>
  );
};

export default DriverHome;
