import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section
        className="w-full bg-gradient-to-b from-[#0D1B4B] to-[#1A237E] text-white px-6 py-20 md:py-32 flex items-center justify-center min-h-[90vh]"
        style={{ height: '90vh' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Every Mother Deserves to Come Home
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            AI-powered risk assessment for frontline health workers across India
          </p>
          <Link
            to="/intake"
            className="inline-block bg-[#DC2626] hover:bg-[#B71C1C] text-white font-bold px-8 py-4 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Start Assessment →
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stat Card 1 */}
            <div className="border-t-4 border-[#DC2626] bg-white shadow-lg rounded-lg p-8 text-center">
              <p className="text-5xl md:text-6xl font-bold text-[#1A237E] mb-3">295,000</p>
              <p className="text-gray-700 text-lg font-semibold">Maternal deaths yearly</p>
            </div>

            {/* Stat Card 2 */}
            <div className="border-t-4 border-[#DC2626] bg-white shadow-lg rounded-lg p-8 text-center">
              <p className="text-5xl md:text-6xl font-bold text-[#1A237E] mb-3">44,000</p>
              <p className="text-gray-700 text-lg font-semibold">Deaths in India alone</p>
            </div>

            {/* Stat Card 3 */}
            <div className="border-t-4 border-[#DC2626] bg-white shadow-lg rounded-lg p-8 text-center">
              <p className="text-5xl md:text-6xl font-bold text-[#DC2626] mb-3">37%</p>
              <p className="text-gray-700 text-lg font-semibold">Reduction with AI assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-gray-50 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white shadow-lg rounded-lg p-8 text-center hover:shadow-xl transition duration-300">
              <div className="text-6xl mb-6">🔬</div>
              <h3 className="text-2xl font-bold text-[#1A237E] mb-4">Instant Risk Assessment</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                AI analyzes 8 clinical vitals in under 10 seconds
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white shadow-lg rounded-lg p-8 text-center hover:shadow-xl transition duration-300">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-2xl font-bold text-[#1A237E] mb-4">Auto Referral Letter</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Formal medical referral generated instantly
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white shadow-lg rounded-lg p-8 text-center hover:shadow-xl transition duration-300">
              <div className="text-6xl mb-6">🏥</div>
              <h3 className="text-2xl font-bold text-[#1A237E] mb-4">Nearest Hospital</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                GPS finds closest maternity hospital
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#0D1B4B] text-white py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-lg font-semibold">
            MotherShield — Saving mothers, one scan at a time
          </p>
        </div>
      </footer>
    </div>
  );
}