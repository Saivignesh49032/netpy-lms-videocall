'use client';

export default function StudentDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-sky-900">My Dashboard</h1>
      <p className="text-sky-700">Track your daily lectures and review subject materials.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-8 bg-white border border-sky-100 p-6 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg text-sky-800 mb-4">Today's Schedule</h3>
          <div className="text-center py-10 bg-slate-50 rounded-lg">
            <p className="text-slate-500 font-medium">You have no live classes today. Take a break or review recordings!</p>
          </div>
        </div>
        
        <div className="col-span-4 bg-sky-500 text-white p-6 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
          <h3 className="font-semibold text-lg mb-2">Have a question?</h3>
          <p className="text-sky-100 text-sm mb-4">Keep your doubts ready for the next live Q&A session.</p>
        </div>
      </div>
    </div>
  );
}
