import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { AuthApi } from '../hooks/useAuth'
import type { Preferences } from '../lib/units'

interface Props {
  open: boolean
  onClose: () => void
  auth: AuthApi
  prefs: Preferences
  onPrefs: (p: Partial<Preferences>) => void
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex items-center justify-between gap-3 py-2.5">
      <legend className="float-left text-[16px]">{label}</legend>
      <div className="flex rounded-[10px] bg-white/10 p-0.5" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`press min-w-[3rem] rounded-[8px] px-3 py-1.5 text-[14px] font-semibold ${value === v ? 'bg-white/90 text-[#0b1220] shadow' : 'text-white/90'}`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function AccountSheet({ open, onClose, auth, prefs, onPrefs }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close()
  }, [open])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const err = mode === 'signin' ? await auth.signIn(email, password) : await auth.signUp(email, password)
    setBusy(false)
    if (err) setMsg(err)
    else {
      setPassword('')
      onClose()
    }
  }

  const guest = async () => {
    setBusy(true)
    const err = await auth.startGuest()
    setBusy(false)
    if (err) setMsg(err)
    else onClose()
  }

  const user = auth.user
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="account-title"
      className="sheet m-0 mt-auto w-full max-w-none rounded-t-[24px] bg-[#1c1f26]/95 p-0 text-white backdrop-blur-xl backdrop:bg-black/50 sm:m-auto sm:max-w-md sm:rounded-[24px]"
      data-testid="account-sheet"
    >
      <div className="px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h2 id="account-title" className="text-[20px] font-bold">
            {user ? (auth.isGuest ? 'Guest session' : 'Account') : 'Sync your cities'}
          </h2>
          <button type="button" onClick={onClose} className="press grid h-8 w-8 place-items-center rounded-full bg-white/15" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {!auth.enabled ? (
          <p className="mt-2 text-[15px] text-white/80">Accounts aren't configured on this deployment. Your cities are saved on this device.</p>
        ) : user ? (
          <div className="mt-2 space-y-3">
            <p className="text-[15px] text-white/85">
              {auth.isGuest ? 'You are using a guest account. Your cities sync live across tabs while this session lasts.' : `Signed in as ${user.email}. Your cities sync across devices.`}
            </p>
            <button type="button" onClick={() => void auth.signOut().then(onClose)} className="press w-full rounded-xl bg-white/15 py-2.5 text-[16px] font-semibold">
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-2.5">
            <p className="text-[15px] text-white/85">Sign in to keep your cities in sync. Cities on this device are merged into your account.</p>
            <label className="block">
              <span className="sr-only">Email</span>
              <input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-xl bg-white/10 px-3 text-[16px] placeholder:text-white/65 focus:ring-2 focus:ring-white/70 focus:outline-none" />
            </label>
            <label className="block">
              <span className="sr-only">Password</span>
              <input type="password" required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full rounded-xl bg-white/10 px-3 text-[16px] placeholder:text-white/65 focus:ring-2 focus:ring-white/70 focus:outline-none" />
            </label>
            {msg && (
              <p role="alert" className="text-[14px] text-[#ffc9b5]">
                {msg}
              </p>
            )}
            <button type="submit" disabled={busy} className="press w-full rounded-xl bg-[#0a84ff] py-2.5 text-[16px] font-semibold disabled:opacity-60">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <div className="flex items-center justify-between text-[15px]">
              <button type="button" className="press py-1 text-[#64b5ff]" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Create an account' : 'I have an account'}
              </button>
              <button type="button" className="press py-1 text-[#64b5ff]" onClick={guest} disabled={busy}>
                Try as guest
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
          <Segmented label="Temperature" value={prefs.units} options={[['F', '°F'], ['C', '°C']]} onChange={(units) => onPrefs({ units })} />
          <Segmented label="Wind" value={prefs.windUnit} options={[['mph', 'mph'], ['kmh', 'km/h'], ['ms', 'm/s'], ['kn', 'kn']]} onChange={(windUnit) => onPrefs({ windUnit })} />
          <Segmented label="Background" value={prefs.theme} options={[['dynamic', 'Sky'], ['midnight', 'Midnight']]} onChange={(theme) => onPrefs({ theme })} />
        </div>
      </div>
    </dialog>
  )
}
