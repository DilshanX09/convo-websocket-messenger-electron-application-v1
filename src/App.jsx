import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';

import Chat from './screen/ChatsScreen.jsx';
import LoginScreen from './screen/LoginScreen.jsx';
import SplashScreen from "./screen/SplashScreen.jsx";
import TwoFactorScreen from "./screen/TwoFactorScreen.jsx";
import RegisterScreen from "./screen/RegisterScreen.jsx";
import ProfileScreen from "./screen/ProfileScreen.jsx";
import EmailVerificationScreen from "./screen/EmailVerificationScreen.jsx";
import DeviceInformationScreen from "./screen/DeviceInformationScreen.jsx";


const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path='/user/auth/login' element={<LoginScreen />} />
        <Route path='/user/auth/register' element={<RegisterScreen />} />
        <Route path='/user/auth/verify/:id/:email' element={<EmailVerificationScreen />} />
        <Route path='/chats' element={<Chat />} />
        <Route path='/chats/:chatId' element={<Chat />} />
        <Route path='/profile/:username' element={<ProfileScreen />} />
        <Route path='/user/sessions' element={<DeviceInformationScreen />} />
        <Route path='/auth/2fa-verification' element={<TwoFactorScreen />} />
      </Routes>
    </BrowserRouter>
  );

}

export default App;
