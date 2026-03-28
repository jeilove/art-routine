'use client';

import { useEffect } from 'react';

// 버전 로그를 CSP 정책과 충돌 없이 출력하는 클라이언트 컴포넌트
// dangerouslySetInnerHTML 인라인 스크립트 대신 useEffect를 사용하여 CSP 이슈 우회
export default function VersionLogger() {
  useEffect(() => {
    console.log(
      '%c🎨 Art Routine v0.4.6 %c| Absolute Initial Mock Seeding',
      'color: #c5a454; font-weight: bold; font-size: 1.2em;',
      'color: #888;'
    );
  }, []);

  return null;
}
