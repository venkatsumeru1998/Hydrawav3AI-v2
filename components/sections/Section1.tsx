"use client";
import React from 'react';
import { FormData } from '@/types';

interface Section1Props {
  formData: FormData;
  updateField: (field: keyof FormData, value: any) => void;
}

const Section1: React.FC<Section1Props> = ({ formData, updateField }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <>
        {/* Name Field */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#b5b0a8] uppercase tracking-[0.1em] block" style={{ fontFamily: 'var(--font-poppins)' }}>
            Name
          </label>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full compact-input rounded-2xl px-5 py-3.5 text-sm font-medium"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>

        {/* Email Field */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#b5b0a8] uppercase tracking-[0.1em] block" style={{ fontFamily: 'var(--font-poppins)' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="example@email.com"
            value={formData.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full compact-input rounded-2xl px-5 py-3.5 text-sm font-medium"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>

        {/* Phone Number Field */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#b5b0a8] uppercase tracking-[0.1em] block" style={{ fontFamily: 'var(--font-poppins)' }}>
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="e.g. +1234567890"
            value={formData.phoneNumber || ''}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            className="w-full compact-input rounded-2xl px-5 py-3.5 text-sm font-medium"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>

        {/* Age Field */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#b5b0a8] uppercase tracking-[0.1em] block" style={{ fontFamily: 'var(--font-poppins)' }}>
            Age
          </label>
          <input
            type="text"
            placeholder="Years"
            value={formData.age}
            onChange={(e) => updateField('age', e.target.value)}
            className="w-full compact-input rounded-2xl px-5 py-3.5 text-sm font-medium"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>

        {/* Height Field */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#b5b0a8] uppercase tracking-[0.1em] block" style={{ fontFamily: 'var(--font-poppins)' }}>
            Height(cm)
          </label>
          <input
            type="text"
            placeholder="Value"
            value={formData.height}
            onChange={(e) => updateField('height', e.target.value)}
            className="w-full compact-input rounded-2xl px-5 py-3.5 text-sm font-medium"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>

        {/* Weight Field */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[#b5b0a8] uppercase tracking-[0.1em] block" style={{ fontFamily: 'var(--font-poppins)' }}>
            Weight(kg)
          </label>
          <input
            type="text"
            placeholder="Value"
            value={formData.weight}
            onChange={(e) => updateField('weight', e.target.value)}
            className="w-full compact-input rounded-2xl px-5 py-3.5 text-sm font-medium"
            style={{ fontFamily: 'var(--font-poppins)' }}
          />
        </div>
      </>

      {/* Sex at Birth */}
      <div className="md:col-span-2 lg:col-span-2 space-y-3">
        <label className="text-xs font-semibold text-[#b5b0a8] uppercase tracking-[0.1em] block" style={{ fontFamily: 'var(--font-poppins)' }}>
          Sex at Birth
        </label>
        <div className="flex flex-wrap gap-3">
          {['Male', 'Female', 'Intersex', 'Prefer not to say'].map(opt => (
            <button
              key={opt}
              onClick={() => updateField('sexAtBirth', opt)}
              className={`px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all border whitespace-nowrap ${formData.sexAtBirth === opt
                ? 'tan-bg text-[#1a2b33] border-transparent shadow-lg'
                : 'bg-[#fdfbf9] text-[#8b8780] border-[#eeeae5] hover:bg-[#f8f5f1] hover:border-tan-bg/30'
                }`}
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Section1;
