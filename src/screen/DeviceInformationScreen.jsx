import React, { useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { formatLastSeenSriLanka } from "../methods/FormatedDate";
import { MdOutlineEmail, MdOutlineLightMode, MdOutlineNightlight, MdRefresh } from "react-icons/md";

import axios from "axios";
import Cookie from 'js-cookie';

export default function DeviceInformationScreen() {

     const Navigate = useNavigate();
     const loggedUserId = React.useRef(null);
     const { theme, toggleTheme } = useContext(ThemeContext);

     const [sessionData, setSessionData] = React.useState(null);
     const [loading, setLoading] = React.useState(true);
     const [user, setUser] = React.useState(null);

     const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

     const fetchSessionData = async (user) => {
          await axios.post(`http://localhost:5000/api/v1/user/sessions`, { userId: user })
               .then(response => { setLoading(false); setSessionData(response.data.sessions) })
               .catch(error => { console.error('Error fetching session data:', error); setLoading(false); });
     }

     function checkAuthorization() {
          if (!Cookie.get('UUID')) Navigate('/?_#unauthorized_access');
          else loggedUserId.current = Cookie.get('UUID');
          return;
     }

     checkAuthorization();

     useEffect(() => {
          const fetch2FAStatus = async (user) => {
               await axios.post(`http://localhost:5000/api/v1/auth/2FA-status`, { userId: user })
                    .then(response => {
                         (response.data.status === 1) ? setTwoFactorEnabled(true) : setTwoFactorEnabled(false);
                    }).catch(error => { console.error('Error fetching 2FA status:', error); });
          };
          fetchSessionData(loggedUserId.current);
          fetch2FAStatus(loggedUserId.current);
          setUser(loggedUserId.current);

     }, []);

     const handle2FA = async (e) => {
          const checked = e.target.checked;
          setTwoFactorEnabled(checked);
          await axios.post(`http://localhost:5000/api/v1/auth/2FA-Handle`, { id: user, status: checked ? true : false });
     };


     if (loading) {
          return (
               <div className="text-[17px] h-screen flex flex-col justify-center items-center">
                    <span className={`${theme === "light" ? "light-loader" : "dark-loader"}`}></span>
                    <div className={` ${theme === 'light' ? 'text-gray-500' : 'text-white'}`}>Loading Device Informations.....</div>
               </div>
          );
     }

     return (

          <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#212121]'} h-screen`}>
               <div className="space-y-5 md:mx-10 lg:mx-20 sm:mx-10 xl:mx-40 px-5 pt-8">

                    <div onClick={toggleTheme} className={`fixed right-5 top-5 ${theme === 'light' ? 'border border-[#e4e4e4] hover:bg-[#f6f6f6]' : 'bg-[#2b2b2b] hover:bg-[#1f1f1f]'} p-2 rounded-full cursor-pointer  transition-all duration-300 ease-in-out`}>
                         {theme === 'light' ? <MdOutlineNightlight className='text-[#2b2b2b] text-2xl' /> : <MdOutlineLightMode className='text-white text-2xl' />}
                    </div>

                    <div onClick={(e) => {
                         e.preventDefault(); Navigate('/chats');
                    }} className='flex gap-2 items-center cursor-pointer'>
                         <IoArrowBackCircleOutline className={`text-2xl ${theme === 'light' ? 'text-black' : "text-white"} rounded-full w-5 h-5`} />
                         <span className={`text-sm SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}>Back</span>
                    </div>

                    <div>
                         <h3 className={`SF-pro-regular ${theme === 'light' ? 'text-gray-7800' : "text-white"}`}>Security & Authentication</h3>
                         <p className={`text-[14px] SF-pro-regular ${theme === 'light' ? 'text-gray-400' : "text-gray-400"} `}>
                              Our platform guarantees that your app is secured with measures in place.
                         </p>
                    </div>

                    <div>
                         <h3 className={`SF-pro-regular ${theme === 'light' ? 'text-gray-7800' : "text-white"}`}>Current Sessions</h3>
                         <p className={`text-[14px] SF-pro-regular ${theme === 'light' ? 'text-gray-400' : "text-gray-400"} `}>
                              keep up with your available sessions logged in from your account
                         </p>
                    </div>

                    <button
                         onClick={() => fetchSessionData(user)}
                         className={`flex justify-end px-3 py-2 text-[13px] gap-2 rounded-full ${theme === 'light' ? 'border border-[#e4e4e4] hover:text-black hover:bg-[#f6f6f6]' : 'bg-[#2b2b2b] hover:text-white text-gray-300'}  transition`}
                         title="Refresh sessions"
                         type="button"
                    >

                         <MdRefresh className={`text-xl ${theme === 'light' ? 'text-gray-700' : 'text-white'} transition-transform hover:rotate-90`} />
                         Refresh Sessions
                    </button>


                    {
                         sessionData && (
                              <>
                                   <div className={`border ${theme === 'light' ? 'border-gray-200' : 'border-[#383838]'} rounded-md md:w-[60%] w-[100%] `}>
                                        {
                                             sessionData && (
                                                  sessionData.map((session, index) => (
                                                       <div className={`flex justify-between items-cente p-4 ${sessionData.length > 1 && (theme === 'light' ? 'border-b border-[#e4e4e4] last:border-none' : 'border-b border-[#383838] last:border-none')}  `} key={index}>
                                                            <div>
                                                                 <p className={`${theme === 'light' ? 'bg-[#f6f6f6] text-gray-800' : 'bg-[#2b2b2b] text-gray-300'} rounded-md text-sm justify-center py-1 px-2 flex-nowrap inline-block items-center`}>IP - {session.IP_ADDRESS}</p>
                                                                 <p className={`${theme === 'light' ? 'text-black' : 'text-white'} text-lg mt-2`}>{session.BROWSER_NAME} ,<span className={`text-gray-500 text-sm`}> {session.BROWSER_VERSION}</span></p>
                                                                 <p className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm`}>{session.LOCATION}</p>
                                                            </div>
                                                            <div className={`flex flex-col items-end`}>
                                                                 <span className={`${theme === 'light' ? 'bg-[#f6f6f6] text-gray-700' : 'bg-[#2b2b2b] text-white'} inline-block py-1 px-2 text-[14px] uppercase rounded-md`}>{session.STATUS}</span>
                                                                 <p className={`text-sm ${theme === 'light' ? 'text-gray-800' : 'text-gray-400'} mt-2`}>Date Information - {formatLastSeenSriLanka(session.DATE)}</p>
                                                            </div>
                                                       </div>
                                                  ))
                                             )

                                        }
                                   </div>
                              </>

                         )

                    }

                    <div>
                         <h3 className={`SF-pro-regular ${theme === 'light' ? 'text-gray-7800' : "text-white"}`}>Two-factor authentication (2FA)</h3>
                         <p className={`text-[14px] SF-pro-regular ${theme === 'light' ? 'text-gray-400' : "text-gray-400"} `}>
                              keep your account secure by enabling 2FA from an authenticator
                         </p>
                    </div>

                    <div className="flex justify-between items-center md:w-[60%] w-[100%] ">

                         <div className="flex gap-2">
                              <div><MdOutlineEmail className={`text-3xl ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} pt-1`} /></div>
                              <div>
                                   <p className={`text-[15px] SF-pro-medium ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Text message (email)</p>
                                   <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-[14px] SF-pro-regular`}>Secure your One-Time password is a secure method for two-factor authentication</p>
                              </div>
                         </div>

                         <div>
                              <input
                                   type="checkbox"
                                   className="toggle border border-[#e4e4e4]"
                                   onChange={handle2FA}
                                   checked={twoFactorEnabled}
                              />
                         </div>
                    </div>
               </div>
          </div>

     );
}