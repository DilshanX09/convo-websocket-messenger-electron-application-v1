import axios from 'axios';
import { useContext, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { MdOutlineLightMode, MdOutlineNightlight } from 'react-icons/md';

const EmailVerificationScreen = () => {

     const Navigate = useNavigate();

     const { id, email } = useParams();
     const { theme, toggleTheme } = useContext(ThemeContext);

     const fieldsRef = useRef();

     const [state, setState] = useState({ code1: "", code2: "", code3: "", code4: "" });
     const [err, setErr] = useState(false);
     const [serverResponse, setServerResponse] = useState('')

     const inputFocus = (e) => {
          e.preventDefault();
          const elements = fieldsRef.current.children
          const dataIndex = +e.target.getAttribute("data-index")
          if ((e.key === "Delete" || e.key === "Backspace")) {
               const next = dataIndex - 1;
               if (next > -1) {
                    elements[next].focus()
               }
          } else {

               const next = dataIndex + 1
               if (next < elements.length && e.target.value !== " " && e.target.value !== "" && e.key.length === 1) {
                    elements[next].focus()
               }
          }
     }

     const handleChange = (e, codeNumber) => {
          const value = e.target.value
          setState({ ...state, [codeNumber]: value.slice(value.length - 1) })
     }

     const handleClick = async (e) => {
          e.preventDefault();
          const code = state.code1 + state.code2 + state.code3 + state.code4;

          try {
               const response = await axios.post('http://localhost:5000/api/v1/auth/verify-otp', {
                    uuid: id, code: code
               });

               console.log(response.data)

               if (response.data.status === 200) {
                    setErr(false)
                    setServerResponse('Your are Verified!')
                    Navigate('/user/auth/login');
               } else {
                    setErr(true);
                    setServerResponse(response.data.error);
               }
          } catch (Exception) {
               setServerResponse('Something went wrong, please try again later.');
          }
     }

     return (

          <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#212121]'} h-screen flex justify-center items-center`}>

               <div div onClick={toggleTheme} className={`fixed right-5 top-5 bg-[#2b2b2b] ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-[#2b2b2b] hover:bg-[#1f1f1f]'} p-2 rounded-full cursor-pointer  transition-all duration-300 ease-in-out`}>
                    {theme === 'light' ? <MdOutlineNightlight className='text-[#2b2b2b] text-2xl' /> : <MdOutlineLightMode className='text-white text-2xl' />}
               </div >

               <div className='flex flex-col items-center md:justify-start justify-center'>
                    <h1 className={`text-xl pt-3 pb-1 ${theme === 'light' ? 'text-black' : 'text-white'} SF-pro-medium`}>Verify Your Email Address to Complete Registration</h1>
                    <span className='text-gray-400 text-sm px-4 text-center w-[60%]'>"We've sent a verification code to your email address. Please check your inbox and enter the code below to verify your account and continue using the app"</span>
                    <p className={`${theme === 'light' ? 'text-black' : 'text-white'} pt-2`}>"Code sent to <span className='underline'>{email}</span>"</p>
                    <div style={{ width: "350px" }}>

                         <div className='my-5 flex justify-evenly'>
                              <div ref={fieldsRef} className="mt-2 flex items-center gap-x-4">
                                   <input type="text" data-index="0" placeholder="0" value={state.code1} className={`w-12 h-12  rounded-lg ${theme === 'light' ? 'text-black border border-[#e4e4e4]' : 'bg-[#2b2b2b] text-white '} ${err ? 'border-red-500' : 'border-gray-300'} ${err && 'focus:border-red-600'}  outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code1")}
                                        onKeyUp={inputFocus}
                                   />
                                   <input type="text" data-index="1" placeholder="0" value={state.code2} className={`w-12 h-12  rounded-lg ${theme === 'light' ? 'text-black  border border-[#e4e4e4]' : 'bg-[#2b2b2b] text-white '} ${err ? 'border-red-500' : 'border-gray-300'} ${err && 'focus:border-red-600'}  outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code2")}
                                        onKeyUp={inputFocus}
                                   />
                                   <input type="text" data-index="2" placeholder="0" value={state.code3} className={`w-12 h-12  rounded-lg ${theme === 'light' ? 'text-black  border border-[#e4e4e4]' : 'bg-[#2b2b2b] text-white '} ${err ? 'border-red-500' : 'border-gray-300'} ${err && 'focus:border-red-600'}  outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code3")}
                                        onKeyUp={inputFocus}
                                   />
                                   <input type="text" data-index="3" placeholder="0" value={state.code4} className={`w-12 h-12  rounded-lg ${theme === 'light' ? 'text-black border border-[#e4e4e4]' : 'bg-[#2b2b2b] text-white '} ${err ? 'border-red-500' : 'border-gray-300'} ${err && 'focus:border-red-600'}  outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code4")}
                                        onKeyUp={inputFocus}
                                   />
                              </div>
                         </div>
                         {
                              serverResponse && (
                                   <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="fixed right-5 bottom-5 text-gray-500 cursor-pointer">
                                        <span className={`${theme == 'light' ? 'text-gray-700 bg-gray-200' : 'text-white bg-[#2b2b2b] '} px-3 py-2 SF-pro-regular text-sm rounded-md`} >
                                             {serverResponse}
                                        </span>
                                   </motion.div>
                              )
                         }
                         <div className='my-3'>
                              <span className='text-sm px-2 text-gray-500'>Next Step Go to Press The Button</span>
                         </div>
                         <div className='grid'>
                              <button onClick={handleClick} className={` py-4 rounded-lg font-medium text-md ${theme === 'light' ? 'bg-[#181818] text-white' : 'bg-white text-black'}`}>Verify</button>
                         </div>
                    </div>
               </div>
          </div >
     )

}

export default EmailVerificationScreen;
