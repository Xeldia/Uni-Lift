export function TerminalContainer({ title, subtitle, maxWidth = "740px", children }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center py-8">
      <div className="w-full" style={{ maxWidth }}>
        <div className="w-full bg-white border-2 border-black" style={{ boxShadow: "4px 4px 0px 0px black" }}>
          <div className="px-10 pt-8 pb-4">
            <h1 className="font-['Consolas:Bold',sans-serif] text-[28px] text-black tracking-[1px]">{title}</h1>
            <p className="font-['Consolas:Regular',sans-serif] text-[10px] text-black opacity-60 tracking-[4px] mt-1">{subtitle}</p>
          </div>
          <div className="h-px bg-black w-full" />
          {children}
        </div>
      </div>
    </main>
  );
}
