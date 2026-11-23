import React from 'react';
import { usePortal } from '../../context/PortalContext';
import {
  Compass,
  GraduationCap,
  Award,
  CheckCircle2,
  Code2,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setCurrentPage } = usePortal();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          About The Platform
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          Empowering Postgraduate Computing Scholars Through Integrated Digital Pedagogy
        </h1>
        <p className="text-base text-[#795548] dark:text-stone-300 leading-relaxed">
          MCA SMART CAMPUS is an integrated academic management, continuous evaluation, and verified skill-growth platform engineered for Master of Computer Applications curricula.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#B83232]/10 text-[#B83232] dark:text-[#F2C94C] flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#292929] dark:text-white">Our Mission</h2>
          <p className="text-sm text-[#795548] dark:text-stone-300 leading-relaxed">
            To provide postgraduate computer science students with a frictionless, high-fidelity academic environment where mathematical foundations, algorithmic problem solving, relational data engineering, and modern Python systems engineering are studied, tested, and evaluated in unison.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[#B83232]/10 text-[#B83232] dark:text-[#F2C94C] flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#292929] dark:text-white">Our Vision</h2>
          <p className="text-sm text-[#795548] dark:text-stone-300 leading-relaxed">
            To establish a benchmark in postgraduate computing education through continuous objective assessment, interactive browser sandboxes, and transparent student performance analytics aligned with national postgraduate accreditation standards.
          </p>
        </div>
      </div>

      {/* Academic Objectives */}
      <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            Core Curriculum Goals
          </span>
          <h2 className="text-2xl font-bold text-[#292929] dark:text-white mt-1">
            Academic Objectives for MCA Semester 1
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 p-4 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <div className="font-mono text-sm font-bold text-[#B83232] dark:text-[#F2C94C]">01. Discrete Logic</div>
            <p className="text-xs text-[#795548] dark:text-stone-300 leading-relaxed">
              Master formal propositional calculus, proof techniques by induction, Eulerian/Hamiltonian graph models, and algebraic group theorems.
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <div className="font-mono text-sm font-bold text-[#B83232] dark:text-[#F2C94C]">02. Algorithms & Data</div>
            <p className="text-xs text-[#795548] dark:text-stone-300 leading-relaxed">
              Analyze Big-O asymptotic limits, implement balanced AVL/B-Trees, and solve single-source shortest path problems via Dijkstra & Kruskal.
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <div className="font-mono text-sm font-bold text-[#B83232] dark:text-[#F2C94C]">03. Data Engineering</div>
            <p className="text-xs text-[#795548] dark:text-stone-300 leading-relaxed">
              Design relational schemas through Boyce-Codd (BCNF) normalization, preserve functional dependencies, and manage ACID transactional states.
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-xl bg-[#F7F5F2] dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <div className="font-mono text-sm font-bold text-[#B83232] dark:text-[#F2C94C]">04. Modern Python</div>
            <p className="text-xs text-[#795548] dark:text-stone-300 leading-relaxed">
              Engineer production Python applications using dunder protocol emulation, metaprogramming decorators, NumPy vectorization, and unit testing.
            </p>
          </div>
        </div>
      </div>

      {/* Learning Methodology & Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-2xl font-bold text-[#292929] dark:text-white">
            Pedagogical Methodology: Continuous Cognitive Synthesis
          </h2>
          <p className="text-sm text-[#795548] dark:text-stone-300 leading-relaxed">
            Unlike static LMS repositories, MCA SMART CAMPUS follows an active-recall, problem-first methodology. Theory units are tightly paired with automated unit examinations and live algorithmic challenges.
          </p>

          <div className="space-y-3">
            {[
              {
                title: 'Structured Cognitive Scaffold',
                desc: 'Each course is decomposed into 5 progressive syllabus units with direct mapping to end-semester university rubrics.'
              },
              {
                title: 'Instant Formative Assessment',
                desc: 'Objective tests with real-time scoring eliminate the latency between learning a concept and verifying comprehension.'
              },
              {
                title: 'Zero-Installation Python Lab',
                desc: 'Students test algorithms right inside the browser without local environment conflicts or interpreter mismatches.'
              },
              {
                title: 'Transparent Performance Diagnostics',
                desc: 'Continuous radar charts and SGPA estimators illuminate specific knowledge gaps before final university examinations.'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#292929] dark:text-white">{item.title}</h3>
                  <p className="text-xs text-[#795548] dark:text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Overview Box */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
            <Code2 className="w-4 h-4" />
            <span>Architecture & Technology</span>
          </div>
          <h3 className="text-lg font-bold text-[#292929] dark:text-white">
            Django 5.2 & Python 3.13 Backend
          </h3>
          <p className="text-xs text-[#795548] dark:text-stone-300 leading-relaxed">
            The platform is structured on an enterprise Django backend architecture, preserving all standard ORM models, CSRF protections, template inheritance, and relational data schemas.
          </p>

          <div className="space-y-2 text-xs text-[#292929] dark:text-stone-300 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
              <span className="text-[#795548] dark:text-stone-400">Backend Framework</span>
              <span className="font-mono font-medium">Django 5.2 / Python 3.13</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
              <span className="text-[#795548] dark:text-stone-400">Database Engine</span>
              <span className="font-mono font-medium">SQLite3 / PostgreSQL ORM</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
              <span className="text-[#795548] dark:text-stone-400">Frontend Styling</span>
              <span className="font-mono font-medium">Bootstrap 5 + Tailwind</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#795548] dark:text-stone-400">Interactive Visualization</span>
              <span className="font-mono font-medium">Chart.js ES6 Engine</span>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentPage('subjects');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full mt-2 py-2 px-3 text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Explore Semester 1 Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
