import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function FirmAuth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '',
    industrySector: 'Technology',
    contactPerson: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/firm');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* Left Decorative Core Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-950 text-white p-16 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Corporate Portal</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Acquire Top Academic Tech Talent.
          </h1>
        </div>

        <div className="relative z-10 max-w-md border-l-2 border-amber-500 pl-6 my-auto">
          <blockquote className="text-xl font-medium text-slate-300 leading-relaxed tracking-wide font-serif italic">
            "Directly integrate and evaluate vetted university candidates within your live corporate engineering frameworks."
          </blockquote>
          <p className="text-[11px] text-amber-400 mt-4 font-bold uppercase tracking-widest">Industry Vetting Board</p>
        </div>

        <div className="relative z-10 text-[11px] text-slate-500 font-medium tracking-wide">
          © 2026 University Placement System. Enterprise Console.
        </div>
      </div>

      {/* Input Core Wrapper Sheet */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-16 bg-white shadow-2xl">
        <div className="w-full max-w-md space-y-10">
          
          <div className="text-center lg:text-left space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isRegistering ? 'Register Corporate Node' : 'Partner Sign In'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {isRegistering ? 'Already cleared?' : 'Want to list vacancies?'}{' '}
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="font-bold text-amber-600 hover:text-amber-700 transition-colors underline decoration-amber-200 underline-offset-4 hover:decoration-amber-600 focus:outline-none"
              >
                {isRegistering ? 'Sign In here' : 'Join as Partner'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Company Registered Legal Name</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g., TechCorp Solutions Ltd"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all duration-200"
                />
              </div>
            )}

            {isRegistering && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Industry Sector Domain</label>
                <div className="relative">
                  <select
                    name="industrySector"
                    value={formData.industrySector}
                    onChange={handleInputChange}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-slate-900 appearance-none focus:outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all duration-200"
                  >
                    <option value="Technology">Financial Technology & Core Software</option>
                    <option value="Telecommunications">Telecommunications infrastructure</option>
                    <option value="Banking">Commercial Banking & Asset Capital</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            )}

            {isRegistering && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">HR Lead / Supervisor Name</label>
                <input
                  type="text"
                  name="contactPerson"
                  required
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="e.g., Jane Mercer"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all duration-200"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Corporate Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="recruitment@company.com"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Security Access Key</label>
                {!isRegistering && <a href="#" className="text-xs font-semibold text-slate-400 hover:text-amber-600 transition-colors">Credential recovery?</a>}
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all duration-200"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full h-12">
                {isRegistering ? 'Submit Partnership Request' : 'Authorize Workspace'}
              </Button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Are you an attachment student or institutional administrator? <br />
              <span className="inline-block mt-3 text-slate-500 font-medium">
                Switch to <a href="/login/student" className="text-slate-900 font-bold hover:text-amber-600 transition-colors underline decoration-slate-300 underline-offset-4">Student Hub</a> or Suspend to <a href="/login/university" className="text-slate-900 font-bold hover:text-amber-600 transition-colors underline decoration-slate-300 underline-offset-4">Faculty Portal</a>
              </span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}