import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import InsurerLayout from './layouts/InsurerLayout'
import ClientLayout  from './layouts/ClientLayout'

// Landing
import Landing from './pages/Landing'

// Insurer pages (reusing existing + new)
import Overview       from './pages/Overview'
import ClaimsExplorer from './pages/ClaimsExplorer'
import NewClaimForm   from './pages/NewClaim'
import AIAssistant    from './pages/AIAssistant'
import Documents      from './pages/insurer/Documents'
import RagAdmin       from './pages/insurer/RagAdmin'

// Client pages
import MyClaims      from './pages/client/MyClaims'
import ClientNewClaim from './pages/client/NewClaim'
import ClaimDetail   from './pages/client/ClaimDetail'
import AskAssistant  from './pages/client/AskAssistant'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Insurer portal */}
        <Route path="/insurer" element={<InsurerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<Overview />} />
          <Route path="claims"     element={<ClaimsExplorer />} />
          <Route path="new-claim"  element={<NewClaimForm onSuccess={() => window.location.href = '/insurer/claims'} />} />
          <Route path="documents"  element={<Documents />} />
          <Route path="rag"        element={<RagAdmin />} />
        </Route>

        {/* Client portal */}
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="my-claims" replace />} />
          <Route path="my-claims"    element={<MyClaims />} />
          <Route path="new-claim"    element={<ClientNewClaim />} />
          <Route path="claims/:id"   element={<ClaimDetail />} />
          <Route path="ask"          element={<AskAssistant />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
