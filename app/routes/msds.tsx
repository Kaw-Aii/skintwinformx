import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import { MSDSGenerator } from '~/components/documents/MSDSGenerator.client';
import { BaseMSDSGenerator } from '~/components/documents/BaseMSDSGenerator';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'MSDS Generator - SkinTwin' },
    { name: 'description', content: 'Generate Material Safety Data Sheet (MSDS) documents for cosmetic ingredients and formulations' },
  ];
};

export const loader = () => json({});

/**
 * MSDS (Material Safety Data Sheet) Generator page
 * Generates safety data sheets for cosmetic ingredients and formulations
 * following GHS/CLP classification requirements
 */
export default function MSDSPage() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <div className="flex-1 overflow-hidden">
        <ClientOnly fallback={<BaseMSDSGenerator />}>
          {() => <MSDSGenerator />}
        </ClientOnly>
      </div>
    </div>
  );
}