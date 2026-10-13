import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TabsLayout } from './components/TabsLayout'
import { Button, FullScreenLoader } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { DataProvider } from './lib/data'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryPage } from './pages/CategoryPage'
import { HomePage } from './pages/HomePage'
import { ItemFormPage } from './pages/ItemFormPage'
import { ItemPage } from './pages/ItemPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RandomPage } from './pages/RandomPage'
import { RegisterPage } from './pages/RegisterPage'

function AppRoutes() {
  const { session, profile, loading, offline } = useAuth()

  if (loading) return <FullScreenLoader />
  if (session && !profile && offline) return <OfflineScreen />

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
          <Route path="/random" element={<RandomPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/item/new" element={<ItemFormPage />} />
        <Route path="/item/:id" element={<ItemPage />} />
        <Route path="/item/:id/edit" element={<ItemFormPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  )
}

function OfflineScreen() {
  const { refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="text-4xl">📡</p>
      <p className="text-lg font-semibold">Нет связи с сервером</p>
      <p className="text-muted">Проверьте интернет. Если интернет есть, возможно, Supabase «заснул» — подробности в README.</p>
      <Button className="mt-4 max-w-60" busy={busy} onClick={() => (setBusy(true), refresh().finally(() => setBusy(false)))}>
        Повторить
      </Button>
    </div>
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
