import Image from 'next/image';

export default function Header() {
  return (
    <header className="relative lg:fixed top-0 left-0 w-full h-20 z-50 flex items-center justify-between px-6 lg:px-8 backdrop-blur-xl bg-black/20 border-b border-white/10 shadow-2xl">
      <div className="flex items-center">
        <span className="text-3xl lg:text-5xl text-white" style={{ fontFamily: 'Impact, sans-serif', fontWeight: 'normal' }}>SUMMER PROMOTION</span>
      </div>
      <div className="flex items-center">
        <Image src="/asset-2.png" alt="Logo" width={56} height={56} className="rounded-lg" priority />
      </div>
    </header>
  );
} 