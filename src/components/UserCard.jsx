import React from "react";
import Avatar from './Avatar/Avatar'

const MailIcon = (props) => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" {...props}>
    <path d="M2.94 5.5A2 2 0 0 1 4.9 4h10.2a2 2 0 0 1 1.96 1.5L10 10.5 2.94 5.5Z" />
    <path d="M2 7.1V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.1l-8 5.4-8-5.4Z" />
  </svg>
);
const UserIcon = (props) => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" {...props}>
    <path d="M10 10a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z" />
  </svg>
);
const IdIcon = (props) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" {...props}>
    <path d="M3 4h18v16H3zM7 8h6v2H7zm0 4h10v2H7z" />
  </svg>
);
const AtIcon = (props) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" {...props}>
    <path d="M12 3a9 9 0 1 0 9 9v-1a1 1 0 1 0-2 0v1a7 7 0 1 1-2.05-4.95A5 5 0 0 0 19 13a3 3 0 0 1-6 0V8a1 1 0 1 1 2 0v5a1 1 0 0 0 2 0 5 5 0 1 0-5-10Z" />
  </svg>
);

function Row({ icon, label, children }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-x-4 gap-y-1">
      <dt className="flex items-center gap-2 text-gray-500 text-sm">
        {icon}
        <span>{label}</span>
      </dt>
      <dd className="font-medium text-sm">{children}</dd>
    </div>
  );
}
export default function UserCard({ user }) {
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "—";

  return (
    <section dir="rtl" className="bg-white shadow rounded-lg p-4">
      <header className="flex items-center gap-3 mb-4">
        <Avatar
          first={user?.first_name}
          last={user?.last_name}
          username={user?.username}
        />
        <div>
          <div className="text-lg font-semibold">{fullName}</div>
          {user?.username && (
            <div className="text-gray-500">@{user.username}</div>
          )}
        </div>
      </header>

      <dl className="space-y-3">
        <Row icon={<IdIcon />} label="شناسه">
          {user?.id ?? "—"}
        </Row>

      <Row icon={<AtIcon />} label="دسترسی">
          {user?.role ? `${user.role}` : "—"}
        </Row>

        <Row icon={<UserIcon />} label="نام">
          {user?.first_name || "—"}
        </Row>
        <Row icon={<UserIcon />} label="نام خانوادگی">
          {user?.last_name || "—"}
        </Row>
        <Row icon={<AtIcon />} label="نام کاربری">
          {user?.username ? `@${user.username}` : "—"}
        </Row>
        <Row icon={<MailIcon />} label="ایمیل">


          {user?.email ? (
            <a className="hover:underline" href={`mailto:${user.email}`}>
              {user.email}
            </a>
          ) : (
            "—"
          )}
        </Row>
      </dl>
    </section>
  );
}
