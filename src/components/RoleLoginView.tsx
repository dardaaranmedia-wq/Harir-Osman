import React, { useState } from "react";
import { usePOS } from "../store/posStore";
import { UserRole } from "../types";
import { Coffee, Key, Lock, User, Sparkles, LogIn, ChevronRight, Eye, EyeOff } from "lucide-react";
import { LunaLogo } from "./LunaLogo";

interface RoleLoginViewProps {
  onToggleSimulator?: () => void;
  showSimulator?: boolean;
}

export const RoleLoginView: React.FC<RoleLoginViewProps> = ({ onToggleSimulator, showSimulator }) => {
  const { loginPin, loginAdmin, users } = usePOS();
  
  const [loginMode, setLoginMode] = useState<"pin" | "admin">("pin");
  
  // PIN states
  const [pin, setPin] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  // Admin States
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleKeyPress = (num: string) => {
    setErrorText("");
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-validate if 4 digits reached
      if (nextPin.length === 4) {
        const loggedUser = loginPin(nextPin);
        if (loggedUser) {
          setPin("");
        } else {
          setTimeout(() => {
            setErrorText("Incorrect PIN. Please try again.");
            setPin("");
          }, 300);
        }
      }
    }
  };

  const clearPin = () => {
    setPin("");
    setErrorText("");
  };

  const backspacePin = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
    setErrorText("");
  };

  const handleAdminSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setErrorText("");
    
    // Developer account check
    const loggedUser = loginAdmin(email, password);
    if (loggedUser) {
      setEmail("");
      setPassword("");
    } else {
      setErrorText("Invalid administrator credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Decorative ambient background overlays */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-stone-800/40 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-sm bg-neutral-950/70 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 shadow-2xl relative z-10 space-y-6">
        
        {/* Branding header */}
        <div 
          onDoubleClick={onToggleSimulator}
          title="Luna Café Security Portal (Double click to toggle simulation options)"
          className="text-center space-y-2 flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <div className="w-16 h-16 flex items-center justify-center">
            <LunaLogo className="w-14 h-14 text-[#E5C158]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Welcome to Luna Café
            </h1>
            <p className="text-xs tracking-wide text-stone-400 font-medium">
              Secure Restaurant Management System
            </p>
          </div>
        </div>

        {/* Tab switch mechanism */}
        <div className="grid grid-cols-2 bg-neutral-900/80 p-1 rounded-xl border border-neutral-80/20 text-xs">
          <button 
            type="button"
            onClick={() => { setLoginMode("pin"); setErrorText(""); }}
            className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              loginMode === "pin" ? "bg-amber-950 text-amber-400 shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Staff PIN Log
          </button>
          
          <button 
            type="button"
            onClick={() => { setLoginMode("admin"); setErrorText(""); }}
            className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
              loginMode === "admin" ? "bg-amber-950 text-amber-400 shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Admin Account
          </button>
        </div>

        {/* Display general errors */}
        {errorText && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-xs text-center py-2.5 px-3 rounded-xl font-medium animate-pulse">
            {errorText}
          </div>
        )}

        {loginMode === "pin" ? (
          /* Staff PIN Pad */
          <div className="space-y-6">
            
            {/* PIN Secure Indicator screen */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex gap-4 justify-center py-3">
                {[...Array(4)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      pin.length > i 
                        ? "bg-amber-400 border-amber-400 scale-110 shadow-glow" 
                        : "border-neutral-700 bg-neutral-950"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                Enter 4-Digit PIN code
              </span>
            </div>

            {/* Keypad Layout Grid */}
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-14 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/40 rounded-2xl flex items-center justify-center font-bold text-lg active:scale-90 active:bg-amber-950 active:text-amber-200 transition"
                >
                  {num}
                </button>
              ))}
              
              <button
                type="button"
                onClick={clearPin}
                className="h-14 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-white flex items-center justify-center"
              >
                Clear
              </button>
              
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                className="h-14 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800/40 rounded-2xl flex items-center justify-center font-bold text-lg active:scale-95 transition"
              >
                0
              </button>

              <button
                type="button"
                onClick={backspacePin}
                className="h-14 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-white flex items-center justify-center"
              >
                log
              </button>
            </div>

          </div>
        ) : (
          /* Separate Secure Admin Form using raw elements to prevent intrusive Google Sign-In and safari email password autofill prompts */
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Admin Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Admin Username"
                    value={email}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAdminSubmit();
                      }
                    }}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 text-sm pl-11 pr-3 py-3 rounded-xl border border-neutral-800 focus:border-amber-950 outline-none text-white focus:bg-neutral-900/80 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="• • • • • •"
                    value={password}
                    autoComplete="new-password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAdminSubmit();
                      }
                    }}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900 text-sm pl-11 pr-10 py-3 rounded-xl border border-neutral-800 focus:border-amber-950 outline-none text-white focus:bg-neutral-900/80 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => handleAdminSubmit()}
              className="w-full bg-amber-950 hover:bg-amber-900 text-white text-xs font-black py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign in as Admin
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Under login tagline */}
      <p className="mt-6 text-xs text-neutral-500 font-medium tracking-wide text-center">
        “Secure, Reliable, Real-Time Restaurant POS System”
      </p>
    </div>
  );
};
