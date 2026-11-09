import type { ReactNode } from 'react';
import messages from '@/features/lanka/messages/en.json';

export const metadata = {
  title: `${messages.customer} · ${messages.brand}`,
  description: messages.accountBody,
};
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
