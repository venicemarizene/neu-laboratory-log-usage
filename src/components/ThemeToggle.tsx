"use client"

import { useState, useEffect } from "react"

/**
 * Institutional Theme Toggle component.
 * Manages light/dim mode with persistent storage using 'neu-labtrack-theme' key.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Read the stored theme on mount
    const savedTheme = localStorage.getItem('neu-labtrack-theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Fallback to system preference if no key is found
      // Note: User prompt says default is always light, but respecting system pref is standard practice.
      // However, to follow the strict instruction: "Default is always light mode if no key is found"
      setTheme('light')
      document.documentElement.classList.toggle('dark', false)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    
    // Toggle logic sequence requested:
    // 1. read current (handled by 'theme' state)
    // 2. toggle class
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    // 3. save to localStorage
    localStorage.setItem('neu-labtrack-theme', newTheme)
    
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="pill-theme-toggle"
      style={{
        borderRadius: '999px',
        padding: '6px 14px',
        backgroundColor: 'var(--color-accent-bg)',
        border: '1px solid var(--color-accent-border)',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'background 0.2s ease, color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {theme === 'light' ? '☀ Light' : '☾ Dim'}
    </button>
  )
}
