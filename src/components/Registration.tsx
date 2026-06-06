"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from 'framer-motion';

import { DEFAULT_EVENT_SLUG } from '@/lib/constants';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  college: string;
  phone: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  college: string;
  year: string;
  teamName: string;
  track: string;
  projectIdea: string;
  tshirtSize: string;
  dietary: string;
  source: string;
  terms: boolean;
  updates: boolean;
}

const FLOATING_PARTICLES = [
  { left: "12%", top: "18%", duration: 3.2, delay: 0.1 },
  { left: "24%", top: "72%", duration: 4.1, delay: 0.4 },
  { left: "36%", top: "44%", duration: 3.8, delay: 0.7 },
  { left: "48%", top: "85%", duration: 4.4, delay: 1.0 },
  { left: "58%", top: "28%", duration: 3.5, delay: 0.3 },
  { left: "67%", top: "63%", duration: 4.0, delay: 0.8 },
  { left: "76%", top: "16%", duration: 3.6, delay: 1.2 },
  { left: "84%", top: "78%", duration: 4.3, delay: 0.5 },
  { left: "92%", top: "36%", duration: 3.9, delay: 1.1 },
  { left: "8%", top: "54%", duration: 4.2, delay: 0.9 },
  { left: "18%", top: "92%", duration: 3.7, delay: 0.6 },
  { left: "29%", top: "12%", duration: 4.5, delay: 1.4 },
  { left: "41%", top: "66%", duration: 3.4, delay: 0.2 },
  { left: "53%", top: "48%", duration: 4.1, delay: 1.3 },
  { left: "64%", top: "88%", duration: 3.8, delay: 0.4 },
  { left: "73%", top: "58%", duration: 4.6, delay: 1.5 },
  { left: "81%", top: "26%", duration: 3.3, delay: 0.7 },
  { left: "89%", top: "68%", duration: 4.0, delay: 1.0 },
  { left: "95%", top: "8%", duration: 3.6, delay: 0.5 },
  { left: "5%", top: "80%", duration: 4.3, delay: 1.1 },
];

export default function RegistrationPage() {
  const router = useRouter();
  const initialFormData: FormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    college: '',
    year: '',
    teamName: '',
    track: '',
    projectIdea: '',
    tshirtSize: '',
    dietary: 'none',
    source: '',
    terms: false,
    updates: false,
  };

  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        return 'Please enter your first and last name.';
      }
      if (!formData.email.trim()) {
        return 'Please enter your email address.';
      }
      if (!formData.phone.trim()) {
        return 'Please enter your phone number.';
      }
      if (!formData.college.trim()) {
        return 'Please enter your college or university name.';
      }
      if (!formData.year.trim()) {
        return 'Please select your year of study.';
      }
    }

    if (step === 2) {
      if (!formData.teamName.trim()) {
        return 'Please enter a team name.';
      }
      if (!formData.track.trim()) {
        return 'Please choose a hackathon track.';
      }

      for (const [index, member] of teamMembers.entries()) {
        const hasAnyValue = Boolean(
          member.name.trim() || member.email.trim() || member.college.trim() || member.phone.trim(),
        );

        if (
          hasAnyValue &&
          (!member.name.trim() || !member.email.trim() || !member.college.trim() || !member.phone.trim())
        ) {
          return `Please complete all fields for Team Member ${index + 1}.`;
        }
      }
    }

    if (step === 3) {
      if (!formData.tshirtSize.trim()) {
        return 'Please select a T-shirt size.';
      }
      if (!formData.terms) {
        return 'Please accept the terms and conditions.';
      }
    }

    return null;
  };

  const handleNextStep = () => {
    const validationError = validateStep(currentStep);

    if (validationError) {
      setSubmitError(validationError);
      setSubmitSuccess(null);
      return;
    }

    setSubmitError(null);
    setCurrentStep(currentStep + 1);
  };

  const addTeamMember = () => {
    if (teamMembers.length >= 3) {
      alert('Maximum 3 additional members (4 total including leader)');
      return;
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: '',
      email: '',
      college: '',
      phone: '',
    };

    setTeamMembers([...teamMembers, newMember]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(teamMembers.map(member =>
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateStep(1) || validateStep(2) || validateStep(3);
    if (validationError) {
      setSubmitError(validationError);
      setSubmitSuccess(null);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventSlug: DEFAULT_EVENT_SLUG,
          fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          collegeName: formData.college,
          year: formData.year,
          teamName: formData.teamName,
          problemTrack: formData.track,
          projectIdea: formData.projectIdea,
          tshirtSize: formData.tshirtSize,
          dietary: formData.dietary,
          source: formData.source,
          updates: formData.updates,
          githubUrl: '',
          linkedinUrl: '',
          teamMembers: teamMembers.map((member) => ({
            name: member.name,
            email: member.email,
            college: member.college,
            phone: member.phone,
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Registration failed.');
      }

      setSubmitSuccess(payload.message ?? 'Registration successful. Check your email for confirmation.');
      setFormData({ ...initialFormData });
      setTeamMembers([]);
      setCurrentStep(1);
      router.push('/participant?registered=1');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit the registration form right now.';

      if (message.toLowerCase().includes('signed in')) {
        setSubmitError('Please sign in with Supabase Auth before registering for the hackathon.');
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: '👤' },
    { number: 2, title: 'Team Details', icon: '👥' },
    { number: 3, title: 'Preferences', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Floating particles */}
        {FLOATING_PARTICLES.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            style={{
              left: particle.left,
              top: particle.top,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex justify-between items-center px-8 py-6">
        <motion.div
          className="flex items-center gap-[10px]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "#fff",
          }}>D</div>
          <span style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.3px", color: "#e8eaf0" }}>
            Dnyanathon<span style={{ color: "#6366f1" }}> &apos;26</span>
          </span>
        </motion.div>

        <motion.a
          href="/"
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 backdrop-blur-sm font-semibold"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          ← Back to Home
        </motion.a>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-5 gap-12">
        {/* Left Sidebar - Event Info */}
        <motion.div
          className="lg:col-span-2 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-emerald-400">DIET SATARA • JUNE 7-8, 2026</span>
          </div>

          <div>
            <h1 className="text-5xl font-black leading-tight mb-4">
              Register for India&apos;s Most{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Electrifying
              </span>{' '}
              Hackathon
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Join 1,200+ builders for 24 hours of innovation, collaboration, and limitless possibilities.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '⏱️', label: 'Duration', value: '24 Hours Non-Stop' },
              { icon: '👥', label: 'Team Size', value: '2-4 Members' },
              { icon: '🏆', label: 'Prize Pool', value: '₹50,000 Total' },
              { icon: '📍', label: 'Venue', value: 'DIET, Satara' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</div>
                  <div className="font-semibold text-white">{item.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress Steps */}
          <div className="hidden lg:block space-y-3 pt-8">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Registration Progress</div>
            {steps.map((step) => (
              <motion.div
                key={step.number}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentStep === step.number
                    ? 'bg-purple-500/20 border border-purple-500/40'
                    : currentStep > step.number
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-white/5 border border-white/10'
                }`}
                whileHover={{ x: 5 }}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    currentStep === step.number
                      ? 'bg-purple-500 text-white'
                      : currentStep > step.number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span className={currentStep >= step.number ? 'text-white font-medium' : 'text-slate-400'}>
                  {step.title}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Registration Form */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Complete Your Registration</h2>
              <p className="text-slate-400">Fill in the details to secure your spot</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {(submitError || submitSuccess) && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    submitError
                      ? 'border-red-500/30 bg-red-500/10 text-red-200'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  }`}
                >
                  {submitError ?? submitSuccess}
                </div>
              )}

              {/* Step 1: Personal Information */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <span className="text-2xl">📋</span> Team Leader Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          First Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Last Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          placeholder="john.doe@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          College/University <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          placeholder="Your Institution"
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          Year of Study <span className="text-red-400">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                          <option value="graduate">Graduate</option>
                          <option value="postgraduate">Postgraduate</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Team Details */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <span className="text-2xl">👥</span> Team Details
                    </h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Team Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        placeholder="Enter a creative team name"
                        value={formData.teamName}
                        onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Hackathon Track <span className="text-red-400">*</span>
                      </label>
                      <select
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        value={formData.track}
                        onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                      >
                        <option value="">Choose a track</option>
                        <option value="ai-ml">AI & Machine Learning</option>
                        <option value="web3">Web3 & Blockchain</option>
                        <option value="healthcare">Healthcare Tech</option>
                        <option value="fintech">FinTech</option>
                        <option value="education">EdTech</option>
                        <option value="sustainability">Sustainability & Climate</option>
                        <option value="open">Open Innovation</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Project Idea (Optional)</label>
                      <textarea
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all min-h-[100px] resize-none"
                        placeholder="Brief description of what you're planning to build..."
                        value={formData.projectIdea}
                        onChange={(e) => setFormData({ ...formData, projectIdea: e.target.value })}
                      />
                    </div>

                    {/* Team Members */}
                    <div className="space-y-4">
                      <AnimatePresence>
                        {teamMembers.map((member, idx) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-purple-300">Team Member {idx + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeTeamMember(member.id)}
                                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm transition-all"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                placeholder="Full Name"
                                value={member.name}
                                onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                              />
                              <input
                                type="email"
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                placeholder="Email"
                                value={member.email}
                                onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                              />
                              <input
                                type="text"
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                placeholder="College"
                                value={member.college}
                                onChange={(e) => updateTeamMember(member.id, 'college', e.target.value)}
                              />
                              <input
                                type="tel"
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                placeholder="Phone"
                                value={member.phone}
                                onChange={(e) => updateTeamMember(member.id, 'phone', e.target.value)}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <motion.button
                        type="button"
                        onClick={addTeamMember}
                        className="w-full py-3 border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 rounded-xl text-purple-400 hover:text-purple-300 font-medium transition-all hover:bg-purple-500/5"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        + Add Team Member (Max 3 additional)
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Preferences */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <span className="text-2xl">⚙️</span> Additional Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                          T-Shirt Size <span className="text-red-400">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          value={formData.tshirtSize}
                          onChange={(e) => setFormData({ ...formData, tshirtSize: e.target.value })}
                        >
                          <option value="">Select Size</option>
                          <option value="xs">XS</option>
                          <option value="s">S</option>
                          <option value="m">M</option>
                          <option value="l">L</option>
                          <option value="xl">XL</option>
                          <option value="xxl">XXL</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Dietary Restrictions</label>
                        <select
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                          value={formData.dietary}
                          onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
                        >
                          <option value="none">None</option>
                          <option value="vegetarian">Vegetarian</option>
                          <option value="vegan">Vegan</option>
                          <option value="gluten-free">Gluten Free</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">How did you hear about us?</label>
                      <select
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      >
                        <option value="">Select an option</option>
                        <option value="social">Social Media</option>
                        <option value="friend">Friend/Colleague</option>
                        <option value="college">College/University</option>
                        <option value="email">Email Newsletter</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-4 pt-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          required
                          className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          checked={formData.terms}
                          onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          I agree to the{' '}
                          <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                            Terms & Conditions
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                            Code of Conduct
                          </a>
                          <span className="text-red-400"> *</span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          checked={formData.updates}
                          onChange={(e) => setFormData({ ...formData, updates: e.target.checked })}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          I want to receive updates about Dnyanothsav &apos;26 and future events
                        </span>
                      </label>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <p className="text-sm text-blue-300">
                        <strong>ℹ️ Important:</strong> Registration closes on June 1, 2026. You&apos;ll receive a
                        confirmation email within 24 hours.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6">
                {currentStep > 1 && (
                  <motion.button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ← Previous
                  </motion.button>
                )}

                {currentStep < 3 ? (
                  <motion.button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Next Step →
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Complete Registration →'
                    )}
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
