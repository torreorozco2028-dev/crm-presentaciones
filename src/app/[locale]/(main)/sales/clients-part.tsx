'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, CheckCircle2, ChevronDown, User, 
  IdCard, MapPin, Briefcase, Phone, Mail 
} from 'lucide-react';
import { registerClientAction } from './actions';

export default function ClientsPart() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const result = await registerClientAction(data);
    
    setLoading(false);
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsExpanded(false);
      }, 2000);
    }
  }

  return (
    <section className="relative z-10 px-6 py-8 bg-white">
      <div className="mx-auto max-w-5xl">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex cursor-pointer items-center justify-between rounded-2xl border transition-all duration-300 p-6 ${
            isExpanded 
            ? 'border-blue-100 bg-blue-50/30 shadow-sm' 
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-5">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              isExpanded ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <UserPlus size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Registro de Cliente</h2>
              <p className="text-sm text-slate-500">Gestión de prospectos e interesados para el proyecto</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-slate-400"
          >
            <ChevronDown size={24} />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="overflow-hidden"
            >
              <form 
                onSubmit={handleSubmit}
                className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl md:p-10"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-3">
                  
                  <SectionHeader icon={<User size={16}/>} title="Identidad del Cliente" color="text-blue-600" />
                  
                  <InputField name="names" label="Nombres" required />
                  <InputField name="first_last_name" label="Apellido Paterno" required />
                  <InputField name="second_last_name" label="Apellido Materno" />
                  
                  <SectionHeader icon={<IdCard size={16}/>} title="Documentación y Contacto" color="text-emerald-600" />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700 ml-1">Tipo de Documento</label>
                    <select name="type_document" className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10">
                      <option value="CI">Cédula de Identidad</option>
                      <option value="Passport">Pasaporte</option>
                      <option value="NIT">NIT</option>
                    </select>
                  </div>
                  <InputField name="n_document" label="N° de Documento" type="number" />
                  <InputField name="email" label="Email" type="email" />
                  <InputField name="cellphone" label="Teléfono" type="number" />
                  
                  <SectionHeader icon={<Briefcase size={16}/>} title="Perfil de Interés" color="text-indigo-600" />

                  <InputField name="occupation" label="Ocupación" />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700 ml-1">Género</label>
                    <select name="genre" className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10">
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                  <InputField name="marital_status" label="Estado Civil" />
                  
                  <div className="md:col-span-3">
                    <InputField name="location" label="Dirección de Domicilio" icon={<MapPin size={14}/>} />
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 pt-8">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={loading || isSuccess}
                    type="submit"
                    className={`flex items-center gap-2 rounded-xl px-10 py-3 text-sm font-bold uppercase tracking-wider transition-all shadow-lg ${
                      isSuccess 
                      ? 'bg-emerald-500 text-white shadow-emerald-200' 
                      : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Procesando...
                      </span>
                    ) : isSuccess ? (
                      <><CheckCircle2 size={18} /> ¡Registrado!</>
                    ) : (
                      'Guardar Cliente'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function SectionHeader({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 md:col-span-3">
      <div className={`${color} bg-current/10 p-2 rounded-lg`}>
        {React.cloneElement(icon as React.ReactElement)}
      </div>
      <span className={`text-sm font-bold uppercase tracking-widest ${color}`}>
        {title}
      </span>
      <div className="h-px flex-1 bg-slate-100 ml-2" />
    </div>
  );
}

function InputField({ label, name, type = "text", required = false, icon }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-slate-700 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          required={required}
          placeholder={`Ej: ${label}...`}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 ${icon ? 'pl-10' : 'px-4'}`}
        />
      </div>
    </div>
  );
}