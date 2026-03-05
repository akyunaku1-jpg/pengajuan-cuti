import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 ${
    isActive
      ? "bg-[#6c8cf533] text-white"
      : "text-white/55 hover:bg-white/10 hover:text-white"
  }`;

const Sidebar = ({ title, items }) => {
  const mainItems = items.filter((item) => item.to !== "/logout");
  const logoutItem = items.find((item) => item.to === "/logout");
  const LogoutIcon = logoutItem?.icon;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] overflow-hidden border-r border-white/5 bg-[#0f172a] p-6">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(108,140,245,0.35)_0%,rgba(108,140,245,0)_65%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6c8cf5] to-[#7c3aed] text-base font-bold text-white">
            EL
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-white">{title}</h1>
            <p className="text-xs text-white/50">Employee Leave System</p>
          </div>
        </div>

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">Menu Utama</p>
        <nav className="space-y-1.5">
          {mainItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute -left-6 top-2 h-8 w-1 rounded-r-full bg-primary" />}
                    {Icon ? <Icon size={17} className={isActive ? "text-white" : "text-white/55"} /> : null}
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {logoutItem ? (
          <div className="mt-auto border-t border-white/10 pt-5">
            <NavLink
              to={logoutItem.to}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#fca5a5] transition duration-200 hover:bg-[#ef444422] hover:text-[#f87171]"
            >
              {LogoutIcon ? <LogoutIcon size={17} /> : null}
              <span>{logoutItem.label}</span>
            </NavLink>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;
