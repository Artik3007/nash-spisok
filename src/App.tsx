import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TabsLayout } from './components/TabsLayout'
import { FullScreenLoader } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { DataProvider } from './lib/data'
import { CategoryPage } from './pages/CategoryPage'
import { HomePage } from './pages/HomePage'
import { ItemFormPage } from './pages/ItemFormPage'
import { ItemPage } from './pages/ItemPage'
import { LoginPage } from './pages/LoginPage'
import { Placeholder } from './pages/Placeholder'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'

function AppRoutes() {
  const { session, profile, loading } = useAuth()

  if (loading) return <FullScreenLoader />

  // Не вошли или пара ещё не настроена
  if (!session || !profile) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to={session ? '/register' : '/login'} replace />} />
      </Routes>
    )
  }

  return (
    <DataProvider key={profile.couple_id}>
      <Routes>
        <Route element={<TabsLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/random" element={<Placeholder title="Случайный выбор" sub={false} />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/item/new" element={<ItemFormPage />} />
        <Route path="/item/:id" element={<ItemPage />} />
        <Route path="/item/:id/edit" element={<ItemFormPage />} />
        <Route path="/categories" element={<Placeholder title="Категории" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
