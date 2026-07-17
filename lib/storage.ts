// Public URL for an uploaded activity file. Serving it from the Supabase
// storage origin (different from the app origin) is what sandboxes student
// code away from the teacher's app session.
export function activityPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/activities/${storagePath}`;
}
