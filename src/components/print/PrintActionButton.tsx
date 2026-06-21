'use client';

export function PrintActionButton() {
  return (
    <button className="printNowButton" type="button" onClick={() => window.print()}>
      In phiếu dò
    </button>
  );
}
