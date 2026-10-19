import { useState } from "react";
import { Icon } from "../components/icons.jsx";
import { Card, Button, Badge } from "../components/primitives.jsx";
import { PageTitle } from "../layout/Layout.jsx";
import { useTheme } from "../theme/ThemeContext.jsx";

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`w-[52px] h-[30px] border-3 border-line rounded-full shrink-0 relative cursor-pointer transition-colors ${on ? "bg-green" : "bg-cream"}`}>
      <span className={`absolute top-[2px] w-[20px] h-[20px] bg-white border-[2.5px] border-line rounded-full transition-all ${on ? "left-[26px]" : "left-[2px]"}`} />
    </button>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="flex gap-1 bg-cream border-3 border-line rounded-[12px] p-1 shadow-sticker-sm">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold cursor-pointer border-[2.5px] ${value === o ? "bg-lilac border-line shadow-sticker-sm text-ink" : "bg-transparent border-transparent text-neutral-500"}`}>{o}</button>
      ))}
    </div>
  );
}

function SettingsSection({ icon, title, desc, children }) {
  return (
    <Card className="bg-paper shadow-sticker-lg p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-lilac text-ink border-3 border-line rounded-xl shadow-sticker-sm flex items-center justify-center"><Icon name={icon} size={19} /></div>
        <div><h2 className="font-display text-[19px] m-0 leading-none">{title}</h2>{desc && <p className="m-0 text-[12.5px] text-neutral-500 mt-1">{desc}</p>}</div>
      </div>
      {children}
    </Card>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-mono font-bold text-neutral-500 mb-1.5">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cream border-3 border-line rounded-xl px-4 py-2.5 font-sans text-[14.5px] font-medium outline-none text-ink" />
    </label>
  );
}

function PrefRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="font-semibold text-[14.5px]">{label}</span>
      {children}
    </div>
  );
}

function ConnRow({ icon, name, sub, badge, badgeColor, action }) {
  return (
    <div className="flex items-center gap-3.5 bg-cream text-ink border-[2.5px] border-line rounded-[14px] shadow-sticker-sm p-3.5">
      <div className="w-11 h-11 bg-paper border-[2.5px] border-line rounded-xl flex items-center justify-center shrink-0 dark:text-bone"><Icon name={icon} size={21} /></div>
      <div className="flex-1 min-w-0"><div className="font-bold text-[14px]">{name}</div><div className="text-[11.5px] text-neutral-500 font-mono">{sub}</div></div>
      <div className="flex items-center gap-2.5 shrink-0">
        <Badge color={badgeColor}>{badge}</Badge>
        {action}
      </div>
    </div>
  );
}

export function Settings() {
  const [name, setName] = useState("Maya Rahmawati");
  const [email, setEmail] = useState("maya.r@gmail.com");
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState("English");
  const [notif, setNotif] = useState({ task: true, health: true, finance: false });
  const flip = (k) => setNotif((s) => ({ ...s, [k]: !s[k] }));
  return (
    <>
      <PageTitle title="Settings" subtitle="Manage your profile, preferences, and connected tools." />

      <div className="grid grid-cols-2 gap-5 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">

          <SettingsSection icon="grid" title="Profile" desc="Your account details">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="relative">
                <div className="w-16 h-16 bg-blue text-ink border-3 border-line rounded-2xl shadow-sticker flex items-center justify-center font-display text-2xl">M</div>
                <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-lilac text-ink border-[2.5px] border-line rounded-lg shadow-sticker-sm flex items-center justify-center cursor-pointer"><Icon name="plus" size={14} sw={3} /></button>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge color="lilac">FREE PLAN</Badge>
                <Button color="lilac" className="!py-2 !px-3.5 !text-[13px]">Upgrade</Button>
              </div>
            </div>
            <div className="flex flex-col gap-3.5">
              <Field label="FULL NAME" value={name} onChange={setName} />
              <Field label="EMAIL" value={email} onChange={setEmail} type="email" />
            </div>
          </SettingsSection>

          <SettingsSection icon="gear" title="Preferences" desc="Theme, language & notifications">
            <PrefRow label="Theme">
              <Segmented value={theme === "dark" ? "Dark" : "Light"} options={["Light", "Dark"]}
                onChange={(v) => setTheme(v.toLowerCase())} />
            </PrefRow>
            <PrefRow label="Language"><Segmented value={lang} options={["Indonesian", "English"]} onChange={setLang} /></PrefRow>
            <div className="border-t-[2.5px] border-line my-3.5" />
            <div className="font-mono text-[11px] font-bold text-neutral-400 mb-1">NOTIFICATIONS</div>
            <PrefRow label="Task reminders"><Toggle on={notif.task} onClick={() => flip("task")} /></PrefRow>
            <PrefRow label="Health reminders"><Toggle on={notif.health} onClick={() => flip("health")} /></PrefRow>
            <PrefRow label="Finance alerts"><Toggle on={notif.finance} onClick={() => flip("finance")} /></PrefRow>
          </SettingsSection>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">

          <SettingsSection icon="list" title="Module connections" desc="Apps linked to your Karsa account">
            <div className="flex flex-col gap-3">
              <ConnRow icon="grid" name="myITS Classroom" sub="Syncs your assignments" badge="CONNECTED" badgeColor="green" />
              <ConnRow icon="clock" name="Google Calendar" sub="Sync deadlines & events" badge="DISCONNECTED" badgeColor="red-300"
                action={<button className="bg-paper border-[2.5px] border-line rounded-lg shadow-sticker-sm px-3 py-1.5 text-[12px] font-bold cursor-pointer dark:text-bone">Connect</button>} />
              <ConnRow icon="receipt" name="GoPay PDF import" sub="Last synced Jul 5, 2026" badge="ACTIVE" badgeColor="blue" />
            </div>
          </SettingsSection>

          <SettingsSection icon="drop" title="Data & privacy" desc="Control your personal data">
            <div className="flex gap-3 mb-4">
              <Button variant="dark" color="lilac" className="flex-1"><Icon name="upload" size={16} sw={2.6} stroke="#E4D5F7" /> Export my data</Button>
              <Button color="red-300" className="flex-1">Delete account</Button>
            </div>
            <p className="m-0 text-[12.5px] text-neutral-500 leading-snug bg-cream border-2 border-line rounded-xl px-3.5 py-3">
              Your skincare &amp; health logs are encrypted at rest and never shared with third parties. Only you can export or delete them.
            </p>
          </SettingsSection>

          <SettingsSection icon="gear" title="Account">
            <div className="flex flex-col gap-3">
              <button className="w-full flex items-center justify-center gap-2 bg-paper border-3 border-line rounded-xl shadow-sticker px-4 py-3 font-sans font-bold text-[15px] cursor-pointer">Change password</button>
              <Button color="red-300" className="w-full">Log out</Button>
            </div>
          </SettingsSection>
        </div>
      </div>
    </>
  );
}
