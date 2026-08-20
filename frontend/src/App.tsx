import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { MachineListPage } from './pages/MachineListPage'
import { MachineDetailPage } from './pages/MachineDetailPage'
import { InspectionPage } from './pages/InspectionPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MachineListPage />} />
            <Route path="/machines/:machineId" element={<MachineDetailPage />} />
            <Route path="/inspections/:inspectionId" element={<InspectionPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
