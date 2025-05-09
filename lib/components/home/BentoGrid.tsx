export function BentoGrid() {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <h2 className="text-xl font-bold mb-2">Latest Clips</h2>
            <p>Check out the newest uploads!</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <h2 className="text-xl font-bold mb-2">Top Screenshots</h2>
            <p>See what's trending!</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <h2 className="text-xl font-bold mb-2">Quote of the Day</h2>
            <p>Get inspired!</p>
          </div>
        </div>
      </div>
    );
  }