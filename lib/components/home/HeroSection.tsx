import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="container mx-auto px-4 py-16 text-center text-white">
      <h1 className="text-4xl font-bold mb-4">Welcome to Regenbogenbande</h1>
      <p className="text-xl mb-8">Share your favorite moments with friends!</p>
      <Link 
        href="/upload" 
        className="bg-white text-purple-500 px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition"
      >
        Upload Your First Clip
      </Link>
    </div>
  );
}