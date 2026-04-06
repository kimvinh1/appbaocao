'use client';

import { useEffect, useRef } from 'react';
import { incrementArticleView } from '@/app/actions-kb';

/**
 * Component vô hình — chỉ có nhiệm vụ tăng viewCount một lần khi user thật sự mở trang.
 * Dùng useRef để tránh gọi 2 lần trong React Strict Mode.
 */
export function ViewTracker({ articleId }: { articleId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void incrementArticleView(articleId);
  }, [articleId]);

  return null;
}
