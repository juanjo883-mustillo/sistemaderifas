import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Pago from './pages/Pago'
import Confirmacion from './pages/Confirmacion'
import Login from './pages/Login'
import Vendedor from './pages/Vendedor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pago" element={<Pago />} />
        <Route path="/confirmacion" element={<Confirmacion />} />
        <Route path="/login" element={<Login />} />
        <Route path="/vendedor" element={<Vendedor />} />
      </Routes>
    </BrowserRouter>
  )
}
