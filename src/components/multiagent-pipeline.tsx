'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, ShieldAlert, FileText, Share2, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { AgentInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MultiagentPipelineProps {
  agents: AgentInfo[];
  isProcessing: boolean;
  className?: string;
}

export function MultiagentPipeline({
  agents,
  isProcessing,
  className
}: MultiagentPipelineProps) {
  const getIcon = (id: string) => {
    switch (id) {
      case 'stt':
        return Mic;
      case 'factcheck':
        return ShieldAlert;
      case 'editorial':
        return FileText;
      case 'smm':
        return Share2;
      default:
        return Sparkles;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Мультиагентный оркестратор (4 AI Agents Pipeline)
            </h3>
            <p className="text-[11px] text-slate-400">
              Сквозная цепочка: транскрибация $\to$ фактчекинг $\to$ черновик $\to$ SMM-адаптация
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Оркестрация в процессе...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {agents.map((agent, index) => {
          const Icon = getIcon(agent.id);
          const isCompleted = agent.status === 'completed';
          const isRunning = agent.status === 'running';

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.25 }}
              className={cn(
                'relative p-3.5 rounded-xl border transition-all select-none overflow-hidden',
                isRunning && 'bg-blue-950/20 border-blue-500/50 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/30',
                isCompleted && 'bg-slate-900/90 border-slate-700/80 shadow-sm',
                agent.status === 'idle' && 'bg-slate-900/40 border-slate-800/60 opacity-70'
              )}
            >
              {isRunning && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full"
                  animate={{ translateX: ['100%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                />
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  className={cn(
                    'p-2 rounded-lg border',
                    isRunning && 'bg-blue-500/20 border-blue-400/40 text-blue-300',
                    isCompleted && 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                    agent.status === 'idle' && 'bg-slate-800/70 border-slate-700/50 text-slate-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1.5">
                  {isRunning && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/50">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Обработка
                    </span>
                  )}
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {agent.durationMs ? `${(agent.durationMs / 1000).toFixed(1)}s` : 'Готово'}
                    </span>
                  )}
                  {agent.status === 'idle' && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Шаг 0{index + 1}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  {agent.name}
                </h4>
                <div className="text-[11px] text-indigo-400 font-mono mb-1">
                  {agent.role}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {agent.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
