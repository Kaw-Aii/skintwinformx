import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import { PIFGenerator } from '~/components/documents/PIFGenerator.client';
import { BasePIFGenerator } from '~/components/documents/BasePIFGenerator';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'PIF Generator - SkinTwin' },
    { name: 'description', content: 'Generate Product Information File (PIF) documents for cosmetic formulations' },
  ];
};

export const loader = () => json({});

/**
 * PIF (Product Information File) Generator page
 * Generates comprehensive product information files for cosmetic formulations
 * following EU cosmetic regulation requirements
 */
export default function PIFPage() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <div className="flex-1 overflow-hidden">
        <ClientOnly fallback={<BasePIFGenerator />}>
          {() => <PIFGenerator />}
        </ClientOnly>
      </div>
    </div>
  );
}