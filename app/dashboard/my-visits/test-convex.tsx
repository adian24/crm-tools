'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function TestConvexQuery() {
  let data: any[] = [];
  let error: string | null = null;

  try {
    console.log('Testing useQuery...');
    console.log('API:', api);
    console.log('API.targets:', api?.targets);
    console.log('API.targets.getTargets:', api?.targets?.getTargets);

    if (api?.targets?.getTargets) {
      const result = useQuery(api.targets.getTargets);
      console.log('useQuery result:', result);
      data = Array.isArray(result) ? result : [];
    } else {
      error = 'API targets.getTargets not available';
    }
  } catch (err) {
    console.error('Error in TestConvexQuery:', err);
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Convex Query Test</h3>
      <p>Status: {error ? `❌ Error: ${error}` : '✅ Success'}</p>
      <p>Data Count: {data.length}</p>
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
        {JSON.stringify(data.slice(0, 2), null, 2)}
      </pre>
    </div>
  );
}