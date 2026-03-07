export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <div className="text-6xl mb-6">🙏</div>
          <h1 className="text-2xl md:text-3xl font-bold text-amber-800 mb-4">
            感謝您的報名
          </h1>
          <p className="text-gray-600 mb-2 leading-relaxed">
            您的報名資料已成功送出。
          </p>
          <p className="text-gray-600 mb-8 leading-relaxed">
            感恩您參與清明慎終追遠法會，<br />
            祝福您闔家平安、萬事如意。
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            如有任何疑問，請聯絡主辦單位。
          </div>
        </div>
      </div>
    </div>
  );
}
