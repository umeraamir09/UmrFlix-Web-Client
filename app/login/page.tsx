'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { EmailInput, PasswordInput } from '@/components/ui/StyledInput'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await login(username, password)

    if (!result.success) {
      setError(result.error || 'Invalid credentials')
    }
  }

  return (
    <AuroraBackground
    >
      <div className='relative w-full'>
      <div className="min-h-screen flex w-full items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className='flex justify-center'>
        <Image 
          src={'/branding/logo_header2.png'}
          alt='UmrFlix Logo'
          width={250}
          height={100}
          className="w-auto h-auto max-w-[250px] sm:max-w-[300px]"
          priority
          unoptimized
        />
        </div>
        <div className='bg-black/60 p-6 sm:p-8 backdrop-blur-sm space-y-6 sm:space-y-8 rounded-lg border border-gray-800/50'>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Sign in</h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <EmailInput 
              label="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
            
            <PasswordInput 
              label="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-red-600 hover:bg-red-700 py-3 font-semibold text-white transition-colors duration-200"
            >
              Sign In
            </button>
          </form>
          <p className='text-center text-gray-400 text-sm'>Umroo Productions Inc. 2025</p>
        </div>
      </div>
      </div>
      </div>
    </AuroraBackground>
  )
}
