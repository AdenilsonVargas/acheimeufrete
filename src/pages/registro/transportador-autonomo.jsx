'use client';

import { useState } from 'react';
import TransportadorAutonomoForm from '@/components/auth/registration/transportador/TransportadorAutonomoForm';

export default function TransportadorAutonomoRegistro() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <TransportadorAutonomoForm />
    </div>
  );
}
