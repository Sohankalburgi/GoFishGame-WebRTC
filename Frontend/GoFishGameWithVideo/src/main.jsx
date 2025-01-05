
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import { Game } from './pages/Game.jsx'
import { Login } from './pages/Login.jsx'
import { SignUp } from './pages/Signup.jsx'
import {StartGame} from './pages/StartGame.jsx'
import { JoinGame } from './pages/JoinGame.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <Routes>
    <Route path='/' element={<App/>}/>
    <Route path='/game/:roomId/:userId' element={<Game/>}/>
    <Route path='/joingame/:userid' element={<JoinGame/>}/>
    <Route path='/login' element={<Login/>}/>
    <Route path='/signup' element={<SignUp/>}/>
    <Route path= '/startGame' element={<StartGame/>}/>
  </Routes>

  </BrowserRouter>
)
