import { IoMailOutline } from "react-icons/io5";
import { RiLockPasswordLine } from "react-icons/ri";
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { MdOutlineLightMode, MdOutlineNightlight } from "react-icons/md";
import { ThemeContext } from "../context/ThemeContext";
import { motion } from 'framer-motion';
import axios from 'axios';
import '../App.css'
import getBrowserInfo from "../methods/GetDeviceInformation";
import baseUrl from "../methods/BaseUrl";

const LoginScreen = () => {

     const Navigate = useNavigate();

     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [showPassword, setShowPassword] = useState(false);

     const [err, setErr] = useState(false);
     const [serverResponse, setServerResponse] = useState('');

     const { theme, toggleTheme } = useContext(ThemeContext);


     const togglePasswordVisibility = () => {
          setShowPassword(!showPassword);
     };

     const fetchDeviceInfo = async (uuid) => {
          const info = await getBrowserInfo(uuid);
          await axios.post(baseUrl(`/api/v1/sessions/store-device-information`), { userId: info.userId, data: info });
     }

     const handleSubmit = async (e) => {

          e.preventDefault();

          try {

               const response = await axios.post('http://localhost:5000/api/v1/auth/login',
                    { email, password },
                    { withCredentials: true });

               if (response.data.status === '2FA') {
                    setServerResponse(response.data.error || "2FA required.");
                    setTimeout(() => {
                         localStorage.setItem('uuid', response.data.uuid);
                         Navigate('/auth/2fa-verification', {
                              state: {
                                   uuid: response.data.uuid,
                                   email: response.data.email,
                              }
                         });
                    }, 2000);
               }

               else if (response.data.status === 'error') {
                    setErr(true);
                    setServerResponse(response.data.error || "An error occurred.");
               }

               else if (response.data.status === 200) {
                    setErr(false);
                    fetchDeviceInfo(response.data.uuid);
                    setServerResponse(response.data.response || "Login successful.");
                    setTimeout(() => {
                         Navigate('/chats');
                    }, 1000);
               }

               else if (response.data.status === 307) {
                    Navigate(`/user/auth/verify/${response.data.uuid}/${response.data.email}`);
               }

               else {
                    setServerResponse(response.data);
               }

          } catch (error) {
               setErr(true);
               setServerResponse("Internal Server Error...!");
          }
     }

     return (
          <>
               <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#212121]'} h-screen flex justify-center items-center`}>

                    <div onClick={toggleTheme} className={`fixed right-5 top-5 bg-[#2b2b2b] ${theme === 'light' ? 'bg-[#f6f6f6] hover:bg-gray-200' : 'bg-[#2b2b2b] hover:bg-[#1f1f1f]'} p-2 rounded-full cursor-pointer  transition-all duration-300 ease-in-out`}>
                         {theme === 'light' ? <MdOutlineNightlight className='text-[#2b2b2b] text-2xl' /> : <MdOutlineLightMode className='text-white text-2xl' />}
                    </div>

                    {
                         serverResponse && (
                              <motion.div
                                   initial={{ opacity: 0, scale: 0.95 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   className="fixed right-5 bottom-5 text-gray-500 cursor-pointer">
                                   <span className={`${theme == 'light' ? 'text-gray-700 bg-[#f6f6f6] border border-[#e4e4e4]' : 'text-white bg-[#2b2b2b] '} px-3 py-2 SF-pro-regular text-sm rounded-md`} >
                                        {serverResponse}
                                   </span>
                              </motion.div>
                         )
                    }

                    <div className='flex flex-col items-center md:justify-start'>
                         <h1 className={`text-xl pt-3 pb-1 ${theme === 'light' ? 'text-[#121212]' : 'text-white'} w-3/5 SF-pro text-center`}>Access your chats instantly – log in with your email to reconnect with friends, resume real-time messaging, and share media. Secure, fast, and effortless – jump back into the conversation now!</h1>
                         <span className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-[13px] font-medium SF-pro- mt-10`}>Please Enter your Valid Email & Password</span>
                         <div style={{ width: "350px" }}>
                              <div id="input" className={`mt-4 relative flex flex-col items-end px-1 py-3 rounded-lg ${theme === 'light' ? 'text-[#121212] border border-[#e4e4e4]' : 'text-white bg-[#2b2b2b]'}  ${err ? 'border-red-500' : 'border-gray-300'} outline-none appearance-none`}>
                                   <input type="email" onChange={(e) => { setEmail(e.target.value) }} className={`w-5/6 SF-pro-regular font-medium outline-none border-none bg-transparent ${theme === 'light' ? 'text-gray-700 placeholder:text-gray-600' : null} `} placeholder='Email Address' />
                                   <IoMailOutline className={`w-5 h-5 font-medium absolute left-5 top-[14px] ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'} `} />
                              </div>
                              <div id="input" className={`mt-2 relative flex flex-col items-end px-1 py-3 rounded-lg ${theme === 'light' ? 'text-[#121212] border border-[#e4e4e4]' : 'text-white bg-[#2b2b2b]'}   ${err ? 'border-red-500' : 'border-gray-300'} outline-none appearance-none`}>
                                   <input type={showPassword ? "text" : "password"} onChange={(e) => { setPassword(e.target.value) }} className={`${theme === 'light' ? 'text-gray-700 placeholder:text-gray-600' : null} SF-pro-regular font-medium w-5/6 outline-none border-none bg-transparent`} placeholder='Password' />
                                   <RiLockPasswordLine className={`w-5 h-5 font-medium absolute left-5 top-[14px] ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'}`} />
                                   <span
                                        onClick={togglePasswordVisibility}
                                        style={{
                                             position: 'absolute',
                                             right: '17px',
                                             top: '50%',
                                             transform: 'translateY(-50%)',
                                             cursor: 'pointer'
                                        }}
                                   >
                                        {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                                   </span>
                              </div>

                              <div className='grid pt-3'>
                                   <button onClick={handleSubmit} className={`${theme === 'light' ? 'bg-[#121212] text-white' : 'bg-white text-black '} py-3 rounded-lg font-medium text-md`}>Next</button>
                              </div>

                              <div className="pt-4">
                                   <span className={`${theme === 'light' ? 'text-slate-700' : 'text-slate-400'} text-sm font-medium SF-pro-regular`}>
                                        Don't have an account ? <Link to='/user/auth/register'> <span className={`${theme === 'light' ? 'text-[#121212]' : 'text-white'} underline font-medium`}>Register Now</span> </Link>
                                   </span>
                              </div>

                         </div>
                    </div>
               </div>
          </>
     );

}

export default LoginScreen;
