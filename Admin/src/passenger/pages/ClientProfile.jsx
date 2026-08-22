import React, { useState } from 'react'
import Wallet from '../components/Wallet'
import { FontAwesome} from '@fortawesome/react-fontawesome'
import { faPen, faHome, faEnvelope, faPhone, faLocationDot, faTriangleExclamation, faComments, faGear } from '@fortawesome/free-solid-svg-icons'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ProfileSections from '../components/ProfileSections'
import Setting from '../components/Setting' 

/*
 * ملف ClientProfile يعرض ملف العميل الشخصي، بياناته الأساسية، وأقسام
 * التقييمات والبلاغات والمفضلة.
 */
const ClientProfile = () => {
	const navigate = useNavigate()
	const client = useSelector((state) => state.auth || {})
	const [selectedSection, setSelectedSection] = useState('reports')
	const [isSettingOpen, setIsSettingOpen] = useState(false) 

	return (
		<div className='min-h-screen w-full bg-gradient-to-b from-gray-800 to-gray-900 text-white relative flex flex-col p-4 pt-24 pb-28 select-none' dir="rtl">
  
			<header className='fixed top-0 left-0 right-0 p-4 z-40 text-xs flex items-center justify-between bg-gray-800/80 backdrop-blur-md'>
				<Wallet />
				
				<button 
					onClick={() => setIsSettingOpen(true)} 
					className='text-white bg-zinc-800 rounded-full h-14 w-14 flex items-center justify-center shadow-lg active:scale-95 transition-all'
				>
					<FontAwesomeicon={faGear} className='text-zinc-400 text-lg hover:text-white transition-colors' />
				</button>
			</header>

			<div className='w-full rounded-3xl bg-zinc-800 p-4 flex flex-col items-center gap-4 shrink-0 shadow-md mt-2'>
				<div className='relative'>
					<img className='w-24 h-24 rounded-full border-2 border-zinc-700 object-cover' src={client.avatar} alt="avatar" />
					<button onClick={() => navigate('/profile/edit')} className='absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-xs shadow-md active:scale-95 transition-all'>
						<FontAwesomeicon={faPen} className='text-white' />
					</button>
				</div>
				<span className='text-xl font-bold'>{client.name}</span>
				<span className='flex text-sm items-center gap-2 text-zinc-400'>{client.homeAddress} <FontAwesomeicon={faHome} /></span>
				<div className='flex flex-wrap justify-center items-center gap-4 border-t border-zinc-700/50 pt-3 w-full font-thin text-zinc-400'>
					<span className='flex text-xs items-center gap-2'> {client.phone} <FontAwesomeicon={faPhone} /></span>
					<span className='flex text-xs items-center gap-2'>{client.email} <FontAwesomeicon={faEnvelope} /> </span>
				</div>
			</div>

			<div className='w-full rounded-3xl bg-zinc-800 p-6 mt-4 flex-1 flex flex-col gap-6 shadow-md mb-4'>
				<div className='flex justify-around items-center gap-4 border-b border-zinc-700/50 pb-4 text-zinc-400 font-bold'>
					<button onClick={() => setSelectedSection('reports')} className={`flex flex-col items-center gap-1 flex-1 transition-colors ${selectedSection === 'reports' ? 'text-yellow-500' : 'hover:text-yellow-500'}`}><FontAwesomeicon={faTriangleExclamation} className='text-xl' /><span className='text-[10px] font-normal'>البلاغات</span></button>
					<div className='text-zinc-700 font-thin'>|</div>
					<button onClick={() => setSelectedSection('myTrips')} className={`flex flex-col items-center gap-1 flex-1 transition-colors ${selectedSection === 'myTrips' ? 'text-blue-500' : 'hover:text-blue-500'}`}><FontAwesomeicon={faLocationDot} className='text-xl' /><span className='text-[10px] font-normal'>تفاصيل رحلاتي</span></button>
					<div className='text-zinc-700 font-thin'>|</div>
					<button onClick={() => setSelectedSection('rates')} className={`flex flex-col items-center gap-1 flex-1 transition-colors ${selectedSection === 'rates' ? 'text-green-500' : 'hover:text-green-500'}`}><FontAwesomeicon={faComments} className='text-xl' /><span className='text-[10px] font-normal'>التقييمات</span></button>
				</div>

				<ProfileSections selectedSection={selectedSection} />
			</div>

			<Navigation />

			{isSettingOpen && (
				<div
					onClick={() => setIsSettingOpen(false)}
					className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'
				/>
			)}
			<Setting isOpen={isSettingOpen} onClose={() => setIsSettingOpen(false)} />
		</div>
	)
}

export default ClientProfile