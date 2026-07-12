'use client';

export default function FormattedDateTime({ iso }: { iso: string | null | undefined }) {
  if (!iso) return <>—</>;
  return <>{new Date(iso).toLocaleString()}</>;
}
