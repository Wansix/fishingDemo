export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">FishFarm DeFi</h3>
          <p className="text-slate-400 text-sm mb-8">
            물고기잡이 메타포로 쉽게 이해하는 DeFi V3 유동성 파밍 체험
          </p>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-500">
          © 2024 FishFarm DeFi. 본 프로젝트는 교육 및 데모 목적으로 제작되었습니다.
        </div>
      </div>
    </footer>
  );
}